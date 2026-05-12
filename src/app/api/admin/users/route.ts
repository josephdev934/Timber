import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserModel } from '@/infrastructure/db/models/User';
import { connectToDatabase } from '@/infrastructure/db/connect';

export const dynamic = 'force-dynamic';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users
 * ==========================================
 * Paginated, searchable, and filterable user directory.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[ADMIN_USERS_FETCH] Starting request...");
    // 1. Guard
    await protectRoute(req, ['admin']);

    // 2. Extract Params
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, banned
    const role = searchParams.get('role') || 'all';

    const offset = (page - 1) * limit;

    // 3. Build Query
    await connectToDatabase();
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
    }

    if (role !== 'all') {
      query.role = role;
    }

    // 4. Fetch
    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      UserModel.countDocuments(query)
    ]);
    
    console.log(`[ADMIN_USERS_FETCH] Found ${total} users for query:`, JSON.stringify(query));

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_USERS_LIST]", err.message);
    const status = err.message === 'FORBIDDEN_ROLE_RESTRICTION' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
