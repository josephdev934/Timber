/**
 * ==========================================
 * INFRASTRUCTURE LAYER - CACHE KEYS
 * ==========================================
 * Centralized registry for all Redis cache keys.
 * Implements versioning to allow seamless cache invalidation 
 * across deployment cycles.
 * ==========================================
 */

export const CACHE_CONFIG = {
  VERSION: 'v1',
  TTL: {
    COMMENT_TREE: 60 * 10 // 10 minutes
  }
};

/**
 * Cache Key Generator
 */
export const CacheKeys = {
  
  /**
   * Generates key for the threaded comment tree of a specific content document.
   * Format: comments:tree:{version}:{contentId}
   */
  commentTree: (contentId: string) => `comments:tree:${CACHE_CONFIG.VERSION}:${contentId}`,

  /**
   * Distributed lock key for cache rebuilds.
   * Format: comments:lock:{contentId}
   */
  commentLock: (contentId: string) => `comments:lock:${contentId}`

};
