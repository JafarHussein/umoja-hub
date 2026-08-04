/**
 * @jest-environment node
 *
 * QA-02 state-machine test — onboarding funnel.
 * Drives role -> identity against an evolving DB stage and asserts stages
 * advance in order and cannot be skipped or repeated.
 *
 * Setup ends at identity. Verification is no longer a funnel stage — it is a
 * demand-driven submission to /api/verification, covered by its own test — so
 * the machine here is deliberately shorter than it used to be.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

// Stateful in-memory user the two routes read and mutate.
const user: { onboardingStage: string; role: string | null; oauthProvider: string; [k: string]: unknown } = {
  onboardingStage: 'ROLE_SELECTION',
  role: null,
  oauthProvider: 'google',
};

const findByIdMock = jest.fn(() => ({
  select: () => ({ lean: () => Promise.resolve({ ...user }) }),
}));
const findByIdAndUpdateMock = jest.fn((_id: string, update: { $set: Record<string, unknown> }) => {
  for (const [k, v] of Object.entries(update.$set)) {
    if (k === 'onboardingStage') user.onboardingStage = v as string;
    else if (k === 'role') user.role = v as string;
    else user[k] = v;
  }
  return Promise.resolve({ ...user });
});

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => findByIdMock(...(a as [])),
    findByIdAndUpdate: (...a: unknown[]) => findByIdAndUpdateMock(...(a as [string, { $set: Record<string, unknown> }])),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST as rolePOST } from '../role/route';
import { POST as identityPOST } from '../identity/route';

const SESSION = { user: { id: 'u1', role: 'FARMER', firstName: 'Sam' } };

function req(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/onboarding/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('onboarding funnel state machine', () => {
  beforeEach(() => {
    user.onboardingStage = 'ROLE_SELECTION';
    user.role = null;
    user.oauthProvider = 'google';
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
  });

  it('blocks identity before a role is chosen', async () => {
    const res = await identityPOST(req('identity', { lastName: 'O', phoneNumber: '0712345678', county: 'Kisumu' }));
    expect(res.status).toBe(409); // stage is still ROLE_SELECTION
  });

  it('advances ROLE_SELECTION -> IDENTITY_INPUT -> COMPLETED', async () => {
    const r1 = await rolePOST(req('role', { role: 'FARMER' }));
    expect(r1.status).toBe(200);
    expect(user.onboardingStage).toBe('IDENTITY_INPUT');
    expect(user.role).toBe('FARMER');

    const r2 = await identityPOST(req('identity', { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' }));
    expect(r2.status).toBe(200);
    // Setup is complete without a document. A farmer who does not have their ID
    // to hand today still reaches the marketplace, their dashboard and prices;
    // publishing produce is what verification gates, and it gates it there.
    expect(user.onboardingStage).toBe('COMPLETED');
  });

  it('does not put the account in a verification queue at signup', async () => {
    await rolePOST(req('role', { role: 'FARMER' }));
    await identityPOST(req('identity', { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' }));
    expect(user['farmerData.verificationStatus']).toBeUndefined();
  });

  it('rejects repeating role selection once past ROLE_SELECTION', async () => {
    await rolePOST(req('role', { role: 'FARMER' }));
    const again = await rolePOST(req('role', { role: 'BUYER' }));
    expect(again.status).toBe(409);
    expect(user.role).toBe('FARMER'); // unchanged
  });

  it('rejects identity submitted twice', async () => {
    await rolePOST(req('role', { role: 'FARMER' }));
    await identityPOST(req('identity', { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' }));
    const again = await identityPOST(
      req('identity', { lastName: 'Changed', phoneNumber: '0712345679', county: 'Nairobi' })
    );
    expect(again.status).toBe(409);
  });
});
