import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * ==========================================
 * TIMBER GLOBAL MIDDLEWARE
 * ==========================================
 * Priority Chain: 
 * 1. Maintenance Mode Check
 * 2. Auth Guard
 * 3. Role Restriction
 * ==========================================
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. SKIP STATIC ASSETS
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. MAINTENANCE MODE CHECK (Step 1.1)
  // We use an internal API call because Redis clients are often incompatible with Edge Runtime.
  // The API route handles the Redis logic in the Node.js runtime.
  try {
    const maintRes = await fetch(`${req.nextUrl.origin}/api/admin/maintenance/check`, {
      cache: 'no-store'
    });
    if (maintRes.ok) {
      const { enabled, message } = await maintRes.json();
      
      if (enabled && pathname !== '/maintenance' && !pathname.startsWith('/login')) {
        // Double check if the user is an admin before blocking
        const token = req.cookies.get('timber_token')?.value;
        let isAdmin = false;
        if (token) {
          try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            if (payload.role === 'admin') isAdmin = true;
          } catch (e) {}
        }

        if (!isAdmin) {
          return NextResponse.redirect(new URL('/maintenance', req.url));
        }
      }
    }
  } catch (err) {
    console.error("[MIDDLEWARE_MAINTENANCE_CHECK_FAILED]", err);
  }

  // 3. ADMIN ACCESS CONTROL (Step 1.2)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('timber_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (payload.role !== 'admin') {
        // Redirect non-admins to home with a "denied" query param
        return NextResponse.redirect(new URL('/?error=access_denied', req.url));
      }
      
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
