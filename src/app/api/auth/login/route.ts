import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/application/services/AuthService';

/**
 * ==========================================
 * PRESENTATION LAYER - POST /api/auth/login
 * ==========================================
 * Proxy for authentication logic with input hardening.
 * ==========================================
 */

export async function POST(req: NextRequest) {
  try {
    // 1. Sanitize incoming credentials
    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password?.trim();

    // 2. Reject incomplete credential sets
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required credentials.',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // 3. Trigger business logic from service layer
    const result = await AuthService.loginUser(email, password);

    // 4. Return authenticated session data with HTTP-only cookie for middleware
    const response = NextResponse.json(result, { status: 200 });
    
    response.cookies.set('timber_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error("[API_ERROR_LOGIN]", error.message);
    
    // Map explicit auth failure messages to appropriate status/code
    const isAuthFailure = error.message === 'Invalid credentials.';
    const status = isAuthFailure ? 401 : 400;
    const code = isAuthFailure ? 'UNAUTHORIZED' : 'VALIDATION_ERROR';

    return NextResponse.json({ 
      error: error.message || 'Login Failed',
      code 
    }, { status });
  }
}
