/**
 * ==========================================
 * PRESENTATION LAYER - /api/comments/[id]
 * ==========================================
 * Handles mutation and deletion of specific comments.
 * Ensures strict author/admin authorization and ID validation.
 * ==========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/infrastructure/security/authMiddleware';
import { CommentService } from '@/application/services/CommentService';
import { isValidObjectId } from '@/infrastructure/db/idUtils';

/**
 * Handle PUT - Edit existing comment text with guard layers
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await params;

    // 1. Validate ObjectId format for the target comment
    if (!isValidObjectId(commentId)) {
      return NextResponse.json({ 
        error: 'Invalid comment ID format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // 2. Authenticate user context
    const authContext = await protectRoute(req);
    
    // 3. Normalize and validate text input
    const body = await req.json();
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ 
        error: 'Comment text cannot be empty.',
        code: 'INVALID_INPUT'
      }, { status: 400 });
    }

    // 4. Fetch current comment state to check ownership
    const comment = await CommentService.getCommentById(commentId);
    if (!comment) {
      return NextResponse.json({ 
        error: 'The requested comment does not exist.',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 5. Authorization: Only author or admin allowed
    if (comment.authorId !== authContext.userId && authContext.role !== 'admin') {
      return NextResponse.json({ 
        error: 'You do not have permission to edit this comment.',
        code: 'UNAUTHORIZED'
      }, { status: 403 });
    }

    // 6. Delegate modification
    const updated = await CommentService.editComment(commentId, text);

    return NextResponse.json({ comment: updated }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_COMMENT_PUT]", error);
    return NextResponse.json({ 
      error: 'An internal error occurred while updating the comment.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * Handle DELETE - Remove a comment with identity verification
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: commentId } = await params;

    // 1. ID Consistency Check
    if (!isValidObjectId(commentId)) {
      return NextResponse.json({ 
        error: 'Invalid comment ID format.',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const authContext = await protectRoute(req);

    // 2. Resolve entity to verify ownership/status
    const comment = await CommentService.getCommentById(commentId);
    if (!comment) {
      return NextResponse.json({ 
        error: 'Comment not found.',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 3. RBAC/Ownership Guard
    if (comment.authorId !== authContext.userId && authContext.role !== 'admin') {
      return NextResponse.json({ 
        error: 'You are not authorized to delete this comment.',
        code: 'UNAUTHORIZED'
      }, { status: 403 });
    }

    // 4. Delegate technical removal
    const success = await CommentService.deleteComment(commentId);

    if (!success) {
      console.error("[REPO_FAILURE_DELETE]", { commentId });
      return NextResponse.json({ 
        error: 'Failed to delete the comment from the database.',
        code: 'DB_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ success }, { status: 200 });

  } catch (error: any) {
    console.error("[API_ERROR_COMMENT_DELETE]", error);
    return NextResponse.json({ 
      error: 'An internal error occurred while deleting the comment.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
