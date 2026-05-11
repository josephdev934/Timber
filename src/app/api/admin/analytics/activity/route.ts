import { NextRequest, NextResponse } from 'next/server';
import { AuditLogModel } from '@/infrastructure/db/models/AuditLog';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { getRedisClient } from '@/infrastructure/redis/redisClient';

/**
 * ==========================================
 * ANALYTICS API - activity
 * ==========================================
 * Aggregates platform activity over time (last 30 days).
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    const range = req.nextUrl.searchParams.get('range') || '30d';
    const cacheKey = `analytics:activity:${range}`;
    
    // 1. Check Cache
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    await connectToDatabase();

    // Calculate start date
    const days = parseInt(range.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 2. Aggregate Data (using AuditLog for high-level actions + Mocking if empty)
    // In a real app, you might aggregate from Posts/Comments directly
    // but for the dashboard overview, AuditLogs or a dedicated stats collection is common.
    
    // For this implementation, we'll aggregate from PostModel if it exists, 
    // or just provide a structured mock if the DB is empty to avoid blank charts.
    
    const { PostModel } = await import('@/infrastructure/db/models/Post');
    
    const activity = await PostModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } }
    ]);

    // 3. Cache Result (5 min TTL)
    await redis.set(cacheKey, JSON.stringify(activity), { EX: 300 });

    return NextResponse.json(activity);

  } catch (err) {
    console.error("[ANALYTICS_ACTIVITY_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 });
  }
}
