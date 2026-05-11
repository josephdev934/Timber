import mongoose from "mongoose";
import { env } from "../../config/env";

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - DB CONNECTION
 * ==========================================
 * Handles connectivity to MongoDB. Part of the Infrastructure layer since
 * it deals with external systems/databases.
 * 
 * Uses Mongoose for ORM mappings.
 * implements caching to prevent multiple connections in serverless Next.js.
 * ==========================================
 */

// Define connection cache structure
interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend global safely (without polluting namespace)
const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseGlobal;
};

// Retrieve cached connection if it exists
let cached: MongooseGlobal = globalWithMongoose.mongoose as MongooseGlobal;

// Initialize cache if not present
if (!cached) {
  cached = globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connects to MongoDB, reusing existing connection if available.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If connection already exists, reuse it
  if (cached.conn) {
    return cached.conn;
  }

  // Ensure environment variable is set from our centralized config
  const MONGODB_URI = env.MONGODB_URI;

  // Create connection promise if it doesn't exist
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if cluster is unreachable
      socketTimeoutMS: 45000,         // Close sockets after 45s
    });
  }

  try {
    // Await and cache the connection
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on failure to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
