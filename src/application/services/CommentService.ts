/**
 * ==========================================
 * APPLICATION LAYER - COMMENT SERVICE
 * ==========================================
 * Orchestrates threaded commenting, @mentions, and notifications.
 * Includes hardening layers for safe ID parsing and error logging.
 * Production-safe Redis caching enabled for comment trees.
 * ==========================================
 */

import { CommentRepository } from '../../infrastructure/repositories/CommentRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { CommentEventEmitter, CommentEventPayload } from '../../infrastructure/socket/eventEmitter';
import { NotificationService } from './NotificationService';
import { Comment } from '../../domain/entities/Comment';
import { safeObjectId } from '../../infrastructure/db/idUtils';
import { getRedisClient } from '../../infrastructure/redis/redisClient';
import { CACHE_CONFIG, CacheKeys } from '../../infrastructure/redis/cacheKeys';
import { parseMentions } from '../utils/mentionUtils';

export class CommentService {
  
  /**
   * Root comment creation logic.
   * Parses mentions and triggers notifications for tagged users.
   */
  static async createComment(data: { contentId: string; authorId: string; text: string }): Promise<Comment> {
    
    // 1. Detect and parse @mentions from the raw text
    const mentionedUserIds = await this.parseMentions(data.text);

    // 2. Normalize and safe-parse identifiers to prevent DB casting crashes
    const safeContentId = safeObjectId(data.contentId);
    const safeAuthorId = safeObjectId(data.authorId);

    if (!safeContentId || !safeAuthorId) {
      throw new Error('Invalid ID formats provided for comment creation.');
    }

    // 3. Persist the comment through the repository layer (MUST succeed)
    try {
      const comment = await CommentRepository.create({
        contentId: safeContentId.toString(),
        authorId: safeAuthorId.toString(),
        text: data.text,
        mentions: mentionedUserIds,
        parentId: undefined
      });

      // 4. BEST EFFORT: Trigger notifications for mentioned users
      if (mentionedUserIds.length > 0) {
        this.notifyMentionedUsers(comment, mentionedUserIds).catch(err => 
          console.error("[NOTIFICATION_FAILED_SAFE]", { error: err.message })
        );
      }

      // 5. BEST EFFORT: Invalidate Cache
      await this.invalidateCache(data.contentId).catch(err => 
        console.error("[CACHE_INVALIDATE_FAILED_SAFE]", { error: err.message })
      );

      // 6. BEST EFFORT: Emit Real-Time event
      try {
        CommentEventEmitter.emitCommentCreated(data.contentId, {
          commentId: comment.id,
          contentId: comment.contentId,
          text: comment.text,
          authorId: comment.authorId,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString()
        });
      } catch (socketErr) {
        console.error("[SOCKET_EMIT_FAILED_SAFE]", socketErr);
      }

      // 7. Return response
      return comment;
    } catch (repoError: any) {
      console.error("[COMMENT_CREATION_FAILED]", { error: repoError.message, contentId: data.contentId });
      throw new Error('Failed to persist comment in repository.');
    }
  }

  /**
   * Reply creation logic linking a new comment to an existing parent.
   */
  static async replyToComment(parentId: string, data: { contentId: string; authorId: string; text: string }): Promise<Comment> {
    
    // 1. ID Normalization
    const safeParentId = safeObjectId(parentId);
    const safeContentId = safeObjectId(data.contentId);
    if (!safeParentId || !safeContentId) throw new Error('Invalid ID formats for reply.');

    // 2. Verify parent existence
    const parent = await CommentRepository.findById(parentId);
    if (!parent) throw new Error('Parent comment not found.');

    // 3. Parse mentions
    const mentionedUserIds = await this.parseMentions(data.text);

    // 4. Persist the threaded reply (MUST succeed)
    try {
      const reply = await CommentRepository.create({
        contentId: data.contentId,
        authorId: data.authorId,
        text: data.text,
        parentId: parentId,
        mentions: mentionedUserIds
      });

      // 5. BEST EFFORT: Notification for parent author
      if (parent.authorId !== data.authorId) {
        const commentPreview = (data.text || "your post").substring(0, 30);
        const commentSuffix = (data.text || "").length > 30 ? '...' : '';

        NotificationService.createNotification({
          userId: parent.authorId,
          actorId: data.authorId,
          type: 'reply',
          message: `replied to your comment: "${commentPreview}${commentSuffix}"`,
          metadata: { 
            contentId: data.contentId,
            commentId: reply.id 
          }
        }).catch(err => console.error("[NOTIFICATION_FAILED_SAFE]", { error: err.message }));
      }

      // 6. BEST EFFORT: Notify mentions
      if (mentionedUserIds.length > 0) {
        this.notifyMentionedUsers(reply, mentionedUserIds).catch(err => 
          console.error("[NOTIFICATION_FAILED_SAFE]", { error: err.message })
        );
      }

      // 7. BEST EFFORT: Invalidate Cache
      await this.invalidateCache(data.contentId).catch(err => 
        console.error("[CACHE_INVALIDATE_FAILED_SAFE]", { error: err.message })
      );

      // 8. BEST EFFORT: Emit Real-Time event
      try {
        CommentEventEmitter.emitCommentReplied(data.contentId, {
          commentId: reply.id,
          contentId: reply.contentId,
          parentId: reply.parentId,
          text: reply.text,
          authorId: reply.authorId,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString()
        });
      } catch (socketErr) {
        console.error("[SOCKET_EMIT_FAILED_SAFE]", socketErr);
      }

      // 9. Return response
      return reply;
    } catch (repoError: any) {
      console.error("[REPO_FAILURE_REPLY]", { error: repoError.message, parentId });
      throw new Error('Database failure during reply creation.');
    }
  }

  /**
   * Fetch and structure comment tree
   * Optimised with Cache-Aside pattern utilizing versioned Redis keys.
   */
  static async getCommentTree(contentId: string): Promise<any[]> {
    if (!safeObjectId(contentId)) throw new Error('Invalid contentId for tree resolution.');
    
    const cacheKey = CacheKeys.commentTree(contentId);
    const lockKey = CacheKeys.commentLock(contentId);

    // 1. Attempt Cache HIT with Error Isolation
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        console.log(`[CACHE_HIT] contentId: ${contentId} | key: ${cacheKey}`);
        return JSON.parse(cached);
      }
      
      console.log(`[CACHE_MISS] contentId: ${contentId} | key: ${cacheKey}`);
    } catch (redisErr) {
      console.error(`[REDIS_DOWN] [CACHE_BYPASS] contentId: ${contentId} | error: ${redisErr}`);
    }

    // 2. Cache Stampede Protection: Acquire Distributed Lock
    let lockAcquired = false;
    try {
      const redis = await getRedisClient();
      // Lock for 10 seconds to allow rebuild, NX ensures only one acquires it
      const result = await redis.set(lockKey, 'locked', { NX: true, EX: 10 });
      
      if (result === 'OK') {
        lockAcquired = true;
        console.log(`[CACHE_LOCK_ACQUIRED] contentId: ${contentId} | key: ${lockKey}`);
      } else {
        console.log(`[CACHE_LOCK_SKIPPED] contentId: ${contentId} | key: ${lockKey} | path: wait_then_fallback`);
        // Wait briefly (1s) for the lock-holding request to finish rebuild
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-check cache after waiting
        const cachedAfterWait = await redis.get(cacheKey);
        if (cachedAfterWait) {
          console.log(`[CACHE_HIT] contentId: ${contentId} | key: ${cacheKey} (post-wait)`);
          return JSON.parse(cachedAfterWait);
        }
      }
    } catch (lockErr) {
      console.error(`[CACHE_ERROR] Lock operation failed, falling back to DB`, { contentId, error: lockErr });
    }

    // 3. Rebuild Logic - Only reach here if MISS and (I have lock OR wait failed)
    try {
      const flatComments = await CommentRepository.findByContentId(contentId);
      const commentMap: Record<string, any> = {};
      const tree: any[] = [];

      flatComments.forEach(comment => {
        commentMap[comment.id] = { ...comment, children: [] };
      });

      flatComments.forEach(comment => {
        if (comment.parentId && commentMap[comment.parentId]) {
          commentMap[comment.parentId].children.push(commentMap[comment.id]);
        } else {
          tree.push(commentMap[comment.id]);
        }
      });

      // 4. Update Cache (Only if I acquired the lock)
      if (lockAcquired) {
        const redis = await getRedisClient();
        await redis.set(cacheKey, JSON.stringify(tree), {
          EX: CACHE_CONFIG.TTL.COMMENT_TREE
        });
        console.log(`[CACHE_WRITE] contentId: ${contentId} | key: ${cacheKey} | ttl: ${CACHE_CONFIG.TTL.COMMENT_TREE}s`);
      }

      return tree;
    } catch (err) {
      console.error(`[DB_FALLBACK_FAILURE] contentId: ${contentId}`, err);
      throw err;
    } finally {
      // 5. Always release lock if I was the one who acquired it
      if (lockAcquired) {
        try {
          const redis = await getRedisClient();
          await redis.del(lockKey);
        } catch (releaseErr) {
          console.error(`[CACHE_ERROR] Failed to release lock: ${lockKey}`, releaseErr);
        }
      }
    }
  }

  /**
   * Resolve usernames to IDs
   */
  static async parseMentions(text: string): Promise<string[]> {
    return parseMentions(text);
  }

  /**
   * Helper for notifications
   */
  private static async notifyMentionedUsers(comment: Comment, userIds: string[]) {
    await Promise.all(userIds.map(userId => 
      NotificationService.createNotification({
        userId,
        actorId: comment.authorId,
        type: 'mention',
        message: `mentioned you in a comment: "${comment.text.substring(0, 30)}${comment.text.length > 30 ? '...' : ''}"`,
        metadata: { 
          contentId: comment.contentId,
          commentId: comment.id 
        }
      }).catch(err => console.error("[NOTIFICATION_DISPATCH_FAILED]", { userId, error: err.message }))
    ));
  }

  /**
   * Resolve specific comment
   */
  static async getCommentById(id: string): Promise<Comment | null> {
    if (!safeObjectId(id)) return null;
    return await CommentRepository.findById(id);
  }

  /**
   * Fetch recent comments by user for their activity feed
   */
  static async getUserActivities(userId: string): Promise<Comment[]> {
    if (!safeObjectId(userId)) return [];
    return await CommentRepository.findByAuthorId(userId);
  }

  /**
   * Edit comment text
   */
  static async editComment(id: string, text: string): Promise<Comment | null> {
    if (!safeObjectId(id)) throw new Error('Invalid commentId for edit.');
    
    // 1. DB Write (MUST succeed)
    const updated = await CommentRepository.update(id, { text });
    
    if (updated) {
      // 2. BEST EFFORT: Invalidate Cache
      await this.invalidateCache(updated.contentId).catch(err => 
        console.error("[CACHE_INVALIDATE_FAILED_SAFE]", { error: err.message })
      );

      // 3. BEST EFFORT: Emit Real-Time event
      try {
        CommentEventEmitter.emitCommentUpdated(updated.contentId, {
          commentId: updated.id,
          contentId: updated.contentId,
          text: updated.text,
          authorId: updated.authorId,
          updatedAt: updated.updatedAt.toISOString()
        });
      } catch (socketErr) {
        console.error("[SOCKET_EMIT_FAILED_SAFE]", socketErr);
      }
    }
    
    return updated;
  }

  /**
   * Delete comment
   */
  static async deleteComment(id: string): Promise<boolean> {
    if (!safeObjectId(id)) throw new Error('Invalid commentId for deletion.');
    
    // 1. Fetch to get contentId
    const comment = await CommentRepository.findById(id);
    if (!comment) return false;

    // 2. DB Delete (MUST succeed)
    const deleted = await CommentRepository.delete(id);
    
    if (deleted) {
      // 3. BEST EFFORT: Invalidate Cache
      await this.invalidateCache(comment.contentId).catch(err => 
        console.error("[CACHE_INVALIDATE_FAILED_SAFE]", { error: err.message })
      );

      // 4. BEST EFFORT: Emit Real-Time event
      try {
        CommentEventEmitter.emitCommentDeleted(comment.contentId, {
          commentId: comment.id,
          contentId: comment.contentId,
          authorId: comment.authorId
        });
      } catch (socketErr) {
        console.error("[SOCKET_EMIT_FAILED_SAFE]", socketErr);
      }
    }
    
    return deleted;
  }

  /**
   * Toggle like on a comment
   */
  static async toggleLike(commentId: string, userId: string): Promise<void> {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    await CommentRepository.toggleLike(commentId, userId);

    // Invalidate cache so the like count updates in the UI for other users
    await this.invalidateCache(comment.contentId).catch(err => 
      console.error("[CACHE_INVALIDATE_FAILED_SAFE]", { error: err.message })
    );

    // Real-time: Notify users in the content room
    try {
      // Re-fetch to get updated count
      const updated = await CommentRepository.findById(commentId);
      if (updated) {
        CommentEventEmitter.emitCommentLiked(comment.contentId, commentId, userId, updated.likes.length);
      }
    } catch (socketErr) {
       console.error("[SOCKET_EMIT_FAILED_SAFE] COMMENT_LIKED", socketErr);
    }
  }

  /**
   * Helper to invalidate the threaded tree cache
   */
  private static async invalidateCache(contentId: string) {
    const cacheKey = CacheKeys.commentTree(contentId);
    try {
      const redis = await getRedisClient();
      await redis.del(cacheKey);
      console.log(`[CACHE_INVALIDATE] contentId: ${contentId} | key: ${cacheKey}`);
    } catch (err) {
      console.error(`[REDIS_DOWN] [CACHE_BYPASS_REDIS] contentId: ${contentId} | error: ${err}`);
    }
  }
}
