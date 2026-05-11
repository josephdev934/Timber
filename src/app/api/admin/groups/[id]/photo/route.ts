import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ConversationModel } from '@/infrastructure/db/models/Conversation';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/groups/:id/photo
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);
    
    // In a full implementation, we'd parse FormData and upload to Cloudinary.
    // For now, we'll extract the URL if passed, or just mock the success if a file is uploaded.
    let photoUrl = "";
    
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get('photo');
      // Mock Cloudinary upload...
      photoUrl = "/mock-group-photo.png"; 
    } else {
      const body = await req.json();
      photoUrl = body.photoUrl;
    }

    if (!photoUrl) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    await connectToDatabase();
    const group = await ConversationModel.findByIdAndUpdate(id, {
      groupPhoto: photoUrl,
      groupPhotoUpdatedBy: adminId,
      groupPhotoUpdatedAt: new Date()
    }, { new: true });

    if (group) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Group',
        targetId: id,
        metadata: { action: 'UPDATE_PHOTO', photoUrl }
      });
    }

    return NextResponse.json({ success: true, photoUrl, message: "Group photo updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
