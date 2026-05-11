import { NextResponse } from "next/server";
import { PostService } from "@/application/services/PostService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    let currentUserId: string | null = null;
    try {
      const auth = await protectRoute(req as any);
      currentUserId = auth.userId;
    } catch { }

    const { id } = await params;
    const posts = await PostService.getUserPosts(id);
    
    const formattedPosts = posts.map(post => ({
      id: post.id,
      author: {
        name: post.author?.name || post.author?.username || "Unknown",
        username: post.author?.username ? `@${post.author.username}` : (post.author?.id ? `@${post.author.id.substring(0,6)}` : "@unknown"),
        avatar: post.author?.avatar || "/default-avatar.svg"
      },
      content: post.content,
      images: post.images || [],
      video: post.video,
      likes: post.likes,
      likeCount: post.likeCount ?? post.likes.length,
      commentCount: post.commentCount ?? 0,
      likedByCurrentUser: currentUserId ? post.likes.includes(currentUserId) : false,
      timestamp: new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stats: { 
        likes: post.likeCount ?? post.likes.length, 
        comments: post.commentCount ?? 0, 
        shares: 0 
      }
    }));

    return NextResponse.json(formattedPosts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
