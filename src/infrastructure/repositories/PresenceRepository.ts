import { getRedisClient } from '../redis/redisClient';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - PRESENCE REPOSITORY
 * ==========================================
 * Manages ephemeral user status using Redis Hashes.
 * Data shape: presence:user:{userId} -> { status, lastActive, currentView }
 * ==========================================
 */
export class PresenceRepository {
  private static readonly KEY_PREFIX = 'presence:user:';
  private static readonly TTL = 60; // 60 seconds

  /**
   * Set user status with auto-expiration
   */
  static async setUserStatus(userId: string, status: 'online' | 'away' | 'offline', metadata?: any): Promise<void> {
    const client = await getRedisClient();
    const key = `${this.KEY_PREFIX}${userId}`;

    const data = {
      status,
      lastActive: Date.now().toString(),
      ...metadata
    };

    await client.hSet(key, data);
    await client.expire(key, this.TTL);
  }

  /**
   * Get specific user status
   */
  static async getUserStatus(userId: string): Promise<any> {
    const client = await getRedisClient();
    const key = `${this.KEY_PREFIX}${userId}`;
    const data = await client.hGetAll(key);
    
    if (!data || Object.keys(data).length === 0) {
      return { status: 'offline', lastActive: null };
    }

    return {
      ...data,
      lastActive: parseInt(data.lastActive)
    };
  }

  /**
   * Multi-fetch statuses
   */
  static async getMultiUserStatus(userIds: string[]): Promise<Record<string, any>> {
    const client = await getRedisClient();
    const results: Record<string, any> = {};

    await Promise.all(userIds.map(async (id) => {
      results[id] = await this.getUserStatus(id);
    }));

    return results;
  }

  /**
   * Clear status (explicit logout)
   */
  static async clearUserStatus(userId: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(`${this.KEY_PREFIX}${userId}`);
  }
}
