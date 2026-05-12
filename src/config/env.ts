import 'server-only';

/**
 * ==========================================
 * CONFIGURATION LAYER - ENVIRONMENT SETUP
 * ==========================================
 * This file centralizes all environment variable access.
 * It validates required variables at startup to prevent runtime crashes.
 * ALL environment access in the application must go through this export.
 * ==========================================
 */

// Define the interface for our application's validated configuration
export interface EnvConfig {
  // Required: MongoDB Connection String
  MONGODB_URI: string;
  // Required: JWT Signing Secret
  JWT_SECRET: string;
  // Required: The base URL of the application
  APP_URL: string;
  // Optional: Redis Connection String (defaults to localhost)
  REDIS_URL: string;
  // Optional: Password Hashing Salt Rounds (defaults to 10)
  SALT_ROUNDS: number;
  // Metadata
  NODE_ENV: string;
  // Optional: Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  // Pusher Configuration
  PUSHER_APP_ID: string;
  PUSHER_KEY: string;
  PUSHER_SECRET: string;
  PUSHER_CLUSTER: string;
}

/**
 * Loads and validates environment variables.
 *
 * Key behaviour: during `next build` (NEXT_PHASE = phase-production-build),
 * Next.js collects page data by importing all server modules — but real env
 * vars are NOT present yet. We detect this and return safe stub values so
 * the build can complete. Real validation only runs at request time.
 */
const loadEnv = (): EnvConfig => {
  // Detect if we are in the build phase (where some env vars might be missing)
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  const MONGODB_URI = process.env.MONGODB_URI || '';
  const JWT_SECRET = process.env.JWT_SECRET || '';
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.URL ||
    'http://localhost:3000';
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const CLOUDINARY_CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    '';
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
  
  // Pusher config
  const PUSHER_APP_ID = process.env.PUSHER_APP_ID || '';
  const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || '';
  const PUSHER_SECRET = process.env.PUSHER_SECRET || '';
  const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

  // Only throw during actual runtime — not during `next build`
  if (!isBuildPhase) {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
      console.warn("⚠️ [ENV_WARN] Pusher configuration is incomplete. Real-time features may be disabled.");
    }
  }

  return {
    MONGODB_URI,
    JWT_SECRET,
    APP_URL,
    REDIS_URL,
    SALT_ROUNDS,
    NODE_ENV,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    PUSHER_APP_ID,
    PUSHER_KEY,
    PUSHER_SECRET,
    PUSHER_CLUSTER,
  };
};

export const env = loadEnv();
