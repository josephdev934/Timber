import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserService } from '@/application/services/UserService';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/users/:id/unban
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await UserService.unbanUser(id);

    // Audit Log
    await AuditLogService.log({
      adminId,
      action: 'UNBAN_USER',
      targetType: 'User',
      targetId: id,
      metadata: { status: 'active' }
    });

    return NextResponse.json({ success: true, message: "User unbanned." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
