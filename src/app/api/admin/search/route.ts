import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { UserModel } from '@/infrastructure/db/models/User';
import { PostModel } from '@/infrastructure/db/models/Post';
import { CommentModel } from '@/infrastructure/db/models/Comment';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/search
 * ==========================================
 * Global search across users, groups, posts and comments.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const regex = new RegExp(query, 'i');

    // Parallel search
    const [users, posts, comments] = await Promise.all([
      UserModel.find({ 
        $or: [
          { name: regex },
          { username: regex },
          { email: regex }
        ] 
      }).limit(5).select('name username profilePhoto').lean(),
      
      PostModel.find({ 
        $or: [
          { text: regex },
          { 'author.name': regex }
        ] 
      }).limit(5).populate('authorId', 'name username').lean(),

      CommentModel.find({ 
        text: regex 
      }).limit(5).populate('authorId', 'name username').lean()
    ]);

    // For groups, we'd search the Group collection if it exists
    // Assuming GroupModel exists based on previous file listings
    let groups: any[] = [];
    try {
        const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
        groups = await ConversationModel.find({ 
          type: 'group',
          $or: [
            { name: regex },
            { description: regex }
          ] 
        }).limit(5).select('name description').lean();
    } catch (e) {}

    const results = [
      ...users.map(u => ({ id: u._id, type: 'User', title: u.name, subtitle: u.username, image: u.profilePhoto, href: `/admin/users?id=${u._id}` })),
      ...groups.map(g => ({ id: g._id, type: 'Group', title: g.name, subtitle: g.description, href: `/admin/groups?id=${g._id}` })),
      ...posts.map(p => ({ id: p._id, type: 'Post', title: p.text?.substring(0, 40), subtitle: `By ${p.authorId?.name || 'Unknown'}`, href: `/admin/posts?id=${p._id}` })),
      ...comments.map(c => ({ id: c._id, type: 'Comment', title: c.text?.substring(0, 40), subtitle: `On content ${c.contentId}`, href: `/admin/posts?commentId=${c._id}` }))
    ];

    return NextResponse.json({ results });

  } catch (err: any) {
    console.error("[API_ERROR_ADMIN_SEARCH]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
