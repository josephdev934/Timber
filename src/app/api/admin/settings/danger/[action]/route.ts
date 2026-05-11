import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { PlatformSettingsService } from '@/application/services/admin/PlatformSettingsService';

/**
 * ==========================================
 * ADMIN API - POST /api/admin/settings/danger/:action
 * ==========================================
 * Handles emergency and destructive platform operations.
 * ==========================================
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const { action } = await params;

    switch (action) {
      case 'wipe-data':
        await PlatformSettingsService.wipeTestData(adminId);
        return NextResponse.json({ success: true, message: "Recent test data wiped successfully" });
        
      case 'force-disconnect':
        await PlatformSettingsService.forceDisconnectAll(adminId);
        return NextResponse.json({ success: true, message: "All users forcefully disconnected" });
        
      case 'clear-redis':
        await PlatformSettingsService.clearRedis(adminId);
        return NextResponse.json({ success: true, message: "Redis cache completely cleared" });
        
      default:
        return NextResponse.json({ error: "Invalid danger action" }, { status: 400 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
