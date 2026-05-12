import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/infrastructure/socket/pusher';
import { verifyToken } from '@/infrastructure/security/jwtUtils';

/**
 * ==========================================
 * API: /api/pusher/auth
 * ==========================================
 * Authorizes private Pusher channel subscriptions.
 * Verifies the user's JWT and then grants access to the requested channel.
 * ==========================================
 */

export async function POST(req: NextRequest) {
  try {
    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json({ error: "Pusher not configured" }, { status: 500 });
    }

    // 1. Extract Token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify User
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 3. Extract Pusher Auth Params
    // Pusher sends these as application/x-www-form-urlencoded by default
    const formData = await req.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    /**
     * SECURE CHANNEL VALIDATION
     * Here we could add logic to check if the user is actually in the chat.
     * For now, we'll authorize based on valid JWT.
     */
    
    const auth = pusher.authorizeChannel(socketId, channelName, {
      user_id: decoded.userId,
      user_info: {
        name: decoded.role // or other metadata
      }
    });

    return new NextResponse(JSON.stringify(auth), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error("[PUSHER_AUTH_ERROR]", err.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
