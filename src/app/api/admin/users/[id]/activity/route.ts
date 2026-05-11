import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users/:id/activity
 * ==========================================
 * Returns a log of user activities.
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

    // Fetch posts and comments as activity points
    const [posts, comments] = await Promise.all([
      import('@/infrastructure/db/models/Post').then(({ PostModel }) => 
        PostModel.find({ $or: [{ author: userId }, { authorId: userId }] }).sort({ createdAt: -1 }).limit(10).lean()
      ),
      import('@/infrastructure/db/models/Comment').then(({ CommentModel }) => 
        CommentModel.find({ authorId: userId }).sort({ createdAt: -1 }).limit(10).lean()
      )
    ]);

    const activity = [
      ...posts.map(p => ({ type: 'post', date: (p as any).createdAt, text: (p as any).content || (p as any).text })),
      ...comments.map(c => ({ type: 'comment', date: (c as any).createdAt, text: (c as any).text }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ activity });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
