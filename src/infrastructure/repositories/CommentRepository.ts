/**
 * ==========================================
 * INFRASTRUCTURE LAYER - COMMENT REPOSITORY
 * ==========================================
 * Handles persistence and retrieval logic for threaded comments.
 * Uses Mongoose CommentModel and maps to Domain Comment Entities.
 * ==========================================
 */

import { CommentModel, ICommentDocument } from '../db/models/Comment';
import { PostModel } from '../db/models/Post';
import { Comment } from '../../domain/entities/Comment';
import { connectToDatabase } from '../db/connect';

export class CommentRepository {
  
  /**
   * Internal mapper to convert database documents to pure domain entities
   */
  private static mapToDomain(doc: any): Comment {
    const author = doc.authorId;
    let authorData: any;

    if (author && typeof author === 'object') {
      if (author._id) {
        // Populated
        authorData = {
          id: author._id.toString(),
          name: author.name,
          username: author.username,
          avatar: author.avatar
        };
      } else {
        // Unpopulated ObjectId object
        authorData = undefined; // We don't have full data
      }
    } else {
      // String or Null
      authorData = undefined;
    }

    return {
      id: doc._id.toString(),
      contentId: doc.contentId.toString(),
      authorId: author ? author.toString() : "unknown",
      author: authorData,
      text: doc.text,
      parentId: doc.parentId?.toString(),
      likes: (doc.likes || []).map((l: any) => l.toString()),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Persist a new comment or reply
   */
  static async create(data: Partial<Comment>): Promise<Comment> {
    await connectToDatabase();
    // Create the document using the Mongoose model
    const created = await CommentModel.create({
      contentId: data.contentId,
      authorId: data.authorId,
      text: data.text,
      parentId: data.parentId,
      mentions: data.mentions
    });

    // Update Post engagement stats
    await PostModel.findByIdAndUpdate(data.contentId, { $inc: { commentCount: 1 } });

    return this.mapToDomain(created);
  }

  /**
   * Resolve a single comment by ID
   */
  static async findById(id: string): Promise<Comment | null> {
    await connectToDatabase();
    try {
      const doc = await CommentModel.findById(id);
      return doc ? this.mapToDomain(doc) : null;
    } catch {
      return null;
    }
  }

  /**
   * Optimize: Fetch all comments for a specific piece of content in one query.
   * This prevents N+1 issues when building the tree in the service layer.
   */
  static async findByContentId(contentId: string): Promise<Comment[]> {
    await connectToDatabase();
    // Sort by createdAt to maintain historical ordering by default
    // We populate authorId here to get name/avatar/username for the UI
    const docs = await CommentModel.find({ contentId })
      .sort({ createdAt: 1 })
      .populate('authorId', 'name username avatar');
    
    return docs.map(doc => this.mapToDomain(doc));
  }

  /**
   * Fetch all comments by a specific user for the activity feed.
   */
  static async findByAuthorId(authorId: string): Promise<Comment[]> {
    await connectToDatabase();
    const docs = await CommentModel.find({ authorId })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name username avatar');
    
    return docs.map(doc => this.mapToDomain(doc));
  }

  /**
   * Toggle a like on a comment
   */
  static async toggleLike(commentId: string, userId: string): Promise<void> {
    await connectToDatabase();
    const comment = await CommentModel.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    // Safe comparison: Convert all to strings
    const likesStrings = (comment.likes || []).map((id: any) => id.toString());
    const isLiked = likesStrings.includes(userId.toString());

    if (isLiked) {
      await CommentModel.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
    } else {
      await CommentModel.findByIdAndUpdate(commentId, { $addToSet: { likes: userId } });
    }
  }

  /**
   * Update the text or metadata of an existing comment
   */
  static async update(id: string, updates: Partial<Comment>): Promise<Comment | null> {
    await connectToDatabase();
    const doc = await CommentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, lean: true }
    ) as ICommentDocument;
    
    return doc ? this.mapToDomain(doc) : null;
  }

  /**
   * Remove a comment and return success status
   */
  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    
    // Fetch comment to get contentId before deletion
    const comment = await CommentModel.findById(id);
    if (!comment) return false;

    const result = await CommentModel.findByIdAndDelete(id);
    
    if (result) {
      // Decrement post engagement stats
      await PostModel.findByIdAndUpdate(comment.contentId, { $inc: { commentCount: -1 } });
    }

    return result !== null;
  }

  /**
   * Count replies for a specific parent (can be used for UI labels)
   */
  static async countReplies(parentId: string): Promise<number> {
    await connectToDatabase();
    return await CommentModel.countDocuments({ parentId });
  }
}
