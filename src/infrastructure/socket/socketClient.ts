import { io, Socket } from 'socket.io-client';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - CLIENT SOCKET UTILITY
 * ==========================================
 * Production-grade client-side socket management.
 * Features:
 * - Singleton pattern to prevent duplicate connections.
 * - Automatic room re-joining on reconnection.
 * - Centralized event handling.
 * ==========================================
 */

class SocketClient {
  private static instance: Socket | null = null;
  private static activeRooms: Set<string> = new Set();

  /**
   * Initialize or return the existing socket instance.
   */
  public static getInstance(url: string = process.env.NEXT_PUBLIC_APP_URL || ''): Socket {
    if (this.instance) return this.instance;

    console.log(`[SOCKET_CLIENT_INIT] Connecting to ${url}...`);

    this.instance = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupInternalHandlers();
    return this.instance;
  }

  /**
   * Setup core lifecycle handlers (reconnect, error, etc.)
   */
  private static setupInternalHandlers() {
    if (!this.instance) return;

    this.instance.on('connect', () => {
      console.log(`[SOCKET_CLIENT_CONNECTED] socketId: ${this.instance?.id}`);
      
      // CRITICAL: Rejoin all previously joined rooms on reconnect
      if (this.activeRooms.size > 0) {
        console.log(`[SOCKET_CLIENT_REJOINING] Rejoining ${this.activeRooms.size} rooms...`);
        this.activeRooms.forEach(room => {
          this.instance?.emit('join_room', room);
        });
      }
    });

    this.instance.on('disconnect', (reason) => {
      console.warn(`[SOCKET_CLIENT_DISCONNECTED] reason: ${reason}`);
      this.activeRooms.clear(); // Important: Reset local room state on disconnect
    });

    this.instance.on('connect_error', (error) => {
      console.error(`[SOCKET_CLIENT_ERROR] Connection failed: ${error.message}`);
    });

    this.instance.on('reconnect_attempt', (attempt) => {
      console.log(`[SOCKET_CLIENT_RECONNECTING] Attempt #${attempt}`);
    });
  }

  /**
   * Safe wrapper for joining rooms.
   * Tracks rooms to ensure they are rejoined on reconnect.
   */
  public static joinRoom(roomId: string) {
    const socket = this.getInstance();
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.add(roomId);
      socket.emit('join_room', roomId);
      console.log(`[SOCKET_CLIENT_JOIN] Room: ${roomId}`);
    }
  }

  /**
   * Safe wrapper for leaving rooms.
   */
  public static leaveRoom(roomId: string) {
    const socket = this.getInstance();
    if (this.activeRooms.has(roomId)) {
      this.activeRooms.delete(roomId);
      socket.emit('leave_room', roomId);
      console.log(`[SOCKET_CLIENT_LEAVE] Room: ${roomId}`);
    }
  }

  /**
   * Specific wrapper for private chat rooms.
   * Tracks chatId and emits 'join_chat'
   */
  public static joinChat(chatId: string) {
    const socket = this.getInstance();
    const roomId = `chat:${chatId}`;
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.add(roomId);
      socket.emit('join_chat', { chatId });
      console.log(`[SOCKET_CLIENT_JOIN_CHAT] ChatId: ${chatId}`);
    }
  }

  /**
   * Specific wrapper for personal notification rooms.
   */
  public static joinUser(userId: string) {
    const socket = this.getInstance();
    const roomId = `user:${userId}`;
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.add(roomId);
      socket.emit('join_user', { userId });
      console.log(`[SOCKET_CLIENT_JOIN_USER] UserId: ${userId}`);
    }
  }

  /**
   * Get raw socket instance if needed.
   */
  public static getSocket(): Socket | null {
    return this.instance;
  }
}

export const socketClient = SocketClient;
