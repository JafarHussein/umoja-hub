/**
 * @jest-environment node
 *
 * QA-03 auth-migration smoke — signIn / jwt / session callbacks.
 * Covers OAuth account creation, admin allowlist bootstrap, verified-email
 * requirement, block-and-redirect account linking, provider->role enforcement,
 * suspended-user rejection, and JWT hydration.
 */

import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn().mockResolvedValue({});
const mockUserExists = jest.fn().mockResolvedValue(null);
const mockUserFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockUserFindOne(...a),
    create: (...a: unknown[]) => mockUserCreate(...a),
    exists: (...a: unknown[]) => mockUserExists(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockUserFindByIdAndUpdate(...a),
  },
}));

const mockCheckRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
}));

const mockSendWelcome = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/auth/welcome', () => ({
  sendWelcome: (...a: unknown[]) => mockSendWelcome(...a),
}));

import { authOptions } from '../options';

type SignInArg = {
  user: { email?: string; id?: string };
  account: { provider: string; access_token?: string } | null;
  profile?: Record<string, unknown>;
};
type JwtArg = { token: Record<string, unknown>; user?: { email?: string }; trigger?: string };

const signIn = authOptions.callbacks!.signIn! as unknown as (a: SignInArg) => Promise<boolean | string>;
const jwt = authOptions.callbacks!.jwt! as unknown as (a: JwtArg) => Promise<Record<string, unknown>>;
const session = authOptions.callbacks!.session! as unknown as (a: {
  session: { user: Record<string, unknown> };
  token: Record<string, unknown>;
}) => Promise<{ user: Record<string, unknown> }>;

const googleProfile = (email: string, verified = true) => ({ email, email_verified: verified });

describe('signIn callback — OAuth account lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
    mockUserExists.mockResolvedValue(null);
  });

  it('creates a PENDING account for a new Google identity (no role, no password)', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u-new' });

    const res = await signIn({
      user: { email: 'kamau@gmail.com' },
      account: { provider: 'google' },
      profile: { email: 'kamau@gmail.com', email_verified: true, given_name: 'Kamau', family_name: 'Githinji', picture: 'https://img/pic.jpg' },
    });

    expect(res).toBe(true);
    const created = mockUserCreate.mock.calls[0][0];
    // Identity is taken from the provider, never asked for again.
    expect(created).toMatchObject({
      email: 'kamau@gmail.com',
      firstName: 'Kamau',
      lastName: 'Githinji',
      profilePhotoUrl: 'https://img/pic.jpg',
      username: 'kamau',
      oauthProvider: 'google',
      isEmailVerified: true,
      onboardingStage: 'PASSWORD_SETUP',
      role: null,
    });
    // What a fresh OAuth identity gets is deliberately inert.
    expect(created.hashedPassword).toBeUndefined();
    // The welcome is role-specific, so it cannot fire before a role exists.
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it('de-duplicates a username that is already taken', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u-dup' });
    // 'kamau' is taken; the next candidate is free.
    mockUserExists.mockImplementation((q: { username?: string }) =>
      Promise.resolve(q.username === 'kamau' ? { _id: 'other' } : null)
    );

    await signIn({
      user: { email: 'kamau@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('kamau@gmail.com'),
    });

    expect(mockUserCreate.mock.calls[0][0].username).toBe('kamau_1');
  });

  it('seeds githubUsername from the GitHub handle so the student never types it', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u-gh' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ email: 'dev@users.noreply.github.com', primary: true, verified: true }]),
    }) as unknown as typeof fetch;

    await signIn({
      user: { email: 'dev@users.noreply.github.com' },
      account: { provider: 'github', access_token: 'gho_x' },
      profile: { login: 'brianotieno', name: 'Brian Otieno', avatar_url: 'https://gh/a.png' },
    });

    expect(mockUserCreate.mock.calls[0][0]).toMatchObject({
      username: 'brianotieno',
      firstName: 'Brian',
      lastName: 'Otieno',
      oauthProvider: 'github',
      studentData: { githubUsername: 'brianotieno' },
    });
  });

  it('never creates an ADMIN from a public OAuth sign-in (security invariant #1)', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u-x' });

    await signIn({
      user: { email: 'sneaky@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('sneaky@gmail.com'),
    });

    // The account is created, but inert: role null. Only the role route can set
    // a role, and its schema excludes ADMIN.
    expect(mockUserCreate.mock.calls[0][0].role).toBeNull();
    expect(mockUserCreate.mock.calls[0][0].onboardingStage).toBe('PASSWORD_SETUP');
  });

  it('bootstraps an allowlisted Google email straight to ADMIN/COMPLETED', async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'boss@umojahub.com, ops@umojahub.com';
    mockUserFindOne.mockResolvedValue(null);
    await signIn({
      user: { email: 'boss@umojahub.com' },
      account: { provider: 'google' },
      profile: googleProfile('boss@umojahub.com'),
    });
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN', onboardingStage: 'COMPLETED' })
    );
  });

  it('does not admin-bootstrap an allowlisted email arriving via GitHub', async () => {
    // GitHub is never an admin path. The allowlist only applies to Google, so
    // the same address arriving over GitHub gets an ordinary pending account.
    process.env.ADMIN_EMAIL_ALLOWLIST = 'boss@umojahub.com';
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u-gh-boss' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ email: 'boss@umojahub.com', primary: true, verified: true }]),
    }) as unknown as typeof fetch;

    const res = await signIn({
      user: { email: 'boss@umojahub.com' },
      account: { provider: 'github', access_token: 'gho_x' },
      profile: { login: 'boss' },
    });
    expect(res).toBe(true);
    expect(mockUserCreate.mock.calls[0][0]).toMatchObject({
      role: null,
      onboardingStage: 'PASSWORD_SETUP',
      oauthProvider: 'github',
    });
  });

  it('rejects a Google sign-in with an unverified email', async () => {
    const res = await signIn({
      user: { email: 'x@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('x@gmail.com', false),
    });
    expect(res).toBe('/auth/login?error=OAuthEmailUnverified');
  });

  it('rejects a suspended existing user', async () => {
    mockUserFindOne.mockResolvedValue({ status: 'SUSPENDED', oauthProvider: 'google', role: 'FARMER' });
    const res = await signIn({
      user: { email: 'sus@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('sus@gmail.com'),
    });
    expect(res).toBe(false);
  });

  it('blocks-and-redirects when the email belongs to a different provider', async () => {
    mockUserFindOne.mockResolvedValue({ status: 'ACTIVE', oauthProvider: 'github', role: 'STUDENT' });
    const res = await signIn({
      user: { email: 'dual@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('dual@gmail.com'),
    });
    expect(res).toBe('/auth/login?error=AccountExists');
  });

  it('enforces provider->role for an established account', async () => {
    mockUserFindOne.mockResolvedValue({ status: 'ACTIVE', oauthProvider: 'google', role: 'STUDENT' });
    const res = await signIn({
      user: { email: 'mismatch@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('mismatch@gmail.com'),
    });
    expect(res).toBe('/auth/login?error=ProviderRoleMismatch');
  });

  it('allows an established matching account to sign in', async () => {
    mockUserFindOne.mockResolvedValue({ status: 'ACTIVE', oauthProvider: 'google', role: 'FARMER' });
    const res = await signIn({
      user: { email: 'farmer@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('farmer@gmail.com'),
    });
    expect(res).toBe(true);
  });
});

describe('credentials authorize — username + password sign-in', () => {
  type Authorize = (
    c: Record<string, string> | undefined
  ) => Promise<{ id: string; role: string | null } | null>;
  // NextAuth v4 nests the user-supplied authorize under `.options`; the
  // top-level `.authorize` is its default stub.
  const credProvider = authOptions.providers.find(
    (p) => (p as { id?: string }).id === 'credentials'
  ) as unknown as { options: { authorize: Authorize } };
  const authorize = credProvider.options.authorize;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockUserFindByIdAndUpdate.mockResolvedValue({});
  });

  it('returns the user for valid credentials on an active account', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({
          _id: 'u1',
          email: 'wanjiku@gmail.com',
          firstName: 'Wanjiku',
          role: 'FARMER',
          hashedPassword,
          status: 'ACTIVE',
        }),
    });
    const res = await authorize({ username: 'wanjiku', password: 'Secret123' });
    expect(res).toMatchObject({ id: 'u1', role: 'FARMER' });
  });

  it('rejects a wrong password', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({ _id: 'u1', hashedPassword, status: 'ACTIVE', role: 'FARMER' }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'wrong' })).toBeNull();
  });

  it('rejects a non-active account', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({ _id: 'u1', hashedPassword, status: 'SUSPENDED', role: 'FARMER' }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'Secret123' })).toBeNull();
  });

  it('rejects an unknown username', async () => {
    mockUserFindOne.mockReturnValue({ select: () => Promise.resolve(null) });
    expect(await authorize({ username: 'ghost', password: 'Secret123' })).toBeNull();
  });

  it('rejects malformed input without touching the DB', async () => {
    expect(await authorize({ username: '', password: '' })).toBeNull();
    expect(mockUserFindOne).not.toHaveBeenCalled();
  });

  it('denies when the throttle is exceeded (before any DB work)', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false });
    expect(await authorize({ username: 'wanjiku', password: 'Secret123' })).toBeNull();
    expect(mockUserFindOne).not.toHaveBeenCalled();
  });

  it('denies a locked account regardless of the password', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({
          _id: 'u1',
          hashedPassword,
          status: 'ACTIVE',
          role: 'FARMER',
          lockedUntil: new Date(Date.now() + 60_000),
        }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'Secret123' })).toBeNull();
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('increments the failure counter on a wrong password below the threshold', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({ _id: 'u1', hashedPassword, status: 'ACTIVE', failedLoginAttempts: 1 }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'wrong' })).toBeNull();
    const update = mockUserFindByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
    expect(update.$set).toEqual({ failedLoginAttempts: 2 });
  });

  it('locks the account at the failure threshold', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({ _id: 'u1', hashedPassword, status: 'ACTIVE', failedLoginAttempts: 4 }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'wrong' })).toBeNull();
    const update = mockUserFindByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
    expect(update.$set.failedLoginAttempts).toBe(0);
    expect(update.$set.lockedUntil).toBeInstanceOf(Date);
  });

  it('clears prior failure state on a successful sign-in', async () => {
    const hashedPassword = bcrypt.hashSync('Secret123', 4);
    mockUserFindOne.mockReturnValue({
      select: () =>
        Promise.resolve({
          _id: 'u1',
          email: 'a@b.com',
          firstName: 'W',
          role: 'FARMER',
          hashedPassword,
          status: 'ACTIVE',
          failedLoginAttempts: 3,
        }),
    });
    expect(await authorize({ username: 'wanjiku', password: 'Secret123' })).toMatchObject({
      id: 'u1',
    });
    const update = mockUserFindByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
    expect(update.$set).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
  });
});

describe('jwt + session callbacks — hydration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hydrates the token from the DB on initial sign-in', async () => {
    mockUserFindOne.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            _id: 'u1',
            role: 'FARMER',
            firstName: 'Kamau',
            onboardingStage: 'COMPLETED',
            farmerData: { isVerified: true },
          }),
      }),
    });

    const token = await jwt({ token: {}, user: { email: 'farmer@gmail.com' } });
    expect(token).toMatchObject({
      id: 'u1',
      role: 'FARMER',
      onboardingStage: 'COMPLETED',
      isOnboarded: true,
      isVerified: true,
    });
  });

  it('maps token claims onto the session', async () => {
    const out = await session({
      session: { user: {} },
      token: { id: 'u1', role: 'FARMER', firstName: 'Kamau', onboardingStage: 'COMPLETED', isOnboarded: true, isVerified: true },
    });
    expect(out.user).toMatchObject({ id: 'u1', role: 'FARMER', isOnboarded: true, isVerified: true });
  });
});
