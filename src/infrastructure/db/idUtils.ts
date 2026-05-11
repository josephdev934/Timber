import mongoose, { Types } from 'mongoose';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - ID UTILITIES
 * ==========================================
 * Provides centralized verification and normalization for MongoDB ObjectIds.
 * Ensures the system never crashes due to MongoCastError during DB operations.
 * ==========================================
 */

/**
 * Checks if a string is a valid MongoDB ObjectId format.
 * Prevents Mongoose from trying to cast invalid hex strings.
 */
export function isValidObjectId(id: string | undefined | null): boolean {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Safely converts a string to a Mongoose ObjectId.
 * Returns null if the string is invalid instead of throwing a CastError.
 */
export function safeObjectId(id: string | undefined | null): Types.ObjectId | null {
  if (!id || !isValidObjectId(id)) {
    console.error("[INVALID_OBJECT_ID_NORMALIZATION]", { id });
    return null;
  }
  return new mongoose.Types.ObjectId(id);
}

/**
 * Validates multiple IDs at once. Returns false if ANY are invalid.
 */
export function areValidObjectIds(ids: (string | undefined | null)[]): boolean {
  return ids.every(id => isValidObjectId(id));
}
