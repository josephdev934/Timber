import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { CloudinaryService } from '@/infrastructure/external/CloudinaryService';
import { MediaModel } from '@/infrastructure/db/models/Media';
import { PostModel } from '@/infrastructure/db/models/Post';
import { MessageModel } from '@/infrastructure/db/models/Message';
import { connectToDatabase } from '@/infrastructure/db/connect';

export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    // 1. Calculate platform counts
    const [mediaCount, postWithImages, postWithVideo, messageCount] = await Promise.all([
      MediaModel.countDocuments(),
      PostModel.countDocuments({ images: { $exists: true, $not: { $size: 0 } } }),
      PostModel.countDocuments({ video: { $exists: true, $ne: null } }),
      MessageModel.countDocuments({ mediaUrl: { $exists: true, $ne: null } })
    ]);

    const totalAssets = mediaCount + postWithImages + postWithVideo + messageCount;

    // 2. Fetch Cloudinary stats
    const usageData = await CloudinaryService.getUsageStats();

    const formatBytes = (bytes: any) => {
      if (!bytes || bytes <= 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      if (isNaN(i)) return '0 B';
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const stats = {
      storage: {
        used: usageData.storage,
        limit: usageData.storageLimit,
        used_human: formatBytes(usageData.storage),
        limit_human: formatBytes(usageData.storageLimit),
        percent: usageData.storageLimit > 0 ? Math.min(100, (usageData.storage / usageData.storageLimit) * 100) : 0,
        totalAssets: usageData.totalAssets
      },
      bandwidth: {
        used: usageData.bandwidth,
        limit: usageData.bandwidthLimit,
        used_human: formatBytes(usageData.bandwidth),
        limit_human: formatBytes(usageData.bandwidthLimit),
        percent: usageData.bandwidthLimit > 0 ? Math.min(100, (usageData.bandwidth / usageData.bandwidthLimit) * 100) : 0,
        totalAssets: usageData.totalAssets
      }
    };

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[STATS_API_ERROR]", {
      message: err.message,
      stack: err.stack,
      error: err
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
