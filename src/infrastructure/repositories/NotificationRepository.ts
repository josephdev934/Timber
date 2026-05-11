/**
 * ==========================================
 * INFRASTRUCTURE LAYER - NOTIFICATION REPOSITORY
 * ==========================================
 * Connects directly to the NotificationModel.
 * Provides clean CRUD for alerting users about mentions and replies.
 * ==========================================
 */

import { NotificationModel, INotificationDocument } from '../db/models/Notification';
import { Notification } from '../../domain/entities/Notification';
import { connectToDatabase } from '../db/connect';

export class NotificationRepository {
  
  /**
   * Internal mapper to convert DB documents to domain entities
   */
  private static mapToDomain(doc: any): Notification {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      actorId: doc.actorId?._id ? doc.actorId._id.toString() : (doc.actorId?.toString() || doc.actorId),
      actor: doc.actorId && typeof doc.actorId === 'object' && (doc.actorId.username || doc.actorId.name) ? {
        name: doc.actorId.name || doc.actorId.username,
        username: doc.actorId.username,
        avatar: doc.actorId.profilePhoto || "/default-avatar.svg"
      } : undefined,
      type: doc.type as any,
      category: doc.category as any,
      message: doc.message,
      metadata: doc.metadata ? {
        contentId: doc.metadata.contentId?.toString(),
        chatId: doc.metadata.chatId?.toString(),
        commentId: doc.metadata.commentId?.toString(),
        link: doc.metadata.link
      } : undefined,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Persist a new notification
   */
  static async create(data: Partial<Notification>): Promise<Notification> {
    await connectToDatabase();
    const created = await NotificationModel.create({
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      category: data.category || 'social',
      message: data.message,
      metadata: data.metadata,
      isRead: data.isRead || false
    });
    
    const populated = await created.populate('actorId', 'username name profilePhoto');
    return this.mapToDomain(populated);
  }

  /**
   * Fetch paginated notifications for a specific user
   */
  static async findByUserId(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    await connectToDatabase();
    const docs = await NotificationModel.find({ userId })
      .populate('actorId', 'username name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
    
    return docs.map(doc => this.mapToDomain(doc));
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(id: string): Promise<Notification | null> {
    await connectToDatabase();
    const doc = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true, lean: true }
    ) as INotificationDocument;
    
    return doc ? this.mapToDomain(doc) : null;
  }

  /**
   * Batch mark multiple notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Remove a specific notification by ID
   */
  static async deleteById(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await NotificationModel.findByIdAndDelete(id);
    return !!result;
  }
}
