import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportService } from '@/application/services/admin/ReportService';

/**
 * ==========================================
 * PRESENTATION LAYER - POST /api/reports
 * ==========================================
 * Allows any authenticated user to report content or users.
 * ==========================================
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth Guard (Any user can report)
    const { userId } = await protectRoute(req);

    // 2. Extract and Sanitize
    const body = await req.json();
    const { reportedUserId, contentType, contentId, reason } = body;

    if (!reportedUserId || !contentType || !contentId || !reason) {
      return NextResponse.json({ 
        error: "Missing required fields for report.",
        code: "INVALID_REQUEST"
      }, { status: 400 });
    }

    // 3. Process Submission
    const report = await ReportService.submitReport({
      reporterId: userId,
      reportedUserId,
      contentType,
      contentId,
      reason
    });

    // 4. Return generic success (No details for privacy)
    return NextResponse.json({
      message: "Report submitted successfully. Thank you for helping keep Timber safe.",
      reportId: report._id
    }, { status: 201 });

  } catch (err: any) {
    console.error("[API_ERROR_REPORT_SUBMISSION]", err.message);
    const status = err.message.startsWith('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
