import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { encode } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import UserModel from '@/lib/models/User.model';
import OrderModel from '@/lib/models/Order.model';
import WithdrawalRequestModel from '@/lib/models/WithdrawalRequest.model';
import {
  Role,
  OnboardingStage,
  UserStatus,
  VerificationStatus,
  FulfillmentType,
  ListingUnit,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
} from '@/types';
import { E2E_USERS, AUTH_DIR, authFile, type E2EUserFixture } from './auth';

// Deterministic fixture order for UI-01 (Farmer Fulfillment Pipeline). It sits
// in the only state the "Confirm Carrier Handover" prompt acts on — PAID +
// IN_FULFILLMENT + not yet confirmed — so the FIX-01 `canConfirmDispatch` flag
// is true. `paidAt` is a fixed instant; specs freeze the clock relative to it so
// the 24-h countdown text is stable across runs.
const FIXTURE_ORDER_REF = 'E2E-FAR-0001';
const FIXTURE_ORDER_PAID_AT = new Date('2026-01-01T00:00:00.000Z');
const FIXTURE_LISTING_ID = '000000000000000000000001';

// ---------------------------------------------------------------------------
// Global setup: provision per-role fixtures and mint their session JWTs.
//
// The middleware (`getToken`) and server components (`getServerSession`) both
// decode the NextAuth session cookie with NEXTAUTH_SECRET and never re-read the
// DB on a page load, so a JWT signed here with the same secret is accepted as a
// real session. The token's `id` points at the upserted user so data-backed
// screens resolve real records.
// ---------------------------------------------------------------------------

const SESSION_MAX_AGE = 24 * 60 * 60; // matches authOptions.session.maxAge
// Non-secure cookie name: NEXTAUTH_URL is http://localhost in dev/CI, so
// NextAuth uses the unprefixed name (the `__Secure-` prefix is https-only).
const COOKIE_NAME = 'next-auth.session-token';

// Minimal role sub-document carrying the verification flag the screens branch
// on. Top-level required fields are only email + firstName (User.model.ts).
function roleData(fixture: E2EUserFixture): Record<string, unknown> {
  switch (fixture.role) {
    case Role.FARMER:
      return {
        farmerData: {
          verificationStatus: fixture.isVerified
            ? VerificationStatus.APPROVED
            : VerificationStatus.PENDING,
          isVerified: fixture.isVerified,
        },
      };
    case Role.BUYER:
      return {
        buyerData: {
          verificationStatus: fixture.isVerified
            ? VerificationStatus.APPROVED
            : VerificationStatus.PENDING,
          isVerified: fixture.isVerified,
        },
      };
    case Role.LECTURER:
      return { lecturerData: { isVerified: fixture.isVerified } };
    case Role.STUDENT:
      return { studentData: { githubUsername: 'e2e-student' } };
    default:
      return {};
  }
}

export default async function globalSetup(): Promise<void> {
  // Load .env.local exactly as the dev server / seed script do, so the secret
  // used to mint cookies matches the secret the running server verifies with.
  loadEnvConfig(process.cwd());

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to mint e2e session tokens.');
  }

  await connectDB();
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const idsByKey = new Map<string, string>();

  for (const fixture of E2E_USERS) {
    const user = await UserModel.findOneAndUpdate(
      { email: fixture.email },
      {
        $set: {
          email: fixture.email,
          firstName: fixture.firstName,
          role: fixture.role,
          onboardingStage: OnboardingStage.COMPLETED,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          ...roleData(fixture),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, lean: true }
    );

    if (!user) {
      throw new Error(`Failed to provision e2e fixture: ${fixture.email}`);
    }

    const id = String((user as { _id: unknown })._id);
    idsByKey.set(fixture.key, id);

    const token = await encode({
      token: {
        id,
        sub: id,
        email: fixture.email,
        firstName: fixture.firstName,
        role: fixture.role,
        onboardingStage: OnboardingStage.COMPLETED,
        isOnboarded: true,
        isVerified: fixture.isVerified,
      },
      secret,
      maxAge: SESSION_MAX_AGE,
    });

    const storageState = {
      cookies: [
        {
          name: COOKIE_NAME,
          value: token,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax' as const,
          expires: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
        },
      ],
      origins: [],
    };

    fs.writeFileSync(authFile(fixture.key), JSON.stringify(storageState, null, 2));
  }

  // UI-01 fixture order: PAID + IN_FULFILLMENT + not yet confirmed so the farmer
  // orders screen renders the live handover prompt. $unset keeps it re-runnable —
  // a prior run that confirmed the order is reset back to the unconfirmed state.
  const farmerId = idsByKey.get('farmer');
  const buyerId = idsByKey.get('buyer');
  if (farmerId && buyerId) {
    await OrderModel.findOneAndUpdate(
      { orderReferenceId: FIXTURE_ORDER_REF },
      {
        $set: {
          listingId: FIXTURE_LISTING_ID,
          farmerId,
          buyerId,
          cropName: 'Tomatoes',
          quantityOrdered: 50,
          unit: ListingUnit.KG,
          pricePerUnit: 80,
          totalAmountKES: 4000,
          fulfillmentType: FulfillmentType.PICKUP,
          buyerPhone: '+254700000010',
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
          paidAt: FIXTURE_ORDER_PAID_AT,
        },
        $unset: { confirmedByFarmerAt: '', receivedByBuyerAt: '' },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Keep the settlement ledger (UI-02) deterministic: with no committed
    // payouts the fixture farmer's available balance always equals the single
    // PAID fixture order (KES 4,000). Clears anything a prior run/manual test
    // may have filed.
    await WithdrawalRequestModel.deleteMany({ farmerId });
  }

  await mongoose.disconnect();
}
