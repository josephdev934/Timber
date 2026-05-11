import mongoose, { Schema, Document } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (MEDIA)
 * ==========================================
 * Tracks all user-uploaded media (images, videos) independent 
 * of the posts or messages they are attached to.
 * ==========================================
 */

export interface IMediaDocument extends Document {
  url: string;
  publicId?: string; // Cloudinary public ID
  uploaderId: mongoose.Types.ObjectId;
  type: 'image' | 'video';
  size?: number; // In bytes
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMediaDocument>({
  url: { type: String, required: true },
  publicId: { type: String },
  uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  size: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent schema caching issues in Next.js HMR
if (mongoose.models.Media) {
  delete mongoose.models.Media;
}

export const MediaModel = mongoose.model<IMediaDocument>('Media', MediaSchema);
