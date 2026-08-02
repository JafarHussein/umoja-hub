import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role, OnboardingStage } from '@/types';

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
  { prefix: '/dashboard/ngo', role: Role.NGO },
  { prefix: '/dashboard/employer', role: Role.EMPLOYER },
  { prefix: '/dashboard/institution', role: Role.INSTITUTION },
  { prefix: '/dashboard/admin', role: Role.ADMIN },
  { prefix: '/api/admin', role: Role.ADMIN },
];

// ---------------------------------------------------------------------------
// Exemption whitelist (Decision 02-A / DOC-01). Defensive: the matcher already
// scopes this middleware to the authenticated app shell, but if it is ever
// broadened these public surfaces must never be auth- or onboarding-gated.
// ---------------------------------------------------------------------------
const EXEMPT_PREFIXES = [
  '/_next',
  '/auth', // login / register / reset / unauthorized
  '/api/auth', // NextAuth's own sign-in + callback endpoints — never block
  '/api/webhooks/daraja',
  '/api/health',
  '/api/transparency',
  '/marketplace',
  '/knowledge',
  '/verify/', // email-verification landing (DOC-01: /verify/[token])
];

function isExempt(path: string): boolean {
  if (path === '/favicon.ico') return true;
  return EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(p));
}

// V3 onboarding (AUTH_ONBOARDING_FLOW_V3) is OAuth-first, so exactly one screen
// runs before an account exists: the provider picker. Everything after it is
// authenticated, because the OAuth callback has already created the account.
// An already-onboarded user is still bounced to their dashboard below (step 6).
const PRE_AUTH_ONBOARDING_PREFIXES = ['/onboarding/welcome'];

function isPreAuthOnboarding(path: string): boolean {
  return PRE_AUTH_ONBOARDING_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

// Onboarding funnel target for a given stage (Decision 02-A). The /onboarding
// route group is built by AUTH-06; these slugs are the contract it must honour.
function onboardingPathForStage(stage: string | undefined): string {
  switch (stage) {
    case OnboardingStage.PASSWORD_SETUP:
      return '/onboarding/password';
    case OnboardingStage.IDENTITY_INPUT:
      return '/onboarding/identity-input';
    case OnboardingStage.VERIFICATION_UPLOAD:
      return '/onboarding/verification-upload';
    default:
      return '/onboarding/role-selection';
  }
}

// Known-good landing pages per role (not every role group has an index route).
function dashboardForRole(role: Role | null): string {
  switch (role) {
    case Role.FARMER:
      return '/dashboard/farmer/listings';
    case Role.BUYER:
      return '/marketplace';
    case Role.STUDENT:
      return '/dashboard/student';
    case Role.LECTURER:
      return '/dashboard/lecturer/queue';
    case Role.NGO:
      return '/dashboard/ngo';
    case Role.EMPLOYER:
      return '/dashboard/employer';
    case Role.INSTITUTION:
      return '/dashboard/institution';
    case Role.ADMIN:
      return '/dashboard/admin/verification-queue';
    default:
      return '/';
  }
}

// Hard 404 — hides the admin surface from authenticated non-admins. The status
// code is the security-meaningful part (the resource must appear not to exist).
function hardNotFound(isApi: boolean): NextResponse {
  if (isApi) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  return new NextResponse('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith('/api');

  // 1. Daraja webhook — IP allowlisting, no JWT (runs before any auth check).
  if (path === '/api/webhooks/daraja') {
    if (process.env.NODE_ENV === 'production') {
      const forwarded = req.headers.get('x-forwarded-for');
      const clientIp = forwarded?.split(',')[0]?.trim() ?? '';
      if (!clientIp || !DARAJA_ALLOWED_IPS.has(clientIp)) {
        return NextResponse.json({ error: 'Forbidden', code: 'WEBHOOK_IP_BLOCKED' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // 2. Public surfaces — never gated.
  if (isExempt(path)) {
    return NextResponse.next();
  }

  // 3. JWT claims only — no DB reads on page loads (Decision 02-A).
  const token = await getToken({ req, secret: process.env['NEXTAUTH_SECRET'] ?? '' });

  // 4. Unauthenticated.
  if (!token) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    // The provider picker runs before an account exists — let it through.
    if (isPreAuthOnboarding(path)) {
      return NextResponse.next();
    }
    const signInUrl = new URL('/auth/login', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = (token.role as Role | null | undefined) ?? null;
  const isOnboarded = Boolean(token.isOnboarded);
  const stage = token.onboardingStage as string | undefined;
  const isAdminRoute = path.startsWith('/dashboard/admin') || path.startsWith('/api/admin');

  // 5. Admin routes: an authenticated non-admin must not learn they exist.
  if (isAdminRoute && role !== Role.ADMIN) {
    return hardNotFound(isApi);
  }

  // 6. Onboarding lock (page routes only — APIs self-guard via requireRole).
  if (!isApi) {
    const onOnboarding = path.startsWith('/onboarding');
    if (role === null || !isOnboarded) {
      const target = onboardingPathForStage(stage);
      if (!onOnboarding) {
        return NextResponse.redirect(new URL(target, req.url));
      }
      // /onboarding/welcome is the pre-auth provider picker AND the OAuth
      // callback target, so a user who has just signed in lands there and must
      // be moved on. Only that screen is policed here.
      //
      // The other funnel screens deliberately are NOT: each one self-guards
      // against the database, and the stage on this token can lag it (the JWT
      // refreshes on update(), the row updates immediately). Forcing the token's
      // stage on every path made those two authorities fight — the middleware
      // sent the user back on the stale claim, the page sent them forward on the
      // fresh row, and the browser looped until it gave up.
      if (isPreAuthOnboarding(path)) {
        return NextResponse.redirect(new URL(target, req.url));
      }
    } else if (onOnboarding) {
      // A fully-onboarded user has no business on the onboarding pages.
      return NextResponse.redirect(new URL(dashboardForRole(role), req.url));
    }
  }

  // 7. Role-prefix enforcement. Admin mismatches were already 404'd in step 5;
  // every other role mismatch is surfaced as an unauthorized redirect.
  for (const { prefix, role: requiredRole } of ROLE_ROUTE_MAP) {
    if (path.startsWith(prefix)) {
      if (requiredRole === Role.ADMIN) break;
      if (role !== requiredRole) {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — the authenticated app shell plus the onboarding funnel and the
// Daraja webhook. Public routes (marketplace, knowledge, website, auth pages)
// are intentionally excluded so they never incur a JWT check.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/api/admin/:path*',
    '/api/webhooks/daraja',
  ],
};
