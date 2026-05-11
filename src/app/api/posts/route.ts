import { NextResponse } from "next/server";
import { PostService } from "@/application/services/PostService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: GET /api/posts
 * ==========================================
 * Fetches the global social timeline.
 */
export async function GET(req: Request) {
  try {
    // Best-effort auth check for likedByCurrentUser
    let currentUserId: string | null = null;
    try {
      const auth = await protectRoute(req as any);
      currentUserId = auth.userId;
    } catch {
      // Not logged in, check if public feed is allowed
      const { FeatureFlagService } = await import('@/application/services/admin/FeatureFlagService');
      const isPublicFeedEnabled = await FeatureFlagService.isEnabled('publicFeed');
      if (!isPublicFeedEnabled) {
        return NextResponse.json({ error: "UNAUTHORIZED: Public feed is disabled. Please log in." }, { status: 401 });
      }
    }

    const posts = await PostService.getTimeline();
    
    const formattedPosts = posts.map(post => ({
      id: post.id,
      author: {
        name: post.author?.name || post.author?.username || "Unknown",
        username: post.author?.username ? `@${post.author.username}` : (post.author?.id ? `@${post.author.id.substring(0,6)}` : "@unknown"),
        avatar: post.author?.avatar || "/default-avatar.svg"
      },
      content: post.content,
      images: post.images || [],
      video: post.video || null,
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

/**
 * ==========================================
 * API ROUTE: POST /api/posts
 * ==========================================
 * Creates a new timeline post. Protected route.
 */
export async function POST(req: Request) {
  try {
    const auth = await protectRoute(req as any);
    const body = await req.json();
    console.log("RAW BODY [POSTS]:", body);
    
    const { text, images, video } = body;
    const post = await PostService.createPost(auth.userId, text, images, video);
    
    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith("UNAUTHORIZED") ? 401 : 500 });
  }
}
