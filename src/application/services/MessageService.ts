import { MessageRepository } from '@/infrastructure/repositories/MessageRepository';
import { Message } from '@/domain/entities/Message';
import { MessageEventEmitter } from '@/infrastructure/socket/messageEventEmitter';
import { resolveUserId } from '../utils/userMapping';
import { parseMentions } from '../utils/mentionUtils';
import { FeatureFlagService } from './admin/FeatureFlagService';

/**
 * ==========================================
 * APPLICATION LAYER - MESSAGE SERVICE
 * ==========================================
 */

export class MessageService {
  /**
   * Orchestrate sending a message
   */
  static async sendMessage(data: { senderId: string; receiverId?: string; chatId?: string; text: string; replyTo?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): Promise<Message> {
    if (!data.senderId || (!data.text?.trim() && !data.mediaUrl)) {
      throw new Error("Invalid message data provided.");
    }

    if (data.mediaUrl) {
      await FeatureFlagService.assertEnabled('mediaUploads');
    }
    
    let targetChatId = data.chatId;

    // If no chatId is provided, it's a private message to receiverId
    if (!targetChatId) {
      if (!data.receiverId) throw new Error("Must provide either chatId or receiverId");
      const conversation = await MessageRepository.getOrCreatePrivateConversation(data.senderId, data.receiverId);
      targetChatId = conversation._id.toString();
    }

    try {
      const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
      const { UserRepository } = await import('@/infrastructure/repositories/UserRepository');

      // 1. Run all independent lookups in parallel
      const [convCheck, mentionedIds, sender] = await Promise.all([
        ConversationModel.findById(targetChatId).lean() as Promise<any>,
        parseMentions(data.text),
        UserRepository.findById(data.senderId)
      ]);

      if (convCheck) {
         const isParticipant = convCheck.participants?.some((p: any) => p.toString() === data.senderId);
         if (!isParticipant) {
           throw new Error("UNAUTHORIZED: You are not a participant in this conversation.");
         }
      }

      // 2. Create the message
      const message = await MessageRepository.create({
        chatId: targetChatId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text || "",
        replyTo: data.replyTo as any,
        mentions: mentionedIds,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType
      });

      // 3. Emit real-time event IMMEDIATELY
      MessageEventEmitter.emitMessageCreated(targetChatId as string, {
        messageId: message.id,
        chatId: message.chatId,
        senderId: data.senderId,
        senderName: sender?.name || sender?.username || "Unknown",
        text: message.text,
        replyTo: message.replyTo,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        createdAt: message.createdAt.toISOString()
      });

        // NOTIFICATION: Notify all other participants in the conversation
        try {
          if (convCheck && convCheck.participants) {
            const { NotificationService } = await import('../../application/services/NotificationService');
            const otherParticipants = convCheck.participants.filter((p: any) => p.toString() !== data.senderId);
            
            console.log(`[NOTIFICATION_DEBUG] ChatId: ${targetChatId} | Type: ${convCheck.type} | Notifying: ${otherParticipants.length} users`);

            await Promise.all(otherParticipants.map((pId: any) => {
              const recipientId = pId.toString();
              console.log(`[NOTIFICATION_DISPATCH] Recipient: ${recipientId} | Actor: ${data.senderId}`);
              const textPreview = (data.text || "sent a media file").substring(0, 30);
              const textSuffix = (data.text || "").length > 30 ? '...' : '';
              
              return NotificationService.createNotification({
                userId: recipientId,
                actorId: data.senderId,
                type: 'message',
                message: `sent a message${convCheck.type === 'group' ? ` to ${convCheck.name || 'the group'}` : ''}: "${textPreview}${textSuffix}"`,
                metadata: { chatId: targetChatId as string }
              }).catch(err => console.error("[NOTIFICATION_FAILED_SAFE] message", err));
            }));
          } else {
            console.warn(`[NOTIFICATION_SKIPPED] Conversation not found or has no participants: ${targetChatId}`);
          }
        } catch (notifErr: any) {
          console.error("[NOTIFICATION_ORCHESTRATION_FAILED]", notifErr.message);
        }

        // NOTIFICATION: For mentions in messages (special highlight)
        if (mentionedIds.length > 0) {
          const { NotificationService } = await import('../../application/services/NotificationService');
          await Promise.all(mentionedIds.map(mId => {
            if (mId === data.senderId) return Promise.resolve(); // Don't notify self
            return NotificationService.createNotification({
              userId: mId,
              actorId: data.senderId,
              type: 'mention',
              message: `mentioned you: "${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}"`,
              metadata: { chatId: targetChatId as string }
            }).catch(err => console.error("[NOTIFICATION_FAILED_SAFE] message mention", err));
          }));
        }

        // NOTIFICATION: For replies
        if (data.replyTo) {
          try {
             const { MessageModel } = await import('@/infrastructure/db/models/Message');
             const originalMsg = await MessageModel.findById(data.replyTo).lean();
             if (originalMsg && originalMsg.senderId.toString() !== data.senderId) {
               const { NotificationService } = await import('../../application/services/NotificationService');
               const replyPreview = (originalMsg.text || "a media file").substring(0, 30);
               const replySuffix = (originalMsg.text || "").length > 30 ? '...' : '';

               await NotificationService.createNotification({
                 userId: originalMsg.senderId.toString(),
                 actorId: data.senderId,
                 type: 'reply',
                 message: `replied to your message: "${replyPreview}${replySuffix}"`,
                 metadata: { chatId: targetChatId as string, messageId: message.id }
               });
             }
          } catch (replyNotifErr) {
            console.error("[REPLY_NOTIFICATION_FAILED]", replyNotifErr);
          }
        }
      } catch (socketErr) {
        console.error("[SOCKET_EMIT_FAILED_SAFE] MESSAGE_CREATED", socketErr);
      }

      return message;
    } catch (err: any) {
      console.error("[MESSAGE_SEND_FAILED]", { error: err.message });
      throw new Error(`Failed to send message: ${err.message}`);
    }
  }

  /**
   * Create a new group chat
   */
  static async createGroupConversation(participantIds: string[], name: string, createdBy: string): Promise<any> {
    if (!name || !name.trim()) {
      throw new Error("Group name is required.");
    }
    if (!participantIds || participantIds.length < 2) {
      throw new Error("Group must have at least 2 participants.");
    }

    await FeatureFlagService.assertEnabled('groupCreation');

    return await MessageRepository.createGroupConversation(participantIds, name.trim(), createdBy);
  }

  /**
   * Delete a conversation (owner only for groups, participant for private)
   */
  static async deleteConversation(conversationId: string, requestingUserId: string): Promise<void> {
    const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
    const conversation = await ConversationModel.findById(conversationId).lean() as any;

    if (!conversation) {
      throw new Error("Conversation not found.");
    }

    if (conversation.type === 'group') {
      const creatorId = conversation.createdBy?.toString();
      const isParticipant = conversation.participants?.some((p: any) => p.toString() === requestingUserId);
      const isRemoved = conversation.removedParticipants?.some((p: any) => p.toString() === requestingUserId);
      const isAuthorized = creatorId === requestingUserId || (!creatorId && isParticipant);

      if (isAuthorized) {
        await MessageRepository.deleteConversation(conversationId);
      } else if (isParticipant || isRemoved) {
        await MessageRepository.hideConversation(conversationId, requestingUserId);
      } else {
        throw new Error("UNAUTHORIZED: You are not a participant in this conversation.");
      }
    } else {
      const isParticipant = conversation.participants?.some((p: any) => p.toString() === requestingUserId);
      if (!isParticipant) {
        throw new Error("UNAUTHORIZED: You are not a participant in this conversation.");
      }
      await MessageRepository.hideConversation(conversationId, requestingUserId);
    }
  }

  /**
   * Edit an existing message
   */
  static async editMessage(messageId: string, text: string, userId: string): Promise<Message> {
    const { MessageModel } = await import('@/infrastructure/db/models/Message');
    const msg = await MessageModel.findById(messageId);
    
    if (!msg) throw new Error("Message not found.");
    if (msg.senderId.toString() !== userId) {
      throw new Error("UNAUTHORIZED: You can only edit your own messages.");
    }

    const updated = await MessageRepository.update(messageId, text);
    if (!updated) throw new Error("Failed to update message.");

    MessageEventEmitter.emitMessageUpdated(updated.chatId, messageId, text);
    return updated;
  }

  /**
   * Delete an existing message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { MessageModel } = await import('@/infrastructure/db/models/Message');
    const msg = await MessageModel.findById(messageId);
    
    if (!msg) throw new Error("Message not found.");
    
    // Authorization: Sender or Group Owner can delete? 
    // Usually only sender can delete their own message in WhatsApp, 
    // though admins can delete anything. Let's start with sender only.
    if (msg.senderId.toString() !== userId) {
       throw new Error("UNAUTHORIZED: You can only delete your own messages.");
    }

    await MessageRepository.delete(messageId);
    MessageEventEmitter.emitMessageDeleted(msg.chatId, messageId);
  }

  /**
   * Deterministic Chat ID Generation
   * WhatsApp style: sort(userA, userB).join("_")
   */
  public static generateChatId(userA: string, userB: string): string {
    return [userA, userB].sort().join("_");
  }

  /**
   * Add a member to a group (owner only)
   */
  static async addMember(conversationId: string, userId: string, requestingUserId: string): Promise<void> {
    const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
    const conversation = await ConversationModel.findById(conversationId).lean() as any;

    if (!conversation) throw new Error("Conversation not found.");
    if (conversation.type !== 'group') throw new Error("Members can only be added to groups.");
    
    const creatorId = conversation.createdBy?.toString();
    const isParticipant = conversation.participants.some((p: any) => p.toString() === requestingUserId);
    const isAuthorized = creatorId === requestingUserId || (!creatorId && isParticipant);

    if (!isAuthorized) {
      throw new Error("UNAUTHORIZED: Only the group creator can add members.");
    }

    await MessageRepository.addParticipant(conversationId, userId);

    const { UserRepository } = await import('@/infrastructure/repositories/UserRepository');
    const addedUser = await UserRepository.findById(userId);
    const addedName = addedUser?.name || addedUser?.username || "Unknown User";

    const sysMsg = await MessageRepository.create({
      chatId: conversationId,
      senderId: requestingUserId,
      text: `Admin added ${addedName}`,
      isSystemMessage: true
    } as any);

    try {
      MessageEventEmitter.emitMessageCreated(conversationId, {
        messageId: sysMsg.id,
        chatId: sysMsg.chatId,
        senderId: requestingUserId,
        senderName: "System",
        text: sysMsg.text,
        isSystemMessage: true,
        createdAt: sysMsg.createdAt.toISOString()
      });
    } catch (e) {}

    try {
      const { NotificationService } = await import('@/application/services/NotificationService');
      await NotificationService.createNotification({
        userId,
        actorId: requestingUserId,
        type: 'mention',
        message: `added you to the group: "${conversation.name || 'Group Chat'}"`,
        metadata: { chatId: conversationId }
      });
    } catch (e) {
      console.error("[NOTIFICATION_DISPATCH_FAILED]", e);
    }
  }

  /**
   * Remove a member from a group (owner only)
   */
  static async removeMember(conversationId: string, userId: string, requestingUserId: string): Promise<void> {
    const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
    const conversation = await ConversationModel.findById(conversationId).lean() as any;

    if (!conversation) throw new Error("Conversation not found.");
    if (conversation.type !== 'group') throw new Error("Members can only be removed from groups.");
    
    const creatorId = conversation.createdBy?.toString();
    const isParticipant = conversation.participants.some((p: any) => p.toString() === requestingUserId);
    const isAuthorized = creatorId === requestingUserId || (!creatorId && isParticipant);

    if (!isAuthorized) {
      throw new Error("UNAUTHORIZED: Only the group creator can remove members.");
    }
    if (creatorId === userId) {
      throw new Error("The creator cannot be removed from the group.");
    }

    await MessageRepository.removeParticipant(conversationId, userId);

    const { UserRepository } = await import('@/infrastructure/repositories/UserRepository');
    const removedUser = await UserRepository.findById(userId);
    const removedName = removedUser?.name || removedUser?.username || "Unknown User";

    const sysMsg = await MessageRepository.create({
      chatId: conversationId,
      senderId: requestingUserId,
      text: `Admin removed ${removedName}`,
      isSystemMessage: true
    } as any);

    try {
      MessageEventEmitter.emitMessageCreated(conversationId, {
        messageId: sysMsg.id,
        chatId: sysMsg.chatId,
        senderId: requestingUserId,
        senderName: "System",
        text: sysMsg.text,
        isSystemMessage: true,
        createdAt: sysMsg.createdAt.toISOString()
      });
    } catch (e) {}

    try {
      const { NotificationService } = await import('@/application/services/NotificationService');
      await NotificationService.createNotification({
        userId,
        actorId: requestingUserId,
        type: 'mention', 
        message: `removed you from the group: "${conversation.name || 'Group Chat'}"`,
        metadata: { chatId: conversationId }
      });
    } catch (e) {
      console.error("[NOTIFICATION_DISPATCH_FAILED]", e);
    }
  }

  /**
   * Fetch chat history
   */
  static async getChatHistory(chatId: string): Promise<Message[]> {
    return await MessageRepository.findByChatId(chatId);
  }

  /**
   * Mark all messages in a chat as read
   */
  static async markChatAsRead(chatId: string, userId: string): Promise<void> {
    await MessageRepository.markAsRead(chatId, userId);
    try {
      MessageEventEmitter.emitMessagesRead(chatId, userId);
    } catch (err) {
      console.error("[SOCKET_EMIT_FAILED_SAFE] MESSAGES_READ", err);
    }
  }

  /**
   * Update group photo (owner only)
   */
  static async updateGroupPhoto(conversationId: string, groupPhoto: string, requestingUserId: string): Promise<any> {
    const { ConversationModel } = await import('@/infrastructure/db/models/Conversation');
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) throw new Error("Conversation not found.");
    if (conversation.type !== 'group') throw new Error("Photos can only be updated for groups.");
    
    const creatorId = conversation.createdBy?.toString();
    const isParticipant = conversation.participants.some((p: any) => p.toString() === requestingUserId);
    const isAuthorized = creatorId === requestingUserId || (!creatorId && isParticipant);

    if (!isAuthorized) {
      throw new Error("UNAUTHORIZED: Only group owners can update the photo.");
    }

    // Update group photo and audit fields
    const updated = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { 
        $set: { 
          groupPhoto,
          groupPhotoUpdatedBy: requestingUserId as any,
          groupPhotoUpdatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!updated) throw new Error("Failed to update conversation.");

    // Create system message
    const sysMsg = await MessageRepository.create({
      chatId: conversationId,
      senderId: requestingUserId,
      text: `GROUP PROFILE PHOTO UPDATED`,
      isSystemMessage: true
    } as any);

    try {
      // Emit message event
      MessageEventEmitter.emitMessageCreated(conversationId, {
        messageId: sysMsg.id,
        chatId: sysMsg.chatId,
        senderId: requestingUserId,
        senderName: "System",
        text: sysMsg.text,
        isSystemMessage: true,
        createdAt: sysMsg.createdAt.toISOString()
      });

      // Emit specialized group photo updated event
      const io = (await import('@/infrastructure/socket/socketServer')).socketServer.getIO();
      if (io) {
        const { buildChatRoom } = await import('@/infrastructure/socket/roomUtils');
        io.to(buildChatRoom(conversationId)).emit("GROUP_PHOTO_UPDATED", { 
          chatId: conversationId, 
          groupPhoto,
          updatedBy: requestingUserId
        });
      }
    } catch (e) {
      console.error("[SOCKET_EMIT_FAILED_SAFE] GROUP_PHOTO_UPDATED", e);
    }

    return updated;
  }
}
