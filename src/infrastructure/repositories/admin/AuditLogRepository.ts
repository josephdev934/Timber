import { AuditLogModel } from '../../db/models/AuditLog';
import { connectToDatabase } from '../../db/connect';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - AUDIT LOG REPOSITORY
 * ==========================================
 * Handles persistence for admin activity records.
 * ==========================================
 */
export class AuditLogRepository {
  /**
   * Create a new audit log entry
   */
  static async create(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: any;
  }): Promise<void> {
    await connectToDatabase();
    await AuditLogModel.create({
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata,
      timestamp: new Date()
    });
  }

  /**
   * Fetch logs for a specific admin or target (paginated)
   */
  static async findLogs(query: any, limit = 50, offset = 0): Promise<any[]> {
    await connectToDatabase();
    return await AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .populate('adminId', 'name username profilePhoto')
      .lean();
  }
}
