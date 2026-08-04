/**
 * scripts/dev-session.ts — mint a NextAuth v4 session cookie for local visual QA.
 *
 * The app is OAuth-only, which can't be driven headlessly. Since the session
 * strategy is JWT, we can forge a valid encrypted session cookie for a seeded
 * user using the same `encode` + NEXTAUTH_SECRET the app uses. This is a
 * LOCAL-DEV-ONLY tool — it is never imported by the app and refuses to run
 * against production.
 *
 * Usage: tsx scripts/dev-session.ts <email>
 *   Prints `next-auth.session-token=<jwe>` for the matching seeded user.
 */

if (process.env.NODE_ENV === 'production') {
  console.error('dev-session: refusing to run in production.'); // eslint-disable-line no-console
  process.exit(1);
}

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { encode } from 'next-auth/jwt';
import { connectDB } from '../src/lib/db';
import User from '../src/lib/models/User.model';
import { Role, OnboardingStage } from '../src/types';
import { isOnboardingComplete } from '../src/lib/auth/onboarding';

function out(msg: string): void {
  console.log(msg); // eslint-disable-line no-console
}

interface ILeanUser {
  _id: unknown;
  role?: Role | null;
  firstName: string;
  onboardingStage?: string;
  farmerData?: { isVerified?: boolean };
  buyerData?: { isVerified?: boolean };
  lecturerData?: { isVerified?: boolean };
}

function computeIsVerified(u: ILeanUser): boolean {
  switch (u.role) {
    case Role.FARMER:
      return Boolean(u.farmerData?.isVerified);
    case Role.BUYER:
      return Boolean(u.buyerData?.isVerified);
    case Role.LECTURER:
      return Boolean(u.lecturerData?.isVerified);
    default:
      return false;
  }
}

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx scripts/dev-session.ts <email>'); // eslint-disable-line no-console
    process.exit(1);
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('dev-session: NEXTAUTH_SECRET is not set.'); // eslint-disable-line no-console
    process.exit(1);
  }

  // `new` → a fresh, not-yet-onboarded session (role null, ROLE_SELECTION) for
  // viewing the onboarding funnel. No DB lookup needed.
  if (email === 'new') {
    const token = {
      id: '000000000000000000000000',
      role: null,
      firstName: 'New',
      onboardingStage: OnboardingStage.ROLE_SELECTION,
      isOnboarded: false,
      isVerified: false,
    };
    const jwe = await encode({ token, secret, maxAge: 24 * 60 * 60 });
    out('# new (not onboarded) — role=null stage=ROLE_SELECTION');
    out(`next-auth.session-token=${jwe}`);
    process.exit(0);
  }

  await connectDB();
  const user = (await User.findOne({ email })
    .select(
      'role firstName onboardingStage farmerData.isVerified buyerData.isVerified lecturerData.isVerified'
    )
    .lean()) as ILeanUser | null;

  if (!user) {
    console.error(`dev-session: no user with email ${email}. Run npm run demo first.`); // eslint-disable-line no-console
    process.exit(1);
  }

  // Mirror the JWT claim set produced by authOptions.callbacks.jwt so the
  // session callback hydrates a fully-onboarded session.
  const stage = (user.onboardingStage as OnboardingStage) ?? OnboardingStage.COMPLETED;
  const token = {
    id: String(user._id),
    role: (user.role as Role | null) ?? null,
    firstName: user.firstName,
    onboardingStage: stage,
    isOnboarded: isOnboardingComplete(stage),
    isVerified: computeIsVerified(user),
  };

  const jwe = await encode({ token, secret, maxAge: 24 * 60 * 60 });

  out(`# ${email} — role=${token.role} verified=${token.isVerified}`);
  out(`next-auth.session-token=${jwe}`);
  process.exit(0);
}

void main();
