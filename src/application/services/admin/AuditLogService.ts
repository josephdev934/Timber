import { AuditLogRepository } from '../../../infrastructure/repositories/admin/AuditLogRepository';

/**
 * ==========================================
 * APPLICATION LAYER - AUDIT LOG SERVICE
 * ==========================================
 * Centralized logging for admin write actions.
 * ==========================================
 */
export class AuditLogService {
  /**
   * Log an admin action.
   * This is a fire-and-forget method intended to be called after a successful action.
   */
  static async log(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await AuditLogRepository.create(data);
      console.log(`[AUDIT_LOG] ${data.action} on ${data.targetType}:${data.targetId} by ${data.adminId}`);
    } catch (err) {
      // We don't want to fail the main transaction if logging fails, 
      // but we should record it in server logs.
      console.error("[AUDIT_LOG_FAILURE]", err);
    }
  }
}
