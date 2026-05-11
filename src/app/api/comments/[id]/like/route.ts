import { NextResponse } from "next/server";
import { CommentService } from "@/application/services/CommentService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: POST /api/comments/[id]/like
 * ==========================================
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;

    await CommentService.toggleLike(id, auth.userId);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith("UNAUTHORIZED") ? 401 : 500 });
  }
}
