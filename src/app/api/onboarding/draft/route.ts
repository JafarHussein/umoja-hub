import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { onboardingDraftSchema } from '@/lib/validation/onboardingSchema';
import { AppError, handleApiError, hashSecret, logger } from '@/lib/utils';
import {
  ONBOARDING_DRAFT_COOKIE,
  signDraftId,
  verifyDraftValue,
  draftCookieOptions,
} from '@/lib/auth/onboardingDraftCookie';

// ---------------------------------------------------------------------------
// POST /api/onboarding/draft (AUTH_ONBOARDING_FLOW_V2, slice 2)
//
// Pre-auth: collects username + role + password BEFORE an account exists, holds
// them in an OnboardingDraft (password bcrypt-hashed), and returns a signed
// httpOnly cookie that the OAuth reconcile step reads. ADMIN is rejected at the
// schema boundary (the enum excludes it). No session required — this runs before
// authentication and is outside the middleware matcher.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = onboardingDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, password, role } = parsed.data;

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');
    const { default: OnboardingDraft } = await import('@/lib/models/OnboardingDraft.model');

    // The draft this browser already owns (if any) — lets the user revise their
    // details without colliding with their own username.
    const ownDraftId = verifyDraftValue(req.cookies.get(ONBOARDING_DRAFT_COOKIE)?.value);

    if (await User.exists({ username })) {
      throw new AppError('That username is taken.', 409, 'USERNAME_TAKEN');
    }
    const draftClash = await OnboardingDraft.findOne({ username }).select('_id').lean();
    if (draftClash && String(draftClash._id) !== ownDraftId) {
      throw new AppError('That username is taken.', 409, 'USERNAME_TAKEN');
    }

    const hashedPassword = await hashSecret(password);

    let draftId: string;
    const existing = ownDraftId
      ? await OnboardingDraft.findByIdAndUpdate(
          ownDraftId,
          { $set: { username, role, hashedPassword } },
          { new: true }
        )
      : null;
    if (existing) {
      draftId = String(existing._id);
    } else {
      const created = await OnboardingDraft.create({ username, role, hashedPassword });
      draftId = String(created._id);
    }

    logger.info('onboarding', 'Draft saved', { role });

    const res = NextResponse.json({ data: { username, role } });
    res.cookies.set(ONBOARDING_DRAFT_COOKIE, signDraftId(draftId), draftCookieOptions);
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
