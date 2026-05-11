import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { getRedisClient } from '@/infrastructure/redis/redisClient';
import { UserModel } from '@/infrastructure/db/models/User';
import { ReportModel } from '@/infrastructure/db/models/Report';
import { MediaModel } from '@/infrastructure/db/models/Media';
import { socketServer } from '@/infrastructure/socket/socketServer';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/stats
 * ==========================================
 * Aggregates high-level platform stats for the Overview page.
 * Includes total counts and trend data (Growth metrics).
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Guard & Cache Check
    await protectRoute(req, ['admin']);
    const redis = await getRedisClient();
    const cacheKey = 'admin:stats:snapshot';
    
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    await connectToDatabase();

    // 2. Define Timeframes for Trends
    const now = new Date();
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(new Date(todayStart).setDate(todayStart.getDate() - 1));
    const weekStart = new Date(new Date(todayStart).setDate(todayStart.getDate() - 7));
    const lastWeekStart = new Date(new Date(weekStart).setDate(weekStart.getDate() - 7));

    // 3. Extract activeNow from Socket.IO Server instance
    const io = socketServer.getIO();
    const activeNow = io ? io.engine.clientsCount : 0;

    // 4. Parallel Aggregation
    const [
      totalUsers,
      pendingReports,
      flaggedMedia,
      flaggedPosts,
      flaggedMessages,
      totalMedia,
      mediaUploadsToday,
      usersThisWeek,
      usersLastWeek,
      reportsThisWeek,
      reportsLastWeek,
      mediaUploadsYesterday
    ] = await Promise.all([
      UserModel.countDocuments(),
      ReportModel.countDocuments({ status: 'pending' }),
      MediaModel.countDocuments({ isFlagged: true }),
      require('@/infrastructure/db/models/Post').PostModel.countDocuments({ isFlagged: true }),
      require('@/infrastructure/db/models/Message').MessageModel.countDocuments({ isFlagged: true }),
      MediaModel.countDocuments(),
      MediaModel.countDocuments({ createdAt: { $gte: todayStart } }),
      
      // Trend Deltas
      UserModel.countDocuments({ createdAt: { $gte: weekStart } }),
      UserModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
      
      ReportModel.countDocuments({ createdAt: { $gte: weekStart } }),
      ReportModel.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
      
      MediaModel.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } })
    ]);

    const totalPendingMod = pendingReports + flaggedMedia + flaggedPosts + flaggedMessages;

    const stats = {
      totalUsers,
      activeNow,
      pendingReports: totalPendingMod,
      mediaUploads: totalMedia, // Switched to Total Media for dashboard accuracy
      mediaToday: mediaUploadsToday,
      trends: {
        totalUsers: { current: usersThisWeek, previous: usersLastWeek },
        pendingReports: { current: reportsThisWeek, previous: reportsLastWeek },
        mediaUploads: { current: mediaUploadsToday, previous: mediaUploadsYesterday }
      }
    };

    // 5. Persist to Cache (30s TTL)
    await redis.set(cacheKey, JSON.stringify(stats), { EX: 30 });

    return NextResponse.json(stats);

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_STATS]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
