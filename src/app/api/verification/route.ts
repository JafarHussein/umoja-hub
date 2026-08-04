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
import {
  Role,
  OnboardingStage,
  VerificationStatus,
  NotificationType,
  BuyerType,
} from '@/types';
import { notify, notifyAdmins } from '@/lib/notifications/notify';

// ---------------------------------------------------------------------------
// /api/verification — the one place an account submits proof of identity.
//
// This replaced three routes that did the same job differently:
// `/api/onboarding/verification` (funnel), `/api/farmers/verify` (farmer
// profile) and `/api/buyers/verify` (no caller at all). They had drifted: the
// buyer route accepted only `taxComplianceCertificate`, so an individual buyer
// whose first submission was rejected was asked for a KRA certificate they had
// never had — the defect the buyer-type branch was written to end, alive again
// on the resubmission path. One endpoint cannot drift from itself.
//
// Submitting does not verify anyone. An administrator reviews from the queue;
// this only records the artefact and moves the account to PENDING.
// STUDENTs verify by institutional-email pin instead (/api/onboarding/institutional-email).
// ---------------------------------------------------------------------------

/** What the account currently has to do about verification. */
export interface IVerificationState {
  role: Role;
  status: VerificationStatus;
  /** BUYER only — decides whether we ask for a certificate or an ID. */
  buyerType: BuyerType | null;
  /** True once an administrator has approved. */
  isVerified: boolean;
}

interface ILeanUser {
  role?: Role | null;
  onboardingStage?: string;
  farmerData?: { verificationStatus?: VerificationStatus; isVerified?: boolean };
  buyerData?: {
    verificationStatus?: VerificationStatus;
    isVerified?: boolean;
    buyerType?: BuyerType;
  };
  lecturerData?: { isVerified?: boolean; facultyCredentialLetterUrl?: string };
}

// A lecturer carries no verificationStatus field — the admin lecturer queue
// works off isVerified — so its state is derived from what it does have: an
// uploaded credential letter means "submitted, awaiting review".
function readState(user: ILeanUser): IVerificationState {
  switch (user.role) {
    case Role.FARMER:
      return {
        role: Role.FARMER,
        status: user.farmerData?.verificationStatus ?? VerificationStatus.UNSUBMITTED,
        buyerType: null,
        isVerified: Boolean(user.farmerData?.isVerified),
      };
    case Role.BUYER:
      return {
        role: Role.BUYER,
        status: user.buyerData?.verificationStatus ?? VerificationStatus.UNSUBMITTED,
        // Records predating the branch have no value. INDIVIDUAL is the safe
        // default: it asks for an identity document, which every buyer has.
        buyerType: user.buyerData?.buyerType ?? BuyerType.INDIVIDUAL,
        isVerified: Boolean(user.buyerData?.isVerified),
      };
    case Role.LECTURER:
      return {
        role: Role.LECTURER,
        status: user.lecturerData?.isVerified
          ? VerificationStatus.APPROVED
          : user.lecturerData?.facultyCredentialLetterUrl
            ? VerificationStatus.PENDING
            : VerificationStatus.UNSUBMITTED,
        buyerType: null,
        isVerified: Boolean(user.lecturerData?.isVerified),
      };
    default:
      throw new AppError(
        'Verification does not apply to your account.',
        409,
        'VERIFICATION_WRONG_ROLE'
      );
  }
}

const SELECT =
  'role onboardingStage farmerData.verificationStatus farmerData.isVerified ' +
  'buyerData.verificationStatus buyerData.isVerified buyerData.buyerType ' +
  'lecturerData.isVerified lecturerData.facultyCredentialLetterUrl';

async function loadUser(userId: string): Promise<ILeanUser> {
  await connectDB();
  const { default: User } = await import('@/lib/models/User.model');
  const user = (await User.findById(userId).select(SELECT).lean()) as ILeanUser | null;
  if (!user) {
    throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
  }
  return user;
}

function requireUserId(session: { user?: { id?: string } } | null): string {
  if (!session?.user?.id) {
    throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
  }
  return session.user.id;
}

// ---------------------------------------------------------------------------
// GET — what the verification screen needs to know before it renders. Asking
// the server means the screen never guesses which document to request, and a
// buyer is never shown a form for the archetype they did not choose.
// ---------------------------------------------------------------------------
export async function GET(): Promise<NextResponse> {
  try {
    const userId = requireUserId(await getServerSession(authOptions));
    return NextResponse.json({ data: readState(await loadUser(userId)) });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST — record a submission and put the account in the review queue.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = requireUserId(await getServerSession(authOptions));
    const user = await loadUser(userId);
    const state = readState(user);

    if (state.status === VerificationStatus.APPROVED) {
      throw new AppError('Your account is already verified.', 409, 'VERIFICATION_ALREADY_APPROVED');
    }
    if (state.status === VerificationStatus.PENDING) {
      throw new AppError(
        'Your verification is under review. You will be notified when it is complete.',
        409,
        'VERIFICATION_PENDING'
      );
    }

    const body: unknown = await req.json();
    const built = buildUpdate(state, body);
    if (!built.ok) return validationFailed(built.details);
    const set = built.set;

    // A row still sitting on the legacy VERIFICATION_UPLOAD stage is normalised
    // here. `isOnboardingComplete` already treats that stage as done, so this
    // changes no behaviour — it just lets the data converge on one terminal
    // value instead of leaving a retired one on the record indefinitely.
    if (user.onboardingStage !== OnboardingStage.COMPLETED) {
      set.onboardingStage = OnboardingStage.COMPLETED;
    }

    const { default: User } = await import('@/lib/models/User.model');
    await User.findByIdAndUpdate(userId, { $set: set });

    logger.info('verification', 'Verification submitted', { userId, role: state.role });

    // Neither message names the document. Nothing here has inspected the upload
    // — the schema checks only that it is a Cloudinary URL — so calling it "your
    // tax compliance certificate" asserts something the platform does not know.
    // It said exactly that to a live account whose upload was a photo of
    // something else, because the form had demanded a certificate the user did
    // not have. The administrator names the document at review time.
    void notify({
      userId,
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'Verification received — your documents are under review',
      body: 'Thank you. Your documents are with our review team and an administrator will look at them shortly. You can keep using UmojaHub in the meantime.',
      relatedEntity: { kind: 'User', id: userId },
    });
    void notifyAdmins({
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'New verification request',
      body: `A ${String(state.role).toLowerCase()} submitted documents for verification. Open the verification queue to review.`,
      relatedEntity: { kind: 'User', id: userId },
    });

    return NextResponse.json({
      data: { ...state, status: VerificationStatus.PENDING },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Either the fields to write or the field errors to return. A result type
// rather than a module-level scratch variable: route handlers serve concurrent
// requests from one module instance, so shared mutable state there would let
// one request's errors surface in another's response.
type BuildResult =
  | { ok: true; set: Record<string, unknown> }
  | { ok: false; details: unknown };

function buildUpdate(state: IVerificationState, body: unknown): BuildResult {
  switch (state.role) {
    case Role.FARMER: {
      const parsed = farmerOnboardingVerificationSchema.safeParse(body);
      if (!parsed.success) return { ok: false, details: parsed.error.flatten() };
      return {
        ok: true,
        set: {
          'farmerData.documentType': parsed.data.documentType,
          'farmerData.documentNumber': parsed.data.documentNumber,
          'farmerData.documentImageUrl': parsed.data.documentImageUrl,
          'farmerData.verificationStatus': VerificationStatus.PENDING,
          ...(parsed.data.landOwnershipToken !== undefined && {
            'farmerData.landOwnershipToken': parsed.data.landOwnershipToken,
          }),
        },
      };
    }
    case Role.BUYER: {
      const parsed = buyerOnboardingVerificationSchema.safeParse(body);
      if (!parsed.success) return { ok: false, details: parsed.error.flatten() };
      // The submitted buyerType must match the account's own. Without this a
      // client could send BUSINESS for an individual account and store a
      // certificate the record has no organisation to attach it to.
      if (parsed.data.buyerType !== state.buyerType) {
        return {
          ok: false,
          details: {
            fieldErrors: {
              buyerType: ['This does not match the kind of buyer on your account.'],
            },
          },
        };
      }
      // An individual proves identity with a document; a business proves
      // standing with a KRA certificate. Separate fields are what let the
      // acknowledgement stay true.
      return {
        ok: true,
        set:
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
              },
      };
    }
    default: {
      const parsed = lecturerOnboardingVerificationSchema.safeParse(body);
      if (!parsed.success) return { ok: false, details: parsed.error.flatten() };
      return {
        ok: true,
        set: {
          'lecturerData.facultyCredentialLetterUrl': parsed.data.facultyCredentialLetterUrl,
        },
      };
    }
  }
}

function validationFailed(details: unknown): NextResponse {
  return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_FAILED', details },
    { status: 400 }
  );
}
