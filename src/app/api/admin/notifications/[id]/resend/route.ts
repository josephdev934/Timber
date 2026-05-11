import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { AdminNotificationService } from '@/application/services/admin/AdminNotificationService';

/**
 * ==========================================
 * ADMIN API - POST /api/admin/notifications/:id/resend
 * ==========================================
 * Retries a single failed notification using its stored payload.
 * ==========================================
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);

    const success = await AdminNotificationService.resendNotification(params.id, adminId);

    if (success) {
      return NextResponse.json({ success: true, message: "Notification resent successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Failed to resend notification" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
