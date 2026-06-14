/**
 * @jest-environment node
 *
 * QA-03 auth-migration smoke — signIn / jwt / session callbacks.
 * Covers OAuth account creation, admin allowlist bootstrap, verified-email
 * requirement, block-and-redirect account linking, provider->role enforcement,
 * suspended-user rejection, and JWT hydration.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockUserFindOne(...a),
    create: (...a: unknown[]) => mockUserCreate(...a),
  },
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
  });

  it('creates a new Google user at ROLE_SELECTION with no role', async () => {
    mockUserFindOne.mockResolvedValue(null);
    const ok = await signIn({
      user: { email: 'new@gmail.com' },
      account: { provider: 'google' },
      profile: googleProfile('new@gmail.com'),
    });
    expect(ok).toBe(true);
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: null, onboardingStage: 'ROLE_SELECTION', oauthProvider: 'google' })
    );
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
    process.env.ADMIN_EMAIL_ALLOWLIST = 'boss@umojahub.com';
    mockUserFindOne.mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ email: 'boss@umojahub.com', primary: true, verified: true }]),
    }) as unknown as typeof fetch;

    await signIn({
      user: { email: 'boss@umojahub.com' },
      account: { provider: 'github', access_token: 'gho_x' },
      profile: { login: 'boss' },
    });
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({ role: null }));
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
