import { MessageModel } from '../db/models/Message';
import { ConversationModel } from '../db/models/Conversation';
import { Message } from '../../domain/entities/Message';
import { connectToDatabase } from '../db/connect';
import mongoose from 'mongoose';
import '../db/models/User';
import { PresenceRepository } from './PresenceRepository';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - MESSAGE REPOSITORY
 * ==========================================
 */

export class MessageRepository {
  static async create(data: Partial<Message>): Promise<Message> {
    await connectToDatabase();
    
    // Explicitly set all fields to ensure they reach the database
    const doc = new MessageModel({
      chatId: data.chatId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      text: data.text || "",
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      replyTo: data.replyTo,
      mentions: data.mentions,
      isSystemMessage: data.isSystemMessage || false
    });

    await doc.save();
    
    // Update the 'updatedAt' of the conversation so it floats to the top
    await ConversationModel.findByIdAndUpdate(data.chatId, {
      $set: { updatedAt: new Date() }
    });

    // Populate enough for the entity mapping
    const populated = await MessageModel.findById(doc._id)
      .populate('senderId', 'username profilePhoto name')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username name' }
      });

    return this.mapToEntity(populated);
  }

  /**
   * Update message content
   */
  static async update(id: string, text: string): Promise<Message | null> {
    await connectToDatabase();
    const doc = await MessageModel.findByIdAndUpdate(
      id,
      { $set: { text } },
      { new: true }
    ).populate('senderId', 'username profilePhoto name')
     .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username name' }
      });

    if (!doc) return null;
    return this.mapToEntity(doc);
  }

  /**
   * Delete a message
   */
  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await MessageModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Find or create a 1-to-1 conversation between two users
   */
  static async getOrCreatePrivateConversation(user1Id: string, user2Id: string): Promise<any> {
    await connectToDatabase();
    
    // Find a private conversation where both users are participants
    let conversation = await ConversationModel.findOne({
      type: 'private',
      participants: { $all: [user1Id, user2Id], $size: 2 }
    });

    if (!conversation) {
      conversation = await ConversationModel.create({
        type: 'private',
        participants: [user1Id, user2Id]
      });
    }

    return conversation;
  }

  /**
   * Create a new group conversation
   */
  static async createGroupConversation(participantIds: string[], name: string, createdBy: string): Promise<any> {
    await connectToDatabase();
    return await ConversationModel.create({
      type: 'group',
      name,
      createdBy,
      participants: participantIds
    });
  }

  /**
   * Delete a conversation (only the creator can delete groups)
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    await connectToDatabase();
    await MessageModel.deleteMany({ chatId: conversationId });
    await ConversationModel.findByIdAndDelete(conversationId);
  }

  /**
   * Mark all messages in a chat as read by a user
   */
  static async markAsRead(chatId: string, userId: string): Promise<void> {
    await connectToDatabase();
    await MessageModel.updateMany(
      { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
  }

  static async findByChatId(chatId: string): Promise<Message[]> {
    await connectToDatabase();
    const docs = await MessageModel.find({ chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username profilePhoto name')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username name' }
      });
    return docs.map(doc => this.mapToEntity(doc));
  }

  /**
   * Find all conversations for a user, sorted by recent activity
   */
  static async findRecentChats(userId: string): Promise<any[]> {
    try {
      await connectToDatabase();
      
      // 1. Find all conversations where the user is a participant OR removed participant, and not hidden
      const conversations = await ConversationModel.find({
        $or: [{ participants: userId }, { removedParticipants: userId }],
        hiddenBy: { $ne: userId }
      }).populate('participants', 'username profilePhoto name').lean();

      // 2. Fetch the last message for each conversation
      const chatsWithMessages = await Promise.all(
        conversations.map(async (conv: any) => {
          try {
            const [lastMessage, unreadCount] = await Promise.all([
              MessageModel.findOne({ chatId: conv._id.toString() }).sort({ createdAt: -1 }).lean(),
              MessageModel.countDocuments({ 
                chatId: conv._id.toString(), 
                senderId: { $ne: new mongoose.Types.ObjectId(userId) },
                readBy: { $ne: new mongoose.Types.ObjectId(userId) }
              })
            ]);
            
            const participants = conv.participants || [];
            const otherParticipant = participants.find((p: any) => p._id?.toString() !== userId);
            
            const chatName = conv.type === 'private' 
                ? otherParticipant?.name || otherParticipant?.username || 'Unknown'
                : conv.name || 'Unnamed Group';

            const chatAvatar = conv.type === 'private'
                ? otherParticipant?.profilePhoto || "/default-avatar.svg"
                : conv.groupPhoto || (conv as any).avatar || "/default-avatar.svg";

            const otherParticipantId = otherParticipant?._id?.toString();
            let isOnline = false;

            if (conv.type === 'private' && otherParticipantId) {
              try {
                const status = await PresenceRepository.getUserStatus(otherParticipantId);
                isOnline = status.status === 'online';
              } catch (presErr) {
                console.warn("[PRESENCE_SYNC_FAILED]", presErr);
              }
            }

            return {
              id: conv._id.toString(),
              name: chatName,
              groupPhoto: chatAvatar,
              lastMessage: lastMessage?.text || '',
              lastMessageAt: lastMessage?.createdAt || conv.createdAt || new Date(),
              time: (lastMessage?.createdAt || conv.createdAt) 
                  ? new Date(lastMessage?.createdAt || conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '',
              unreadCount: unreadCount || 0,
              isGroup: conv.type === 'group',
              isActiveParticipant: Array.isArray(conv.participants) && conv.participants.some((p: any) => p._id?.toString() === userId || p.toString() === userId),
              isOnline
            };
          } catch (err: any) {
            console.error(`[CHAT_MAP_ERROR] chat: ${conv._id}`, err.message);
            return null;
          }
        })
      );

      // 3. Filter out failed maps and sort by last message time
      return chatsWithMessages
        .filter(c => c !== null)
        .sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    } catch (err: any) {
      console.error("[findRecentChats_CRITICAL_ERROR]", err.message);
      throw err;
    }
  }

  /**
   * Add a participant to a conversation
   */
  static async addParticipant(conversationId: string, userId: string): Promise<void> {
    await connectToDatabase();
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $addToSet: { participants: userId },
      $pull: { removedParticipants: userId }
    });
  }

  /**
   * Remove a participant from a conversation
   */
  static async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await connectToDatabase();
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $pull: { participants: userId },
      $addToSet: { removedParticipants: userId }
    });
  }

  /**
   * Hide a conversation for a specific user
   */
  static async hideConversation(conversationId: string, userId: string): Promise<void> {
    await connectToDatabase();
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $addToSet: { hiddenBy: userId }
    });
  }

  private static mapToEntity(doc: any): Message {
    let senderData: any;
    const sender = doc.senderId;

    if (sender && typeof sender === 'object' && sender._id) {
      senderData = {
        id: sender._id.toString(),
        username: sender.username,
        name: sender.name || sender.username,
        avatar: sender.profilePhoto || "/default-avatar.svg"
      };
    } else {
      senderData = sender?.toString() || 'unknown';
    }

    let replyToData: any = undefined;
    if (doc.replyTo && typeof doc.replyTo === 'object' && doc.replyTo._id) {
      replyToData = {
        id: doc.replyTo._id.toString(),
        text: doc.replyTo.text,
        senderName: doc.replyTo.senderId?.name || doc.replyTo.senderId?.username || "Unknown"
      };
    }

    return {
      id: doc._id.toString(),
      chatId: doc.chatId,
      senderId: sender?._id ? sender._id.toString() : (sender?.toString() || 'unknown'),
      sender: senderData,
      receiverId: doc.receiverId?.toString() || 'unknown',
      text: doc.text,
      replyTo: replyToData,
      mentions: (doc.mentions || []).map((m: any) => m.toString()),
      readBy: (doc.readBy || []).map((id: any) => id.toString()),
      mediaUrl: doc.mediaUrl,
      mediaType: doc.mediaType,
      isSystemMessage: doc.isSystemMessage || false,
      createdAt: doc.createdAt
    } as Message;
  }
}

