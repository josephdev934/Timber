import mongoose, { Schema, Document } from 'mongoose';
import { Message } from '../../../domain/entities/Message';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (MESSAGE)
 * ==========================================
 */

export interface IMessageDocument extends Document {
  chatId: string;
  senderId: mongoose.Types.ObjectId | any;
  receiverId?: mongoose.Types.ObjectId | any;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  readBy: mongoose.Types.ObjectId[] | any[];
  replyTo?: mongoose.Types.ObjectId | any;
  mentions?: mongoose.Types.ObjectId[] | any[];
  isSystemMessage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>({
  chatId: { type: String, required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  text: { type: String, default: "" },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'], default: null },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isSystemMessage: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent schema caching issues in Next.js HMR
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export const MessageModel = mongoose.model<IMessageDocument>('Message', MessageSchema);
