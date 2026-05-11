import mongoose, { Schema, Document } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB MODELS (SETTINGS)
 * ==========================================
 * Singleton document storing global platform configuration.
 * ==========================================
 */

export interface IPlatformSettingsDocument extends Document {
  isSingleton: boolean;
  general: {
    platformName: string;
    logoUrl?: string;
  };
  features: {
    mediaUploads: boolean;
    groupCreation: boolean;
    publicFeed: boolean;
    mentions: boolean;
    notifications: boolean;
  };
  rateLimits: {
    messagesPerMinute: number;
    uploadsPerDay: number;
    reportsPerHour: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettingsDocument>({
  isSingleton: { type: Boolean, default: true, unique: true }, // Ensures only one doc exists
  general: {
    platformName: { type: String, default: 'Timber' },
    logoUrl: { type: String, default: '' }
  },
  features: {
    mediaUploads: { type: Boolean, default: true },
    groupCreation: { type: Boolean, default: true },
    publicFeed: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  rateLimits: {
    messagesPerMinute: { type: Number, default: 60 },
    uploadsPerDay: { type: Number, default: 50 },
    reportsPerHour: { type: Number, default: 10 }
  },
  maintenance: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'The platform is currently down for maintenance.' }
  }
}, { timestamps: true });

// Model initialization
export const PlatformSettingsModel = mongoose.models.PlatformSettings || mongoose.model<IPlatformSettingsDocument>('PlatformSettings', PlatformSettingsSchema);
