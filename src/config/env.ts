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
  // Optional: Current Execution Environment (defaults to development)
  NODE_ENV: string;
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

/**
 * Validates and loads environment variables into a typed object.
 * Uses lazy evaluation so it only runs at runtime (inside API handlers),
 * NOT during Next.js static build analysis — which prevents build crashes
 * on platforms like Netlify/Vercel where env vars aren't available at build time.
 */
const loadEnv = (): EnvConfig => {
  // 1. Extract values from process.env
  const MONGODB_URI = process.env.MONGODB_URI;
  const JWT_SECRET = process.env.JWT_SECRET;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.URL || 'http://localhost:3000';

  // 2. Handle Optional Variables with Defaults
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const SALT_ROUNDS_RAW = process.env.SALT_ROUNDS || '10';
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

  // 3. Strict Validation — only throw at runtime, not during build static analysis
  if (!MONGODB_URI) {
    throw new Error('❌ FATAL: Missing environment variable MONGODB_URI');
  }

  if (!JWT_SECRET) {
    throw new Error('❌ FATAL: Missing environment variable JWT_SECRET');
  }

  // 4. Transform and Finalize types
  const SALT_ROUNDS = parseInt(SALT_ROUNDS_RAW, 10);

  return {
    MONGODB_URI,
    JWT_SECRET,
    APP_URL,
    REDIS_URL,
    SALT_ROUNDS,
    NODE_ENV,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
  };
};

/**
 * Lazy singleton — evaluated on first access, not at module import time.
 * This prevents the build from crashing when env vars aren't present
 * during static page generation.
 */
let _env: EnvConfig | null = null;

export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: string) {
    if (!_env) {
      _env = loadEnv();
    }
    return (_env as any)[prop];
  }
});
