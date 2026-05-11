import { NextResponse } from "next/server";
import { CommentService } from "@/application/services/CommentService";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const activities = await CommentService.getUserActivities(id);
    
    // Format activities for the frontend
    const formatted = activities.map(act => ({
      id: act.id,
      type: 'comment',
      text: act.text,
      contentId: act.contentId,
      timestamp: new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
