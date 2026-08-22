import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { registrationSchema } from '@/lib/validation/onboardingSchema';
import { sanitizeUsername, resolveUniqueUsername, splitName } from '@/lib/auth/oauthIdentity';
import { isStalePendingAccount } from '@/lib/auth/pendingAccounts';
import { checkRateLimit } from '@/lib/rateLimit';
import { AppError, handleApiError, hashSecret, logger } from '@/lib/utils';
import { OnboardingStage, UserStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/auth/register — create an account with an email and a password.
//
// This is the SECOND entry into the onboarding funnel, not a second
// authentication system. Until now the only way to obtain an account was the
// OAuth `signIn` callback in `src/lib/auth/options.ts`, which meant no account
// could exist without Google or GitHub. Everything downstream of account
// creation — role selection, identity, verification, the session, the
// middleware — is untouched and shared.
//
// Public: `/api/auth` is on the middleware's exemption list, so no session is
// required (and none exists yet). It sits alongside `/api/auth/password-reset/*`
// under the NextAuth catch-all; a static segment wins over `[...nextauth]`.
//
// The request body carries NO role. Role is chosen at the next step and
// validated there against `roleSelectionSchema`, whose enum contains neither
// ADMIN nor INSTITUTION. There is therefore no privilege-bearing field in this
// request for a caller to tamper with — see PART 9 of the security notes in
// context/REGISTRATION_ARCHITECTURE_ASSESSMENT.md.
// ---------------------------------------------------------------------------

// Account creation is cheap for us and valuable to an abuser, so it is capped
// per source address.
//
// The number is deliberately generous. This platform's users share addresses
// constantly — a campus network, a cyber café, a cooperative office all present
// as one IP, and an onboarding drive puts twenty real people behind it inside an
// hour. A cap that stops a script but also stops a queue of genuine farmers is
// not a security control, it is an outage. Twenty per hour still ends bulk
// registration, and what a fresh account can obtain is inert anyway: no role, no
// verification, and no route it can reach until a person completes the funnel.
const REGISTER_IP_MAX = 20;
const REGISTER_IP_WINDOW_MS = 60 * 60 * 1000;

/**
 * The address to attribute this attempt to, or null when there is not one.
 *
 * Returning null matters more than it looks. The obvious alternative — falling
 * back to a literal `'unknown'` — does not produce "a limit for unidentified
 * callers", it produces **one shared bucket for every caller the platform cannot
 * identify**, which is the opposite of a per-source limit: the first twenty
 * attempts exhaust the allowance for everybody, and no legitimate signup can be
 * told apart from the script that spent it. Locally, where no proxy sets the
 * header, that bucket is *every registration on the machine* — the e2e suite and
 * a rehearsal both drain the same hour-long counter in Redis, and there is no
 * way to clear it short of the Upstash console.
 *
 * Vercel — the deployment target — overwrites `x-forwarded-for` and `x-real-ip`
 * on every request, so a client cannot suppress or forge them and the cap always
 * applies in production. Behind a proxy that does not set either, this route is
 * unthrottled; that is a property of the proxy, and the right place to fix it is
 * the proxy.
 */
function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return req.headers.get('x-real-ip')?.trim() || null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json().catch(() => null);

    // The client validates with this same schema before it ever gets here. That
    // is guidance; this is the boundary. `safeParse` returns the flattened field
    // errors the form renders inline, in the shape every other route uses.
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    // `email` arrives trimmed and lower-cased by the schema, which is the same
    // normalisation the User model applies and the same one the login path uses
    // to resolve an account. One casing rule, applied in one place.
    const { fullName, email, password } = parsed.data;

    const ip = clientIp(req);
    if (ip) {
      const { allowed } = await checkRateLimit(
        `register-ip:${ip}`,
        REGISTER_IP_MAX,
        REGISTER_IP_WINDOW_MS
      );
      if (!allowed) {
        throw new AppError(
          'Too many accounts created from here. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const existing = await User.findOne({ email }).select('onboardingStage createdAt').lean();
    if (existing) {
      // An abandoned OAuth attempt holds the email and nothing else — no
      // password, no role, no data. Refusing on its behalf would strand someone
      // who closed the Google tab and came back to register properly, which is
      // exactly the dead end the OAuth callback already reclaims these rows to
      // avoid (see lib/auth/pendingAccounts.ts). Same rule, same reason.
      if (isStalePendingAccount(existing)) {
        await User.deleteOne({ _id: existing._id });
        logger.info('auth', 'Reclaimed an abandoned pending account at registration', {
          userId: String(existing._id),
        });
      } else {
        // Registration cannot be made non-enumerable the way password reset can:
        // the person in front of us has to be told their email is already in
        // use, or they cannot act. The mitigation is the rate limit above, and
        // the message says nothing beyond what the sign-in form would reveal.
        throw new AppError(
          'An account with this email already exists. Sign in instead.',
          409,
          'EMAIL_TAKEN'
        );
      }
    }

    const { firstName, lastName } = splitName(fullName);
    const username = await resolveUniqueUsername(
      sanitizeUsername(email.split('@')[0] ?? ''),
      async (candidate) => (await User.exists({ username: candidate })) !== null
    );

    const created = await User.create({
      email,
      username,
      // bcrypt, cost 12, via the shared wrapper. The field is `select: false` on
      // the schema, so the hash never leaves the database unless a query asks
      // for it by name — and no response on this route returns the document.
      hashedPassword: await hashSecret(password),
      firstName,
      ...(lastName ? { lastName } : {}),
      // No role yet. The next screen assigns one, server-side, from a four-member
      // enum. A registration can no more become an admin than an OAuth sign-in can.
      role: null,
      // PASSWORD_SETUP is skipped rather than faked: that stage exists only
      // because OAuth creates the row before a password exists. This row already
      // has one, so the funnel genuinely starts at role selection.
      onboardingStage: OnboardingStage.ROLE_SELECTION,
      // Nobody has verified this address. OAuth accounts are `true` because the
      // provider asserted it; claiming the same here would be a lie the admin
      // verification queue would later read as fact.
      isEmailVerified: false,
      status: UserStatus.ACTIVE,
    });

    // Never the password, never the hash, never the whole document.
    logger.info('auth', 'Account registered with credentials', {
      userId: String(created._id),
      username,
    });

    // `username` is returned so the confirmation can show the handle the account
    // was given; the client signs in with the email it already holds.
    return NextResponse.json(
      { data: { username, onboardingStage: OnboardingStage.ROLE_SELECTION } },
      { status: 201 }
    );
  } catch (error) {
    // The unique index on `email` is the real guarantee — the lookup above is a
    // courtesy that loses a race with a simultaneous signup. `handleApiError`
    // maps Mongo's 11000 to a 409, so the duplicate is refused either way.
    return handleApiError(error);
  }
}
