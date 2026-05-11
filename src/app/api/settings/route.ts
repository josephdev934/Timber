import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { PlatformSettingsModel } from '@/infrastructure/db/models/PlatformSettings';

/**
 * ==========================================
 * PUBLIC API - GET /api/settings
 * ==========================================
 * Returns public-facing platform configuration.
 * (No sensitive data, just branding and status)
 * ==========================================
 */
export async function GET() {
  try {
    await connectToDatabase();
    const settings = await PlatformSettingsModel.findOne({ isSingleton: true }).lean();
    
    if (!settings) {
      return NextResponse.json({
        general: { platformName: 'Timber' },
        maintenance: { enabled: false }
      });
    }

    // Filter only public data
    return NextResponse.json({
      general: settings.general,
      maintenance: settings.maintenance,
      features: settings.features
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load platform settings" }, { status: 500 });
  }
}
