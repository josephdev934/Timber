import mongoose, { Schema, Document } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (NOTIFICATION LOG)
 * ==========================================
 * Hardened audit trail for every notification dispatch attempt.
 * Required for resending failed notifications.
 * ==========================================
 */

export interface INotificationLogDocument extends Document {
  recipientId: mongoose.Types.ObjectId | any;
  type: string;
  payload: any; // Stored payload for resend capabilities
  status: 'pending' | 'delivered' | 'failed';
  failureReason?: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

const NotificationLogSchema = new Schema<INotificationLogDocument>({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending', index: true },
  failureReason: { type: String },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true });

// Prevent schema caching issues in Next.js HMR
if (mongoose.models.NotificationLog) {
  delete mongoose.models.NotificationLog;
}

export const NotificationLogModel = mongoose.model<INotificationLogDocument>('NotificationLog', NotificationLogSchema);
