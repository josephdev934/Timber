import mongoose, { Schema, Document } from 'mongoose';
import { Conversation } from '../../../domain/entities/Conversation';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (CONVERSATION)
 * ==========================================
 * Translates Conversation pure interface to Mongoose Schema definition.
 * ==========================================
 */

export interface IConversationDocument extends Document {
  type: 'private' | 'group';
  name?: string;
  groupPhoto?: string;
  groupPhotoUpdatedBy?: mongoose.Types.ObjectId;
  groupPhotoUpdatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId | any;
  participants: mongoose.Types.ObjectId[] | any[];
  removedParticipants: mongoose.Types.ObjectId[] | any[];
  hiddenBy: mongoose.Types.ObjectId[] | any[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>({
  type: { type: String, enum: ['private', 'group'], required: true },
  name: { type: String, default: null },
  groupPhoto: { type: String, default: null },
  groupPhotoUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  groupPhotoUpdatedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  removedParticipants: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  hiddenBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  status: { type: String, enum: ['active', 'archived'], default: 'active', index: true }
}, { timestamps: true });

// Standard guard pattern for Next.js models
export const ConversationModel = mongoose.models.Conversation || mongoose.model<IConversationDocument>('Conversation', ConversationSchema);
