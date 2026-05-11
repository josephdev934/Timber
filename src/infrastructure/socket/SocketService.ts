/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SOCKET SERVICE
 * ==========================================
 * Provides a clean abstraction for emitting real-time events.
 * ==========================================
 */

import { buildContentRoom, buildUserRoom } from './roomUtils';
import { socketServer } from './socketServer';

export class SocketService {
  
  /**
   * Emit an event to a specific room.
   */
  static emitToRoom(room: string, event: string, payload: any) {
    const io = socketServer.getIO();

    if (io) {
      io.to(room).emit(event, payload);
      console.log(`[SOCKET_EMIT] [PID: ${process.pid}] Emitted ${event} to ${room}`);
    } else {
      console.warn(`[SOCKET_SKIPPED] [PID: ${process.pid}] Socket not initialized | event: ${event} | room: ${room}`);
    }
  }

  /**
   * Notify a specific user's private notification room
   */
  static emitToUser(userId: string, event: string, payload: any) {
    const roomId = buildUserRoom(userId);
    this.emitToRoom(roomId, event, payload);
  }

  /**
   * Broadcast to all users watching a specific content thread
   */
  static emitToContent(contentId: string, event: string, payload: any) {
    const roomId = buildContentRoom(contentId);
    this.emitToRoom(roomId, event, payload);
  }
}
