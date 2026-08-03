/**
 * @jest-environment node
 *
 * Post-authentication intent preservation.
 *
 * Two things regress here, and both are user-visible:
 *  - Drop the intent and sign-in dumps people on a default page instead of the
 *    one they asked for — the bug this module was written to fix.
 *  - Trust the intent and `?callbackUrl=` becomes an open redirect, handing a
 *    freshly-authenticated user to another site. The parameter is attacker-
 *    controllable, so every rejection case below is a security test.
 */

import { safeInternalPath, resolvePostAuthDestination, loginUrlWithIntent } from '../intent';

const ORIGIN = 'https://umoja-hub.vercel.app';

describe('safeInternalPath', () => {
  it('keeps a relative path, including its query string', () => {
    expect(safeInternalPath('/dashboard/buyer/orders')).toBe('/dashboard/buyer/orders');
    expect(safeInternalPath('/marketplace?category=Fruits&sort=recent')).toBe(
      '/marketplace?category=Fruits&sort=recent'
    );
  });

  it('reduces a same-origin absolute URL to its path', () => {
    expect(safeInternalPath(`${ORIGIN}/dashboard/farmer/listings`, ORIGIN)).toBe(
      '/dashboard/farmer/listings'
    );
    expect(safeInternalPath(`${ORIGIN}/marketplace?q=maize#top`, ORIGIN)).toBe(
      '/marketplace?q=maize#top'
    );
  });

  it('rejects another origin', () => {
    expect(safeInternalPath('https://evil.example/steal', ORIGIN)).toBeNull();
    expect(safeInternalPath('http://umoja-hub.vercel.app.evil.example/x', ORIGIN)).toBeNull();
  });

  it('rejects protocol-relative and backslash open-redirect payloads', () => {
    expect(safeInternalPath('//evil.example', ORIGIN)).toBeNull();
    expect(safeInternalPath('/\\evil.example', ORIGIN)).toBeNull();
    expect(safeInternalPath('\\\\evil.example', ORIGIN)).toBeNull();
  });

  it('rejects non-http schemes', () => {
    expect(safeInternalPath('javascript:alert(1)', ORIGIN)).toBeNull();
    expect(safeInternalPath('data:text/html,<script>', ORIGIN)).toBeNull();
  });

  it('rejects empty and absent values', () => {
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
    expect(safeInternalPath('   ')).toBeNull();
  });
});

describe('resolvePostAuthDestination', () => {
  it('returns the requested page so sign-in resumes the interrupted journey', () => {
    expect(resolvePostAuthDestination('/dashboard/buyer/orders', '/onboarding/welcome')).toBe(
      '/dashboard/buyer/orders'
    );
  });

  it('falls back when there is no intent to honour', () => {
    expect(resolvePostAuthDestination(null, '/onboarding/welcome')).toBe('/onboarding/welcome');
  });

  it('falls back rather than following an off-site destination', () => {
    expect(resolvePostAuthDestination('https://evil.example', '/onboarding/welcome')).toBe(
      '/onboarding/welcome'
    );
    expect(resolvePostAuthDestination('//evil.example', '/onboarding/welcome')).toBe(
      '/onboarding/welcome'
    );
  });
});

describe('loginUrlWithIntent', () => {
  it('records where the user was headed', () => {
    expect(loginUrlWithIntent('/dashboard/admin/payouts')).toBe(
      '/auth/login?callbackUrl=%2Fdashboard%2Fadmin%2Fpayouts'
    );
  });

  it('does not send the login screen back to itself', () => {
    expect(loginUrlWithIntent('/auth/login')).toBe('/auth/login');
    expect(loginUrlWithIntent('/auth/unauthorized')).toBe('/auth/login');
  });

  it('does not record the onboarding funnel, which the middleware routes itself', () => {
    expect(loginUrlWithIntent('/onboarding/role-selection')).toBe('/auth/login');
  });

  it('drops an unusable destination instead of embedding it', () => {
    expect(loginUrlWithIntent('https://evil.example/x')).toBe('/auth/login');
  });
});
