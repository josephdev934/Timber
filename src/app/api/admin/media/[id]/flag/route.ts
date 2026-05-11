import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { MediaService } from '@/application/services/admin/MediaService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/media/:id/flag
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    const isFlagged = await MediaService.toggleFlag(id, adminId);

    return NextResponse.json({ success: true, isFlagged, message: "Media flag toggled" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
