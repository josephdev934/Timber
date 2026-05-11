import { socketServer } from './socketServer';
import { buildContentRoom } from './roomUtils';
import { AdminEventBus, ADMIN_BUS_EVENTS } from '../events/AdminEventBus';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SOCKET EVENT EMITTER
 * ==========================================
 * Provides reusable functions for emitting comment-related events.
 * ==========================================
 */

// Event Names
export const COMMENT_EVENTS = {
  COMMENT_CREATED: 'COMMENT_CREATED',
  COMMENT_REPLIED: 'COMMENT_REPLIED',
  COMMENT_UPDATED: 'COMMENT_UPDATED',
  COMMENT_DELETED: 'COMMENT_DELETED',
  COMMENT_LIKED: 'COMMENT_LIKED',
} as const;

export const POST_EVENTS = {
  POST_CREATED: 'POST_CREATED',
  POST_LIKED: 'POST_LIKED',
  POST_DELETED: 'POST_DELETED',
} as const;

export type CommentEventType = keyof typeof COMMENT_EVENTS;

export interface CommentEventPayload {
  commentId: string;
  contentId: string;
  parentId?: string;
  text?: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export class CommentEventEmitter {
  /**
   * Core emission logic with structured logging and failure safety.
   * Ensures that socket failures NEVER break the API response flow.
   */
  private static emit(contentId: string, type: CommentEventType, data: CommentEventPayload) {
    let roomId = "unknown";
    const eventName = COMMENT_EVENTS[type];

    try {
      roomId = buildContentRoom(contentId);
      const io = socketServer.getIO();

      if (!io) {
        console.warn(`[SOCKET_SKIPPED] [PID: ${process.pid}] Socket not initialized | event: ${eventName} | roomId: ${roomId}`);
        return;
      }
      
      // Emit to the specific content room
      io.to(roomId).emit(eventName, {
        type: eventName,
        data
      });
     
      console.log(`[SOCKET_EMIT_SUCCESS] [PID: ${process.pid}] ${eventName} | roomId: ${roomId}`);

      // Feed Admin Bus (Phase 2)
      AdminEventBus.publish(type === 'COMMENT_CREATED' ? ADMIN_BUS_EVENTS.COMMENT_CREATED : 
                            type === 'COMMENT_UPDATED' ? ADMIN_BUS_EVENTS.COMMENT_UPDATED : 
                            ADMIN_BUS_EVENTS.COMMENT_DELETED, data);
    } catch (error: any) {
      // SAFE FAIL: We log the error but do not throw it, keeping the API response intact
      console.error(`[SOCKET_EMIT_FAILED_SAFE] [PID: ${process.pid}] ${eventName} | roomId: ${roomId} | error: ${error.message}`);
    }
  }

  static emitCommentCreated(contentId: string, data: CommentEventPayload) {
    this.emit(contentId, 'COMMENT_CREATED', data);
  }

  static emitCommentReplied(contentId: string, data: CommentEventPayload) {
    this.emit(contentId, 'COMMENT_REPLIED', data);
  }

  static emitCommentUpdated(contentId: string, data: CommentEventPayload) {
    this.emit(contentId, 'COMMENT_UPDATED', data);
  }

  static emitCommentDeleted(contentId: string, data: CommentEventPayload) {
    this.emit(contentId, 'COMMENT_DELETED', data);
  }

  static emitCommentLiked(contentId: string, commentId: string, userId: string, likesCount: number) {
    this.emit(contentId, 'COMMENT_LIKED' as any, { commentId, contentId, authorId: userId, text: likesCount.toString() } as any);
  }
}

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - POST EVENT EMITTER
 * ==========================================
 */
export class PostEventEmitter {
  static emitPostLiked(postId: string, userId: string, likesCount: number) {
    try {
      const io = socketServer.getIO();
      if (!io) return;

      io.emit(POST_EVENTS.POST_LIKED, {
        postId,
        userId,
        likesCount
      });
      console.log(`[SOCKET_EMIT_SUCCESS] POST_LIKED | postId: ${postId}`);
    } catch (err) {
      console.error("[SOCKET_EMIT_FAILED_SAFE] POST_LIKED", err);
    }
  }

  static emitPostCreated(post: any) {
     try {
      const io = socketServer.getIO();
      if (!io) return;

      io.emit(POST_EVENTS.POST_CREATED, post);
      
      // Feed Admin Bus (Phase 2)
      AdminEventBus.publish(ADMIN_BUS_EVENTS.POST_CREATED, post);
    } catch (err) {
      console.error("[SOCKET_EMIT_FAILED_SAFE] POST_CREATED", err);
    }
  }
}
