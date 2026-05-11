import { isValidObjectId } from "@/infrastructure/db/idUtils";

/**
 * ==========================================
 * APPLICATION LAYER - USER MAPPING UTILITY
 * ==========================================
 * Temporary bridge to map human-readable test IDs to valid MongoDB ObjectIds.
 * This allows the Frontend Test UI to function without a real Auth/User system.
 * ==========================================
 */

const FAKE_USER_MAP: Record<string, string> = {
  user1: "64f000000000000000000001",
  user2: "64f000000000000000000002",
  user3: "64f000000000000000000003",
};

/**
 * Safely resolves a user identifier.
 * 1. If it's a known alias (e.g. "user1"), returns the mapped ObjectId.
 * 2. If it's already a valid ObjectId, returns it as-is.
 * 3. Otherwise, throws an error to prevent DB casting crashes.
 */
export function resolveUserId(id: string): string {
  // 1. Check mapping
  if (FAKE_USER_MAP[id]) {
    return FAKE_USER_MAP[id];
  }

  // 2. Validate if it's already an ObjectId
  if (isValidObjectId(id)) {
    return id;
  }

  throw new Error(`[USER_MAPPING_ERROR] Identifier "${id}" is not a valid test alias or MongoDB ObjectId.`);
}
