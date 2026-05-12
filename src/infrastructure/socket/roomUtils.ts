/**
 * ==========================================
 * INFRASTRUCTURE LAYER - SOCKET ROOM UTILS
 * ==========================================
 * Single source of truth for Socket.IO room naming.
 * Hardened to handle various ID types (string, ObjectId, wrapped objects).
 * ==========================================
 */

/**
 * Normalizes any input into a clean string ID.
 * Handles: 
 * - string ("69df...")
 * - MongoDB ObjectId
 * - Wrapped object { contentId: "..." } or { id: "..." }
 */
function normalizeId(input: any): string {
  if (input === null || input === undefined) {
    throw new Error("[ID_NORMALIZATION_ERROR] Input is null or undefined");
  }

  // 1. If it's already a string, return it trimmed
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("[ID_NORMALIZATION_ERROR] Empty string provided");
    return trimmed;
  }

  // 2. If it's a MongoDB ObjectId (has toString and looks like one)
  // Check specifically for mongoose-like ObjectIds
  if (input._bsontype === 'ObjectId' || (input.toString && typeof input.toString === 'function' && input.toString().length === 24)) {
    return input.toString();
  }

  // 3. If it's an object, try to extract common ID fields
  if (typeof input === 'object') {
    const extracted = input.contentId || input.id || input._id;
    if (extracted) {
      // Recursively normalize the extracted value
      return normalizeId(extracted);
    }
  }

  // 4. Fallback to String coercion if it's not a complex object
  const finalId = String(input);
  if (finalId === "[object Object]" || finalId.trim() === "") {
    throw new Error(`[ID_NORMALIZATION_ERROR] Could not normalize input: ${JSON.stringify(input)}`);
  }

  return finalId.trim();
}

/**
 * Standardize content-specific room IDs.
 * Format: content:${contentId}
 */
export function buildContentRoom(contentId: any): string {
  try {
    const id = normalizeId(contentId);

    // Prevent double prefix (safely check if it's a string first, though normalizeId guarantees it)
    if (typeof id === 'string' && id.startsWith("content_")) {
      // If it's "content_content_id", we want to strip the extras
      return `content_${id.replace(/^content_/, '').replace(/^content_/, '')}`;
    }

    return `content_${id}`;
  } catch (err: any) {
    console.error(`[ROOM_ERROR] Failed to build content room: ${err.message}`, { input: contentId });
    throw err;
  }
}

/**
 * Standardize user-specific notification room IDs.
 * Format: user:${userId}
 */
export function buildUserRoom(userId: any): string {
  try {
    const id = normalizeId(userId);

    if (typeof id === 'string' && id.startsWith("user_")) {
      return `user_${id.replace(/^user_/, '')}`;
    }
    return `user_${id}`;
  } catch (err: any) {
    console.error(`[ROOM_ERROR] Failed to build user room: ${err.message}`, { input: userId });
    throw err;
  }
}

/**
 * Standardize chat-specific room IDs.
 * Format: chat:${chatId}
 */
export function buildChatRoom(chatId: any): string {
  try {
    const id = normalizeId(chatId);

    if (typeof id === 'string' && id.startsWith("chat_")) {
      return `chat_${id.replace(/^chat_/, '')}`;
    }
    return `chat_${id}`;
  } catch (err: any) {
    console.error(`[ROOM_ERROR] Failed to build chat room: ${err.message}`, { input: chatId });
    throw err;
  }
}
