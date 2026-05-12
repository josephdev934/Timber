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

// Use the validated environment config
const pusherConfig = {
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.PUSHER_CLUSTER,
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
