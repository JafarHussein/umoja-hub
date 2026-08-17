import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@/types';
import { homeForRole } from '@/lib/auth/dashboards';
import { isOnboardingComplete, onboardingPathForStage } from '@/lib/auth/onboarding';

// ---------------------------------------------------------------------------
// Daraja callback IP allow-list.
//
// This list used to be the sixteen addresses 196.201.214.200-215, and it was
// wrong in the way that matters: it would have blocked real payments.
//
// A live STK Push against the Daraja sandbox on 2026-08-17 produced a genuine
// callback, and it arrived from **196.201.212.138** — a different /24 entirely,
// absent from the old list. Every real Daraja callback would have been refused
// with 403 by this middleware before reaching the handler, so the payment would
// never have been confirmed, the buyer would have been debited and the order
// left unpaid until reconciliation. The narrow list was not a tight control; it
// was an outage waiting for go-live.
//
// Safaricom originates Daraja callbacks from three /24 ranges it owns. Those
// ranges are allow-listed rather than a hand-picked set of addresses, because
// the failure mode of being too narrow (losing real money) is far worse than
// the failure mode of being slightly wide (768 Safaricom-owned addresses may
// POST an unsigned payload that is then schema-validated, replay-guarded by the
// unique index on mpesaTransactionId, and matched to an order or dropped).
//
// This is defence in depth, not the integrity control. Daraja does not sign its
// callbacks, so nothing here proves authorship; the real guarantees are the
// schema check, the order lookup and the replay index downstream.
// ---------------------------------------------------------------------------
const DARAJA_ALLOWED_PREFIXES = ['196.201.212.', '196.201.213.', '196.201.214.'];

function isDarajaCallbackIp(ip: string): boolean {
  return DARAJA_ALLOWED_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Route → required role mapping.
// More specific prefixes must come before less specific ones.
// ---------------------------------------------------------------------------
const ROLE_ROUTE_MAP: Array<{ prefix: string; role: Role }> = [
  { prefix: '/dashboard/farmer', role: Role.FARMER },
  { prefix: '/dashboard/buyer', role: Role.BUYER },
  { prefix: '/dashboard/student', role: Role.STUDENT },
  { prefix: '/dashboard/lecturer', role: Role.LECTURER },
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

// Known-good landing pages per role (not every role group has an index route).
// The map lives in `@/lib/auth/dashboards` so the access-denied screen and the
// account menu land users in exactly the same place this does.
const dashboardForRole = homeForRole;

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
      if (!clientIp || !isDarajaCallbackIp(clientIp)) {
        // Logged, not silent. A blocked callback is a payment that will not be
        // confirmed, and the previous version of this list would have dropped
        // every real one without leaving a trace to find it by.
        // Middleware runs on the edge runtime, where the app logger is not
        // available. A blocked callback must leave a trace, so a bare console
        // is correct here and only here.
        // eslint-disable-next-line no-console
        console.warn(
          JSON.stringify({
            service: 'daraja',
            message: 'Callback rejected by IP allow-list',
            clientIp: clientIp || null,
          })
        );
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
    // Record the destination as a relative path, not `req.url`. Behind a proxy
    // the request URL's host is the internal one, which would not match the
    // browser's origin — the login screen would reject it as off-site and drop
    // the user's intent exactly where it matters most (production).
    signInUrl.searchParams.set('callbackUrl', `${path}${req.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  const role = (token.role as Role | null | undefined) ?? null;
  const stage = token.onboardingStage as string | undefined;
  // Derived from the stage claim rather than read from `token.isOnboarded`, so
  // a token minted before setup and verification were separated is re-judged
  // under the current rule instead of being trapped by the boolean it was
  // stamped with. The two claims are computed by the same helper.
  const isOnboarded = isOnboardingComplete(stage);
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
