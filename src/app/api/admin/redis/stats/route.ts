import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { getRedisClient } from '@/infrastructure/redis/redisClient';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/redis/stats
 * ==========================================
 * Fetches Redis memory usage and a sample of keys.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    const redis = await getRedisClient();

    // 1. Fetch memory stats
    const memoryInfo = await redis.info('memory');
    const usedMemoryStr = memoryInfo.match(/used_memory_human:(.*)/)?.[1]?.trim() || "0B";
    const maxMemoryStr = memoryInfo.match(/maxmemory_human:(.*)/)?.[1]?.trim() || "0B";
    
    // Parse bytes for percentage calculation
    const usedBytes = parseInt(memoryInfo.match(/used_memory:(\d+)/)?.[1] || "0");
    let maxBytes = parseInt(memoryInfo.match(/maxmemory:(\d+)/)?.[1] || "0");
    
    // If maxmemory is 0 (no eviction policy / unbounded), assume 2GB for display
    if (maxBytes === 0) maxBytes = 2 * 1024 * 1024 * 1024; 
    
    const memoryPercentage = maxBytes > 0 ? (usedBytes / maxBytes) * 100 : 0;

    // 2. Fetch keyspace stats
    const keyspaceInfo = await redis.info('keyspace');
    const totalKeys = parseInt(keyspaceInfo.match(/keys=(\d+)/)?.[1] || "0");

    // 3. Scan for a sample of keys (NEVER use keys '*')
    // SCAN returns [cursor, [keys]]
    const scanResult = await redis.scan(0, { MATCH: '*', COUNT: 100 });
    const keys = scanResult.keys || [];

    return NextResponse.json({
      memory: {
        used: usedMemoryStr,
        max: maxMemoryStr === '0B' ? 'Unbounded' : maxMemoryStr,
        percentage: parseFloat(memoryPercentage.toFixed(2))
      },
      keyspace: {
        totalKeys,
        sampleKeys: keys
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
