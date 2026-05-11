import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ConversationModel } from '@/infrastructure/db/models/Conversation';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/groups
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, active, archived

    const offset = (page - 1) * limit;

    const query: any = { type: 'group' };
    if (status !== 'all') {
      query.status = status;
    }

    const [groups, total] = await Promise.all([
      ConversationModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('createdBy', 'name username')
        .populate('participants', 'name username profilePhoto')
        .lean(),
      ConversationModel.countDocuments(query)
    ]);

    return NextResponse.json({
      groups,
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
