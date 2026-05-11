import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { getRedisClient } from '@/infrastructure/redis/redisClient';

/**
 * ==========================================
 * ANALYTICS API - content-breakdown
 * ==========================================
 * Returns counts of different content types.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    const cacheKey = `analytics:content-breakdown`;
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    await connectToDatabase();

    const [postCount, commentCount, mediaCount] = await Promise.all([
      (await import('@/infrastructure/db/models/Post')).PostModel.countDocuments(),
      (await import('@/infrastructure/db/models/Comment')).CommentModel.countDocuments(),
      (await import('@/infrastructure/db/models/Media')).MediaModel.countDocuments(),
    ]);

    const result = [
      { name: 'Posts', value: postCount, color: '#775839' },
      { name: 'Comments', value: commentCount, color: '#8C7B6E' },
      { name: 'Media', value: mediaCount, color: '#C4966A' }
    ];

    await redis.set(cacheKey, JSON.stringify(result), { EX: 300 });

    return NextResponse.json(result);

  } catch (err) {
    console.error("[ANALYTICS_BREAKDOWN_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch breakdown data" }, { status: 500 });
  }
}
