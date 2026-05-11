import mongoose, { Schema, Document } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (REPORT)
 * ==========================================
 * Tracks user-submitted reports for moderation.
 * ==========================================
 */

export interface IReportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  contentType: 'User' | 'Comment' | 'Post' | 'Media';
  contentId: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'dismissed' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId; // adminId
}

const ReportSchema = new Schema<IReportDocument>({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contentType: { type: String, enum: ['User', 'Comment', 'Post', 'Media'], required: true },
  contentId: { type: Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'dismissed', 'resolved'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Index for the priority queue
ReportSchema.index({ status: 1, createdAt: -1 });

export const ReportModel = mongoose.models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);
