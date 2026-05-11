import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportRepository } from '@/infrastructure/repositories/admin/ReportRepository';
import { PostModel } from '@/infrastructure/db/models/Post';
import { CommentModel } from '@/infrastructure/db/models/Comment';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/reports/:id
 * ==========================================
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const report = await ReportRepository.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Attempt to fetch the actual violating content for preview
    let contentPreview = null;
    try {
      if (report.contentType === 'Post') {
        contentPreview = await PostModel.findById(report.contentId).lean();
      } else if (report.contentType === 'Comment') {
        contentPreview = await CommentModel.findById(report.contentId).lean();
      } else if (report.contentType === 'Media') {
        const { MediaModel } = require('@/infrastructure/db/models/Media');
        contentPreview = await MediaModel.findById(report.contentId).lean();
      }
    } catch (e) {
      console.warn(`[REPORT_CONTENT_PREVIEW_FAILED] ${report.contentType}:${report.contentId}`, e);
    }

    return NextResponse.json({
      report,
      contentPreview
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
