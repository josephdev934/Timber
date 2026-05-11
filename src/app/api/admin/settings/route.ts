import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { PlatformSettingsService } from '@/application/services/admin/PlatformSettingsService';

/**
 * ==========================================
 * ADMIN API - GET /api/admin/settings
 * ==========================================
 * Fetches the global platform configuration singleton.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);

    const settings = await PlatformSettingsService.getSettings();

    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
