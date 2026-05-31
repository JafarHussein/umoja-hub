import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// Daraja IP allowlist
// Safaricom Daraja sends payment callbacks exclusively from these IPs.
// Source: https://developer.safaricom.co.ke/Documentation
// IMPORTANT: Verify this list against current Safaricom documentation before
// production go-live. Safaricom may update their IP ranges.
// ---------------------------------------------------------------------------
const DARAJA_ALLOWED_IPS = new Set([
  '196.201.214.200',
  '196.201.214.201',
  '196.201.214.202',
  '196.201.214.203',
  '196.201.214.204',
  '196.201.214.205',
  '196.201.214.206',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.214.209',
  '196.201.214.210',
  '196.201.214.211',
  '196.201.214.212',
  '196.201.214.213',
  '196.201.214.214',
  '196.201.214.215',
]);

// ---------------------------------------------------------------------------
// Route → required role mapping.
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

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;

  // ---------------------------------------------------------------------------
  // Daraja webhook IP allowlisting — runs before any auth check.
  // Safaricom does not send a JWT; auth is purely IP-based.
  // In development (NODE_ENV !== 'production') the check is bypassed so
  // local testing with ngrok or similar tools works without spoofing IPs.
  // ---------------------------------------------------------------------------
  if (path === '/api/webhooks/daraja') {
    if (process.env.NODE_ENV === 'production') {
      const forwarded = req.headers.get('x-forwarded-for');
      const clientIp = forwarded?.split(',')[0]?.trim() ?? '';

      if (!clientIp || !DARAJA_ALLOWED_IPS.has(clientIp)) {
        return NextResponse.json(
          { error: 'Forbidden', code: 'WEBHOOK_IP_BLOCKED' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // JWT auth check for all other protected routes.
  // Equivalent to withAuth — redirects to sign-in if no valid token exists.
  // ---------------------------------------------------------------------------
  const token = await getToken({ req, secret: process.env['NEXTAUTH_SECRET'] ?? '' });

  if (!token) {
    const signInUrl = new URL('/api/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as Role | undefined;

  for (const { prefix, role: requiredRole } of ROLE_ROUTE_MAP) {
    if (path.startsWith(prefix)) {
      if (role !== requiredRole) {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — which paths this middleware runs on.
// /api/webhooks/daraja is added for IP allowlisting.
// Excludes: _next/static, _next/image, favicon, public files, /api/health.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/webhooks/daraja',
  ],
};
