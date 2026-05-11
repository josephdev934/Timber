import { NextResponse } from "next/server";
import { MessageRepository } from "@/infrastructure/repositories/MessageRepository";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

export async function POST(req: Request) {
  try {
    const auth = await protectRoute(req as any);
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const conversation = await MessageRepository.getOrCreatePrivateConversation(auth.userId, userId);
    
    return NextResponse.json(conversation);
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
