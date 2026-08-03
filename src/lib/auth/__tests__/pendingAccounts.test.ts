/**
 * @jest-environment node
 *
 * AUTH_ONBOARDING_FLOW_V3 §8 — abandoned pending-account cleanup.
 *
 * This module issues a deleteMany against the User collection, so its filter is
 * the thing under test as much as its behaviour: every clause has to be present,
 * because dropping any one of them widens the sweep onto accounts people use.
 */

import { isStalePendingAccount, prunePendingAccounts, PENDING_ACCOUNT_TTL_MS } from '../pendingAccounts';

const mockDeleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
  },
}));

const NOW = new Date('2026-08-03T12:00:00Z');
const minutesAgo = (m: number): Date => new Date(NOW.getTime() - m * 60_000);

describe('isStalePendingAccount', () => {
  it('is true for a PASSWORD_SETUP account older than the TTL', () => {
    expect(
      isStalePendingAccount({ onboardingStage: 'PASSWORD_SETUP', createdAt: minutesAgo(31) }, NOW)
    ).toBe(true);
  });

  it('is false for one still inside the TTL', () => {
    // Someone part-way through the password form must never be swept.
    expect(
      isStalePendingAccount({ onboardingStage: 'PASSWORD_SETUP', createdAt: minutesAgo(29) }, NOW)
    ).toBe(false);
  });

  it('is false exactly at the boundary', () => {
    const exact = new Date(NOW.getTime() - PENDING_ACCOUNT_TTL_MS);
    expect(isStalePendingAccount({ onboardingStage: 'PASSWORD_SETUP', createdAt: exact }, NOW)).toBe(
      false
    );
  });

  it.each(['ROLE_SELECTION', 'IDENTITY_INPUT', 'VERIFICATION_UPLOAD', 'COMPLETED'])(
    'is false at stage %s however old',
    (stage) => {
      // Past PASSWORD_SETUP the user has chosen a password — a real credential.
      // Deleting that account would destroy something they entered.
      expect(isStalePendingAccount({ onboardingStage: stage, createdAt: minutesAgo(60 * 24 * 90) }, NOW)).toBe(
        false
      );
    }
  );

  it('is false when createdAt is missing rather than guessing', () => {
    expect(isStalePendingAccount({ onboardingStage: 'PASSWORD_SETUP' }, NOW)).toBe(false);
  });
});

describe('prunePendingAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteMany.mockResolvedValue({ deletedCount: 0 });
  });

  it('narrows the delete on stage, age, absent role, absent password and active status', async () => {
    await prunePendingAccounts(NOW);
    const filter = mockDeleteMany.mock.calls[0][0];

    expect(filter.onboardingStage).toBe('PASSWORD_SETUP');
    expect(filter.role).toBeNull();
    expect(filter.status).toBe('ACTIVE');
    // `$eq: null` matches an explicit null and a missing field alike, which is
    // what "never set a password" looks like on these rows.
    expect(filter.hashedPassword).toEqual({ $eq: null });
    expect(filter.createdAt.$lt).toEqual(new Date(NOW.getTime() - PENDING_ACCOUNT_TTL_MS));
  });

  it('never issues an unscoped delete', async () => {
    await prunePendingAccounts(NOW);
    const filter = mockDeleteMany.mock.calls[0][0];
    expect(Object.keys(filter).length).toBeGreaterThanOrEqual(5);
  });

  it('reports how many rows it removed', async () => {
    mockDeleteMany.mockResolvedValue({ deletedCount: 7 });
    await expect(prunePendingAccounts(NOW)).resolves.toEqual({ deleted: 7 });
  });

  it('reports zero when the driver omits deletedCount', async () => {
    mockDeleteMany.mockResolvedValue({});
    await expect(prunePendingAccounts(NOW)).resolves.toEqual({ deleted: 0 });
  });
});
