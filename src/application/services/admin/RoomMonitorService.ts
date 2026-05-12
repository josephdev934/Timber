import { Server } from 'socket.io';
import { AdminEventBus } from '../../../infrastructure/events/AdminEventBus';

/**
 * ==========================================
 * APPLICATION LAYER - ROOM MONITOR SERVICE
 * ==========================================
 * Observes active Socket.IO rooms, tracks recent events,
 * and broadcasts room states to the Admin Dashboard.
 * ==========================================
 */

interface RoomEventState {
  lastEventName: string;
  lastEventTime: Date;
}

export class RoomMonitorService {
  private static ticker: NodeJS.Timeout | null = null;
  private static io: Server | null = null;
  private static roomEvents = new Map<string, RoomEventState>();

  /**
   * Start the rooms broadcasting ticker.
   */
  public static start(io: Server) {
    if (this.ticker) return;
    this.io = io;

    console.log("[ROOM_MONITOR_START] Tracking active rooms...");

    // 1. Listen for platform events to update room states
    AdminEventBus.getInstance().onAny((event, payload) => {
      this.trackRoomEvent(event as string, payload);
    });

    // 2. Ticker to emit ROOMS_UPDATE
    this.ticker = setInterval(() => {
      this.emitRooms();
    }, 5000);
  }

  public static stop() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  /**
   * Determine room ID from event payload and track it
   */
  private static trackRoomEvent(eventName: string, payload: any) {
    let roomId = null;

    if (payload?.contentId) roomId = `content_${payload.contentId}`;
    else if (payload?.chatId) roomId = `chat_${payload.chatId}`;
    else if (payload?.groupId) roomId = `group_${payload.groupId}`;

    if (roomId) {
      this.roomEvents.set(roomId, {
        lastEventName: eventName,
        lastEventTime: new Date()
      });
    }
  }

  /**
   * Fetch room data and emit to Admin Dashboard
   */
  private static emitRooms() {
    if (!this.io) return;

    try {
      const activeRooms: any[] = [];
      const rooms = this.io.sockets.adapter.rooms;

      // Iterate through Socket.IO rooms
      rooms.forEach((socketSet, roomId) => {
        // Filter out private socket-id rooms and admin rooms
        if (roomId.startsWith('content_') || roomId.startsWith('chat_') || roomId.startsWith('group_')) {
          
          let type = 'unknown';
          if (roomId.startsWith('content_')) type = 'content';
          if (roomId.startsWith('chat_')) type = 'chat';
          if (roomId.startsWith('group_')) type = 'group';

          const eventState = this.roomEvents.get(roomId);

          activeRooms.push({
            id: roomId,
            type,
            userCount: socketSet.size,
            lastEventName: eventState?.lastEventName || null,
            lastEventTime: eventState?.lastEventTime || null
          });
        }
      });

      // Cleanup stale rooms from tracking map (rooms that no longer exist)
      for (const roomId of Array.from(this.roomEvents.keys())) {
        if (!rooms.has(roomId)) {
          this.roomEvents.delete(roomId);
        }
      }

      // Sort by most active/recent
      activeRooms.sort((a, b) => b.userCount - a.userCount);

      // Broadcast to admin:stats room
      this.io.to('admin:stats').emit('ROOMS_UPDATE', activeRooms);

    } catch (err) {
      console.error("[ROOM_MONITOR_EMIT_FAILED]", err);
    }
  }
}
