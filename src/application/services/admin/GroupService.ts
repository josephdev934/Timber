import { ConversationModel } from '../../../infrastructure/db/models/Conversation';
import { AuditLogService } from './AuditLogService';
import { connectToDatabase } from '../../../infrastructure/db/connect';

export class GroupService {
  static async archiveGroup(id: string, adminId: string): Promise<void> {
    await connectToDatabase();
    const group = await ConversationModel.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
    if (group) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Group',
        targetId: id,
        metadata: { status: 'archived' }
      });
    }
  }

  static async disbandGroup(id: string, adminId: string): Promise<void> {
    await connectToDatabase();
    const group = await ConversationModel.findById(id);
    if (!group) throw new Error("Group not found");
    await ConversationModel.findByIdAndDelete(id);
    await AuditLogService.log({
      adminId,
      action: 'DISBAND_GROUP',
      targetType: 'Group',
      targetId: id,
      metadata: { name: group.name, participantsCount: group.participants?.length }
    });
  }

  static async removeMember(groupId: string, userId: string, adminId: string): Promise<void> {
    await connectToDatabase();
    const group = await ConversationModel.findByIdAndUpdate(groupId, {
      $pull: { participants: userId },
      $addToSet: { removedParticipants: userId }
    }, { new: true });
    if (group) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Group',
        targetId: groupId,
        metadata: { action: 'REMOVE_MEMBER', removedUserId: userId }
      });
    }
  }

  static async addMember(groupId: string, userId: string, adminId: string): Promise<void> {
    await connectToDatabase();
    const group = await ConversationModel.findByIdAndUpdate(groupId, {
      $addToSet: { participants: userId },
      $pull: { removedParticipants: userId }
    }, { new: true });
    if (group) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Group',
        targetId: groupId,
        metadata: { action: 'ADD_MEMBER', addedUserId: userId }
      });
    }
  }

  static async transferAdmin(groupId: string, newAdminId: string, adminId: string): Promise<void> {
    await connectToDatabase();
    const group = await ConversationModel.findByIdAndUpdate(groupId, {
      createdBy: newAdminId
    }, { new: true });
    if (group) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Group',
        targetId: groupId,
        metadata: { action: 'TRANSFER_ADMIN', newCreatorId: newAdminId }
      });
    }
  }
}
