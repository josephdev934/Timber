/**
 * ==========================================
 * DOMAIN LAYER - USER ENTITY
 * ==========================================
 * This is a pure TypeScript interface representing the core business concept
 * of a User. It has ZERO dependencies on ORMs (like Mongoose), external 
 * database engines, or frameworks.
 * ==========================================
 */

export interface User {
  id: string; // Generic string ID instead of ObjectId to remain ORM-agnostic
  username: string; // The user's chosen display name
  name: string; // The user's real name
  email: string; // The user's contact email
  passwordHash: string; // Securely hashed password string
  role: 'user' | 'admin'; // Access control level
  profilePhoto?: string; // Optional URL linking to the user's avatar
  bio?: string; // Optional user biography
  createdAt: Date; // The timestamp when this user was created
}
