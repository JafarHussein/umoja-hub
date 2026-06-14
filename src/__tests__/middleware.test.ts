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
