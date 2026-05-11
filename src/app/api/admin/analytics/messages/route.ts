import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { getRedisClient } from '@/infrastructure/redis/redisClient';

/**
 * ==========================================
 * ANALYTICS API - messages
 * ==========================================
 * Aggregates message volume (last 7 days).
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    const range = req.nextUrl.searchParams.get('range') || '7d';
    const cacheKey = `analytics:messages:${range}`;
    
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    await connectToDatabase();

    const days = parseInt(range.replace('d', '')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { MessageModel } = await import('@/infrastructure/db/models/Message');
    
    const messageStats = await MessageModel.aggregate([
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

    await redis.set(cacheKey, JSON.stringify(messageStats), { EX: 300 });

    return NextResponse.json(messageStats);

  } catch (err) {
    console.error("[ANALYTICS_MESSAGES_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch message data" }, { status: 500 });
  }
}
