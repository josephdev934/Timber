import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { MediaModel } from '@/infrastructure/db/models/Media';
import { PostModel } from '@/infrastructure/db/models/Post';
import { MessageModel } from '@/infrastructure/db/models/Message';
import { CloudinaryService } from '@/infrastructure/external/CloudinaryService';
import { connectToDatabase } from '@/infrastructure/db/connect';

export async function GET(req: NextRequest) {
  try {
    await protectRoute(req, ['admin']);
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const type = searchParams.get('type') || 'all'; 
    const search = searchParams.get('search') || '';
    const dateRange = searchParams.get('dateRange') || 'all';

    // 1. Build Date Query
    const dateQuery: any = {};
    if (dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        dateQuery.$gte = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateRange === 'last30') {
        dateQuery.$gte = new Date(now.setDate(now.getDate() - 30));
      }
    }

    // 1. Fetch from Media collection
    const mediaQuery: any = {};
    if (type !== 'all') mediaQuery.type = type;
    if (dateQuery.$gte) mediaQuery.createdAt = dateQuery;

    const mediaItems = await MediaModel.find(mediaQuery)
      .sort({ createdAt: -1 })
      .limit(page * limit)
      .populate('uploaderId', 'name username profilePhoto')
      .lean();

    // 2. Fetch from Posts
    const postQuery: any = {};
    if (type === 'image' || type === 'all') {
      postQuery.images = { $not: { $size: 0 } };
    } else if (type === 'video') {
      postQuery.video = { $exists: true, $ne: null };
    }
    if (dateQuery.$gte) postQuery.createdAt = dateQuery;

    const postMedia = await PostModel.find(postQuery)
      .sort({ createdAt: -1 })
      .limit(page * limit)
      .populate('author', 'name username profilePhoto')
      .lean();

    // 3. Fetch from Messages
    const messageQuery: any = { mediaUrl: { $exists: true, $ne: null } };
    if (type !== 'all') messageQuery.mediaType = type;
    if (dateQuery.$gte) messageQuery.createdAt = dateQuery;

    const messageMedia = await MessageModel.find(messageQuery)
      .sort({ createdAt: -1 })
      .limit(page * limit)
      .populate('senderId', 'name username profilePhoto')
      .lean();

    // 4. Transform and Combine
    let allMedia: any[] = [
      ...mediaItems.map(m => ({
        id: m._id,
        url: m.url,
        type: m.type,
        uploaderId: m.uploaderId,
        createdAt: m.createdAt,
        size: m.size,
        isFlagged: m.isFlagged,
        source: 'Media'
      })),
      ...postMedia.flatMap(p => [
        ...(p.images || []).map((url: string, i: number) => ({
          id: `${p._id}_img_${i}`,
          url,
          type: 'image',
          uploaderId: p.author,
          createdAt: p.createdAt,
          isFlagged: p.isFlagged,
          source: 'Post'
        })),
        ...(p.video ? [{
          id: `${p._id}_vid`,
          url: p.video,
          type: 'video',
          uploaderId: p.author,
          createdAt: p.createdAt,
          isFlagged: p.isFlagged,
          source: 'Post'
        }] : [])
      ]),
      ...messageMedia.map(m => ({
        id: m._id,
        url: m.mediaUrl,
        type: m.mediaType || 'image',
        uploaderId: m.senderId,
        createdAt: m.createdAt,
        isFlagged: (m as any).isFlagged,
        source: 'Message'
      }))
    ];

    // 5. Apply Search (on combined results)
    if (search) {
      const regex = new RegExp(search, 'i');
      allMedia = allMedia.filter(m => 
        regex.test(m.uploaderId?.name || '') || 
        regex.test(m.uploaderId?.username || '')
      );
    }

    // 6. Global Sort and Paginate
    allMedia.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Calculate total BEFORE slicing
    const filteredTotal = allMedia.length;

    const offset = (page - 1) * limit;
    const paginatedMedia = allMedia.slice(offset, offset + limit);

    // 7. Global Display Count (Only show Cloudinary total when no filters are active)
    let displayTotal = filteredTotal;
    if (type === 'all' && dateRange === 'all' && !search) {
      try {
        const usageData = await CloudinaryService.getUsageStats();
        displayTotal = usageData.totalAssets;
      } catch (err) {
        console.warn("[CLOUDINARY_STATS_FETCH_FAILED]", err);
      }
    }

    return NextResponse.json({
      media: paginatedMedia,
      pagination: {
        total: displayTotal,
        page,
        limit,
        totalPages: Math.ceil(displayTotal / limit)
      }
    });

  } catch (err: any) {
    console.error("[ADMIN_MEDIA_GET_FAILED]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
