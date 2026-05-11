/**
 * ==========================================
 * PRESENTATION LAYER - /api/comments
 * ==========================================
 * Thin Next.js API route to delegate to CommentService.
 * Validates session context, input integrity, and ObjectId formats.
 * ==========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { CommentService } from '@/application/services/CommentService';
import { isValidObjectId } from '@/infrastructure/db/idUtils'; // Import validation helper

/**
 * Handle POST - Create a comment or reply with strict validation
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const authContext = await protectRoute(req);
    
    // 2. Parse and normalize body data
    const body = await req.json();
    const contentId = body.contentId?.trim();
    const text = body.text?.trim();
    const parentId = body.parentId?.trim();

    // 3. Reject missing or empty required fields
    if (!contentId || !text) {
      return NextResponse.json({ 
        error: 'Missing required fields: contentId and text are mandatory.',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // 4. Validate ObjectId formats to prevent database casting errors
    if (!isValidObjectId(contentId)) {
      console.error("[INVALID_ID_ATTEMPT]", { contentId, type: 'contentId' });
      return NextResponse.json({ 
        error: 'The provided contentId is not a valid MongoDB ObjectId.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    if (parentId && !isValidObjectId(parentId)) {
      console.error("[INVALID_ID_ATTEMPT]", { parentId, type: 'parentId' });
      return NextResponse.json({ 
        error: 'The provided parentId is not a valid MongoDB ObjectId.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 5. Delegate to domain service logic
    let comment;
    try {
      if (parentId) {
        comment = await CommentService.replyToComment(parentId, {
          contentId,
          text,
          authorId: authContext.userId
        });
      } else {
        comment = await CommentService.createComment({
          contentId,
          text,
          authorId: authContext.userId
        });
      }
    } catch (serviceError: any) {
      console.error("[COMMENT_CREATION_FAILED]", { error: serviceError.message, contentId });
      return NextResponse.json({ 
        error: serviceError.message || 'Failed to create comment.',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    return NextResponse.json({ comment }, { status: 201 });

  } catch (error: any) {
    console.error("[API_ERROR_COMMENTS_POST]", error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during comment creation.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * Handle GET - Fetch comment tree for a specific content reference
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Resolve and normalize content unique ID from query parameters
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId')?.trim();

    // 2. Validate mandatory context
    if (!contentId) {
      return NextResponse.json({ 
        error: 'Missing contentId query parameter.',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // 3. Hardened ObjectId check
    if (!isValidObjectId(contentId)) {
      return NextResponse.json({ 
        error: 'Invalid contentId format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 4. Resolve the nested tree structure from the application service
    const tree = await CommentService.getCommentTree(contentId);

    return NextResponse.json({ comments: tree }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_COMMENTS_GET]", error);
    return NextResponse.json({ 
      error: 'Failed to retrieve comment tree.',
      code: 'DB_ERROR'
    }, { status: 500 });
  }
}
