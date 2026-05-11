/**
 * ==========================================
 * INFRASTRUCTURE LAYER - AUTH MIDDLEWARE
 * ==========================================
 * Next.js App Router specific protection block.
 * Instead of edge middleware, we export this and wrap logic manually to guarantee
 * Node-specific JWT libraries and MongoDB connections don't encounter Edge incompatibilities.
 * ==========================================
 */

import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './jwtUtils';

export interface ProtectedRequestContext {
  userId: string;
  role: string;
}

/**
 * Validates the Authorization header of a Next Request structure.
 * Extract and verifies the Bearer token.
 * Throws explicit error strings meant to be caught by the route controllers.
 */
export async function protectRoute(req: NextRequest, allowedRoles?: string[]): Promise<ProtectedRequestContext> {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Fallback to cookie if header is missing (browser requests)
  if (!token) {
    token = req.cookies.get('timber_token')?.value || null;
  }

  if (!token) {
    throw new Error('UNAUTHORIZED_NO_TOKEN');
  }
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error('UNAUTHORIZED_INVALID_TOKEN');
  }

  // Handle RBAC boundaries 
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(decoded.role)) {
      throw new Error('FORBIDDEN_ROLE_RESTRICTION');
    }
  }

  return {
    userId: decoded.userId,
    role: decoded.role
  };
}
