import { Server } from 'socket.io';
import { getRedisClient } from '../../../infrastructure/redis/redisClient';
import mongoose from 'mongoose';

/**
 * ==========================================
 * APPLICATION LAYER - STATS SERVICE
 * ==========================================
 * Background ticker that aggregates platform stats 
 * and broadcasts them to the Admin Dashboard.
 * ==========================================
 */
export class StatsService {
  private static ticker: NodeJS.Timeout | null = null;
  private static io: Server | null = null;

  /**
   * Start the stats broadcasting ticker.
   */
  public static start(io: Server) {
    if (this.ticker) {
      clearInterval(this.ticker);
    }
    this.io = io;

    console.log("[STATS_SERVICE_START] Ticker initialized (5s interval)");

    this.ticker = setInterval(() => {
      this.emitStats();
    }, 5000);

    // Immediate first emit
    this.emitStats();
  }

  /**
   * Stop the ticker.
   */
  public static stop() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  /**
   * Aggregate and emit stats to admin:stats room.
   */
  private static async emitStats() {
    if (!this.io) return;

    try {
      const redis = await getRedisClient();
      
      // 1. Fetch live metrics from Redis
      const activeConnections = await redis.get('stats:activeConnections');
      const totalUsers = await redis.get('stats:totalUsers');
      const pendingReports = await redis.get('stats:pendingReports');
      const mediaUploads = await redis.get('stats:mediaUploads');

      // 2. Fetch cache hit rate from Redis info
      const info = await redis.info('stats');
      const keyspace_hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || "0");
      const keyspace_misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || "0");
      const totalRequests = keyspace_hits + keyspace_misses;
      const cacheHitRate = totalRequests > 0 ? (keyspace_hits / totalRequests) * 100 : 0;

      const activeRooms = this.io.sockets.adapter.rooms.size;
      const clientsInRoom = this.io.sockets.adapter.rooms.get('admin:stats')?.size || 0;

      const redisCount = parseInt(activeConnections || "0");
      const rawCount = this.io.engine.clientsCount;
      
      // Trust the physical count (rawCount) as the primary source of truth for 
      // the dashboard display to avoid stale Redis values from crashes.
      const finalActiveConnections = rawCount;

      const payload = {
        activeConnections: finalActiveConnections,
        redisCount: redisCount,
        rawSocketCount: rawCount,
        activeRooms: activeRooms,
        totalUsers: parseInt(totalUsers || "0"),
        pendingReports: parseInt(pendingReports || "0"),
        mediaUploads: parseInt(mediaUploads || "0"),
        cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
        clientsInRoom: clientsInRoom,
        timestamp: new Date()
      };

      // 3. Emit to admin stats room
      this.io.to('admin:stats').emit('STATS_UPDATE', payload);

    } catch (err) {
      console.error("[STATS_SERVICE_EMIT_FAILED]", err);
    }
  }
}
