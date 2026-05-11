/**
 * ==========================================
 * INFRASTRUCTURE LAYER - WEBSOCKETS (SOCKET.IO)
 * ==========================================
 * Foundation for Real-time engine holding the sockets logic.
 * No features implemented yet, just building the initial scaffolding that
 * Next.js API routes will hook into to instantiate the server.
 * ==========================================
 */

import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { buildContentRoom, buildUserRoom } from './roomUtils';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Basic setup function to attach Socket.io to the Next.js Http server.
 * In Next.js, we often share the underlying HTTP server.
 */
export function initSocket(res: any) {
  // If socket is already running on this server response block, skip init
  if (res.socket.server.io) {
    console.log('Socket is already running');
    return res.socket.server.io;
  }

  console.log('Initializing Socket.io server...');
  const httpServer: NetServer = res.socket.server;
  
  // Attach socket.io server to the raw HTTP server Next.js uses
  const io = new ServerIO(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*', // We'll restrict this in prod config
      methods: ['GET', 'POST'],
    },
  });

  // Attach core connection lifecycle management
  io.on('connection', (socket) => {
    // 1. Placeholder for explicit JWT authentication and user context lookup
    // console.log(`[Socket] Authenticated User: ${socket.id}`);
    
    // 2. Room strategy: User-specific for immediate private alerts
    socket.on('join-user-room', (userId: string) => {
      // Joins a room identifiable only by the primary user ID
      const roomId = buildUserRoom(userId);
      socket.join(roomId);
      console.log(`[Socket] User ${userId} joined their notification room: ${roomId}`);
    });
    
    // 3. Room strategy: Content-specific for shared live threaded updates
    socket.on('join-content-room', (contentId: string) => {
      // Joins a broad discussion room for all viewers of a specific post/content
      const roomId = buildContentRoom(contentId);
      socket.join(roomId);
      console.log(`[Socket] Joined content discussion room: ${roomId}`);
    });

    // 4. Dynamic leave mechanism for cleanup across navigation cycles
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on('disconnect', () => {
      // Handle standard cleanup on browser close or network failure
    });
  });

  // Store instance onto the server so we only init once
  res.socket.server.io = io;
  return io;
}
