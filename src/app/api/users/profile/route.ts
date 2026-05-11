import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserService } from '@/application/services/UserService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * PRESENTATION LAYER - PUT /api/users/profile
 * ==========================================
 * Protected route for profile mutations with input hardening.
 * ==========================================
 */

export async function PUT(req: NextRequest) {
  try {
    // 1. Identity Verification and ID consistency check
    const authContext = await protectRoute(req);
    
    if (!isValidObjectId(authContext.userId)) {
      return NextResponse.json({ 
        error: 'Critical: Auth context ID is invalid.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const body = await req.json();
    
    // 2. Sanitize and validate update payloads
    const username = body.username?.trim();
    const name = body.name?.trim();
    const bio = body.bio?.trim();
    const profilePhoto = body.profilePhoto?.trim();
    
    const updates: any = {};
    if (username) updates.username = username;
    if (name) updates.name = name;
    if (bio) updates.bio = bio;
    if (profilePhoto) updates.profilePhoto = profilePhoto;

    // Reject empty update attempts
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'At least one property (username, name, bio or profilePhoto) must be provided for update.', 
        code: 'INVALID_INPUT' 
      }, { status: 400 });
    }

    // 3. Dispatch to UserService with isolated ID
    const updatedUser = await UserService.updateUserProfile(authContext.userId, updates);

    // 4. Scrub sensitive fields before returning state
    const { passwordHash, ...safeUser } = updatedUser as any;

    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_USER_PROFILE_PUT]", error.message);
    return NextResponse.json({ error: error.message || 'Profile Update Failed' }, { status: 500 });
  }
}

/**
 * Handle DELETE - Permanent account removal
 */
export async function DELETE(req: NextRequest) {
  try {
    const authContext = await protectRoute(req);
    
    if (!isValidObjectId(authContext.userId)) {
      return NextResponse.json({ error: 'Invalid user ID', code: 'INVALID_ID' }, { status: 400 });
    }

    // Call Service for destructive orchestration
    const success = await UserService.deleteUser(authContext.userId);

    if (!success) {
      return NextResponse.json({ error: 'User not found or deletion failed.', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_USER_PROFILE_DELETE]", error.message);
    return NextResponse.json({ 
      error: 'Failed to delete account.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
