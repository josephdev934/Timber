import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { NotificationLogModel } from '@/infrastructure/db/models/NotificationLog';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/notification-logs
 * ==========================================
 * Paginated list of platform notification delivery logs.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, pending, delivered, failed
    const type = searchParams.get('type') || 'all';

    const offset = (page - 1) * limit;
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (type !== 'all') {
      query.type = type;
    }

    const [logs, total] = await Promise.all([
      NotificationLogModel.find(query)
        .sort({ sentAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('recipientId', 'name username profilePhoto')
        .lean(),
      NotificationLogModel.countDocuments(query)
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
