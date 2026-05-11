import { NextRequest, NextResponse } from "next/server";
import { MessageRepository } from "@/infrastructure/repositories/MessageRepository";
import { protectRoute } from "@/infrastructure/security/authMiddleware";
import { ConversationModel } from "@/infrastructure/db/models/Conversation";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await context.params;

    const chat = await ConversationModel.findById(id).populate('participants', 'username name profilePhoto').lean();
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    let chatName = "Chat";
    let chatAvatar = "/default-avatar.svg";
    let isOnline = false; // Mock

    if (chat.type === 'private') {
      const otherParticipant = (chat.participants as any[]).find(p => p._id.toString() !== auth.userId);
      if (otherParticipant) {
        chatName = otherParticipant.name || otherParticipant.username;
        chatAvatar = otherParticipant.profilePhoto || "/default-avatar.svg";
        
        try {
          const { PresenceRepository } = await import("@/infrastructure/repositories/PresenceRepository");
          const status = await PresenceRepository.getUserStatus(otherParticipant._id.toString());
          isOnline = status.status === 'online';
        } catch (presErr) {
          console.warn("[PRESENCE_FETCH_FAILED]", presErr);
        }
      }
    } else if (chat.type === 'group') {
      if ((chat as any).name) {
        chatName = (chat as any).name;
      } else {
        const names = (chat.participants as any[]).filter(p => p._id.toString() !== auth.userId).map(p => p.name || p.username);
        chatName = names.join(', ') || "Group Chat";
      }
      chatAvatar = (chat as any).groupPhoto || (chat as any).avatar || "/default-avatar.svg";
    }

    const isGroup = chat.type === 'group';
    const creatorId = (chat as any).createdBy?.toString();
    const isParticipant = (chat.participants as any[]).some(p => p._id.toString() === auth.userId);
    
    // For legacy groups without a creatorId, any participant can manage/delete it
    const isOwner = isGroup && (
      creatorId === auth.userId || 
      (!creatorId && isParticipant)
    );

    return NextResponse.json({
      id: chat._id.toString(),
      name: chatName,
      groupPhoto: chatAvatar,
      isGroup,
      createdBy: creatorId || (isOwner ? auth.userId : undefined),
      isOwner,
      canDelete: isOwner || chat.type === 'private' || !isParticipant,
      isOnline,
      isActiveParticipant: isParticipant,
      participants: chat.participants.map((p: any) => ({
        id: p._id.toString(),
        username: p.username,
        name: p.name,
        avatar: p.profilePhoto || "/default-avatar.svg"
      }))
    });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/chats/[id] — Delete a group (owner only)
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await context.params;

    const { MessageService } = await import("@/application/services/MessageService");
    await MessageService.deleteConversation(id, auth.userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/chats/[id] — Update group details (avatar/name)
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await protectRoute(req as any);
    const { id } = await context.params;
    const body = await req.json();

    const chat = await ConversationModel.findById(id);
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    if (chat.type !== 'group') return NextResponse.json({ error: "Cannot update private chat details" }, { status: 400 });

    const isParticipant = chat.participants.some((p: any) => p.toString() === auth.userId);
    const creatorId = chat.createdBy?.toString();
    const isOwner = creatorId === auth.userId || (!creatorId && isParticipant);

    if (!isOwner) {
      return NextResponse.json({ error: "UNAUTHORIZED: Only group owners can update details" }, { status: 401 });
    }

    if (body.groupPhoto !== undefined) {
      const { MessageService } = await import("@/application/services/MessageService");
      await MessageService.updateGroupPhoto(id, body.groupPhoto, auth.userId);
    }
    
    if (body.name !== undefined) {
      chat.name = body.name;
      await chat.save();
    }

    return NextResponse.json({ success: true, groupPhoto: body.groupPhoto });
  } catch (err: any) {
    const isAuthError = err.message.startsWith("UNAUTHORIZED");
    return NextResponse.json(
      { error: err.message }, 
      { status: isAuthError ? 401 : 500 }
    );
  }
}
