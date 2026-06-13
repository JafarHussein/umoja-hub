import { Role, VerificationStatus, StudentTier } from '@/types';

// ---------------------------------------------------------------------------
// buildRoleDefaults — initialise the correct role sub-document when a role is
// first assigned (onboarding Stage 1, AUTH-05; also the credentials register
// path). Shared so the two entry points cannot drift.
// ---------------------------------------------------------------------------

export function buildRoleDefaults(role: string): Record<string, unknown> {
  switch (role) {
    case Role.FARMER:
      return {
        farmerData: {
          verificationStatus: VerificationStatus.UNSUBMITTED,
          isVerified: false,
          cropsGrown: [],
          livestockKept: [],
        },
      };
    case Role.BUYER:
      return {
        buyerData: {
          verificationStatus: VerificationStatus.UNSUBMITTED,
          isVerified: false,
        },
      };
    case Role.STUDENT:
      return {
        studentData: {
          currentTier: StudentTier.BEGINNER,
          techStackPreferences: [],
          completedProjectCount: 0,
          institutionalEmailVerified: false,
        },
      };
    case Role.LECTURER:
      return {
        lecturerData: {
          isVerified: false,
        },
      };
    default:
      return {};
  }
}
