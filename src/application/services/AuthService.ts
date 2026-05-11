import { User } from '@/domain/entities/User';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { hashString, compareHash } from '@/infrastructure/security/hashUtils';
import { signToken } from '@/infrastructure/security/jwtUtils';
import { UserService } from './UserService';
import { safeObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * APPLICATION LAYER - AUTH SERVICE
 * ==========================================
 * Hardened auth logic with structured validation and logging.
 * ==========================================
 */

export class AuthService {
  
  /**
   * Register user with business rule protection.
   */
  static async registerUser(data: { name: string; username: string; email: string; passwordRaw: string }): Promise<Omit<User, 'passwordHash'>> {
    
    // 1. Basic business validation filtering
    if (!data.email.includes('@')) throw new Error('Invalid email format.');
    if (data.passwordRaw.length < 6) throw new Error('Password must be at least 6 characters.');

    // 2. Assert unique entity rules
    try {
      const emailExists = await UserRepository.findByEmail(data.email);
      if (emailExists) throw new Error('Email is already registered.');

      const usernameExists = await UserRepository.findByProperty({ username: data.username });
      if (usernameExists) throw new Error('Username is already taken.');

      // 3. Password Hashing
      const hashed = await hashString(data.passwordRaw);

      // 4. Create User
      const created = await UserRepository.createUser({
        username: data.username,
        name: data.name,
        email: data.email,
        passwordHash: hashed,
        role: 'user'
      });

      // 5. Track total users in Redis (Phase 2)
      try {
        const { getRedisClient } = await import('../../infrastructure/redis/redisClient');
        const redis = await getRedisClient();
        await redis.incr('stats:totalUsers');
      } catch (e) {}

      return {
        id: created.id,
        username: created.username,
        name: created.name,
        email: created.email,
        role: created.role,
        profilePhoto: created.profilePhoto,
        bio: created.bio,
        createdAt: created.createdAt
      } as Omit<User, 'passwordHash'>;
    } catch (repoError: any) {
      if (repoError.message.includes('already')) throw repoError;
      console.error("[REPO_FAILURE_AUTH_REGISTER]", repoError.message);
      throw new Error('Database error during user registration.');
    }
  }

  /**
   * Log in user checking hashed states.
   */
  static async loginUser(email: string, passwordRaw: string): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
    try {
      const user = await UserRepository.findByEmail(email);
      if (!user) throw new Error('Invalid credentials.');

      const isValid = await compareHash(passwordRaw, user.passwordHash);
      if (!isValid) throw new Error('Invalid credentials.');

      const token = signToken({
        userId: user.id,
        role: user.role
      }, '7d');

      const userPayload: Omit<User, 'passwordHash'> = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        createdAt: user.createdAt
      } as unknown as Omit<User, 'passwordHash'>;

      return { token, user: userPayload };
    } catch (err: any) {
      if (err.message === 'Invalid credentials.') throw err;
      console.error("[AUTH_LOGIN_FAILURE]", err.message);
      throw new Error('Login process encountered an internal error.');
    }
  }

  /**
   * Safe identity lookup.
   */
  static async getCurrentUser(userId: string): Promise<User | null> {
    const safeId = safeObjectId(userId);
    if (!safeId) {
      console.error("[INVALID_ID_AUTH_ME]", { userId });
      return null;
    }
    return await UserService.getUserById(userId);
  }
}
