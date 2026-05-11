import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ReportRepository } from '@/infrastructure/repositories/admin/ReportRepository';

/**
 * ==========================================
 * PRESENTATION LAYER - GET /api/admin/reports
 * ==========================================
 * Protected endpoint for admins to browse the moderation queue.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Auth & Role Guard
    await protectRoute(req, ['admin']);

    // 2. Query Params
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'pending'; // pending, resolved, dismissed, all
    const offset = (page - 1) * limit;

    // 3. Fetch
    const [reports, total] = await Promise.all([
      ReportRepository.findByStatus(status, limit, offset),
      ReportRepository.countByStatus(status)
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_REPORTS_LIST]", err.message);
    const status = err.message === 'FORBIDDEN_ROLE_RESTRICTION' ? 403 : 
                   err.message.startsWith('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
