import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { GroupService } from '@/application/services/admin/GroupService';

/**
 * ==========================================
 * ADMIN API - /api/admin/groups/:id/members/:userId
 * ==========================================
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await GroupService.addMember(id, userId, adminId);

    return NextResponse.json({ success: true, message: "Member added to group" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await GroupService.removeMember(id, userId, adminId);

    return NextResponse.json({ success: true, message: "Member removed from group" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
