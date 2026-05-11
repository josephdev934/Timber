import { PostModel } from '../db/models/Post';
import '../db/models/User'; // Ensure User model is registered before populate
import { Post } from '../../domain/entities/Post';
import { connectToDatabase } from '../db/connect';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - POST REPOSITORY
 * ==========================================
 * Handles persistence and retrieval for timeline posts.
 */
export class PostRepository {
  /**
   * Create a new post
   */
  static async create(data: Partial<Post>): Promise<Post> {
    await connectToDatabase();
    
    // Use explicit instantiation to ensure all fields (including images/video) are captured
    const doc = new PostModel({
      author: data.author,
      content: data.content,
      images: data.images || [],
      video: data.video || null,
      media: data.media || []
    });

    await doc.save();
    const populated = await doc.populate('author', 'name username profilePhoto');
    return this.mapToEntity(populated);
  }

  /**
   * Fetch all posts sorted by newest first
   */
  static async findAll(): Promise<any[]> {
    await connectToDatabase();
    // We use 'any' here because we want to populate author details
    const docs = await PostModel.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name username profilePhoto')
      .populate('authorId', 'name username profilePhoto');
    
    return docs.map(doc => this.mapToEntity(doc));
  }

  /**
   * Fetch all posts by a specific user sorted by newest first
   */
  static async findByAuthorId(authorId: string): Promise<any[]> {
    await connectToDatabase();
    const docs = await PostModel.find({ 
      $or: [
        { author: authorId },
        { authorId: authorId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('author', 'name username profilePhoto')
      .populate('authorId', 'name username profilePhoto');
    
    return docs.map(doc => this.mapToEntity(doc));
  }

  /**
   * Toggle a like for a post
   */
  static async toggleLike(postId: string, userId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    await connectToDatabase();
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Post not found");

    // Ensure likes array exists
    if (!post.likes) post.likes = [];

    // Safe comparison: Convert all to strings
    const likesStrings = post.likes.map((id: any) => id.toString());
    const currentlyLiked = likesStrings.includes(userId.toString());

    let updatedPost;
    if (currentlyLiked) {
      updatedPost = await PostModel.findByIdAndUpdate(
        postId, 
        { 
          $pull: { likes: userId },
          $inc: { likeCount: -1 }
        },
        { new: true }
      );
    } else {
      updatedPost = await PostModel.findByIdAndUpdate(
        postId, 
        { 
          $addToSet: { likes: userId },
          $inc: { likeCount: 1 }
        },
        { new: true }
      );
    }

    if (!updatedPost) throw new Error("Update failed");

    // Defensive: Ensure likeCount never goes negative
    if (updatedPost.likeCount < 0) {
      updatedPost.likeCount = 0;
      await updatedPost.save();
    }

    return {
      likesCount: updatedPost.likeCount,
      isLiked: !currentlyLiked
    };
  }

  /**
   * Find a post by ID
   */
  static async findById(postId: string): Promise<any | null> {
    await connectToDatabase();
    const doc = await PostModel.findById(postId)
      .populate('author', 'name username profilePhoto')
      .populate('authorId', 'name username profilePhoto');
    return doc ? this.mapToEntity(doc) : null;
  }

  /**
   * Delete a post
   */
  static async delete(postId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await PostModel.findByIdAndDelete(postId);
    return result !== null;
  }

  /**
   * Map DB doc to Domain Entity
   */
  private static mapToEntity(doc: any): any {
    // Backward compatibility: try new field name, then old field name
    const author = doc.author || doc.authorId || doc.get?.('authorId');
    const content = doc.content || doc.text || doc.get?.('text');

    let authorData: any;

    if (author && typeof author === 'object') {
      if (author._id) {
        // Populated User object
        authorData = {
          id: author._id.toString(),
          name: author.name || author.username || "Unknown",
          username: author.username || "unknown",
          avatar: author.profilePhoto || "/default-avatar.svg"
        };
      } else {
        // Unpopulated ObjectId object
        authorData = { id: author.toString() };
      }
    } else if (author) {
      // String ID
      authorData = { id: author.toString() };
    } else {
      // Missing author (e.g. deleted user)
      authorData = null;
    }

    return {
      id: doc._id.toString(),
      author: authorData,
      content: content,
      media: doc.media || [],
      images: (doc.images && doc.images.length > 0) 
        ? doc.images 
        : (doc.media || []).filter((m: any) => m.type === 'image' || m.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i)).map((m: any) => m.url || m),
      video: doc.video 
        ? doc.video 
        : (doc.media || []).find((m: any) => m.type === 'video' || m.url?.match(/\.(mp4|mov|webm)$/i))?.url || null,
      likes: (doc.likes || []).map((id: any) => id.toString()),
      likeCount: doc.likeCount || 0,
      commentCount: doc.commentCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}
