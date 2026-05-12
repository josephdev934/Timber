import { PlatformSettingsModel } from '../../../infrastructure/db/models/PlatformSettings';
import { connectToDatabase } from '../../../infrastructure/db/connect';
import { AuditLogService } from './AuditLogService';
import { getRedisClient } from '../../../infrastructure/redis/redisClient';
import { socketServer } from '../../../infrastructure/socket/socketServer';
import { UserModel } from '../../../infrastructure/db/models/User';
import { PostModel } from '../../../infrastructure/db/models/Post';
import { CommentModel } from '../../../infrastructure/db/models/Comment';

/**
 * ==========================================
 * APPLICATION LAYER - PLATFORM SETTINGS SERVICE
 * ==========================================
 * Manages global configurations and emergency actions.
 * ==========================================
 */
export class PlatformSettingsService {
  /**
   * Ensure a singleton settings document exists and return it
   */
  static async getSettings() {
    await connectToDatabase();
    let settings = await PlatformSettingsModel.findOneAndUpdate(
      { isSingleton: true },
      { $setOnInsert: { isSingleton: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return settings;
  }

  /**
   * Update settings sections
   */
  static async updateSettings(section: 'general' | 'features' | 'rateLimits' | 'maintenance', data: any, adminId: string) {
    await connectToDatabase();
    
    // Using dot notation to update specific nested fields dynamically
    const updatePayload: any = {};
    for (const [key, value] of Object.entries(data)) {
      updatePayload[`${section}.${key}`] = value;
    }

    const settings = await PlatformSettingsModel.findOneAndUpdate(
      { isSingleton: true },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    // Sync with Redis & Broadcast to ALL clients
    const redis = await getRedisClient();
    
    if (section === 'maintenance') {
      if (data.enabled) {
        await redis.set('platform:maintenance', JSON.stringify({ enabled: true, message: data.message || "Maintenance Mode" }));
      } else {
        await redis.del('platform:maintenance');
      }
    }

    if (section === 'features') {
      // Refresh the full features object from DB to ensure Redis has the complete state
      const currentSettings = await this.getSettings();
      await redis.set('platform:features', JSON.stringify(currentSettings.features));
    }

    // Global real-time settings update
    const { SocketService } = await import('../../../infrastructure/socket/SocketService');
    SocketService.emitGlobal('SETTINGS_UPDATED', { section, settings });

    // Specific maintenance broadcasts for the public frontend
    if (section === 'maintenance') {
      if (data.enabled) {
        SocketService.emitGlobal('MAINTENANCE_MODE', { message: data.message });
      } else {
        SocketService.emitGlobal('MAINTENANCE_ENDED');
      }
    }

    await AuditLogService.log({
      adminId,
      action: section === 'maintenance' ? 'TOGGLE_MAINTENANCE' : 'CHANGE_SETTINGS',
      targetType: 'Platform',
      targetId: 'settings',
      metadata: { section, changes: data }
    });

    return settings;
  }

  /**
   * Danger Zone: Wipe Test Data
   * Deletes all data created by users with role 'user' in the last 24 hours.
   */
  static async wipeTestData(adminId: string) {
    await connectToDatabase();
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find non-admin users active recently
    const recentUsers = await UserModel.find({ role: 'user', createdAt: { $gte: oneDayAgo } }).select('_id');
    const userIds = recentUsers.map(u => u._id);

    // Delete their content
    await PostModel.deleteMany({ authorId: { $in: userIds } });
    await CommentModel.deleteMany({ authorId: { $in: userIds } });
    await UserModel.deleteMany({ _id: { $in: userIds } });

    await AuditLogService.log({
      adminId,
      action: 'CHANGE_SETTINGS',
      targetType: 'Platform',
      targetId: 'danger',
      metadata: { action: 'WIPE_TEST_DATA', wipedUserCount: userIds.length }
    });
  }

  /**
   * Danger Zone: Force Disconnect All
   */
  static async forceDisconnectAll(adminId: string) {
    const io = socketServer.getIO();
    if (io) {
      io.disconnectSockets(); // Kicks everyone
    }

    await AuditLogService.log({
      adminId,
      action: 'CHANGE_SETTINGS',
      targetType: 'Platform',
      targetId: 'danger',
      metadata: { action: 'FORCE_DISCONNECT_ALL' }
    });
  }

  /**
   * Danger Zone: Clear Redis
   */
  static async clearRedis(adminId: string) {
    const redis = await getRedisClient();
    await redis.flushDb();

    // Re-seed essential maintenance key if it was active
    const settings = await this.getSettings();
    if (settings.maintenance.enabled) {
      await redis.set('platform:maintenance', JSON.stringify({ enabled: true, message: settings.maintenance.message }));
    }

    await AuditLogService.log({
      adminId,
      action: 'CHANGE_SETTINGS',
      targetType: 'Platform',
      targetId: 'danger',
      metadata: { action: 'CLEAR_REDIS_CACHE' }
    });
  }
}
