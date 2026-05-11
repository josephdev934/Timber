import { getRedisClient } from '../../../infrastructure/redis/redisClient';
import { PlatformSettingsService } from './PlatformSettingsService';

/**
 * ==========================================
 * APPLICATION LAYER - FEATURE FLAG SERVICE
 * ==========================================
 * Provides high-performance feature gating.
 * Reads from Redis (primary) with MongoDB fallback.
 * ==========================================
 */
export class FeatureFlagService {
  private static readonly REDIS_KEY = 'platform:features';

  /**
   * Check if a specific feature is enabled
   */
  static async isEnabled(feature: 'mediaUploads' | 'groupCreation' | 'publicFeed' | 'mentions' | 'notifications'): Promise<boolean> {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(this.REDIS_KEY);

      if (cached) {
        const features = JSON.parse(cached);
        return !!features[feature];
      }

      // Fallback: Fetch from DB and seed Redis
      const settings = await PlatformSettingsService.getSettings();
      const features = settings.features;
      
      await redis.set(this.REDIS_KEY, JSON.stringify(features), { EX: 3600 }); // Cache for 1 hour
      
      return !!features[feature];
    } catch (err) {
      console.warn(`[FEATURE_FLAG_CHECK_FAILED] Falling back to TRUE for ${feature}`, err);
      // Defensive fallback: assume enabled if system is failing
      return true;
    }
  }

  /**
   * Assert that a feature is enabled. Throws error if disabled.
   */
  static async assertEnabled(feature: 'mediaUploads' | 'groupCreation' | 'publicFeed' | 'mentions' | 'notifications'): Promise<void> {
    const enabled = await this.isEnabled(feature);
    if (!enabled) {
      throw new Error(`FEATURE_DISABLED: The "${feature}" capability is currently disabled by administrators.`);
    }
  }
}
