import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { NotificationLogModel } from '@/infrastructure/db/models/NotificationLog';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/notifications
 * ==========================================
 * Fetches recent notification logs with unread filtering.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get('unread') === 'true';

    const query: any = {};
    if (unreadOnly) {
      query.readAt = { $exists: false };
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationLogModel.find(query)
        .sort({ sentAt: -1 })
        .limit(20)
        .populate('recipientId', 'name username profilePhoto')
        .lean(),
      NotificationLogModel.countDocuments({ readAt: { $exists: false } })
    ]);

    return NextResponse.json({
      notifications,
      unreadCount
    });

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_NOTIFICATIONS]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
