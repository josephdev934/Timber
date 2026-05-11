import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';

/**
 * DELETE /api/users/me
 * Irreversibly remove user account.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authContext = await protectRoute(req);
    
    // 1. Logic to wipe user
    const success = await UserRepository.deleteUser(authContext.userId);
    
    if (success) {
      return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to delete account.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
