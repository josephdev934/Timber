import { PostRepository } from '../../infrastructure/repositories/PostRepository';
import { Post } from '../../domain/entities/Post';
import { PostEventEmitter } from '../../infrastructure/socket/eventEmitter';
import { FeatureFlagService } from './admin/FeatureFlagService';

/**
 * ==========================================
 * APPLICATION LAYER - POST SERVICE
 * ==========================================
 */
export class PostService {
  /**
   * Create a new post from the UI
   */
  static async createPost(authorId: string, text: string, images: string[] = [], video?: string): Promise<Post> {
    if (!text?.trim() && images.length === 0 && !video) {
      throw new Error("Post content cannot be empty.");
    }

    if (images.length > 0 || video) {
      await FeatureFlagService.assertEnabled('mediaUploads');
    }
    
    const post = await PostRepository.create({
      author: authorId,
      content: text || "",
      media: [],
      images,
      video
    });

    // Real-time: Notify all clients
    PostEventEmitter.emitPostCreated(post);

    return post;
  }

  /**
   * Get the global timeline
   */
  static async getTimeline(): Promise<any[]> {
    return await PostRepository.findAll();
  }

  /**
   * Get posts for a specific user
   */
  static async getUserPosts(userId: string): Promise<any[]> {
    return await PostRepository.findByAuthorId(userId);
  }

  /**
   * Toggle like on a post
   */
  static async toggleLike(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const result = await PostRepository.toggleLike(postId, userId);
    
    // Real-time: Notify all clients
    PostEventEmitter.emitPostLiked(postId, userId, result.likesCount);

    // NOTIFICATION: Notify post author if liked (not unliked)
    if (result.isLiked) {
      try {
        const post = await PostRepository.findById(postId);
        const authorId = post.author?.id || post.author;
        
        if (authorId && authorId.toString() !== userId) {
          const { NotificationService } = await import('./NotificationService');
          await NotificationService.createNotification({
            userId: authorId.toString(),
            actorId: userId,
            type: 'reaction',
            message: `liked your post: "${(post.content || '').substring(0, 20)}..."`,
            metadata: { contentId: postId }
          });
        }
      } catch (err) {
        console.warn("[NOTIFICATION_LIKE_FAILED_SAFE]", err);
      }
    }

    return result;
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await PostRepository.findById(postId);
    if (!post) throw new Error("Post not found");
    
    // Authorize
    if (post.author?.id !== userId && post.author !== userId) {
      throw new Error("UNAUTHORIZED: Only the author can delete this post.");
    }

    return await PostRepository.delete(postId);
  }
}
