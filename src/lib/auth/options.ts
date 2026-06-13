import type { NextAuthOptions, Session, User, Profile, Account } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { Role, UserStatus, OnboardingStage, OAuthProvider } from '@/types';

// ---------------------------------------------------------------------------
// Type augmentation — extends NextAuth session and JWT with UmojaHub fields.
// `role` is nullable: an OAuth user has no role until ROLE_SELECTION (AUTH-01).
// ---------------------------------------------------------------------------

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      role: Role | null;
      onboardingStage: OnboardingStage;
      isOnboarded: boolean;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    role: Role | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role | null;
    firstName: string;
    onboardingStage: OnboardingStage;
    isOnboarded: boolean;
    isVerified: boolean;
  }
}

const LOGIN_PATH = '/auth/login';

// ---------------------------------------------------------------------------
// Policy helpers (Decision 01-B)
// ---------------------------------------------------------------------------

// Provider↔role enforcement: STUDENT is GitHub-only (developer identity);
// every other role authenticates with Google. A null role is mid-onboarding
// and is constrained at role-selection time (AUTH-05), not here.
function providerAllowsRole(provider: string, role: string | null | undefined): boolean {
  if (!role) return true;
  if (role === Role.STUDENT) return provider === OAuthProvider.GITHUB;
  return provider === OAuthProvider.GOOGLE;
}

// Admin bootstrap (AUTH-03): Google emails on the allowlist are provisioned as
// ADMIN on first sign-in, skipping the onboarding funnel. An empty/unset list
// means no allowlisted admins. GitHub is never an admin path.
function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

type LeanVerificationUser = {
  _id: unknown;
  role?: string | null;
  firstName: string;
  onboardingStage: string;
  farmerData?: { isVerified?: boolean };
  buyerData?: { isVerified?: boolean };
  lecturerData?: { isVerified?: boolean };
};

// Role-specific verification flag surfaced as the `isVerified` session claim
// (powers the lecturer/farmer system-lockout overlays, UI-03).
function computeIsVerified(user: LeanVerificationUser): boolean {
  switch (user.role) {
    case Role.FARMER:
      return Boolean(user.farmerData?.isVerified);
    case Role.BUYER:
      return Boolean(user.buyerData?.isVerified);
    case Role.LECTURER:
      return Boolean(user.lecturerData?.isVerified);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// OAuth email resolution — the verified-email requirement (Decision 01-B).
// Google asserts verification in the profile; GitHub requires a call to the
// emails API (needs the `user:email` scope) to find the primary verified one.
// ---------------------------------------------------------------------------

async function resolveVerifiedEmail(
  provider: string,
  account: Account | null,
  profile: Profile | undefined,
  user: User
): Promise<string | null> {
  if (provider === OAuthProvider.GOOGLE) {
    const p = profile as { email?: string; email_verified?: boolean } | undefined;
    if (p?.email && p.email_verified) return p.email.toLowerCase().trim();
    return null;
  }

  if (provider === OAuthProvider.GITHUB) {
    const accessToken = account?.access_token;
    if (!accessToken) return null;
    try {
      const res = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'UmojaHub',
        },
      });
      if (!res.ok) return null;
      const emails = (await res.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const match = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      return match?.email?.toLowerCase().trim() ?? null;
    } catch (error) {
      logger.error('auth', 'GitHub email lookup failed', { error });
      return null;
    }
  }

  return user.email?.toLowerCase().trim() ?? null;
}

function deriveFirstName(profile: Profile | undefined, fallbackEmail: string): string {
  const p = profile as { name?: string; login?: string } | undefined;
  const firstToken = p?.name?.trim().split(/\s+/)[0];
  if (firstToken) return firstToken;
  if (p?.login) return p.login;
  return fallbackEmail.split('@')[0] ?? fallbackEmail;
}

// ---------------------------------------------------------------------------
// authOptions — the single NextAuth configuration object
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'openid email profile', prompt: 'select_account' } },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'read:user user:email' } },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }): Promise<boolean | string> {
      const provider = account?.provider;
      if (!provider) return false;

      await connectDB();
      const UserModel = (await import('@/lib/models/User.model')).default;

      // OAuth (google | github) — require a provider-verified email.
      const email = await resolveVerifiedEmail(provider, account ?? null, profile, user);
      if (!email) {
        return `${LOGIN_PATH}?error=OAuthEmailUnverified`;
      }

      const existing = await UserModel.findOne({ email });

      if (existing) {
        if (existing.status !== UserStatus.ACTIVE) {
          return false;
        }
        // Account-linking policy: BLOCK and redirect. An email already tied to a
        // credentials account or the other provider is never auto-linked —
        // this removes the account-takeover vector via a forged OAuth email.
        if (existing.oauthProvider !== provider) {
          return `${LOGIN_PATH}?error=AccountExists`;
        }
        // Provider↔role enforcement for an established account.
        if (!providerAllowsRole(provider, existing.role)) {
          return `${LOGIN_PATH}?error=ProviderRoleMismatch`;
        }
        return true;
      }

      // New OAuth user. Allowlisted Google emails are bootstrapped straight to
      // ADMIN (COMPLETED, no funnel); everyone else enters at ROLE_SELECTION
      // with no role yet. GitHub implies STUDENT (enforced at role selection),
      // so its login is captured now as the read-only githubUsername (UI-12).
      const isAllowlistedAdmin =
        provider === OAuthProvider.GOOGLE && getAdminAllowlist().includes(email);
      const githubLogin = (profile as { login?: string } | undefined)?.login;
      await UserModel.create({
        email,
        firstName: deriveFirstName(profile, email),
        role: isAllowlistedAdmin ? Role.ADMIN : null,
        onboardingStage: isAllowlistedAdmin
          ? OnboardingStage.COMPLETED
          : OnboardingStage.ROLE_SELECTION,
        oauthProvider: provider,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
        ...(provider === OAuthProvider.GITHUB && githubLogin
          ? { studentData: { githubUsername: githubLogin } }
          : {}),
      });

      logger.info('auth', 'New OAuth user created', {
        provider,
        email,
        isAdmin: isAllowlistedAdmin,
      });
      return true;
    },

    async jwt({ token, user, trigger }): Promise<JWT> {
      // Initial sign-in (credentials or OAuth) and post-onboarding refresh both
      // hydrate the token from the canonical DB record. For OAuth, `user.id` is
      // the provider id — the lookup is by email to find our user.
      const query =
        user?.email != null
          ? { email: user.email }
          : trigger === 'update' && token.id
            ? { _id: token.id }
            : null;

      if (query) {
        await connectDB();
        const UserModel = (await import('@/lib/models/User.model')).default;
        const dbUser = (await UserModel.findOne(query)
          .select(
            'role firstName onboardingStage farmerData.isVerified buyerData.isVerified lecturerData.isVerified'
          )
          .lean()) as LeanVerificationUser | null;

        if (dbUser) {
          token.id = String(dbUser._id);
          token.role = (dbUser.role as Role | null) ?? null;
          token.firstName = dbUser.firstName;
          token.onboardingStage = dbUser.onboardingStage as OnboardingStage;
          token.isOnboarded = dbUser.onboardingStage === OnboardingStage.COMPLETED;
          token.isVerified = computeIsVerified(dbUser);
        }
      }

      return token;
    },

    async session({ session, token }): Promise<Session> {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.firstName = token.firstName;
      session.user.onboardingStage = token.onboardingStage;
      session.user.isOnboarded = token.isOnboarded;
      session.user.isVerified = token.isVerified;
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Redirect auth errors back to login with ?error= param
  },

  // Suppress verbose NextAuth debug logs in production
  debug: process.env.NODE_ENV === 'development',
};
