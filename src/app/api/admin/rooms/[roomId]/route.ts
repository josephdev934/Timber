import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { socketServer } from '@/infrastructure/socket/socketServer';
import { UserModel } from '@/infrastructure/db/models/User';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/rooms/:roomId
 * ==========================================
 * Fetches the current connected users in a specific Socket.IO room.
 * ==========================================
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await protectRoute(req, ['admin']);

    const { roomId } = await params;
    const io = socketServer.getIO();

    if (!io) {
      return NextResponse.json({ error: "Socket.IO server not running" }, { status: 500 });
    }

    // 1. Fetch all sockets currently in this room
    const sockets = await io.in(roomId).fetchSockets();

    // 2. Extract user IDs by checking their private 'user:<id>' room memberships
    const userIds = new Set<string>();
    for (const socket of sockets) {
      for (const room of Array.from(socket.rooms)) {
        if (room.startsWith('user:')) {
          userIds.add(room.replace('user:', ''));
        }
      }
    }

    // 3. Fetch user details from DB
    await connectToDatabase();
    const users = await UserModel.find({ _id: { $in: Array.from(userIds) } })
      .select('name username profilePhoto')
      .lean();

    return NextResponse.json({
      roomId,
      totalSockets: sockets.length,
      identifiedUsers: users,
      anonymousSockets: sockets.length - userIds.size
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
