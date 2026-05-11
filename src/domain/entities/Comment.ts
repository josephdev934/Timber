/**
 * ==========================================
 * DOMAIN LAYER - COMMENT ENTITY
 * ==========================================
 * Pure entity representing a comment. Supports recursive threading
 * and inline blocks without knowing how it will be saved.
 * ==========================================
 */

export interface Comment {
  id: string; // The unique identifier of this comment
  contentId: string; // ID of the referenced Content or Post
  authorId: string; // ID of the User who created the comment
  text: string; // The actual literal text of the comment
  parentId?: string; // Optional ID pointing to a parent Comment for threaded replies
  likes: string[]; // Array of User IDs who liked the comment
  author?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  mentions?: string[]; // Array of User IDs who were tagged in the text
  createdAt: Date; // Timestamp marking when the comment was authored
  updatedAt: Date; // Timestamp marking the last edit
}
