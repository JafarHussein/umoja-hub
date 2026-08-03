/**
 * Post-authentication intent preservation.
 *
 * The middleware has always recorded where an unauthenticated user was headed
 * (`/auth/login?callbackUrl=…`), but nothing ever read it back: the login screen
 * hardcoded its destination, so every sign-in landed on the role's default page
 * instead of the page the user asked for. The other 39 redirect sites never
 * wrote the parameter at all.
 *
 * This module is the single place that writes the parameter and the single place
 * that reads it, so the two halves can never drift apart again.
 *
 * Both halves refuse anything that is not a same-origin path. `callbackUrl` is
 * attacker-controllable (it arrives in a query string), so an unguarded read is
 * an open redirect: `/auth/login?callbackUrl=https://evil.example` would hand a
 * freshly-authenticated user to another site.
 */

/**
 * Normalises a candidate destination to a same-origin path, or returns null.
 *
 * Accepts a relative path (`/dashboard/buyer/orders?tab=open`) or an absolute
 * URL on the current origin — the middleware writes `req.url`, which is
 * absolute. Everything else (other origins, protocol-relative `//evil.com`,
 * backslash variants that some browsers normalise to `//`, `javascript:`) is
 * rejected.
 */
export function safeInternalPath(candidate: string | null | undefined, origin?: string): string | null {
  if (!candidate) return null;

  const value = candidate.trim();
  if (value === '') return null;

  // Protocol-relative and backslash forms never reach the URL parser as
  // same-origin, but they are the classic open-redirect payloads — reject
  // them explicitly rather than relying on parser quirks.
  if (value.startsWith('//') || value.startsWith('/\\') || value.startsWith('\\')) {
    return null;
  }

  if (value.startsWith('/')) {
    return value;
  }

  // Absolute URL — keep it only if it points back at this origin.
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return null;

  try {
    const url = new URL(value, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Where to send a user after they authenticate.
 *
 * `fallback` is the role-agnostic default the login screen already used: an
 * onboarding route, so the middleware can forward a finished account to its
 * dashboard and an unfinished one into the funnel.
 */
export function resolvePostAuthDestination(
  callbackUrl: string | null | undefined,
  fallback: string
): string {
  return safeInternalPath(callbackUrl) ?? fallback;
}

/**
 * Builds the sign-in URL for a user who must authenticate before continuing,
 * carrying the page they were trying to reach.
 *
 * Called from client components with no argument, in which case the current
 * location is used. This is what turns an expired session into "sign in and
 * carry on" rather than "sign in and start over".
 */
export function loginUrlWithIntent(target?: string): string {
  const intended =
    target ??
    (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : null);

  const safe = safeInternalPath(intended);

  // Never bounce the login screen back to itself, and never record the
  // onboarding funnel as an intent — the middleware owns that routing.
  if (!safe || safe.startsWith('/auth/') || safe.startsWith('/onboarding')) {
    return '/auth/login';
  }

  return `/auth/login?callbackUrl=${encodeURIComponent(safe)}`;
}
