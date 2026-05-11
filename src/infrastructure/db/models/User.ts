import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../../../domain/entities/User';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (USER)
 * ==========================================
 * This layer takes the pure Domain Entity and maps it to MongoDB using Mongoose.
 * Adapts generic 'string' IDs to complex 'mongoose.Types.ObjectId'.
 * ==========================================
 */

// A database-specific interface matching the structure required by mongoose
// while satisfying the pure entity requirements whenever materialized.
export interface IUserDocument extends Document, Omit<User, 'id'> {
  // 'id' is naturally projected via Mongoose's toJSON transformer
}

/**
 * Mongoose Schema outlining structure and field constraints.
 */
const UserSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePhoto: { type: String },
  bio: { type: String },
  // Phase 4 Additions
  isBanned: { type: Boolean, default: false, index: true },
  banReason: { type: String },
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reportCount: { type: Number, default: 0 }
}, { 
  timestamps: true // Automatically fills createdAt and updatedAt
});

// Guard to prevent Next.js from recompiling duplicate models
export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
