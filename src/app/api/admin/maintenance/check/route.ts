import { NextRequest, NextResponse } from 'next/server';
import { MaintenanceService } from '@/application/services/admin/MaintenanceService';

/**
 * ==========================================
 * INTERNAL API - /api/admin/maintenance/check
 * ==========================================
 * Provides maintenance status for the middleware.
 * Uses the standard Node.js runtime for Redis compatibility.
 * ==========================================
 */
export async function GET(req: NextRequest) {
  try {
    const status = await MaintenanceService.isEnabled();
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
