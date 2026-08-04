import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import {
  farmerOnboardingVerificationSchema,
  buyerOnboardingVerificationSchema,
  lecturerOnboardingVerificationSchema,
} from '@/lib/validation/onboardingSchema';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { Role, OnboardingStage, VerificationStatus, NotificationType, BuyerType } from '@/types';
import { notify, notifyAdmins } from '@/lib/notifications/notify';

// ---------------------------------------------------------------------------
// POST /api/onboarding/verification — Stage 3 for FARMER/BUYER/LECTURER (AUTH-05)
// Auth: onboarding user with a role set (stage must be VERIFICATION_UPLOAD).
// Records the verification artefact (document / certificate / credential letter)
// — setting verificationStatus to PENDING where the role has one — and advances
// onboardingStage to COMPLETED. STUDENTs verify via the institutional-email flow.
// Onboarding completing does NOT make the account verified; an admin still
// approves the submission from the relevant queue.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = await User.findById(session.user.id).select('role onboardingStage').lean();
    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }
    if (user.onboardingStage !== OnboardingStage.VERIFICATION_UPLOAD) {
      throw new AppError('Complete the previous step first.', 409, 'ONBOARDING_INVALID_STAGE');
    }

    const body: unknown = await req.json();
    let set: Record<string, unknown>;

    switch (user.role) {
      case Role.FARMER: {
        const parsed = farmerOnboardingVerificationSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        set = {
          'farmerData.documentType': parsed.data.documentType,
          'farmerData.documentNumber': parsed.data.documentNumber,
          'farmerData.documentImageUrl': parsed.data.documentImageUrl,
          'farmerData.verificationStatus': VerificationStatus.PENDING,
          ...(parsed.data.landOwnershipToken !== undefined && {
            'farmerData.landOwnershipToken': parsed.data.landOwnershipToken,
          }),
        };
        break;
      }
      case Role.BUYER: {
        const parsed = buyerOnboardingVerificationSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        // An individual proves identity with a document; a business proves
        // standing with a KRA certificate. Storing them in separate fields is
        // what lets the acknowledgement below stay true — the previous single
        // `taxComplianceCertificate` field accepted an individual's ID photo and
        // the platform then called it a tax compliance certificate.
        set =
          parsed.data.buyerType === BuyerType.BUSINESS
            ? {
                'buyerData.taxComplianceCertificate': parsed.data.taxComplianceCertificate,
                'buyerData.verificationStatus': VerificationStatus.PENDING,
              }
            : {
                'buyerData.documentType': parsed.data.documentType,
                'buyerData.documentNumber': parsed.data.documentNumber,
                'buyerData.documentImageUrl': parsed.data.documentImageUrl,
                'buyerData.verificationStatus': VerificationStatus.PENDING,
              };
        break;
      }
      case Role.LECTURER: {
        const parsed = lecturerOnboardingVerificationSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        // Lecturers carry no verificationStatus field — the admin lecturer queue
        // works off isVerified. Store the credential letter for that review.
        set = { 'lecturerData.facultyCredentialLetterUrl': parsed.data.facultyCredentialLetterUrl };
        break;
      }
      default:
        throw new AppError(
          'This step does not apply to your account.',
          409,
          'ONBOARDING_WRONG_ROLE'
        );
    }

    await User.findByIdAndUpdate(session.user.id, {
      $set: { ...set, onboardingStage: OnboardingStage.COMPLETED },
    });

    logger.info('onboarding', 'Verification submitted', {
      userId: session.user.id,
      role: user.role,
    });

    // Acknowledgement to the new member, and an operational alert to
    // administrators that a verification awaits review.
    //
    // Neither message names the document type. Nothing here has inspected the
    // upload — the schema checks only that it is a Cloudinary URL — so calling
    // it "your tax compliance certificate" asserts something the platform does
    // not know. It said exactly that to a live account whose upload was a photo
    // of something else entirely, because the form had demanded a certificate
    // the user did not have. The administrator names the document at review
    // time; until then we describe only what is true: a document arrived.
    void notify({
      userId: session.user.id,
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'Welcome to UmojaHub — your account is under review',
      body: 'Thank you for joining UmojaHub. Your verification documents are with our review team, and an administrator will look at them shortly. You can start exploring the platform right away.',
      relatedEntity: { kind: 'User', id: session.user.id },
    });
    void notifyAdmins({
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'New verification request',
      body: `A ${String(user.role).toLowerCase()} submitted documents for verification. Open the verification queue to review.`,
      relatedEntity: { kind: 'User', id: session.user.id },
    });

    return NextResponse.json({ data: { onboardingStage: OnboardingStage.COMPLETED } });
  } catch (error) {
    return handleApiError(error);
  }
}

function validationError(details: unknown): NextResponse {
  return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_FAILED', details },
    { status: 400 }
  );
}
