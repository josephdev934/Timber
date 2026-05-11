import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserService } from '@/application/services/UserService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * PRESENTATION LAYER - GET /api/users/[id]
 * ==========================================
 * Retrieves profile info with ID format protection.
 * ==========================================
 */

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetUserId = id;

    // 1. Structural Validation of the requested ID
    if (!isValidObjectId(targetUserId)) {
      return NextResponse.json({ 
        error: 'The requested User ID is not a valid format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 2. Identity Verification for the caller
    await protectRoute(req);
    
    // 3. Resolve to business logic
    const [user, stats] = await Promise.all([
      UserService.getUserById(targetUserId),
      UserService.getUserStats(targetUserId)
    ]);

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found.',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 4. Scrub internal secrets
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ 
      user: safeUser,
      stats: stats 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_USER_GET_ID]", error.message);
    const isUnauthorized = error.message.startsWith('UNAUTHORIZED');

    return NextResponse.json({ 
      error: isUnauthorized ? 'Authentication Required' : 'Failed to fetch user state.',
      code: isUnauthorized ? 'UNAUTHORIZED' : 'INTERNAL_ERROR'
    }, { status: isUnauthorized ? 401 : 500 });
  }
}
