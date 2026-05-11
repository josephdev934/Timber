import { NextResponse } from "next/server";
import { PostService } from "@/application/services/PostService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: DELETE /api/posts/[id]
 * ==========================================
 * Delete a specific post. Only the author can do this.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;
    
    await PostService.deletePost(id, auth.userId);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
