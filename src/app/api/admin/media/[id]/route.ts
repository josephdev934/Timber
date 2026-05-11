import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { MediaService } from '@/application/services/admin/MediaService';

/**
 * ==========================================
 * ADMIN API - DELETE /api/admin/media/:id
 * ==========================================
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await MediaService.deleteMedia(id, adminId);

    return NextResponse.json({ success: true, message: "Media deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
