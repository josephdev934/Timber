import { NextResponse } from "next/server";
import { MessageService } from "@/application/services/MessageService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: GET /api/messages/[chatId]
 * ==========================================
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await protectRoute(req as any);
    const { chatId } = await params;
    const messages = await MessageService.getChatHistory(chatId);
    
    return NextResponse.json(messages);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
