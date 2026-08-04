import { isOnboardingComplete, onboardingPathForStage } from '../onboarding';
import { OnboardingStage } from '@/types';

// Setup and verification are separate axes. These tests pin the boundary,
// because the middleware gate and the JWT claim both read it — if they ever
// disagree about where setup ends, a user is redirected in a loop.

describe('isOnboardingComplete', () => {
  it('is complete at COMPLETED', () => {
    expect(isOnboardingComplete(OnboardingStage.COMPLETED)).toBe(true);
  });

  it('is complete at the retired VERIFICATION_UPLOAD stage', () => {
    // Rows and unexpired tokens created before setup and verification were
    // separated still carry this. They are freed on the next request rather
    // than sent to a funnel screen that no longer exists.
    expect(isOnboardingComplete(OnboardingStage.VERIFICATION_UPLOAD)).toBe(true);
  });

  it('is not complete before identity has been given', () => {
    expect(isOnboardingComplete(OnboardingStage.PASSWORD_SETUP)).toBe(false);
    expect(isOnboardingComplete(OnboardingStage.ROLE_SELECTION)).toBe(false);
    expect(isOnboardingComplete(OnboardingStage.IDENTITY_INPUT)).toBe(false);
  });

  it('treats an absent or unrecognised stage as incomplete', () => {
    expect(isOnboardingComplete(undefined)).toBe(false);
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete('SOMETHING_ELSE')).toBe(false);
  });
});

describe('onboardingPathForStage', () => {
  it('routes each incomplete stage to its own screen', () => {
    expect(onboardingPathForStage(OnboardingStage.PASSWORD_SETUP)).toBe('/onboarding/password');
    expect(onboardingPathForStage(OnboardingStage.IDENTITY_INPUT)).toBe(
      '/onboarding/identity-input'
    );
    expect(onboardingPathForStage(OnboardingStage.ROLE_SELECTION)).toBe(
      '/onboarding/role-selection'
    );
  });

  it('never routes to the retired verification screen', () => {
    // The route is gone. Returning it for any input would 404 a user mid-funnel.
    for (const stage of Object.values(OnboardingStage)) {
      expect(onboardingPathForStage(stage)).not.toContain('verification');
    }
    expect(onboardingPathForStage(undefined)).not.toContain('verification');
  });
});
