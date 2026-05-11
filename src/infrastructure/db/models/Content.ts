import mongoose, { Schema, Document } from 'mongoose';
import { Content } from '../../../domain/entities/Content';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (CONTENT)
 * ==========================================
 * Adapts the pure Content entity to Mongoose specifics.
 * ==========================================
 */

export interface IContentDocument extends Document, Omit<Content, 'id'> {
  createdBy: mongoose.Types.ObjectId | any; // Mongoose internal refs handle Population vs raw IDs
}

const ContentSchema = new Schema<IContentDocument>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const ContentModel = mongoose.models.Content || mongoose.model<IContentDocument>('Content', ContentSchema);
