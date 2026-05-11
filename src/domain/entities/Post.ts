/**
 * ==========================================
 * DOMAIN LAYER - POST ENTITY
 * ==========================================
 * Pure abstract definition of a social feed Post.
 * ==========================================
 */

export interface Post {
  id: string; // Unique identifier for the timeline post
  author: string; // ID of the User who published it
  content: string; // The textual body of the social post
  media: any[]; // List of attached media (images/videos) represented agnostically
  images?: string[]; // Cloudinary image URLs
  video?: string; // Cloudinary video URL
  likes: string[]; // List of user IDs who liked the post
  likeCount: number; // Cache count for likes
  commentCount: number; // Cache count for comments
  createdAt: Date; // When the post was published
  updatedAt: Date; // When the post was last edited
}
