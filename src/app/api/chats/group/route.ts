import { NextResponse } from "next/server";
import { MessageService } from "@/application/services/MessageService";
import { protectRoute } from "@/infrastructure/security/authMiddleware";

/**
 * ==========================================
 * API ROUTE: POST /api/chats/group
 * ==========================================
 */
export async function POST(req: Request) {
  try {
    const auth = await protectRoute(req as any);
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[API_CHATS_GROUP_JSON_ERROR]", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { participantIds, name } = body;
    console.log("[API_CHATS_GROUP_POST] Incoming:", { userId: auth.userId, participantIds, name });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Validation failed: Group name is missing or empty" }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json({ error: "Validation failed: participantIds must be a valid array" }, { status: 400 });
    }

    // Always include the creator
    const finalParticipants = Array.from(new Set([...participantIds, auth.userId]));

    if (finalParticipants.length < 2) {
      return NextResponse.json({ error: `Validation failed: Group needs at least 2 members (currently have ${finalParticipants.length})` }, { status: 400 });
    }

    console.log("[API_CHATS_GROUP_POST]", { participantIds, name });

    const conversation = await MessageService.createGroupConversation(finalParticipants, name.trim(), auth.userId);
    
    console.log("[API_CHATS_GROUP_SUCCESS]", { id: conversation._id || conversation.id });
    return NextResponse.json(conversation, { status: 201 });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
