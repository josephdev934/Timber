import mongoose, { Schema, Document } from 'mongoose';
import { Comment } from '../../../domain/entities/Comment';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (COMMENT)
 * ==========================================
 * Adapts pure Comment entity structures to MongoDB requirements.
 * ==========================================
 */

export interface ICommentDocument extends Document {
  contentId: mongoose.Types.ObjectId | any;
  authorId: mongoose.Types.ObjectId | any;
  text: string;
  parentId?: mongoose.Types.ObjectId | any;
  likes: mongoose.Types.ObjectId[] | any[];
  mentions?: mongoose.Types.ObjectId[] | any[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>({
  contentId: { type: Schema.Types.ObjectId, required: true, refPath: 'onModel', index: true }, // Index for fast post-level lookups
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', index: true }, // Index for threaded hierarchy traversal
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export const CommentModel = mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);
