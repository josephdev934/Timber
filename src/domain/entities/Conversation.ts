/**
 * ==========================================
 * DOMAIN LAYER - CONVERSATION ENTITY
 * ==========================================
 * Represents the context container for messaging threads.
 * Pure interface, NO external ORM couplings.
 * ==========================================
 */

export interface Conversation {
  id: string; // System-agnostic unique identifier
  type: 'private' | 'group'; // Differentiates 1-on-1 chats from multi-user groups
  name?: string; // Group name (required for groups, absent for private chats)
  groupPhoto?: string; // Group photo avatar
  groupPhotoUpdatedBy?: string; // Audit: user ID who updated the photo
  groupPhotoUpdatedAt?: Date; // Audit: timestamp of the photo update
  createdBy?: string; // User ID of the group creator/owner
  participants: string[]; // List of generic User IDs involved
  removedParticipants?: string[]; // Users who were removed by an admin
  hiddenBy?: string[]; // Users who deleted the chat locally
  createdAt: Date; // Flow timestamp recording when the conversation began
  updatedAt: Date; // Latest activity timestamp
}
