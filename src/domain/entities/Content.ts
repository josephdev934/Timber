/**
 * ==========================================
 * DOMAIN LAYER - CONTENT ENTITY
 * ==========================================
 * Represents a generic collaboratively edited document or main content body.
 * Pure interface, NO database dependencies.
 * ==========================================
 */

export interface Content {
  id: string; // System-agnostic unique identifier
  title: string; // The title of the document or content
  body: string; // The textual body, possibly parsed as markdown or rich text
  createdBy: string; // ID of the User who authored this content
  createdAt: Date; // Timestamp indicating when content was created
  updatedAt: Date; // Timestamp tracking the last modification
}
