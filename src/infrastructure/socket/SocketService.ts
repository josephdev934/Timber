import { buildContentRoom, buildUserRoom } from './roomUtils';
import { getPusherServer } from './pusher';

export class SocketService {
  
  /**
   * Emit an event to a specific room (Channel in Pusher).
   */
  static emitToRoom(room: string, event: string, payload: any) {
    const pusher = getPusherServer();

    if (pusher) {
      // Map Socket.io room to Pusher channel
      // We use 'private-' for all channels to match the client's subscription
      const channelName = room.startsWith('private-') ? room : `private-${room}`;
      
      pusher.trigger(channelName, event, payload).catch(err => {
        console.error(`[PUSHER_ERROR] Trigger failed for ${event} in ${channelName}:`, err);
      });
      console.log(`[PUSHER_EMIT] [PID: ${process.pid}] Triggered ${event} on channel ${channelName}`);
    } else {
      console.warn(`[PUSHER_SKIPPED] Pusher not initialized | event: ${event} | channel: ${room}`);
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

  /**
   * Broadcast to EVERYONE (Global Channel)
   */
  static emitGlobal(event: string, payload: any = {}) {
    this.emitToRoom('global', event, payload);
  }
}
