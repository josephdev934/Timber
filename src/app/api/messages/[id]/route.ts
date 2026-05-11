import { MessageService } from "@/application/services/MessageService";
import { NextResponse } from "next/server";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE - EDIT/DELETE MESSAGE
 * ==========================================
 */

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const updated = await MessageService.editMessage(id, text, auth.userId);
    return NextResponse.json(updated);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    console.error("[API_MESSAGE_EDIT_FAILED]", err.message);
    return NextResponse.json({ error: err.message }, { status: isAuthError ? 401 : 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await params;

    await MessageService.deleteMessage(id, auth.userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    console.error("[API_MESSAGE_DELETE_FAILED]", err.message);
    return NextResponse.json({ error: err.message }, { status: isAuthError ? 401 : 500 });
  }
}
