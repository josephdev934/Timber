import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportService } from '@/application/services/admin/ReportService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/reports/:id/dismiss
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { userId } = await protectRoute(req, ['admin']);

    await ReportService.dismissReport(reportId, userId);

    return NextResponse.json({ success: true, message: "Report dismissed." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
