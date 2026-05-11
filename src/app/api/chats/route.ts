import { NextResponse } from "next/server";
import { MessageRepository } from "@/infrastructure/repositories/MessageRepository";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: GET /api/chats
 * ==========================================
 */
export async function GET(req: Request) {
  try {
    const auth = await protectRoute(req as any);
    
    const chats = await MessageRepository.findRecentChats(auth.userId);
    
    return NextResponse.json(chats);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
