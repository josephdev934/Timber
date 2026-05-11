/**
 * ==========================================
 * DOMAIN LAYER - NOTIFICATION ENTITY
 * ==========================================
 * Abstract definition of a notification intended for a user.
 * ==========================================
 */

export interface Notification {
  id: string; // Notification unique ID
  userId: string; // The ID of the primary User receiving the alert
  actorId: string; // The ID of the user who triggered this alert
  actor?: {
    name: string;
    username: string;
    avatar: string;
  };
  type: 'mention' | 'reply' | 'comment_on_post' | 'message' | 'reaction' | 'system'; // Kind of notification
  category: 'social' | 'security' | 'transactional'; // Grouping for filtering
  message: string; // Descriptive text for the user
  metadata?: {
    contentId?: string;
    chatId?: string;
    commentId?: string;
    messageId?: string;
    link?: string;
  };
  isRead: boolean; // Tracking status
  createdAt: Date; // System creation timestamp
  updatedAt: Date; // System modification timestamp
}
