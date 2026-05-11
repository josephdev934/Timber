import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportService } from '@/application/services/admin/ReportService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/reports/:id/ban
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

    await ReportService.resolveWithBan(id, adminId, reason || "Violation of community standards");

    return NextResponse.json({ success: true, message: "User banned and report resolved." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
