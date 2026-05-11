import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { buildContentRoom, buildChatRoom, buildUserRoom } from './roomUtils';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SOCKET.IO SERVER
 * ==========================================
 * Centralized Socket.IO instance management.
 * One Brain Architecture: Shared between Next.js and custom server.
 * ==========================================
 */

declare global {
  var __TIMBER_SOCKET_IO__: Server | undefined;
}

class SocketServer {
  private static instance: Server | null = null;

  /**
   * Initialize Socket.IO server and attach to HTTP server
   */
  public static init(httpServer: HttpServer): Server {
    console.log(`[SOCKET_INIT] [PID: ${process.pid}] Attempting to initialize Socket.IO...`);
    
    let io: Server;

    // 1. Check globalThis to ensure persistence across reloads (Next.js HMR)
    if (globalThis.__TIMBER_SOCKET_IO__) {
      console.log(`[SOCKET_AVAILABLE] [PID: ${process.pid}] Found existing global Socket.IO instance.`);
      io = globalThis.__TIMBER_SOCKET_IO__;
    } else {
      console.log(`[SOCKET_INIT] [PID: ${process.pid}] Creating NEW Socket.IO Server instance.`);
      io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
      });
      globalThis.__TIMBER_SOCKET_IO__ = io;
    }

      // 1. Reset stale Redis counts on fresh start
      try {
        const { getRedisClient } = require('../redis/redisClient');
        getRedisClient().then((redis: any) => {
          redis.set('stats:activeConnections', '0');
          console.log(`[REDIS_RESET] [PID: ${process.pid}] stats:activeConnections reset to 0`);
        });
      } catch (e) {}

      // 2. Initialize secondary services (Idempotent via service-level checks)
    try {
      // Admin Event Streamer
      const { SocketEventStreamer } = require('./admin/SocketEventStreamer');
      new SocketEventStreamer(io);

      // Stats Ticker
      const { StatsService } = require('../../application/services/admin/StatsService');
      StatsService.start(io);

      // Room Monitor
      const { RoomMonitorService } = require('../../application/services/admin/RoomMonitorService');
      RoomMonitorService.start(io);

      this.setupHandlers();
      console.log(`[SOCKET_INIT] [PID: ${process.pid}] Socket.IO setup complete.`);
    } catch (err: any) {
      console.error(`[SOCKET_ERROR] [SERVICE_INIT_FAILED] ${err.message}`);
    }

    return io;
  }

  /**
   * Global safe access to the Socket.IO instance.
   * NEVER throws. Returns null if not initialized.
   */
  public static getIO(): Server | null {
    try {
      const io = this.instance || globalThis.__TIMBER_SOCKET_IO__ || null;
      
      if (io && !this.instance) {
        this.instance = io; // Sync static instance if found in global
      }
      
      return io;
    } catch (err: any) {
      console.error(`[SOCKET_ERROR] [GET_IO_FAILED] ${err.message}`);
      return null;
    }
  }

  /**
   * Broadcast an event to a specific chat room
   */
  public static emitToChat(chatId: string, event: string, data: any) {
    const io = SocketServer.instance || globalThis.__TIMBER_SOCKET_IO__;
    if (io) {
      const roomId = buildChatRoom(chatId);
      io.to(roomId).emit(event, data);
    }
  }

  /**
   * Setup core connection handlers
   */
  private static setupHandlers(): void {
    const io = this.getIO();
    if (!io) {
      console.error("[SOCKET_ERROR] [SETUP_HANDLERS_FAILED] IO instance missing.");
      return;
    }

    // CRITICAL for HMR: Remove old listeners to ensure the latest logic is used
    io.removeAllListeners('connection');

    io.on('connection', async (socket: Socket) => {
      // Clean slate for the socket to avoid duplicate listeners on the same physical connection
      socket.removeAllListeners();
      
      console.log(`[SOCKET_CONNECTED] [PID: ${process.pid}] socketId: ${socket.id}`);

      // Track connection in Redis (Phase 2)
      try {
        const { getRedisClient } = await import('../redis/redisClient');
        const redis = await getRedisClient();
        await redis.incr('stats:activeConnections');
      } catch (e: any) {}

      /**
       * HARDENING: GLOBAL EVENT DEBUG LAYER
       * Captures and logs EVERY incoming event for transparency.
       * Ensures no event is silently dropped without visibility.
       */
      socket.onAny((eventName, ...args) => {
        console.log(`[SOCKET_EVENT] [PID: ${process.pid}] event: ${eventName} | socketId: ${socket.id} | data:`, args[0]);
      });

      /**
       * TEST EVENT HANDLER
       * Confirms event delivery is functional.
       */
      socket.on("test_event", (data) => {
        console.log("[TEST_EVENT_RECEIVED]", data);
      });

      /**
       * Unified Room Join Handler (Content)
       */
      const handleJoin = (payload: any) => {
        try {
          const isString = typeof payload === 'string';
          const isNotEmpty = isString && payload.trim().length > 0;
          if (!isString || !isNotEmpty) return;

          let roomId: string;
          
          // 1. Recognize System Rooms or Pre-formatted rooms
          if (payload === 'admin:stats' || payload.startsWith('admin:')) {
            roomId = payload;
          } else {
            // 2. Build Content Room (Standard)
            roomId = buildContentRoom(payload);
          }
          
          socket.join(roomId);
          console.log(`[ROOM_JOINED] [PID: ${process.pid}] socketId: ${socket.id} | roomId: ${roomId}`);
        } catch (err: any) {
          console.error(`[SOCKET_ERROR] [ROOM_JOIN_FAILED] socketId: ${socket.id}`, err.message);
        }
      };

      /**
       * Private Chat Room Join Handler
       */
      const handleJoinChat = (payload: any) => {
        try {
          console.log(`[JOIN_CHAT_RECEIVED]`, payload);
          
          const chatId = typeof payload === "string" ? payload : payload?.chatId;
          const isValid = typeof chatId === "string" && chatId.trim().length > 0;

          if (!isValid) {
            console.warn(`[ROOM_REJECTED_INVALID_ID] [CHAT] socketId: ${socket.id} | payload: ${JSON.stringify(payload)}`);
            return;
          }

          const roomId = buildChatRoom(chatId);
          socket.join(roomId);

          console.log(`[ROOM_JOINED] [PID: ${process.pid}] [CHAT] socketId: ${socket.id} | roomId: ${roomId}`);
        } catch (err: any) {
          console.error(`[SOCKET_ERROR] [CHAT_JOIN_FAILED] socketId: ${socket.id}`, err.message);
        }
      };

      /**
       * Room Leaving Handler
       */
      const handleLeave = (payload: any) => {
        try {
          const roomId = buildContentRoom(payload);
          socket.leave(roomId);
          console.log(`[ROOM_LEFT] [PID: ${process.pid}] socketId: ${socket.id} | roomId: ${roomId}`);
        } catch (err: any) {
          console.error(`[SOCKET_ERROR] [ROOM_LEAVE_FAILED] socketId: ${socket.id}`, err.message);
        }
      };

      /**
       * Typing Indicator Handler
       * Broadcasts typing events to all other users in the same chat room.
       */
      socket.on('USER_TYPING', (payload: any) => {
        try {
          const chatId = payload?.chatId;
          const userId = payload?.userId;
          if (!chatId || !userId) return;

          const roomId = buildChatRoom(chatId);
          // Broadcast to everyone in the room EXCEPT the sender
          socket.to(roomId).emit('USER_TYPING', { chatId, userId });
        } catch (err: any) {
          console.error(`[SOCKET_ERROR] [TYPING_FAILED] socketId: ${socket.id}`, err.message);
        }
      });

      /**
       * Personal User Room Join Handler (Notifications)
       */
      const handleJoinUser = (payload: any) => {
        try {
          const userId = typeof payload === "string" ? payload : payload?.userId;
          if (!userId) return;
          const roomId = buildUserRoom(userId);
          socket.join(roomId);
          console.log(`[USER_ROOM_JOINED] [PID: ${process.pid}] socketId: ${socket.id} | roomId: ${roomId}`);
        } catch (err: any) {
          console.error(`[SOCKET_ERROR] [USER_JOIN_FAILED] socketId: ${socket.id}`, err.message);
        }
      };
 
      // Register Event Listeners
      socket.on('join_room', handleJoin);
      socket.on('join_content', handleJoin);
      socket.on('join_chat', handleJoinChat);
      socket.on('join_user', handleJoinUser);
      socket.on('leave_room', handleLeave);
      socket.on('leave_content', handleLeave);

      /**
       * Heartbeat Handler
       */
      socket.on('presence:heartbeat', async (payload: any) => {
        try {
          const userId = payload?.userId;
          if (!userId) return;
          const { PresenceService } = await import('../../application/services/PresenceService');
          await PresenceService.handleHeartbeat(userId, payload.metadata);
        } catch (err: any) {
          console.warn("[HEARTBEAT_FAILED]", err.message);
        }
      });

      /**
       * Typing Indicator Handler
       */
      socket.on('chat:typing', async (payload: any) => {
        try {
          const { chatId, userId, isTyping } = payload;
          if (!chatId || !userId) return;
          
          const { buildChatRoom } = await import('./roomUtils');
          const room = buildChatRoom(chatId);
          
          // Broadcast to everyone else in the chat room
          socket.to(room).emit('chat:typing', { chatId, userId, isTyping });
          
          // Optional: Store in Redis for multi-device sync
          if (isTyping) {
            const { getRedisClient } = await import('../redis/redisClient');
            const redis = await getRedisClient();
            await redis.set(`typing:${chatId}:${userId}`, "1", { EX: 5 });
          }
        } catch (err: any) {
          console.warn("[TYPING_INDICATOR_FAILED]", err.message);
        }
      });

      socket.on('disconnect', async (reason) => {
        console.log(`[SOCKET_DISCONNECTED] [PID: ${process.pid}] socketId: ${socket.id} | reason: ${reason}`);
        
        // Track disconnection in Redis (Phase 2)
        try {
          const { getRedisClient } = await import('../redis/redisClient');
          const redis = await getRedisClient();
          await redis.decr('stats:activeConnections');
        } catch (e: any) {}
      });

      socket.on('error', (err) => {
        console.error(`[SOCKET_ERROR] socketId: ${socket.id}`, err);
      });
    });

    // Server-level connection error handling
    io.on('connect_error', (err) => {
      console.error(`[SOCKET_CONNECT_ERROR] [PID: ${process.pid}]`, err.message);
    });
  }
}

export const socketServer = SocketServer;
