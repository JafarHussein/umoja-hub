import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { usernameSchema } from '@/lib/validation/onboardingSchema';
import { handleApiError } from '@/lib/utils';
import { ONBOARDING_DRAFT_COOKIE, verifyDraftValue } from '@/lib/auth/onboardingDraftCookie';

// ---------------------------------------------------------------------------
// GET /api/onboarding/username-available?u=<username>
//
// Cheap uniqueness probe for the onboarding details form. Checks both existing
// Users and live OnboardingDrafts (excluding this browser's own draft). Returns
// `{ available }` — invalid usernames report `available: false`.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const raw = req.nextUrl.searchParams.get('u') ?? '';
    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ data: { available: false, reason: 'invalid' } });
    }
    const username = parsed.data;

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');
    const { default: OnboardingDraft } = await import('@/lib/models/OnboardingDraft.model');

    const ownDraftId = verifyDraftValue(req.cookies.get(ONBOARDING_DRAFT_COOKIE)?.value);

    if (await User.exists({ username })) {
      return NextResponse.json({ data: { available: false } });
    }
    const draftClash = await OnboardingDraft.findOne({ username }).select('_id').lean();
    const takenByOther = Boolean(draftClash) && String(draftClash?._id) !== ownDraftId;

    return NextResponse.json({ data: { available: !takenByOther } });
  } catch (error) {
    return handleApiError(error);
  }
}
