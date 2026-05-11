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
 * Throws an error if any required variable is missing.
 */
const loadEnv = (): EnvConfig => {
  console.log("[ENV_LOAD] process.env keys:", Object.keys(process.env).filter(k => k.includes('MONGODB') || k.includes('CLOUDINARY')));
  // 1. Extract values from process.env (The ONLY place allowed to do so)
  const MONGODB_URI = process.env.MONGODB_URI;
  const JWT_SECRET = process.env.JWT_SECRET;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  
  // 2. Handle Optional Variables with Defaults
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const SALT_ROUNDS_RAW = process.env.SALT_ROUNDS || '10';
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

  // 3. Strict Validation for Required Variables
  if (!MONGODB_URI) {
    // Fail-fast if critical database configuration is missing
    throw new Error('❌ FATAL: Missing environment variable MONGODB_URI');
  }

  if (!JWT_SECRET) {
    // Fail-fast if security configuration is missing
    throw new Error('❌ FATAL: Missing environment variable JWT_SECRET');
  }

  if (!APP_URL) {
    // Fail-fast if application routing configuration is missing
    throw new Error('❌ FATAL: Missing environment variable NEXT_PUBLIC_APP_URL');
  }

  // 4. Transform and Finalize types
  const SALT_ROUNDS = parseInt(SALT_ROUNDS_RAW, 10);

  // 5. Construct and return the frozen configuration object
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

// Execute validation and export a single, read-only configuration object
export const env = loadEnv();
