import { NextResponse } from "next/server";
import { MessageService } from "@/application/services/MessageService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: PATCH /api/messages/[chatId]/read
 * ==========================================
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const auth = await protectRoute(req as any);
    const { chatId } = await params;
    
    await MessageService.markChatAsRead(chatId, auth.userId);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
