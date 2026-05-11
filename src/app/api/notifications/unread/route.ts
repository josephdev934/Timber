import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { NotificationService } from '@/application/services/NotificationService';

/**
 * Handle GET - Fetch unread count for current user
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await protectRoute(req);
    const count = await NotificationService.getUnreadCount(authContext.userId);
    return NextResponse.json({ count }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
