import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { ConversationModel } from '@/infrastructure/db/models/Conversation';
import { GroupService } from '@/application/services/admin/GroupService';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - /api/admin/groups/:id
 * ==========================================
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const group = await ConversationModel.findById(id)
      .populate('createdBy', 'name username profilePhoto')
      .populate('participants', 'name username profilePhoto isBanned')
      .populate('removedParticipants', 'name username profilePhoto')
      .lean();

    if (!group || group.type !== 'group') {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    // Handle 'archive' action
    if (action === 'archive') {
      await GroupService.archiveGroup(id, adminId);
      return NextResponse.json({ success: true, message: "Group archived" });
    }

    // Handle 'rename' via body
    const body = await req.json();
    if (body.name) {
      await connectToDatabase();
      const oldGroup = await ConversationModel.findByIdAndUpdate(id, { name: body.name });
      
      if (oldGroup) {
        await AuditLogService.log({
          adminId,
          action: 'CHANGE_SETTINGS',
          targetType: 'Group',
          targetId: id,
          metadata: { action: 'RENAME', oldName: oldGroup.name, newName: body.name }
        });
      }
      return NextResponse.json({ success: true, message: "Group renamed" });
    }

    return NextResponse.json({ error: "Invalid action or payload" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);

    await GroupService.disbandGroup(id, adminId);

    return NextResponse.json({ success: true, message: "Group disbanded" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
