import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { PlatformSettingsService } from '@/application/services/admin/PlatformSettingsService';

/**
 * ==========================================
 * ADMIN API - PATCH /api/admin/settings/:section
 * ==========================================
 * Handles updates for general, features, rateLimits, and maintenance.
 * ==========================================
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section: sectionRaw } = await params;
    const { userId: adminId } = await protectRoute(req, ['admin']);
    
    // Map URL parameter to valid section names
    const sectionMap: Record<string, 'general' | 'features' | 'rateLimits' | 'maintenance'> = {
      'general': 'general',
      'features': 'features',
      'rate-limits': 'rateLimits',
      'maintenance': 'maintenance'
    };

    const section = sectionMap[sectionRaw];
    if (!section) {
      return NextResponse.json({ error: "Invalid settings section" }, { status: 400 });
    }

    const body = await req.json();

    const updatedSettings = await PlatformSettingsService.updateSettings(section, body, adminId);

    return NextResponse.json({ 
      success: true, 
      message: `${section} settings updated successfully`,
      settings: updatedSettings 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
