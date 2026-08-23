/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/register — email + password account creation.
 *
 * Covers the behaviour that matters rather than the shape of the handler:
 * validation rejection, password rules, mismatch, duplicate email (both the
 * pre-check and the index race), stale-pending reclaim, rate limiting, that the
 * created row can never carry a role or a privileged stage, that the password
 * is stored only as a hash, and that no secret is returned to the client.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockUserExists = jest.fn().mockResolvedValue(null);
const mockUserDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockUserFindOne(...a),
    create: (...a: unknown[]) => mockUserCreate(...a),
    exists: (...a: unknown[]) => mockUserExists(...a),
    deleteOne: (...a: unknown[]) => mockUserDeleteOne(...a),
  },
}));

const mockCheckRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
}));

import bcrypt from 'bcryptjs';
import { POST } from '../route';

const VALID = {
  fullName: 'Mercy Wairimu',
  email: 'mercy.wairimu@gmail.com',
  password: 'Shamba2026!',
  confirmPassword: 'Shamba2026!',
};

function postReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

/** No account exists with this email. */
function noExistingUser(): void {
  mockUserFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  });
}

/** An account already exists with this email. */
function existingUser(value: Record<string, unknown>): void {
  mockUserFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }),
  });
}

/** The document `User.create` resolves with. */
function createdAs(id = 'newuser1'): void {
  mockUserCreate.mockResolvedValue({ _id: id });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockUserExists.mockResolvedValue(null);
    createdAs();
  });

  // -------------------------------------------------------------------------
  // Success
  // -------------------------------------------------------------------------

  it('creates the account and returns 201', async () => {
    noExistingUser();
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(201);
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
  });

  it('stores the name split into firstName and lastName', async () => {
    noExistingUser();
    await POST(postReq({ ...VALID, fullName: 'Mercy Wairimu Njoroge' }));
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.firstName).toBe('Mercy');
    expect(doc.lastName).toBe('Wairimu Njoroge');
  });

  it('normalises the email to lowercase and trims it', async () => {
    noExistingUser();
    await POST(postReq({ ...VALID, email: '  Mercy.Wairimu@Gmail.com  ' }));
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.email).toBe('mercy.wairimu@gmail.com');
  });

  it('derives a username from the email local part', async () => {
    noExistingUser();
    const res = await POST(postReq(VALID));
    const body = await res.json();
    expect(body.data.username).toBe('mercy_wairimu');
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.username).toBe('mercy_wairimu');
  });

  it('picks a free username when the derived one is taken', async () => {
    noExistingUser();
    // First candidate taken, the suffixed one free.
    mockUserExists.mockResolvedValueOnce({ _id: 'other' }).mockResolvedValue(null);
    const res = await POST(postReq(VALID));
    const body = await res.json();
    expect(body.data.username).toBe('mercy_wairimu_1');
  });

  // -------------------------------------------------------------------------
  // Password handling — PART 6
  // -------------------------------------------------------------------------

  it('stores a bcrypt hash, never the password itself', async () => {
    noExistingUser();
    await POST(postReq(VALID));
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    const hash = doc.hashedPassword as string;

    expect(doc.password).toBeUndefined();
    expect(hash).toEqual(expect.any(String));
    expect(hash).not.toContain(VALID.password);
    expect(hash.startsWith('$2')).toBe(true);
    // The hash must actually be of the submitted password — a stored hash of the
    // wrong thing would lock the account out with every test still green.
    await expect(bcrypt.compare(VALID.password, hash)).resolves.toBe(true);
  });

  it('never returns a password or a hash to the client', async () => {
    noExistingUser();
    const res = await POST(postReq(VALID));
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain(VALID.password);
    expect(raw).not.toContain('hashedPassword');
    expect(raw).not.toContain('$2');
  });

  // -------------------------------------------------------------------------
  // Role and privilege — PART 9. These are the security tests.
  // -------------------------------------------------------------------------

  it('creates the account with no role at all', async () => {
    noExistingUser();
    await POST(postReq(VALID));
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.role).toBeNull();
  });

  it('ignores a role smuggled into the request body', async () => {
    noExistingUser();
    const res = await POST(postReq({ ...VALID, role: 'ADMIN' }));
    expect(res.status).toBe(201);
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.role).toBeNull();
  });

  it('ignores an attempt to self-assign verification or a finished funnel', async () => {
    noExistingUser();
    await POST(
      postReq({
        ...VALID,
        isEmailVerified: true,
        onboardingStage: 'COMPLETED',
        status: 'ACTIVE',
        farmerData: { isVerified: true },
      })
    );
    const doc = mockUserCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(doc.isEmailVerified).toBe(false);
    expect(doc.onboardingStage).toBe('ROLE_SELECTION');
    expect(doc.farmerData).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Validation — PART 5
  // -------------------------------------------------------------------------

  it.each([
    ['a missing body', {}],
    ['a blank name', { ...VALID, fullName: '' }],
    ['a name that is an email address', { ...VALID, fullName: 'mercy@example.com' }],
    ['an invalid email', { ...VALID, email: 'not-an-email' }],
    ['a missing email', { fullName: 'Mercy Wairimu', password: 'Shamba2026!', confirmPassword: 'Shamba2026!' }],
    ['a short password', { ...VALID, password: 'Sh1a!', confirmPassword: 'Sh1a!' }],
    ['a password with no uppercase', { ...VALID, password: 'shamba2026', confirmPassword: 'shamba2026' }],
    ['a password with no digit', { ...VALID, password: 'ShambaShamba', confirmPassword: 'ShambaShamba' }],
    ['mismatched passwords', { ...VALID, confirmPassword: 'Shamba2027!' }],
  ])('rejects %s with 400 and creates nothing', async (_label, body) => {
    noExistingUser();
    const res = await POST(postReq(body));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('VALIDATION_FAILED');
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('returns field errors the form can render inline', async () => {
    noExistingUser();
    const res = await POST(postReq({ ...VALID, confirmPassword: 'Different1!' }));
    const body = await res.json();
    expect(body.details.fieldErrors.confirmPassword[0]).toBe('Both passwords must match');
  });

  // -------------------------------------------------------------------------
  // Email uniqueness — PART 7
  // -------------------------------------------------------------------------

  it('refuses an email that already belongs to a settled account', async () => {
    existingUser({
      _id: 'existing1',
      onboardingStage: 'COMPLETED',
      createdAt: new Date('2020-01-01'),
    });
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('EMAIL_TAKEN');
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('does not leak database internals when the email is taken', async () => {
    existingUser({ _id: 'existing1', onboardingStage: 'COMPLETED', createdAt: new Date('2020-01-01') });
    const body = await (await POST(postReq(VALID))).json();
    expect(body.error).toBe('An account with this email already exists. Sign in instead.');
    expect(JSON.stringify(body)).not.toContain('existing1');
  });

  it('reclaims an abandoned pending account rather than refusing', async () => {
    // PASSWORD_SETUP with nothing entered, older than the 30-minute TTL: the
    // OAuth callback reclaims these, and so must this route, or someone who
    // closed the Google tab can never register at all.
    existingUser({
      _id: 'pending1',
      onboardingStage: 'PASSWORD_SETUP',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(201);
    expect(mockUserDeleteOne).toHaveBeenCalledWith({ _id: 'pending1' });
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
  });

  it('does not reclaim a pending account that is still fresh', async () => {
    existingUser({
      _id: 'pending2',
      onboardingStage: 'PASSWORD_SETUP',
      createdAt: new Date(),
    });
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(409);
    expect(mockUserDeleteOne).not.toHaveBeenCalled();
  });

  it('surfaces a lost duplicate-key race as 409 rather than a crash', async () => {
    // Two simultaneous signups: the lookup says the email is free, the unique
    // index says otherwise. The index is the real guarantee.
    noExistingUser();
    mockUserCreate.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('DB_DUPLICATE');
  });

  // -------------------------------------------------------------------------
  // Failure handling
  // -------------------------------------------------------------------------

  it('returns 429 when the source address has created too many accounts', async () => {
    noExistingUser();
    mockCheckRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(postReq(VALID, { 'x-forwarded-for': '41.90.1.1' }));
    expect(res.status).toBe(429);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('attributes the limit to the caller, not to a shared bucket', async () => {
    noExistingUser();
    await POST(postReq(VALID, { 'x-forwarded-for': '41.90.1.1, 10.0.0.1' }));
    // The first hop is the client; the rest are proxies.
    expect(mockCheckRateLimit).toHaveBeenCalledWith('register-ip:41.90.1.1', 20, 60 * 60 * 1000);
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    noExistingUser();
    await POST(postReq(VALID, { 'x-real-ip': '41.90.2.2' }));
    expect(mockCheckRateLimit).toHaveBeenCalledWith('register-ip:41.90.2.2', 20, 60 * 60 * 1000);
  });

  it('does not throttle at all when no address can be attributed', async () => {
    // A literal 'unknown' key is not a per-source limit — it is one global
    // bucket that every unidentifiable caller drains together, which throttles
    // legitimate signups and identifies nobody. Vercel always supplies the
    // header, so this branch is the local/self-hosted case.
    noExistingUser();
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(201);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it('returns 500 without leaking the underlying error when the insert fails', async () => {
    noExistingUser();
    mockUserCreate.mockRejectedValue(new Error('connection to replica set lost'));
    const res = await POST(postReq(VALID));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('replica set');
  });

  it('rejects a malformed JSON body with 400 rather than throwing', async () => {
    noExistingUser();
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json at all',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });
});
