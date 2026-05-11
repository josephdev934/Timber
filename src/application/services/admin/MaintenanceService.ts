import { getRedisClient } from '../../../infrastructure/redis/redisClient';

/**
 * ==========================================
 * APPLICATION LAYER - MAINTENANCE SERVICE
 * ==========================================
 * Manages the platform-wide maintenance state.
 * Stored in Redis for instant, cross-instance synchronization.
 * ==========================================
 */
export class MaintenanceService {
  private static readonly KEY = 'platform:maintenance';

  /**
   * Check if maintenance mode is enabled.
   */
  static async isEnabled(): Promise<{ enabled: boolean; message: string }> {
    try {
      const client = await getRedisClient();
      const data = await client.get(this.KEY);
      
      if (!data) {
        return { enabled: false, message: "" };
      }

      return JSON.parse(data);
    } catch (err) {
      console.error("[MAINTENANCE_CHECK_FAILED]", err);
      // Fail-safe: Assume platform is live if Redis is down
      return { enabled: false, message: "" };
    }
  }

  /**
   * Toggle maintenance mode.
   */
  static async setStatus(enabled: boolean, message = "The platform is currently undergoing scheduled maintenance. Please check back later."): Promise<void> {
    const client = await getRedisClient();
    const data = JSON.stringify({ enabled, message, updatedAt: new Date() });
    await client.set(this.KEY, data);
    console.log(`[MAINTENANCE_MODE] ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}
