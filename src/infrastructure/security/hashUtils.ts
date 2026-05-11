import bcrypt from 'bcrypt';
import { env } from '../../config/env';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SECURITY (HASHING)
 * ==========================================
 * Provides password and sensitive string hashing utilities.
 * Completely decoupled from the domain models or services.
 * ==========================================
 */
// Configure salt rounds from our centralized env configuration
const SALT_ROUNDS = env.SALT_ROUNDS;

/**
 * Hash a plain text string
 * @param plaintext String to hash (e.g. password)
 */
export async function hashString(plaintext: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plaintext, salt);
}

/**
 * Compare a plain text string against a secure hash
 * @param plaintext Plaintext to verify
 * @param hash Stored hash
 */
export async function compareHash(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
