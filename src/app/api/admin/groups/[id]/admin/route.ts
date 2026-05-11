import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { GroupService } from '@/application/services/admin/GroupService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/groups/:id/admin
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const { newAdminId } = await req.json();

    if (!newAdminId) {
      return NextResponse.json({ error: "newAdminId is required" }, { status: 400 });
    }

    await GroupService.transferAdmin(params.id, newAdminId, adminId);

    return NextResponse.json({ success: true, message: "Group admin transferred" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
