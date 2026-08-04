import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import {
  farmerIdentitySchema,
  buyerIdentitySchema,
  studentIdentitySchema,
  lecturerIdentitySchema,
} from '@/lib/validation/onboardingSchema';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { Role, OnboardingStage } from '@/types';
import type { ZodType } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/onboarding/identity — Stage 2: role-conditional identity (AUTH-05)
// Auth: onboarding user with a role set (stage must be IDENTITY_INPUT).
// Fills the common identity columns (lastName/phoneNumber/county) plus the
// role-specific sub-document fields, then advances to VERIFICATION_UPLOAD.
// githubUsername is never accepted here — it is OAuth-sourced (UI-12).
// ---------------------------------------------------------------------------

const SCHEMA_BY_ROLE: Record<string, ZodType> = {
  [Role.FARMER]: farmerIdentitySchema,
  [Role.BUYER]: buyerIdentitySchema,
  [Role.STUDENT]: studentIdentitySchema,
  [Role.LECTURER]: lecturerIdentitySchema,
};

// Maps the role-specific identity fields onto their sub-document paths.
function roleIdentityUpdate(role: string, data: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  const put = (path: string, value: unknown): void => {
    if (value !== undefined) set[path] = value;
  };

  switch (role) {
    case Role.FARMER:
      put('farmerData.primaryLanguage', data.primaryLanguage);
      put('farmerData.cropsGrown', data.cropsGrown);
      put('farmerData.farmSizeAcres', data.farmSizeAcres);
      put('farmerData.cooperativeName', data.cooperativeName);
      break;
    case Role.BUYER:
      // The discriminator decides which of the fields below exist at all: an
      // INDIVIDUAL carries none of the organisation ones, and `put` skips
      // undefined, so nothing is written for questions they were never asked.
      put('buyerData.buyerType', data.buyerType);
      put('buyerData.organizationName', data.organizationName);
      put('buyerData.businessRegistrationNumber', data.businessRegistrationNumber);
      put('buyerData.corporatePaybill', data.corporatePaybill);
      put('buyerData.procurementScale', data.procurementScale);
      put('buyerData.preferredCounties', data.preferredCounties);
      put('buyerData.purchaseInterests', data.purchaseInterests);
      break;
    case Role.STUDENT:
      put('studentData.academicRegistrationNumber', data.academicRegistrationNumber);
      put('studentData.universityAffiliation', data.universityAffiliation);
      put('studentData.primaryInterest', data.primaryInterest);
      put('studentData.programme', data.programme);
      put('studentData.graduationYear', data.graduationYear);
      break;
    case Role.LECTURER:
      put('lecturerData.departmentAssignment', data.departmentAssignment);
      put('lecturerData.academicStaffId', data.academicStaffId);
      put('lecturerData.universityAffiliation', data.universityAffiliation);
      put('lecturerData.position', data.position);
      break;
  }
  return set;
}

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
    if (user.onboardingStage !== OnboardingStage.IDENTITY_INPUT) {
      throw new AppError('Complete the previous step first.', 409, 'ONBOARDING_INVALID_STAGE');
    }

    const schema = user.role ? SCHEMA_BY_ROLE[user.role] : undefined;
    if (!schema) {
      throw new AppError('Select a role before submitting identity.', 409, 'ONBOARDING_NO_ROLE');
    }

    const body: unknown = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data as Record<string, unknown>;

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        county: data.county,
        onboardingStage: OnboardingStage.VERIFICATION_UPLOAD,
        ...roleIdentityUpdate(user.role as string, data),
      },
    });

    logger.info('onboarding', 'Identity submitted', {
      userId: session.user.id,
      role: user.role,
    });

    return NextResponse.json({
      data: { onboardingStage: OnboardingStage.VERIFICATION_UPLOAD },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
