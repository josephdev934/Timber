import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { AuthService } from '@/application/services/AuthService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * PRESENTATION LAYER - GET /api/auth/me
 * ==========================================
 * Authenticated route resolving current profile with ID normalization check.
 * ==========================================
 */

export async function GET(req: NextRequest) {
  try {
    // 1. Invoke middleware to validate header integrity and parse context
    const authContext = await protectRoute(req);
    
    // 2. Validate extracted ID integrity
    if (!isValidObjectId(authContext.userId)) {
      console.error("[INVALID_ID_ATTEMPT_AUTH_CONTEXT]", { userId: authContext.userId });
      return NextResponse.json({ 
        error: 'Critical: The authenticated user profile has an invalid ID format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 3. Forward to service for state resolution
    const user = await AuthService.getCurrentUser(authContext.userId);

    if (!user) {
      return NextResponse.json({ 
        error: 'The authenticated user profile could not be found.',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 4. Normalize response removing sensitive internal fields
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_AUTH_ME]", error.message);
    const isUnauthorized = error.message.startsWith('UNAUTHORIZED');
    
    return NextResponse.json({ 
      error: isUnauthorized ? 'Session Invalid or Missing' : 'Authentication Resolution Failed',
      code: isUnauthorized ? 'UNAUTHORIZED' : 'INTERNAL_ERROR'
    }, { status: isUnauthorized ? 401 : 500 });
  }
}
