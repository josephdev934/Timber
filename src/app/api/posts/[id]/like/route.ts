import { NextResponse } from "next/server";
import { PostService } from "@/application/services/PostService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: POST /api/posts/[id]/like
 * ==========================================
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;

    const result = await PostService.toggleLike(id, auth.userId);
    
    return NextResponse.json({ 
      likeCount: result.likesCount,
      likedByCurrentUser: result.isLiked 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith("UNAUTHORIZED") ? 401 : 500 });
  }
}
