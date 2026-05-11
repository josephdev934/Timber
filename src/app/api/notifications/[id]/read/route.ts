/**
 * ==========================================
 * PRESENTATION LAYER - /api/notifications/[id]/read
 * ==========================================
 * Handles marking a specific alert as read with ID protection.
 * ==========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { NotificationService } from '@/application/services/NotificationService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * Handle PUT - Mark a specific notification as seen with guard logic
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: notificationId } = await params;

    // 1. Validate Target ID format
    if (!isValidObjectId(notificationId)) {
      return NextResponse.json({ 
        error: 'Invalid notification ID format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 2. Authenticate session context
    await protectRoute(req);

    // 3. Delegate to service for persistence update
    const result = await NotificationService.markAsRead(notificationId);

    if (!result) {
      return NextResponse.json({ 
        error: 'Notification details could not be found or updated.',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_NOTIFICATION_ID_READ]", error.message);
    return NextResponse.json({ 
      error: 'State update failed due to internal error.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
