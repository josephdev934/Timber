import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportService } from '@/application/services/admin/ReportService';

/**
 * ==========================================
 * ADMIN API - DELETE /api/admin/reports/:id/content
 * ==========================================
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { userId } = await protectRoute(req, ['admin']);

    await ReportService.resolveWithDeletion(reportId, userId);

    return NextResponse.json({ success: true, message: "Content deleted and report resolved." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
