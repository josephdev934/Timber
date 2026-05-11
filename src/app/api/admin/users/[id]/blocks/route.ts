import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserModel } from '@/infrastructure/db/models/User';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users/:id/blocks
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

    const user = await UserModel.findById(id).populate('blockedUsers', 'name username profilePhoto').lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ blockedUsers: user.blockedUsers || [] });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
