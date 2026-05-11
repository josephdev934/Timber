import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { NotificationService } from '@/application/services/NotificationService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * Handle DELETE - Remove a specific notification by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await protectRoute(req);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid notification ID format.', code: 'INVALID_ID' }, { status: 400 });
    }

    const success = await NotificationService.deleteNotification(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Notification not found or could not be deleted.', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_NOTIFICATION_DELETE]", error.message);
    return NextResponse.json({ 
      error: 'Failed to delete notification.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
