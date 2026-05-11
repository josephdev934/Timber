import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserService } from '@/application/services/UserService';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/users/:id/ban
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "Ban reason is required." }, { status: 400 });
    }

    await UserService.banUser(id, reason);

    // Audit Log
    await AuditLogService.log({
      adminId,
      action: 'BAN_USER',
      targetType: 'User',
      targetId: id,
      metadata: { reason }
    });

    return NextResponse.json({ success: true, message: "User banned and disconnected." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
