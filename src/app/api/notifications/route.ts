/**
 * ==========================================
 * PRESENTATION LAYER - /api/notifications
 * ==========================================
 * Handles retrieval of user alerts with strict context extraction.
 * ==========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { NotificationService } from '@/application/services/NotificationService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * Handle GET - Fetch notifications feed for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user context
    const authContext = await protectRoute(req);

    // 2. Validate extracted identity format
    if (!isValidObjectId(authContext.userId)) {
      return NextResponse.json({ 
        error: 'Target user context is not a valid ObjectId.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 3. Extract pagination parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
 
    // 4. Delegate for historical alerts fetch
    const notifications = await NotificationService.getUserNotifications(authContext.userId, limit, offset);

    return NextResponse.json({ notifications }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_NOTIFICATIONS_GET]", error.message);
    return NextResponse.json({ 
      error: 'Failed to process notifications retrieval.',
      code: 'DB_ERROR'
    }, { status: 500 });
  }
}

/**
 * Handle PUT - Batch mark all as read for the active user
 */
export async function PUT(req: NextRequest) {
  try {
    const authContext = await protectRoute(req);
    
    if (!isValidObjectId(authContext.userId)) {
      return NextResponse.json({ error: 'Invalid user context ID', code: 'INVALID_OBJECT_ID' }, { status: 400 });
    }

    const success = await NotificationService.markAllAsRead(authContext.userId);
    return NextResponse.json({ success }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_NOTIFICATIONS_PUT]", error.message);
    return NextResponse.json({ 
      error: 'Failed to update notification states.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
