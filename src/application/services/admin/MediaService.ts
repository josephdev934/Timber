import { MediaModel } from '../../../infrastructure/db/models/Media';
import { CloudinaryService } from '../../../infrastructure/external/CloudinaryService';
import { AuditLogService } from './AuditLogService';
import { connectToDatabase } from '../../../infrastructure/db/connect';

/**
 * ==========================================
 * APPLICATION LAYER - ADMIN MEDIA SERVICE
 * ==========================================
 * Administrative actions for media (flagging, deleting).
 * ==========================================
 */
export class MediaService {
  /**
   * Delete a media asset from DB and Cloudinary
   */
  static async deleteMedia(id: string, adminId: string): Promise<void> {
    await connectToDatabase();
    console.log(`[DELETE_DEBUG] Starting smart delete for ID: ${id}`);

    // 1. Determine the source and actual ID
    let targetId = id;
    let source: 'Media' | 'Post' | 'Message' = 'Media';

    if (id.includes('_img_') || id.includes('_vid')) {
      source = 'Post';
      targetId = id.split('_')[0];
    }

    // 2. Perform deletion based on source
    if (source === 'Post') {
      const { PostModel } = require('../../../infrastructure/db/models/Post');
      const post = await PostModel.findById(targetId);
      if (post) {
        // Just clear the media fields, don't delete the whole post unless desired
        // For now, let's just log and skip Cloudinary delete for posts unless we have publicIds there
        await PostModel.findByIdAndUpdate(targetId, { $unset: { video: 1 }, $set: { images: [] } });
        console.log(`[DELETE_DEBUG] Post media cleared for: ${targetId}`);
      }
    } else {
      // Check Media collection first
      let media = await MediaModel.findById(id);
      if (media) {
        if (media.publicId) {
          await CloudinaryService.deleteAsset(media.publicId, media.type);
        }
        await MediaModel.findByIdAndDelete(id);
        console.log(`[DELETE_DEBUG] Media document deleted: ${id}`);
      } else {
        // Check Message collection
        const { MessageModel } = require('../../../infrastructure/db/models/Message');
        const message = await MessageModel.findById(id);
        if (message) {
          await MessageModel.findByIdAndUpdate(id, { $unset: { mediaUrl: 1, mediaType: 1 } });
          console.log(`[DELETE_DEBUG] Message media cleared: ${id}`);
        } else {
          console.warn(`[DELETE_DEBUG] Asset not found in any collection: ${id}`);
          throw new Error("Asset not found");
        }
      }
    }

    // 3. Log to AuditLog
    await AuditLogService.log({
      adminId,
      action: 'DELETE_CONTENT',
      targetType: source,
      targetId,
      metadata: { deletedId: id }
    });
  }

  /**
   * Toggle the flagged status of a media asset
   */
  static async toggleFlag(id: string, adminId: string): Promise<boolean> {
    await connectToDatabase();
    console.log(`[FLAG_DEBUG] Toggling flag for ID: ${id}`);

    let targetId = id;
    let source: 'Media' | 'Post' | 'Message' = 'Media';

    if (id.includes('_img_') || id.includes('_vid')) {
      source = 'Post';
      targetId = id.split('_')[0];
    }

    let newFlagStatus = false;

    if (source === 'Post') {
      const { PostModel } = require('../../../infrastructure/db/models/Post');
      const post = await PostModel.findById(targetId);
      if (!post) throw new Error("Post not found");
      
      newFlagStatus = !post.isFlagged;
      await PostModel.findByIdAndUpdate(targetId, { isFlagged: newFlagStatus });
      console.log(`[FLAG_DEBUG] Post flagged: ${targetId} -> ${newFlagStatus}`);

      // Create/Resolve Report
      const { ReportModel } = require('../../../infrastructure/db/models/Report');
      if (newFlagStatus) {
        await ReportModel.create({
          reporterId: adminId,
          reportedUserId: post.author,
          contentType: 'Post',
          contentId: targetId,
          reason: 'Admin Flagged (Media Library)',
          status: 'pending'
        });
      } else {
        await ReportModel.updateMany(
          { contentId: targetId, status: 'pending' },
          { status: 'resolved', resolvedAt: new Date(), resolvedBy: adminId }
        );
      }
    } else {
      const media = await MediaModel.findById(id);
      if (media) {
        newFlagStatus = !media.isFlagged;
        await MediaModel.findByIdAndUpdate(id, { isFlagged: newFlagStatus });

        const { ReportModel } = require('../../../infrastructure/db/models/Report');
        if (newFlagStatus) {
          await ReportModel.create({
            reporterId: adminId,
            reportedUserId: media.uploaderId,
            contentType: 'Media',
            contentId: id,
            reason: 'Admin Flagged (Media Library)',
            status: 'pending'
          });
        } else {
          await ReportModel.updateMany(
            { contentId: id, status: 'pending' },
            { status: 'resolved', resolvedAt: new Date(), resolvedBy: adminId }
          );
        }
      } else {
        // Check message
        const { MessageModel } = require('../../../infrastructure/db/models/Message');
        const message = await MessageModel.findById(id);
        if (!message) throw new Error("Asset not found in any collection");
        
        newFlagStatus = !message.isFlagged;
        await MessageModel.findByIdAndUpdate(id, { isFlagged: newFlagStatus });

        const { ReportModel } = require('../../../infrastructure/db/models/Report');
        if (newFlagStatus) {
          await ReportModel.create({
            reporterId: adminId,
            reportedUserId: message.senderId,
            contentType: 'Comment', // Generic fallback
            contentId: id,
            reason: 'Admin Flagged (Media Library)',
            status: 'pending'
          });
        } else {
          await ReportModel.updateMany(
            { contentId: id, status: 'pending' },
            { status: 'resolved', resolvedAt: new Date(), resolvedBy: adminId }
          );
        }
      }
    }

    await AuditLogService.log({
      adminId,
      action: 'CHANGE_SETTINGS',
      targetType: source,
      targetId,
      metadata: { action: 'TOGGLE_FLAG', isFlagged: newFlagStatus }
    });

    return newFlagStatus;
  }
}
