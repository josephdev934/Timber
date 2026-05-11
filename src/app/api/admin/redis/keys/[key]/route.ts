import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { getRedisClient } from '@/infrastructure/redis/redisClient';
import { AuditLogService } from '@/application/services/admin/AuditLogService';

/**
 * ==========================================
 * ADMIN API - DELETE /api/admin/redis/keys/:key
 * ==========================================
 * Manually invalidates a specific Redis cache key.
 * ==========================================
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { userId: adminId } = await protectRoute(req, ['admin']);
    const { key } = await params;

    if (!key) {
      return NextResponse.json({ error: "Key parameter is required" }, { status: 400 });
    }

    const redis = await getRedisClient();
    const deletedCount = await redis.del(key);

    if (deletedCount > 0) {
      await AuditLogService.log({
        adminId,
        action: 'CHANGE_SETTINGS',
        targetType: 'Platform',
        targetId: 'redis',
        metadata: { action: 'INVALIDATE_CACHE_KEY', key }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: deletedCount > 0 ? `Key '${key}' invalidated` : `Key '${key}' not found`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
