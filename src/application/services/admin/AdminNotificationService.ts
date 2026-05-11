import { NotificationLogModel } from '../../../infrastructure/db/models/NotificationLog';
import { NotificationService } from '../NotificationService';
import { AuditLogService } from './AuditLogService';
import { connectToDatabase } from '../../../infrastructure/db/connect';

/**
 * ==========================================
 * APPLICATION LAYER - ADMIN NOTIFICATION SERVICE
 * ==========================================
 * Handles administrative retries of failed notifications.
 * ==========================================
 */
export class AdminNotificationService {
  /**
   * Resend a single failed notification using its stored payload.
   */
  static async resendNotification(logId: string, adminId: string): Promise<boolean> {
    await connectToDatabase();
    
    const log = await NotificationLogModel.findById(logId);
    if (!log) throw new Error("Notification log not found");
    if (!log.payload) throw new Error("Original payload missing");

    // Re-dispatch. The NotificationService will create a *new* Notification and a *new* pending log
    // But we still want to mark the old log as "delivered" or at least "retried" so we don't retry it again.
    try {
      await NotificationService.createNotification(log.payload);
      
      // If it didn't throw, the new dispatch succeeded. We can update this old log to indicate it was retried/delivered.
      await NotificationLogModel.findByIdAndUpdate(logId, { status: 'delivered', deliveredAt: new Date() });

      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Platform',
        targetId: logId,
        metadata: { action: 'RESEND_NOTIFICATION', status: 'success' }
      });

      return true;
    } catch (err: any) {
      await NotificationLogModel.findByIdAndUpdate(logId, { failureReason: `Retry failed: ${err.message}` });
      return false;
    }
  }

  /**
   * Bulk resend multiple failed notifications
   */
  static async bulkResend(logIds: string[], adminId: string): Promise<{ successCount: number; failCount: number }> {
    let successCount = 0;
    let failCount = 0;

    for (const id of logIds) {
      try {
        const success = await this.resendNotification(id, adminId);
        if (success) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    if (successCount > 0) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Platform',
        targetId: 'bulk',
        metadata: { action: 'BULK_RESEND_NOTIFICATIONS', successCount, failCount }
      });
    }

    return { successCount, failCount };
  }
}
