import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/application/services/AuthService';

/**
 * ==========================================
 * PRESENTATION LAYER - POST /api/auth/register
 * ==========================================
 * Thin controller layer with hardened inputs.
 * Ensures data integrity before reaching the service.
 * ==========================================
 */

export async function POST(req: NextRequest) {
  try {
    // 1. Normalize and sanitize raw body data
    const body = await req.json();
    const name = body.name?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password?.trim();

    // 2. Reject missing or empty required fields
    if (!name || !username || !email || !password) {
      return NextResponse.json({ 
        error: 'All fields (name, username, email, password) are required.',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // 3. Basic structural validation
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters.', code: 'INVALID_INPUT' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.', code: 'INVALID_INPUT' }, { status: 400 });
    }

    // 4. Delegate to AuthService for business constraint checks (e.g., uniqueness)
    const user = await AuthService.registerUser({
      name,
      username,
      email,
      passwordRaw: password
    });

    return NextResponse.json({ user }, { status: 201 });

  } catch (error: any) {
    console.error("[API_ERROR_REGISTER]", error.message);
    
    // Use the error message from the service if it matches business rules
    const businessErrors = ['Email is already registered.', 'Username is already taken.', 'Invalid email format.'];
    const message = businessErrors.includes(error.message) ? error.message : 'Registration Failed';
    const code = businessErrors.includes(error.message) ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';

    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
