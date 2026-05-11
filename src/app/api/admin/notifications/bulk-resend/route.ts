import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { AdminNotificationService } from '@/application/services/admin/AdminNotificationService';

/**
 * ==========================================
 * ADMIN API - POST /api/admin/notifications/bulk-resend
 * ==========================================
 * Retries multiple failed notifications.
 * ==========================================
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const body = await req.json();

    if (!body.ids || !Array.isArray(body.ids)) {
      return NextResponse.json({ error: "An array of 'ids' is required" }, { status: 400 });
    }

    const { successCount, failCount } = await AdminNotificationService.bulkResend(body.ids, adminId);

    return NextResponse.json({ 
      success: true, 
      message: `Bulk resend complete. Success: ${successCount}, Failed: ${failCount}`,
      stats: { successCount, failCount }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
