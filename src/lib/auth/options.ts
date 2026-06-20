import type { NextAuthOptions, Session, User, Profile, Account } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import { logger, verifySecret } from '@/lib/utils';
import { credentialsLoginSchema } from '@/lib/validation/onboardingSchema';
import {
  ONBOARDING_DRAFT_COOKIE,
  verifyDraftValue,
  clearedDraftCookieOptions,
} from '@/lib/auth/onboardingDraftCookie';
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

    // V2 dual-auth (AUTH_ONBOARDING_FLOW_V2): username + password. The account
    // is still created via OAuth at the end of onboarding; this path lets an
    // existing account sign in with the credentials they set. Requires the JWT
    // session strategy (already configured below).
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        const parsed = credentialsLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;

        await connectDB();
        const UserModel = (await import('@/lib/models/User.model')).default;
        const dbUser = await UserModel.findOne({ username }).select('+hashedPassword');
        if (!dbUser?.hashedPassword || dbUser.status !== UserStatus.ACTIVE) return null;

        const ok = await verifySecret(password, dbUser.hashedPassword);
        if (!ok) return null;

        return {
          id: String(dbUser._id),
          email: dbUser.email,
          firstName: dbUser.firstName,
          role: (dbUser.role as Role | null) ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }): Promise<boolean | string> {
      const provider = account?.provider;
      if (!provider) return false;

      // Credentials sign-in is fully validated in `authorize` above (username +
      // bcrypt password + active status); nothing more to enforce here.
      if (provider === 'credentials') return true;

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

      // New OAuth identity (AUTH_ONBOARDING_FLOW_V2). Allowlisted Google emails
      // are bootstrapped straight to ADMIN with no draft. Everyone else MUST have
      // completed onboarding first — their username/role/password live in a signed
      // OnboardingDraft cookie, reconciled into the account here.
      const githubLogin = (profile as { login?: string } | undefined)?.login;

      if (provider === OAuthProvider.GOOGLE && getAdminAllowlist().includes(email)) {
        await UserModel.create({
          email,
          firstName: deriveFirstName(profile, email),
          role: Role.ADMIN,
          onboardingStage: OnboardingStage.COMPLETED,
          oauthProvider: provider,
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
        });
        logger.info('auth', 'Allowlisted admin provisioned via OAuth', { email });
        return true;
      }

      // Reconcile the onboarding draft (the signed cookie survives the OAuth
      // round-trip; the NextAuth handler runs in a request context so
      // next/headers cookies() is readable here).
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const draftId = verifyDraftValue(cookieStore.get(ONBOARDING_DRAFT_COOKIE)?.value);
      if (!draftId) {
        // No draft → the user reached OAuth without onboarding. Send them through it.
        return '/onboarding/welcome';
      }

      const OnboardingDraft = (await import('@/lib/models/OnboardingDraft.model')).default;
      const draft = await OnboardingDraft.findById(draftId);
      if (!draft) {
        return '/onboarding/welcome';
      }

      // Security invariant: ADMIN is never created from a draft (defence in depth;
      // the schema already excludes it from the role enum).
      if (draft.role === Role.ADMIN || !providerAllowsRole(provider, draft.role)) {
        return `${LOGIN_PATH}?error=ProviderRoleMismatch`;
      }
      // Username may have been claimed since the draft was made (race / TTL).
      if (await UserModel.exists({ username: draft.username })) {
        return `${LOGIN_PATH}?error=AccountExists`;
      }

      await UserModel.create({
        email,
        username: draft.username,
        hashedPassword: draft.hashedPassword,
        firstName: deriveFirstName(profile, email),
        role: draft.role,
        onboardingStage: OnboardingStage.COMPLETED,
        oauthProvider: provider,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
        ...(provider === OAuthProvider.GITHUB && githubLogin
          ? { studentData: { githubUsername: githubLogin } }
          : {}),
      });

      await OnboardingDraft.findByIdAndDelete(draftId);
      try {
        cookieStore.set(ONBOARDING_DRAFT_COOKIE, '', clearedDraftCookieOptions);
      } catch {
        // Cookie clearing is best-effort; the draft row is already deleted, so a
        // dangling cookie reference is harmless and the DB TTL backstops it.
      }

      logger.info('auth', 'Account finalized from onboarding draft', {
        provider,
        role: draft.role,
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
