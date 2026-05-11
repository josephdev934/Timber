import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { PostModel } from '@/infrastructure/db/models/Post';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/posts
 * ==========================================
 * Comprehensive post & comment management.
 * Supports keyword search, author filtering, and pagination.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const offset = (page - 1) * limit;

    // Build Query
    const query: any = {};
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } }
      ];
    }

    // Build Sort
    let sort: any = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'popular') sort = { likeCount: -1 };

    const [posts, total] = await Promise.all([
      PostModel.find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .populate('author', 'name username profilePhoto')
        .populate('authorId', 'name username profilePhoto')
        .lean(),
      PostModel.countDocuments(query)
    ]);

    // Format for Admin Dashboard
    const formattedPosts = posts.map((p: any) => ({
      id: p._id.toString(),
      content: p.content || p.text || "",
      author: p.author || p.authorId || { name: "Unknown", username: "unknown" },
      stats: {
        likes: p.likeCount || 0,
        comments: p.commentCount || 0
      },
      hasMedia: (p.images?.length > 0 || p.video),
      createdAt: p.createdAt
    }));

    return NextResponse.json({
      posts: formattedPosts,
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
