import { ReportModel } from '../../db/models/Report';
import { connectToDatabase } from '../../db/connect';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - REPORT REPOSITORY
 * ==========================================
 * Handles persistence for the moderation queue.
 * ==========================================
 */
export class ReportRepository {
  /**
   * Create a new report
   */
  static async create(data: any): Promise<any> {
    await connectToDatabase();
    return await ReportModel.create(data);
  }

  /**
   * Find reports with flexible status filtering and population
   */
  static async findByStatus(status = 'pending', limit = 20, offset = 0): Promise<any[]> {
    await connectToDatabase();
    const query = status === 'all' ? {} : { status };
    return await ReportModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('reporterId', 'name username profilePhoto')
      .populate('reportedUserId', 'name username profilePhoto isBanned')
      .lean();
  }

  /**
   * Get report by ID with full details
   */
  static async findById(id: string): Promise<any> {
    await connectToDatabase();
    return await ReportModel.findById(id)
      .populate('reporterId', 'name username profilePhoto')
      .populate('reportedUserId', 'name username profilePhoto isBanned reportCount')
      .populate('resolvedBy', 'name username')
      .lean();
  }

  /**
   * Update report status
   */
  static async updateStatus(id: string, status: 'dismissed' | 'resolved', adminId: string): Promise<any> {
    await connectToDatabase();
    return await ReportModel.findByIdAndUpdate(id, {
      $set: {
        status,
        resolvedAt: new Date(),
        resolvedBy: adminId
      }
    }, { new: true });
  }

  /**
   * Count reports by status
   */
  static async countByStatus(status = 'pending'): Promise<number> {
    await connectToDatabase();
    const query = status === 'all' ? {} : { status };
    return await ReportModel.countDocuments(query);
  }
}
