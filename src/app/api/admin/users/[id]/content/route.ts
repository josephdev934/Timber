import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users/:id/content
 * ==========================================
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const [posts, comments] = await Promise.all([
      import('@/infrastructure/db/models/Post').then(({ PostModel }) => 
        PostModel.find({ $or: [{ author: userId }, { authorId: userId }] }).sort({ createdAt: -1 }).lean()
      ),
      import('@/infrastructure/db/models/Comment').then(({ CommentModel }) => 
        CommentModel.find({ authorId: userId }).sort({ createdAt: -1 }).lean()
      )
    ]);

    return NextResponse.json({ posts, comments });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
