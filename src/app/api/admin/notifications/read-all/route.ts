import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { NotificationLogModel } from '@/infrastructure/db/models/NotificationLog';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/notifications/read-all
 * ==========================================
 * Marks all unread notification logs as read.
 * ==========================================
 */
export async function PATCH(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    // Mark all logs without a readAt field as read
    await NotificationLogModel.updateMany(
      { readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_NOTIFICATIONS_READ_ALL]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
