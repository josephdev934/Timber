import { MessageService } from "@/application/services/MessageService";
import { NextResponse } from "next/server";

import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE - SEND MESSAGE
 * ==========================================
 */
export async function POST(req: Request) {
  try {
    const auth = await protectRoute(req as any);
    const body = await req.json();
    console.log("RAW BODY [MESSAGES]:", body);
    
    // Inject authenticated user as sender
    body.senderId = auth.userId;
    
    const message = await MessageService.sendMessage(body);
    
    return NextResponse.json(message);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    console.error("[API_MESSAGE_FAILED]", err.message);
    return NextResponse.json({ error: err.message }, { status: isAuthError ? 401 : 500 });
  }
}
