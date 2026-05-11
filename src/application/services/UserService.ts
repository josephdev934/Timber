import { User } from '@/domain/entities/User';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { safeObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * APPLICATION LAYER - USER SERVICE
 * ==========================================
 * Hardened user management with ID protection and isolated errors.
 * ==========================================
 */

export class UserService {
  
  /**
   * Safe ID fetch preventing CastError crashes.
   */
  static async getUserById(id: string): Promise<User | null> {
    const safeId = safeObjectId(id);
    if (!safeId) return null;

    try {
      return await UserRepository.findById(id);
    } catch (err: any) {
      console.error("[REPO_FAILURE_USER_FETCH]", { id, error: err.message });
      return null;
    }
  }

  /**
   * Calculate activity stats for a user
   */
  static async getUserStats(id: string): Promise<{ posts: number; interactions: number }> {
    const safeId = safeObjectId(id);
    if (!safeId) return { posts: 0, interactions: 0 };

    try {
      const [postCount, commentCount] = await Promise.all([
        import('@/infrastructure/db/models/Post').then(({ PostModel }) => 
          PostModel.countDocuments({ $or: [{ author: safeId }, { authorId: safeId }] })
        ),
        import('@/infrastructure/db/models/Comment').then(({ CommentModel }) => 
          CommentModel.countDocuments({ authorId: safeId })
        )
      ]);

      return {
        posts: postCount,
        interactions: commentCount
      };
    } catch (err: any) {
      console.error("[STATS_FAILURE]", { id, error: err.message });
      return { posts: 0, interactions: 0 };
    }
  }

  /**
   * Identity lookup by email.
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await UserRepository.findByEmail(email);
    } catch (err: any) {
      console.error("[REPO_FAILURE_USER_EMAIL]", { email, error: err.message });
      return null;
    }
  }

  /**
   * Mutation logic with structural protection.
   */
  static async updateUserProfile(id: string, updates: Partial<Pick<User, 'username' | 'profilePhoto' | 'name' | 'bio'>>): Promise<User> {
    const safeId = safeObjectId(id);
    if (!safeId) throw new Error('Invalid user ID provided for update.');

    try {
      // 1. Uniqueness check for username
      if (updates.username) {
        const usernameTrimmed = updates.username.trim();
        if (usernameTrimmed.length < 3) throw new Error('Username too short.');
        
        const existing = await UserRepository.findByProperty({
          username: usernameTrimmed,
          _id: { $ne: safeId }
        });
        
        if (existing) {
          throw new Error('Username is already taken.');
        }
        updates.username = usernameTrimmed;
      }

      // 2. Delegate persistence
      const updated = await UserRepository.updateUser(id, updates);

      if (!updated) {
        throw new Error('User not found.');
      }

      return updated;
    } catch (err: any) {
      if (['Username is already taken.', 'User not found.', 'Username too short.'].includes(err.message)) throw err;
      console.error("[REPO_FAILURE_USER_UPDATE]", { id, error: err.message });
      throw new Error('Critical database failure during profile update.');
    }
  }

  /**
   * Search users by query string.
   */
  static async searchUsers(query: string): Promise<User[]> {
    try {
      return await UserRepository.searchUsers(query);
    } catch (err: any) {
      console.error("[REPO_FAILURE_USER_SEARCH]", { query, error: err.message });
      return [];
    }
  }

  /**
   * Remove user identity and scrub persistence layers.
   */
  static async deleteUser(id: string): Promise<boolean> {
    const safeId = safeObjectId(id);
    if (!safeId) return false;

    try {
      return await UserRepository.deleteUser(id);
    } catch (err: any) {
      console.error("[REPO_FAILURE_USER_DELETE]", { id, error: err.message });
      return false;
    }
  }

  /**
   * Ban a user and kick them from the platform.
   */
  static async banUser(id: string, reason: string): Promise<void> {
    const safeId = safeObjectId(id);
    if (!safeId) throw new Error("Invalid user ID");

    try {
      // 1. Update DB
      await UserRepository.updateUser(id, {
        isBanned: true,
        banReason: reason
      } as any);

      // 2. Force Disconnect Socket (Phase 4 Logic)
      const { socketServer } = await import('@/infrastructure/socket/socketServer');
      const io = socketServer.getIO();
      if (io) {
        const { buildUserRoom } = await import('@/infrastructure/socket/roomUtils');
        const userRoom = buildUserRoom(id);
        
        // Emit kick event to the specific user's room
        io.to(userRoom).emit('FORCE_DISCONNECT', { reason });
        
        // Actually disconnect the sockets in that room
        const sockets = await io.in(userRoom).fetchSockets();
        sockets.forEach(s => s.disconnect(true));
      }

      console.log(`[USER_BANNED] userId: ${id} | reason: ${reason}`);
    } catch (err: any) {
      console.error("[USER_BAN_FAILURE]", err.message);
      throw err;
    }
  }

  /**
   * Unban a user.
   */
  static async unbanUser(id: string): Promise<void> {
    const safeId = safeObjectId(id);
    if (!safeId) throw new Error("Invalid user ID");

    try {
      await UserRepository.updateUser(id, {
        isBanned: false,
        banReason: null
      } as any);
      console.log(`[USER_UNBANNED] userId: ${id}`);
    } catch (err: any) {
      console.error("[USER_UNBAN_FAILURE]", err.message);
      throw err;
    }
  }

  /**
   * Delete a user and all their associated content.
   */
  static async deleteUserDeep(id: string): Promise<void> {
    const safeId = safeObjectId(id);
    if (!safeId) throw new Error("Invalid user ID");

    try {
      // 1. Delete Posts
      const { PostModel } = await import('@/infrastructure/db/models/Post');
      await PostModel.deleteMany({ $or: [{ author: safeId }, { authorId: safeId }] });

      // 2. Delete Comments
      const { CommentModel } = await import('@/infrastructure/db/models/Comment');
      await CommentModel.deleteMany({ authorId: safeId });

      // 3. Delete User
      await UserRepository.deleteUser(id);
      
      console.log(`[USER_DELETED_DEEP] userId: ${id}`);
    } catch (err: any) {
      console.error("[USER_DELETE_DEEP_FAILURE]", err.message);
      throw err;
    }
  }
}
