import mongoose, { Schema, Document } from 'mongoose';
import { Post } from '../../../domain/entities/Post';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (POST)
 * ==========================================
 * Adapts abstract Post entity for Mongoose schema translation.
 * ==========================================
 */

export interface IPostDocument extends Document {
  author: mongoose.Types.ObjectId | any;
  authorId?: mongoose.Types.ObjectId | any; // Legacy fallback
  content: string;
  text?: string; // Legacy fallback
  likeCount: number;
  commentCount: number;
  likes: mongoose.Types.ObjectId[] | any[];
  media: any[];
  images: string[];
  video?: string;
  isFlagged?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPostDocument>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User' }, // Legacy fallback
  text: { type: String }, // Legacy fallback
  media: [{}], // Loosely defined array for mixed media sets (JSON struct)
  images: [{ type: String }],
  video: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent schema caching issues in Next.js HMR
if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

export const PostModel = mongoose.model<IPostDocument>('Post', PostSchema);
