import mongoose, { Schema, Document } from 'mongoose';
import { Notification } from '../../../domain/entities/Notification';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (NOTIFICATION)
 * ==========================================
 * Connects the system's simple Notification struct to Mongoose indexes.
 * ==========================================
 */

export interface INotificationDocument extends Document, Omit<Notification, 'id' | 'actor'> {
  userId: mongoose.Types.ObjectId | any;
  actorId: mongoose.Types.ObjectId | any;
  metadata?: {
    contentId?: mongoose.Types.ObjectId | any;
    chatId?: mongoose.Types.ObjectId | any;
    commentId?: mongoose.Types.ObjectId | any;
    messageId?: mongoose.Types.ObjectId | any;
    link?: string;
  };
}

const NotificationSchema = new Schema<INotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, 
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['mention', 'reply', 'comment_on_post', 'message', 'reaction', 'system'], required: true },
  category: { type: String, enum: ['social', 'security', 'transactional'], default: 'social' },
  message: { type: String, required: true },
  metadata: {
    contentId: { type: Schema.Types.ObjectId },
    chatId: { type: Schema.Types.ObjectId },
    commentId: { type: Schema.Types.ObjectId },
    messageId: { type: Schema.Types.ObjectId },
    link: { type: String }
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema);
