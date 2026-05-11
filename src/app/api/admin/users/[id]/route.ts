import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserService } from '@/application/services/UserService';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users/:id
 * ==========================================
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await protectRoute(req, ['admin']);

    const user = await UserService.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stats = await UserService.getUserStats(id);

    return NextResponse.json({ 
      ...user, 
      stats 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * ==========================================
 * ADMIN API - DELETE /api/admin/users/:id
 * ==========================================
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await UserService.deleteUserDeep(id);

    // Audit Log
    await AuditLogService.log({
      adminId,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: id,
      metadata: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: "User and all associated content deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
