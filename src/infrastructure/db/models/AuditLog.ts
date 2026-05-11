import mongoose, { Schema, Document } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (AUDIT LOG)
 * ==========================================
 * Records every write and destructive action taken by an admin.
 * ==========================================
 */

export interface IAuditLogDocument extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;       // "BAN_USER" | "DELETE_CONTENT" | "DISBAND_GROUP" | "ACTION_REPORT" | "CHANGE_SETTINGS" | "TOGGLE_MAINTENANCE"
  targetType: string;   // "User" | "Group" | "Comment" | "Post" | "Media" | "Report" | "Platform"
  targetId: mongoose.Types.ObjectId;
  metadata: any;        // reason, old value, new value
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for faster searching in the dashboard
AuditLogSchema.index({ adminId: 1, action: 1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
