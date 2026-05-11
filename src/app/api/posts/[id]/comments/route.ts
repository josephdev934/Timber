import { NextResponse } from "next/server";
import { CommentService } from "@/application/services/CommentService";

/**
 * ==========================================
 * API ROUTE: GET /api/posts/[id]/comments
 * ==========================================
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // postId
    const tree = await CommentService.getCommentTree(id);
    
    return NextResponse.json(tree);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
