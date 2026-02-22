import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// Route → required role mapping
// More specific prefixes must come before less specific ones.
// ---------------------------------------------------------------------------

const ROLE_ROUTE_MAP: Array<{ prefix: string; role: Role }> = [
  { prefix: '/dashboard/farmer', role: Role.FARMER },
  { prefix: '/dashboard/buyer', role: Role.BUYER },
  { prefix: '/dashboard/student', role: Role.STUDENT },
  { prefix: '/dashboard/lecturer', role: Role.LECTURER },
  { prefix: '/dashboard/admin', role: Role.ADMIN },
  { prefix: '/api/admin', role: Role.ADMIN },
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const role = req.nextauth.token?.role as Role | undefined;
    const path = req.nextUrl.pathname;

    // Check if this path requires a specific role
    for (const { prefix, role: requiredRole } of ROLE_ROUTE_MAP) {
      if (path.startsWith(prefix)) {
        if (role !== requiredRole) {
          // Wrong role — send to unauthorized page instead of login
          // (they are authenticated, just in the wrong section)
          return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
        }
        break; // First match wins
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the middleware function when a valid JWT token exists.
      // Without a token, withAuth redirects automatically to pages.signIn.
      authorized: ({ token }) => !!token,
    },
  }
);

// ---------------------------------------------------------------------------
// Matcher — which paths this middleware runs on
// Excludes: _next/static, _next/image, favicon, public files
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
