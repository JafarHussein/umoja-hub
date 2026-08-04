import { OnboardingStage } from '@/types';

// ---------------------------------------------------------------------------
// Where account setup ends — the single definition, shared by the middleware
// gate and the JWT claim so the two can never disagree.
//
// Setup and trust are separate questions. "Has this person told us who they
// are?" is answered by finishing the funnel; "has an administrator confirmed
// it?" is answered by `verificationStatus` / `isVerified`, on its own axis,
// and enforced at the restricted action (see `VerificationLockout`).
//
// They used to be one flag. Because the middleware gated the whole product on
// `onboardingStage === COMPLETED`, and only a document upload could write that
// value, a farmer without their ID to hand at signup was locked out of the
// marketplace, prices and their own dashboard — surfaces that need no
// verification at all. A buyer with no company typed "NOT APPLICABLE" into two
// required fields to escape. The corridor manufactured the bad data.
// ---------------------------------------------------------------------------

/**
 * `VERIFICATION_UPLOAD` is a **legacy terminal stage**. It is no longer written
 * by any route — identity submission now completes setup directly — but rows
 * and unexpired JWTs created before that change still carry it. Treating it as
 * complete frees those accounts on their next request with no migration, and
 * keeps a stale token from being redirected to a funnel screen that no longer
 * exists (which would loop: the gate would fire again on arrival).
 */
export function isOnboardingComplete(stage: string | null | undefined): boolean {
  return stage === OnboardingStage.COMPLETED || stage === OnboardingStage.VERIFICATION_UPLOAD;
}

/**
 * The funnel screen an incomplete account belongs on. Only consulted for stages
 * `isOnboardingComplete` rejects, so the terminal stages have no case here.
 */
export function onboardingPathForStage(stage: string | null | undefined): string {
  switch (stage) {
    case OnboardingStage.PASSWORD_SETUP:
      return '/onboarding/password';
    case OnboardingStage.IDENTITY_INPUT:
      return '/onboarding/identity-input';
    default:
      return '/onboarding/role-selection';
  }
}
