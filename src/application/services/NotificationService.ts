import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';
import { safeObjectId, isValidObjectId } from '../../infrastructure/db/idUtils';
import { AdminEventBus, ADMIN_BUS_EVENTS } from '../../infrastructure/events/AdminEventBus';
import { FeatureFlagService } from './admin/FeatureFlagService';

/**
 * ==========================================
 * APPLICATION LAYER - NOTIFICATION SERVICE
 * ==========================================
 * Hardened orchestration for user alerts with ID safety.
 * ==========================================
 */

export class NotificationService {
  
  /**
   * Safe notification creation.
   */
  static async createNotification(data: {
    userId: string;
    actorId: string;
    type: 'mention' | 'reply' | 'comment_on_post' | 'message' | 'reaction' | 'system';
    category?: 'social' | 'security' | 'transactional';
    message: string;
    metadata?: {
      contentId?: string;
      chatId?: string;
      commentId?: string;
      messageId?: string;
      link?: string;
    };
    isRead?: boolean;
  }): Promise<Notification> {
    try {
      // 1. Validation (userId & actorId must exist)
      if (!data.userId || !data.actorId) throw new Error("Recipient and Actor are required.");

      // Check Feature Toggle for Mentions if applicable
      if (data.type === 'mention') {
        const isMentionsEnabled = await FeatureFlagService.isEnabled('mentions');
        if (!isMentionsEnabled) return {} as Notification;
      }
 
      // 2. Persist
      const notification = await NotificationRepository.create({
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        category: data.category || 'social',
        message: data.message,
        metadata: data.metadata,
        isRead: data.isRead || false
      });
 
      // 3. Sync Unread Count in Redis
      try {
        const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
        const redis = await getRedisClient();
        await redis.hIncrBy(`unread:${data.userId}`, 'total', 1);
        if (data.metadata?.chatId) {
          await redis.hIncrBy(`unread:${data.userId}`, `chat:${data.metadata.chatId}`, 1);
        }
      } catch (redisErr) {
        console.warn("[UNREAD_SYNC_FAILED]", redisErr);
      }
 
      // 4. Create Notification Log (Pending)
      const { NotificationLogModel } = await import('../../infrastructure/db/models/NotificationLog');
      const log = await NotificationLogModel.create({
        recipientId: data.userId,
        type: data.type,
        payload: data,
        status: 'pending'
      });

      // 5. Dispatch to live users via Socket.IO
      try {
        const isPushEnabled = await FeatureFlagService.isEnabled('notifications');
        if (isPushEnabled) {
          const { SocketService } = await import('../../infrastructure/socket/SocketService');
          SocketService.emitToUser(data.userId, 'notification:new', notification);
        } else {
          console.log(`[NOTIFICATION_SKIPPED] Push notifications are globally disabled.`);
        }
        
        // Update Log and Feed Admin Bus
        await NotificationLogModel.findByIdAndUpdate(log._id, { status: 'delivered', deliveredAt: new Date() });
        AdminEventBus.publish(ADMIN_BUS_EVENTS.NOTIFICATION_SENT, notification);
      } catch (socketErr: any) {
        console.warn("[SOCKET_DISPATCH_SKIPPED]", socketErr);
        await NotificationLogModel.findByIdAndUpdate(log._id, { status: 'failed', failureReason: socketErr.message });
        AdminEventBus.publish(ADMIN_BUS_EVENTS.NOTIFICATION_FAILED, { error: socketErr, data });
      }
 
      return notification;
    } catch (err: any) {
      console.error("[NOTIFICATION_SERVICE_CREATE_FAILED]", err.message);
      throw err;
    }
  }

  /**
   * Fetch paginated alerts for a user
   */
  static async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    if (!isValidObjectId(userId)) return [];
    
    try {
      return await NotificationRepository.findByUserId(userId, limit, offset);
    } catch (err: any) {
      console.error("[REPO_FAILURE_NOTIFICATIONS_BATCH]", { userId, error: err.message });
      return [];
    }
  }

  /**
   * Get total unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!isValidObjectId(userId)) return 0;
    
    // 1. Try Redis
    try {
      const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
      const redis = await getRedisClient();
      const count = await redis.hGet(`unread:${userId}`, 'total');
      if (count !== null) return parseInt(count);
    } catch (redisErr) {
      console.warn("[UNREAD_FETCH_REDIS_FAILED]", redisErr);
    }

    // 2. Fallback to MongoDB
    try {
      const { NotificationModel } = await import('../../infrastructure/db/models/Notification');
      const count = await NotificationModel.countDocuments({ userId, isRead: false });
      
      // Seed Redis for next time
      try {
        const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
        const redis = await getRedisClient();
        await redis.hSet(`unread:${userId}`, 'total', count.toString());
      } catch (e) {}

      return count;
    } catch (err) {
      console.error("[UNREAD_FETCH_MONGODB_FAILED]", err);
      return 0;
    }
  }

  /**
   * State update with format protection.
   */
  static async markAsRead(notificationId: string): Promise<Notification | null> {
    if (!isValidObjectId(notificationId)) return null;

    try {
      const result = await NotificationRepository.markAsRead(notificationId);
      if (result) {
        // Decrement Redis
        try {
          const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
          const redis = await getRedisClient();
          const current = await redis.hGet(`unread:${result.userId}`, 'total');
          if (current && parseInt(current) > 0) {
            await redis.hIncrBy(`unread:${result.userId}`, 'total', -1);
          }
        } catch (e) {}
      }
      return result;
    } catch (err: any) {
      console.error("[REPO_FAILURE_NOTIFICATION_READ]", { notificationId, error: err.message });
      return null;
    }
  }

  /**
   * Batch update.
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    if (!isValidObjectId(userId)) return false;

    try {
      const success = await NotificationRepository.markAllAsRead(userId);
      if (success) {
        const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
        const redis = await getRedisClient();
        await redis.del(`unread:${userId}`);
      }
      return success;
    } catch (err: any) {
      console.error("[REPO_FAILURE_NOTIFICATION_BATCH_READ]", { userId, error: err.message });
      return false;
    }
  }

  /**
   * Delete a specific alert with Redis sync.
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    if (!isValidObjectId(notificationId)) return false;

    try {
      // 1. Fetch notification first to check read status
      const { NotificationModel } = await import('../../infrastructure/db/models/Notification');
      const doc = await NotificationModel.findById(notificationId);
      if (!doc) return false;

      // 2. Delete from DB
      const success = await NotificationRepository.deleteById(notificationId);
      if (success && !doc.isRead) {
        // 3. Decrement Redis unread count
        try {
          const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
          const redis = await getRedisClient();
          const current = await redis.hGet(`unread:${doc.userId}`, 'total');
          if (current && parseInt(current) > 0) {
            await redis.hIncrBy(`unread:${doc.userId}`, 'total', -1);
          }
        } catch (e) {}
      }
      return success;
    } catch (err: any) {
      console.error("[REPO_FAILURE_NOTIFICATION_DELETE]", { notificationId, error: err.message });
      return false;
    }
  }
}
