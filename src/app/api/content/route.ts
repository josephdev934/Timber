import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/infrastructure/db/connect';
import { ContentModel } from '@/infrastructure/db/models/Content';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * ==========================================
 * PRESENTATION LAYER - /api/content
 * ==========================================
 * Handles root content creation with input hardening.
 */

/**
 * Handle GET - Fetch content feed
 */
export async function GET() {
  try {
    await connectToDatabase();

    const content = await ContentModel.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json(content);
  } catch (error) {
    console.error('[API_ERROR_CONTENT_GET]:', error);
    return NextResponse.json({ 
      error: 'Internal Database Failure during content retrieval.', 
      code: 'DB_ERROR' 
    }, { status: 500 });
  }
}

/**
 * Handle POST - Create hardened document
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Authenticate and validate context
    const authContext = await protectRoute(req);
    if (!isValidObjectId(authContext.userId)) {
      return NextResponse.json({ error: 'Auth context contains invalid ID.', code: 'INVALID_OBJECT_ID' }, { status: 400 });
    }

    // 2. Normalize and sanitize inputs
    const bodyData = await req.json();
    const title = bodyData.title?.trim();
    const body = bodyData.body?.trim();

    // 3. Reject incomplete payloads
    if (!title || !body) {
      return NextResponse.json({ 
        error: 'Title and body are mandatory fields.', 
        code: 'MISSING_FIELDS' 
      }, { status: 400 });
    }

    // 4. Persistence
    const newContent = await ContentModel.create({
      title,
      body,
      createdBy: authContext.userId
    });

    return NextResponse.json(newContent, { status: 201 });
  } catch (error: any) {
    console.error('[API_ERROR_CONTENT_POST]:', error.message);
    const isUnauthorized = error.message.startsWith('UNAUTHORIZED');
    
    return NextResponse.json({ 
      error: isUnauthorized ? 'Authentication Required' : 'Failed to save new content.',
      code: isUnauthorized ? 'UNAUTHORIZED' : 'DB_ERROR'
    }, { status: isUnauthorized ? 401 : 500 });
  }
}
