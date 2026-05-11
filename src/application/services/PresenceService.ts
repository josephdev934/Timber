import { PresenceRepository } from '../../infrastructure/repositories/PresenceRepository';
import { SocketService } from '../../infrastructure/socket/SocketService';

/**
 * ==========================================
 * APPLICATION LAYER - PRESENCE SERVICE
 * ==========================================
 * Orchestrates heartbeat and status broadcasting.
 * ==========================================
 */
export class PresenceService {
  /**
   * Handle incoming heartbeat
   */
  static async handleHeartbeat(userId: string, metadata?: any): Promise<void> {
    const previousStatus = await PresenceRepository.getUserStatus(userId);
    
    // 1. Update Redis
    await PresenceRepository.setUserStatus(userId, 'online', metadata);

    // 2. If user was offline, broadcast "online" event
    if (previousStatus.status === 'offline') {
      SocketService.emitToUser(userId, 'presence:update', { userId, status: 'online' });
      // In a real system, you'd broadcast to friends/rooms here
    }
  }

  /**
   * Force set offline (on clean disconnect)
   */
  static async setOffline(userId: string): Promise<void> {
    await PresenceRepository.clearUserStatus(userId);
    SocketService.emitToUser(userId, 'presence:update', { userId, status: 'offline' });
  }

  /**
   * Get statuses for a list of users
   */
  static async getUserStatuses(userIds: string[]): Promise<Record<string, any>> {
    return await PresenceRepository.getMultiUserStatus(userIds);
  }
}
