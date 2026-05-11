import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { PostModel } from '@/infrastructure/db/models/Post';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - DELETE /api/admin/posts/[id]
 * ==========================================
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const result = await PostModel.findByIdAndDelete(params.id);
    if (!result) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Also decrement total post count in stats cache if needed, but for now we'll let the next sync handle it.
    
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
