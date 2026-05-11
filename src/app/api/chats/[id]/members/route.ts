import { NextResponse } from "next/server";
import { MessageService } from "@/application/services/MessageService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: /api/chats/[id]/members
 * ==========================================
 * POST: Add a member to a group
 * DELETE: Remove a member from a group
 * ==========================================
 */

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await MessageService.addMember(id, userId, auth.userId);
    
    // Notify room participants
    const { socketServer } = await import("@/infrastructure/socket/socketServer");
    socketServer.emitToChat(id, "CHAT_UPDATED", { action: "member_added", userId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await MessageService.removeMember(id, userId, auth.userId);
    
    // Notify room participants
    const { socketServer } = await import("@/infrastructure/socket/socketServer");
    socketServer.emitToChat(id, "CHAT_UPDATED", { action: "member_removed", userId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
