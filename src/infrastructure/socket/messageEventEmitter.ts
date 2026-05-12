import { buildChatRoom } from './roomUtils';
import { AdminEventBus, ADMIN_BUS_EVENTS } from '../events/AdminEventBus';
import { SocketService } from './SocketService';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - MESSAGE EVENT EMITTER
 * ==========================================
 */

export const MESSAGE_EVENTS = {
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
} as const;

export interface MessageEventPayload {
  messageId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isSystemMessage?: boolean;
}

export class MessageEventEmitter {
  /**
   * Safe emission for private/group messages
   */
  static emitMessageCreated(chatId: string, data: MessageEventPayload) {
    const eventName = MESSAGE_EVENTS.MESSAGE_CREATED;

    try {
      SocketService.emitToRoom(buildChatRoom(chatId), eventName, data);
      
      // Feed Admin Bus (Phase 2)
      AdminEventBus.publish(ADMIN_BUS_EVENTS.MESSAGE_CREATED, data);
    } catch (error: any) {
      console.error(`[PUSHER_EMIT_FAILED_SAFE] [PID: ${process.pid}] ${eventName} | chatId: ${chatId} | error: ${error.message}`);
    }
  }

  static emitMessageUpdated(chatId: string, messageId: string, text: string) {
    try {
      SocketService.emitToRoom(buildChatRoom(chatId), MESSAGE_EVENTS.MESSAGE_UPDATED, { messageId, chatId, text });
    } catch (error: any) {
      console.error(`[PUSHER_EMIT_FAILED_SAFE] MESSAGE_UPDATED | error: ${error.message}`);
    }
  }

  static emitMessageDeleted(chatId: string, messageId: string) {
    try {
      SocketService.emitToRoom(buildChatRoom(chatId), MESSAGE_EVENTS.MESSAGE_DELETED, { messageId, chatId });
    } catch (error: any) {
      console.error(`[PUSHER_EMIT_FAILED_SAFE] MESSAGE_DELETED | error: ${error.message}`);
    }
  }
  
  /**
   * Notify participants that messages have been read
   */
  static emitMessagesRead(chatId: string, userId: string) {
    const eventName = 'MESSAGES_READ';
    try {
      SocketService.emitToRoom(buildChatRoom(chatId), eventName, { chatId, userId });
    } catch (error: any) {
      console.error(`[PUSHER_EMIT_FAILED_SAFE] ${eventName} | error: ${error.message}`);
    }
  }
}
