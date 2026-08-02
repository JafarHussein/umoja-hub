/**
 * @jest-environment node
 *
 * QA-03 auth-migration smoke — middleware onboarding lock + admin hiding.
 * Verifies the redirect rules are loop-free against JWT claims only.
 */

import { NextRequest } from 'next/server';

const mockGetToken = jest.fn();
jest.mock('next-auth/jwt', () => ({ getToken: (...a: unknown[]) => mockGetToken(...a) }));

import { middleware } from '../middleware';

function run(path: string) {
  return middleware(new NextRequest(`http://localhost${path}`));
}

function location(res: { headers: Headers }): string | null {
  return res.headers.get('location');
}

describe('middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lets public/exempt paths through without a token check', async () => {
    const res = await run('/marketplace');
    expect(res.status).toBe(200);
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated page request to login', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await run('/dashboard/farmer/listings');
    expect(location(res)).toContain('/auth/login');
  });

  it('returns 401 JSON for an unauthenticated API request', async () => {
    mockGetToken.mockResolvedValue(null);
    const res = await run('/api/admin/payout-requests');
    expect(res.status).toBe(401);
  });

  it('lets an unauthenticated user reach the provider picker (the only pre-auth screen)', async () => {
    mockGetToken.mockResolvedValue(null);
    expect((await run('/onboarding/welcome')).status).toBe(200);
  });

  it('sends an unauthenticated user off every other onboarding screen to login', async () => {
    // Under V3 the rest of the funnel is authenticated — the OAuth callback has
    // already created the account by the time those screens are reachable.
    mockGetToken.mockResolvedValue(null);
    expect(location(await run('/onboarding/password'))).toContain('/auth/login');
    expect(location(await run('/onboarding/role-selection'))).toContain('/auth/login');
  });

  it('routes a password-setup user to the password screen', async () => {
    mockGetToken.mockResolvedValue({
      role: null,
      isOnboarded: false,
      onboardingStage: 'PASSWORD_SETUP',
    });
    expect(location(await run('/dashboard/farmer/listings'))).toContain('/onboarding/password');
  });

  it('moves a signed-in user off the pre-auth welcome screen to their stage', async () => {
    // /onboarding/welcome is the OAuth callback target, so a user who has just
    // authenticated lands there — and must not be left looking at the sign-up
    // page they have already completed.
    mockGetToken.mockResolvedValue({
      role: null,
      isOnboarded: false,
      onboardingStage: 'PASSWORD_SETUP',
    });
    expect(location(await run('/onboarding/welcome'))).toContain('/onboarding/password');
  });

  it('keeps a mid-funnel user on the screen their stage points at', async () => {
    mockGetToken.mockResolvedValue({
      role: null,
      isOnboarded: false,
      onboardingStage: 'ROLE_SELECTION',
    });
    const res = await run('/onboarding/role-selection');
    expect(res.status).toBe(200);
    expect(location(res)).toBeNull();
  });

  it('does not police funnel screens against a possibly-stale token stage', async () => {
    // Regression: the JWT's stage lags the database between a step's API call
    // and the update() that refreshes the token. If the middleware redirected on
    // the stale claim while the page redirected on the fresh row, the two fought
    // and the browser looped until it gave up (ERR_TOO_MANY_REDIRECTS).
    // Each funnel page self-guards against the database instead.
    mockGetToken.mockResolvedValue({
      role: null,
      isOnboarded: false,
      onboardingStage: 'PASSWORD_SETUP',
    });
    const res = await run('/onboarding/role-selection');
    expect(res.status).toBe(200);
    expect(location(res)).toBeNull();
  });

  it('funnels a not-onboarded user to the onboarding stage', async () => {
    mockGetToken.mockResolvedValue({ role: null, isOnboarded: false, onboardingStage: 'ROLE_SELECTION' });
    const res = await run('/dashboard/farmer/listings');
    expect(location(res)).toContain('/onboarding/role-selection');
  });

  it('bounces an onboarded user off the onboarding pages to their dashboard', async () => {
    mockGetToken.mockResolvedValue({ role: 'FARMER', isOnboarded: true, onboardingStage: 'COMPLETED' });
    const res = await run('/onboarding/role-selection');
    expect(location(res)).toContain('/dashboard/farmer/listings');
  });

  it('allows an onboarded role-matched user through (no redirect loop)', async () => {
    mockGetToken.mockResolvedValue({ role: 'FARMER', isOnboarded: true, onboardingStage: 'COMPLETED' });
    const res = await run('/dashboard/farmer/listings');
    expect(res.status).toBe(200);
    expect(location(res)).toBeNull();
  });

  it('hard-404s an authenticated non-admin on an admin page', async () => {
    mockGetToken.mockResolvedValue({ role: 'FARMER', isOnboarded: true, onboardingStage: 'COMPLETED' });
    const res = await run('/dashboard/admin/verification-queue');
    expect(res.status).toBe(404);
  });

  it('hard-404s an authenticated non-admin on an admin API', async () => {
    mockGetToken.mockResolvedValue({ role: 'FARMER', isOnboarded: true, onboardingStage: 'COMPLETED' });
    const res = await run('/api/admin/payout-requests');
    expect(res.status).toBe(404);
  });

  it('redirects a role-mismatched user to unauthorized', async () => {
    mockGetToken.mockResolvedValue({ role: 'BUYER', isOnboarded: true, onboardingStage: 'COMPLETED' });
    const res = await run('/dashboard/farmer/listings');
    expect(location(res)).toContain('/auth/unauthorized');
  });
});
