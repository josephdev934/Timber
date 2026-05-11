import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - CLOUDINARY SERVICE
 * ==========================================
 * Wrapper around Cloudinary Admin SDK.
 * ==========================================
 */

export class CloudinaryService {
  private static isConfigured = false;

  private static ensureConfig() {
    if (this.isConfigured) return;
    
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      console.error("[CLOUDINARY_CONFIG_ERROR] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing!");
      return;
    }

    console.log("[CLOUDINARY_CONFIG] Keys detected:", {
      apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'MISSING',
      apiSecret: apiSecret ? `${apiSecret.substring(0, 4)}...` : 'MISSING'
    });

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    
    this.isConfigured = true;
    console.log("[CLOUDINARY_CONFIG_SUCCESS] Configured with cloud:", cloudName);
  }

  /**
   * Fetches storage and bandwidth usage stats from Cloudinary.
   */
  static async getUsageStats() {
    try {
      this.ensureConfig();
      if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary credentials missing");
      }
      
      const usage = await cloudinary.api.usage();
      console.log("[CLOUDINARY_USAGE_RAW]", JSON.stringify(usage, null, 2));
      
      return {
        bandwidth: usage.bandwidth?.usage || 0,
        bandwidthLimit: usage.bandwidth?.limit || usage.bandwidth?.credits_limit || 0,
        storage: usage.storage?.usage || 0,
        storageLimit: usage.storage?.limit || usage.storage?.credits_limit || 0,
        totalAssets: usage.objects?.usage || 0,
      };
    } catch (err: any) {
      console.error("[CLOUDINARY_API_ERROR_DETAIL]", err);
      // Return fallback for local dev if credentials fail
      return {
        bandwidth: 0,
        bandwidthLimit: 1,
        storage: 0,
        storageLimit: 1
      };
    }
  }

  /**
   * Deletes an asset from Cloudinary using its public ID.
   */
  static async deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image') {
    if (!publicId) return;
    try {
      this.ensureConfig();
      if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        return; // Skip if no real credentials
      }
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err: any) {
      console.error("[CLOUDINARY_DELETE_ERROR]", err.message);
    }
  }
}
