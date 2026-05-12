import Pusher, { Channel } from 'pusher-js';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - PUSHER CLIENT
 * ==========================================
 * Replaces Socket.io-client with Pusher.
 * Maintains a similar API to minimize component refactoring.
 * ==========================================
 */

class PusherClient {
  private static instance: Pusher | null = null;
  private static channels: Map<string, Channel> = new Map();
  private static callbacks: Map<string, Set<Function>> = new Map();

  /**
   * Initialize or return the existing Pusher instance.
   */
  public static getInstance(): any {
    if (!this.instance) {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

      if (!key) {
        console.warn("[PUSHER_CLIENT] Key missing. Real-time features disabled.");
      }

      this.instance = new Pusher(key, {
        cluster,
        forceTLS: true,
        // Authentication endpoint for private channels
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('timber_token')}`
          }
        }
      });

      console.log("[PUSHER_CLIENT_INIT] Connected to Pusher.");
    }

    // Return a "socket-like" object to satisfy existing component usage
    return {
      on: (event: string, cb: Function) => this.on(event, cb),
      off: (event: string, cb: Function) => this.off(event, cb),
      emit: (event: string, data: any) => this.emit(event, data),
    };
  }

  /**
   * Listen for an event globally (across all subscribed channels)
   */
  private static on(event: string, cb: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(cb);
  }

  /**
   * Stop listening for an event
   */
  private static off(event: string, cb: Function) {
    this.callbacks.get(event)?.delete(cb);
  }

  /**
   * Emit a client event (e.g., typing indicators)
   * Note: Pusher requires events triggered by clients to be prefixed with 'client-'
   * and can only be sent on private/presence channels.
   */
  private static emit(event: string, data: any) {
    // For typing indicators specifically, we map to a Pusher client event
    if (event === 'chat:typing' || event === 'USER_TYPING') {
      const chatId = data.chatId;
      const channelName = `private-chat_${chatId}`;
      const channel = this.channels.get(channelName);
      
      if (channel) {
        // Pusher client events must start with client-
        channel.trigger(`client-${event}`, data);
      }
    }
  }

  /**
   * Subscribe to a channel (Room in Socket.io terms)
   */
  public static subscribe(channelName: string) {
    if (!this.instance) this.getInstance();
    
    // Prefix with 'private-' for security and client events
    const fullChannelName = channelName.startsWith('private-') ? channelName : `private-${channelName}`;

    if (!this.channels.has(fullChannelName)) {
      const channel = this.instance!.subscribe(fullChannelName);
      this.channels.set(fullChannelName, channel);

      // Bind to ALL events on this channel and dispatch to our global callbacks
      channel.bind_global((event: string, data: any) => {
        // Handle client-prefixed events (typing indicators)
        const cleanEvent = event.startsWith('client-') ? event.replace('client-', '') : event;
        
        this.callbacks.get(cleanEvent)?.forEach(cb => cb(data));
      });

      console.log(`[PUSHER_SUBSCRIBE] Channel: ${fullChannelName}`);
    }
  }

  public static unsubscribe(channelName: string) {
    const fullChannelName = channelName.startsWith('private-') ? channelName : `private-${channelName}`;
    if (this.channels.has(fullChannelName)) {
      this.instance?.unsubscribe(fullChannelName);
      this.channels.delete(fullChannelName);
      console.log(`[PUSHER_UNSUBSCRIBE] Channel: ${fullChannelName}`);
    }
  }

  // Compatibility aliases
  public static joinRoom(room: string) { this.subscribe(room); }
  public static leaveRoom(room: string) { this.unsubscribe(room); }
  public static joinChat(chatId: string) { this.subscribe(`chat_${chatId}`); }
  public static joinUser(userId: string) { this.subscribe(`user_${userId}`); }
}

export const socketClient = PusherClient;
