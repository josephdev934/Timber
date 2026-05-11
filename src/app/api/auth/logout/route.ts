import { NextRequest, NextResponse } from 'next/server';

/**
 * ==========================================
 * PRESENTATION LAYER - POST /api/auth/logout
 * ==========================================
 * Clears the session cookie.
 * ==========================================
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 });
  
  response.cookies.set('timber_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
