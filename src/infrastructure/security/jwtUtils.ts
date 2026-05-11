import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SECURITY (JWT)
 * ==========================================
 * Provides JSON Web Token signing and verification helpers.
 * Used for stateless Session management and authorization header validation.
 * ==========================================
 */

// Read the security secret from our centralized config object
const JWT_SECRET = env.JWT_SECRET;

export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Generates an access token lasting a limited time
 */
export function signToken(payload: TokenPayload, expiresIn: any = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies and decodes a payload from a token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    // Return null if token is expired or invalid
    return null;
  }
}
