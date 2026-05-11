import { EventEmitter2 } from 'eventemitter2';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - ADMIN EVENT BUS
 * ==========================================
 * A centralized, internal event bus for the dashboard.
 * It allows the platform to broadcast high-level events 
 * without creating circular dependencies with the Socket streamer.
 * ==========================================
 */

export const ADMIN_BUS_EVENTS = {
  // Content
  COMMENT_CREATED: 'COMMENT_CREATED',
  COMMENT_UPDATED: 'COMMENT_UPDATED',
  COMMENT_DELETED: 'COMMENT_DELETED',
  POST_CREATED: 'POST_CREATED',
  POST_DELETED: 'POST_DELETED',
  
  // Messaging
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  GROUP_JOINED: 'GROUP_JOINED',
  GROUP_LEFT: 'GROUP_LEFT',
  
  // Media
  MEDIA_UPLOADED: 'MEDIA_UPLOADED',
  
  // Moderation
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  USER_BANNED: 'USER_BANNED',
  
  // System
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT'
} as const;

export class AdminEventBus extends EventEmitter2 {
  private static instance: AdminEventBus;

  private constructor() {
    super({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20
    });
  }

  public static getInstance(): AdminEventBus {
    if (!AdminEventBus.instance) {
      AdminEventBus.instance = new AdminEventBus();
    }
    return AdminEventBus.instance;
  }

  /**
   * Safe publish that handles any internal bus errors.
   */
  public static publish(event: string, payload: any) {
    try {
      this.getInstance().emit(event, payload);
    } catch (err) {
      console.error(`[ADMIN_BUS_ERROR] Failed to publish ${event}`, err);
    }
  }
}
