import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { NotificationLogModel } from '@/infrastructure/db/models/NotificationLog';

/**
 * ==========================================
 * ADMIN API - POST /api/admin/notification-logs/bulk-resend
 * ==========================================
 * Finds all 'failed' NotificationLog entries and marks them
 * for re-delivery by resetting their status to 'pending'.
 * ==========================================
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await protectRoute(req, ['admin']);
    await connectToDatabase();

    const result = await NotificationLogModel.updateMany(
      { status: 'failed' },
      { $set: { status: 'pending', deliveredAt: null } }
    );

    return NextResponse.json({
      success: true,
      requeued: result.modifiedCount,
      message: `${result.modifiedCount} failed notification(s) re-queued for delivery.`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/**
 * GET /api/admin/notification-logs/bulk-resend
 * Returns the count of failed notifications (used for the button label)
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const failedCount = await NotificationLogModel.countDocuments({ status: 'failed' });

    return NextResponse.json({ failedCount });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
