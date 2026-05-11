import { Server } from 'socket.io';
import { AdminEventBus, ADMIN_BUS_EVENTS } from '../../events/AdminEventBus';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SOCKET EVENT STREAMER
 * ==========================================
 * Passive observer that re-broadcasts high-level platform events
 * to the Admin Dashboard's activity feed and event log.
 * Aligned with UI integration spec (Section 2 & 6).
 * ==========================================
 */
export class SocketEventStreamer {
  private io: Server;
  private eventBuffer: any[] = [];
  private lastFlushTime = Date.now();
  private readonly BATCH_THRESHOLD = 20; // 20 events/sec
  private readonly FLUSH_INTERVAL = 3000; // 3 seconds

  constructor(io: Server) {
    this.io = io;
    this.init();
  }

  private init() {
    console.log("[SOCKET_STREAMER_INIT] Attaching to Admin Event Bus...");

    const bus = AdminEventBus.getInstance();

    // Listen to all events on the bus
    bus.onAny((event, payload) => {
      this.handleEvent(event as string, payload);
    });
  }

  /**
   * Processes an incoming bus event and decides whether to emit or batch.
   */
  private handleEvent(event: string, payload: any) {
    const now = Date.now();
    
    // Derive metadata for logs
    let roomId = "system";
    if (payload?.contentId) roomId = `content:${payload.contentId}`;
    else if (payload?.chatId) roomId = `chat:${payload.chatId}`;
    else if (payload?.groupId) roomId = `group:${payload.groupId}`;

    const eventRecord = {
      eventName: event,
      roomId,
      payload,
      timestamp: now,
      summary: this.deriveSummary(event, payload),
      pid: process.pid
    };

    // 1. Logic for Activity Feed (Always real-time for core events)
    // Section 2 Requirement: Emit specific names (COMMENT_CREATED, etc.)
    if (this.isHighPriority(event)) {
      this.io.to('admin:activity').emit(event, eventRecord);
    }

    // 2. Logic for Event Log (Terminal style) - Section 6
    this.eventBuffer.push(eventRecord);

    if (this.eventBuffer.length >= this.BATCH_THRESHOLD || (now - this.lastFlushTime) > this.FLUSH_INTERVAL) {
      this.flushBuffer();
    }
  }

  private isHighPriority(event: string): boolean {
    const priorities = [
      ADMIN_BUS_EVENTS.COMMENT_CREATED,
      ADMIN_BUS_EVENTS.COMMENT_DELETED,
      ADMIN_BUS_EVENTS.POST_CREATED,
      ADMIN_BUS_EVENTS.MESSAGE_CREATED,
      ADMIN_BUS_EVENTS.GROUP_JOINED,
      ADMIN_BUS_EVENTS.MEDIA_UPLOADED,
      ADMIN_BUS_EVENTS.REPORT_SUBMITTED,
      ADMIN_BUS_EVENTS.USER_BANNED
    ];
    return priorities.includes(event as any);
  }

  /**
   * Generates a human-readable summary for the event log
   */
  private deriveSummary(event: string, payload: any): string {
    const actor = payload?.actorName || payload?.username || "System";
    const target = payload?.contentId || payload?.chatId || payload?.userId || "";
    
    switch(event) {
      case ADMIN_BUS_EVENTS.POST_CREATED: return `${actor} created a new post`;
      case ADMIN_BUS_EVENTS.COMMENT_CREATED: return `${actor} commented on content`;
      case ADMIN_BUS_EVENTS.MESSAGE_CREATED: return `New message in chat ${payload?.chatId}`;
      case ADMIN_BUS_EVENTS.REPORT_SUBMITTED: return `New report submitted by ${actor}`;
      case ADMIN_BUS_EVENTS.USER_BANNED: return `User ${payload?.username || payload?.userId} was banned`;
      case ADMIN_BUS_EVENTS.MEDIA_UPLOADED: return `New media uploaded (${payload?.type})`;
      default: return `System event: ${event}`;
    }
  }

  private flushBuffer() {
    if (this.eventBuffer.length === 0) return;

    if (this.eventBuffer.length >= this.BATCH_THRESHOLD) {
      // Emit summary if we're in "high traffic" mode
      this.io.to('admin:events').emit('events:batch', {
        count: this.eventBuffer.length,
        events: this.eventBuffer,
        isBatched: true
      });
    } else {
      // Emit individual events if traffic is low
      this.eventBuffer.forEach(e => {
        this.io.to('admin:events').emit('events:log', e);
      });
    }

    this.eventBuffer = [];
    this.lastFlushTime = Date.now();
  }
}
