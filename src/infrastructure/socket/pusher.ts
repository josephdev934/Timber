import Pusher from 'pusher';
import { env } from '../../config/env';

/**
 * ==========================================
 * INFRASTRUCTURE LAYER - PUSHER SERVER
 * ==========================================
 * Singleton Pusher instance for server-side event triggering.
 * Designed for serverless environments.
 * ==========================================
 */

// These will be loaded from your Netlify Environment Variables
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
};

let pusherInstance: Pusher | null = null;

export const getPusherServer = () => {
  if (!pusherInstance) {
    if (!pusherConfig.appId || !pusherConfig.key || !pusherConfig.secret) {
      console.warn("[PUSHER_CONFIG_MISSING] Pusher credentials not found. Real-time features will be disabled.");
      return null;
    }
    pusherInstance = new Pusher(pusherConfig);
  }
  return pusherInstance;
};
