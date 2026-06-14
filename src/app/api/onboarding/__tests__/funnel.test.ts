/**
 * @jest-environment node
 *
 * QA-02 state-machine test — onboarding funnel.
 * Drives role -> identity -> verification against an evolving DB stage and
 * asserts stages advance in order and cannot be skipped or repeated.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

// Stateful in-memory user the three routes read and mutate.
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
import { POST as verificationPOST } from '../verification/route';

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

  it('advances ROLE_SELECTION -> IDENTITY_INPUT -> VERIFICATION_UPLOAD -> COMPLETED', async () => {
    const r1 = await rolePOST(req('role', { role: 'FARMER' }));
    expect(r1.status).toBe(200);
    expect(user.onboardingStage).toBe('IDENTITY_INPUT');
    expect(user.role).toBe('FARMER');

    const r2 = await identityPOST(req('identity', { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' }));
    expect(r2.status).toBe(200);
    expect(user.onboardingStage).toBe('VERIFICATION_UPLOAD');

    const r3 = await verificationPOST(
      req('verification', {
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: 'https://res.cloudinary.com/x/doc.jpg',
      })
    );
    expect(r3.status).toBe(200);
    expect(user.onboardingStage).toBe('COMPLETED');
    expect(user['farmerData.verificationStatus']).toBe('PENDING');
  });

  it('rejects repeating role selection once past ROLE_SELECTION', async () => {
    await rolePOST(req('role', { role: 'FARMER' }));
    const again = await rolePOST(req('role', { role: 'BUYER' }));
    expect(again.status).toBe(409);
    expect(user.role).toBe('FARMER'); // unchanged
  });

  it('rejects verification submitted before identity', async () => {
    await rolePOST(req('role', { role: 'FARMER' }));
    // still at IDENTITY_INPUT — verification must wait
    const res = await verificationPOST(
      req('verification', {
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: 'https://res.cloudinary.com/x/doc.jpg',
      })
    );
    expect(res.status).toBe(409);
  });
});
