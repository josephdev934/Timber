import { NextResponse } from "next/server";
import { CommentService } from "@/application/services/CommentService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: POST /api/comments/[id]/reply
 * ==========================================
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params; // parentId
    const body = await req.json(); // { contentId, text }

    const reply = await CommentService.replyToComment(id, {
      contentId: body.contentId,
      authorId: auth.userId,
      text: body.text
    });
    
    return NextResponse.json(reply, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith("UNAUTHORIZED") ? 401 : 500 });
  }
}
