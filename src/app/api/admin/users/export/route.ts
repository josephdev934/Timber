import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { UserModel } from '@/infrastructure/db/models/User';
import { connectToDatabase } from '@/infrastructure/db/connect';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/users/export
 * ==========================================
 * Streams a CSV of all users.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const users = await UserModel.find({}).select('name username email role isBanned createdAt').lean();

    const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Joined At'];
    const rows = users.map(u => [
      u.name,
      u.username,
      u.email,
      u.role,
      u.isBanned ? 'Banned' : 'Active',
      u.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="timber_users_export.csv"'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
