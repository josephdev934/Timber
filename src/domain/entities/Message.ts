/**
 * ==========================================
 * DOMAIN LAYER - MESSAGE ENTITY
 * ==========================================
 * Shape of a private 1-1 message.
 * ==========================================
 */

export interface Message {
  id: string;
  chatId: string;      // Deterministic ID: sort(userA, userB).join("_")
  senderId: string;
  sender?: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  receiverId: string;
  text: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  mentions?: string[]; // Array of user IDs
  readBy: string[]; // List of user IDs who have seen this message
  mediaUrl?: string; // Cloudinary URL (image or video)
  mediaType?: 'image' | 'video'; // Type of media
  isSystemMessage?: boolean; // Flag for automated messages (e.g., "Admin removed John")
  createdAt: Date;
}
