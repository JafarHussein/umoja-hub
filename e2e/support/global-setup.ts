import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { encode } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import UserModel from '@/lib/models/User.model';
import OrderModel from '@/lib/models/Order.model';
import WithdrawalRequestModel from '@/lib/models/WithdrawalRequest.model';
import FarmerGroupModel from '@/lib/models/FarmerGroup.model';
import GroupOrderModel from '@/lib/models/GroupOrder.model';
import MediationRequestModel from '@/lib/models/MediationRequest.model';
import {
  Role,
  OnboardingStage,
  UserStatus,
  VerificationStatus,
  FulfillmentType,
  ListingUnit,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationCategory,
  MediationRequestStatus,
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

// UI-04 read-only group hub: a cooperative created by the verified farmer
// (manager variant) with the unverified farmer as a second roster member, plus
// one group order for the histories section. supplierId is a dangling ref —
// the orders API populates it to null and the card falls back to "Supplier".
const FIXTURE_GROUP_NAME = 'E2E Cooperative';
const FIXTURE_GROUP_ORDER_INPUT = 'Fertilizer (DAP)';
const FIXTURE_SUPPLIER_ID = '000000000000000000000002';
const FIXTURE_GROUP_ORDER_DEADLINE = new Date('2099-01-01T00:00:00.000Z');

// UI-06 buyer mediation: a second buyer order that already carries an OPEN
// mediation, used to assert the UNDER_MEDIATION alert bar. Its farmerId is a
// dangling ref so it never enters the fixture farmer's orders/ledger (which
// would skew UI-01/UI-02). E2E-FAR-0001 stays mediation-free for the
// escalation-gate test.
const FIXTURE_ORDER2_REF = 'E2E-FAR-0002';
const FIXTURE_ORDER2_PAID_AT = new Date('2025-12-01T00:00:00.000Z');
const FIXTURE_ORDER2_FARMER_ID = '000000000000000000000003';

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

    // Clear all of the buyer's mediations so E2E-FAR-0001 starts each run with
    // no escalation (escalation-gate test) and the canonical OPEN mediation
    // below is the only one.
    await MediationRequestModel.deleteMany({ buyerId });

    // Second buyer order (dangling farmer) carrying an OPEN mediation, for the
    // UNDER_MEDIATION alert bar.
    const order2 = await OrderModel.findOneAndUpdate(
      { orderReferenceId: FIXTURE_ORDER2_REF },
      {
        $set: {
          listingId: FIXTURE_LISTING_ID,
          farmerId: FIXTURE_ORDER2_FARMER_ID,
          buyerId,
          cropName: 'Spinach',
          quantityOrdered: 30,
          unit: ListingUnit.KG,
          pricePerUnit: 60,
          totalAmountKES: 1800,
          fulfillmentType: FulfillmentType.DELIVERY,
          buyerPhone: '+254700000011',
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
          paidAt: FIXTURE_ORDER2_PAID_AT,
        },
        $unset: { confirmedByFarmerAt: '', receivedByBuyerAt: '' },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    if (order2) {
      await MediationRequestModel.findOneAndUpdate(
        { orderId: order2._id },
        {
          $set: {
            orderId: order2._id,
            buyerId,
            farmerId: FIXTURE_ORDER2_FARMER_ID,
            category: MediationCategory.NOT_DELIVERED,
            description: 'Order has not arrived after the expected delivery window.',
            status: MediationRequestStatus.OPEN,
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }

  // UI-04 group fixture: verified farmer is creator + member, unverified farmer
  // is a second member, plus one group order for the histories section.
  const unverifiedFarmerId = idsByKey.get('farmer-unverified');
  if (farmerId && unverifiedFarmerId) {
    const group = await FarmerGroupModel.findOneAndUpdate(
      { groupName: FIXTURE_GROUP_NAME },
      {
        $set: {
          groupName: FIXTURE_GROUP_NAME,
          county: 'Kiambu',
          createdBy: farmerId,
          members: [farmerId, unverifiedFarmerId],
          memberCount: 2,
          status: 'ACTIVE',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    if (group) {
      await GroupOrderModel.findOneAndUpdate(
        { groupId: group._id, inputType: FIXTURE_GROUP_ORDER_INPUT },
        {
          $set: {
            groupId: group._id,
            proposedBy: farmerId,
            supplierId: FIXTURE_SUPPLIER_ID,
            inputType: FIXTURE_GROUP_ORDER_INPUT,
            quantityPerMember: 2,
            pricePerMember: 3500,
            joiningDeadline: FIXTURE_GROUP_ORDER_DEADLINE,
            minimumMembers: 5,
            status: 'OPEN',
            participatingMembers: [{ userId: farmerId, paymentStatus: 'PENDING' }],
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }

  await mongoose.disconnect();
}
