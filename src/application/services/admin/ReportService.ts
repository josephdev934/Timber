import { ReportRepository } from '../../../infrastructure/repositories/admin/ReportRepository';
import { AuditLogService } from './AuditLogService';
import { AdminEventBus, ADMIN_BUS_EVENTS } from '../../../infrastructure/events/AdminEventBus';
import { getRedisClient } from '../../../infrastructure/redis/redisClient';

/**
 * ==========================================
 * APPLICATION LAYER - REPORT SERVICE
 * ==========================================
 * Orchestrates the moderation lifecycle.
 * ==========================================
 */
export class ReportService {
  /**
   * Submit a new report (User-facing)
   */
  static async submitReport(data: {
    reporterId: string;
    reportedUserId: string;
    contentType: 'User' | 'Comment' | 'Post' | 'Media' | 'Group' | 'Message';
    contentId: string;
    reason: string;
  }): Promise<any> {
    const report = await ReportRepository.create(data);

    // 1. Update Redis counter for live dashboard metrics
    try {
      const redis = await getRedisClient();
      await redis.incr('stats:pendingReports');
    } catch (e) {}

    // 2. Notify admins via Socket.IO/Event Bus
    AdminEventBus.publish(ADMIN_BUS_EVENTS.REPORT_SUBMITTED, report);

    return report;
  }

  /**
   * Dismiss a report (Admin action)
   */
  static async dismissReport(reportId: string, adminId: string): Promise<void> {
    const report = await ReportRepository.updateStatus(reportId, 'dismissed', adminId);
    
    if (report) {
      // Decrement Redis
      try {
        const redis = await getRedisClient();
        await redis.decr('stats:pendingReports');
      } catch (e) {}

      // Log to Audit Log
      await AuditLogService.log({
        adminId,
        action: 'ACTION_REPORT',
        targetType: 'Report',
        targetId: reportId,
        metadata: { status: 'dismissed' }
      });
    }
  }

  /**
   * Resolve a report with content deletion (Admin action)
   */
  static async resolveWithDeletion(reportId: string, adminId: string): Promise<void> {
    const report = await ReportRepository.findById(reportId);
    if (!report) throw new Error("Report not found");

    // 1. Perform Deletion based on content type
    const { contentType, contentId } = report;
    
    try {
      if (contentType === 'Post') {
        const { PostRepository } = await import('../../../infrastructure/repositories/PostRepository');
        await PostRepository.delete(contentId.toString());
      } else if (contentType === 'Comment') {
        const { CommentRepository } = await import('../../../infrastructure/repositories/CommentRepository');
        await CommentRepository.delete(contentId.toString());
      }
      // TODO: Handle Media deletion in Phase 7
    } catch (err) {
      console.error("[REPORT_RESOLUTION_DELETION_FAILED]", err);
    }

    // 2. Mark report as resolved
    await ReportRepository.updateStatus(reportId, 'resolved', adminId);

    // 3. Update Redis counter
    try {
      const redis = await getRedisClient();
      await redis.decr('stats:pendingReports');
    } catch (e) {}

    // 4. Log to Audit Log
    await AuditLogService.log({
      adminId,
      action: 'DELETE_CONTENT',
      targetType: contentType,
      targetId: contentId.toString(),
      metadata: { reportId, reason: report.reason }
    });
  }

  /**
   * Resolve a report with user ban (Admin action)
   */
  static async resolveWithBan(reportId: string, adminId: string, reason: string): Promise<void> {
    const report = await ReportRepository.findById(reportId);
    if (!report) throw new Error("Report not found");

    const userId = report.reportedUserId._id || report.reportedUserId;

    // Trigger Ban (Phase 4 logic, implemented here for Step 3.3)
    const { UserService } = await import('../UserService');
    await UserService.banUser(userId.toString(), reason);

    // Mark report as resolved
    await ReportRepository.updateStatus(reportId, 'resolved', adminId);

    // Update Redis
    try {
      const redis = await getRedisClient();
      await redis.decr('stats:pendingReports');
    } catch (e) {}

    // Log to Audit Log
    await AuditLogService.log({
      adminId,
      action: 'ACTION_REPORT',
      targetType: 'Report',
      targetId: reportId,
      metadata: { status: 'resolved', action: 'BAN_USER', userId }
    });
  }
}
