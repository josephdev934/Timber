import { createClient } from 'redis';
import { env } from '../../config/env';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - REDIS CLIENT
 * ==========================================
 * Stabilized Redis client with exponential backoff, 
 * ECONNRESET handling, and singleton pattern for Next.js hot-reloading.
 * ==========================================
 */

type RedisClientType = ReturnType<typeof createClient>;

// Support Next.js Hot Reloading by attaching to the global object
declare global {
  var redisClientInstance: RedisClientType | undefined;
}

/**
 * Robust reconnect strategy with exponential backoff.
 * 100ms, 200ms, 400ms, 800ms, 1600ms, 3000ms... (capped at 5s)
 */
const reconnectStrategy = (retries: number) => {
  if (retries > 20) {
    console.error("🔴 Redis: Max retries reached. Service will continue without cache.");
    return new Error("Redis connection failed after 20 attempts");
  }
  const delay = Math.min(Math.pow(2, retries) * 100, 5000);
  console.warn(`🟡 Redis: Reconnecting in ${delay}ms (Attempt ${retries})...`);
  return delay;
};

const createNewClient = (): RedisClientType => {
  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy,
      connectTimeout: 10000,
      keepAlive: true,
    }
  });

  client.on('connect', () => console.log('🟢 Redis: Connecting...'));
  client.on('ready', () => console.log('🟢 Redis: Connected and ready to use.'));
  client.on('reconnecting', () => console.log('🟡 Redis: Reconnecting...'));
  client.on('error', (err) => {
    if (err.code === 'ECONNRESET') {
      console.error('🔴 Redis: Connection Reset (ECONNRESET). Reconnecting...');
    } else {
      console.error('🔴 Redis Error:', err);
    }
  });
  client.on('end', () => console.log('🔴 Redis: Connection closed.'));

  return client;
};

// Singleton initialization
if (!global.redisClientInstance) {
  global.redisClientInstance = createNewClient();
}

const redisClient = global.redisClientInstance;

/**
 * Safe client accessor with lazy connection.
 * Fail-safe: Returns null if connection fails instead of throwing.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error("🔴 Redis: Initial connection failed", err);
      // We still return the client; the library will handle reconnection based on strategy
    }
  }
  return redisClient;
}

export default redisClient;
