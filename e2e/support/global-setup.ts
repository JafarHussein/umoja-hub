import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { encode } from 'next-auth/jwt';
import mongoose from 'mongoose';
import {
  connectToE2EDatabase,
  dropE2EDatabase,
  resolveE2EDatabaseUri,
  writeHarnessMarker,
} from './database';
import UserModel from '@/lib/models/User.model';
import OrderModel from '@/lib/models/Order.model';
import WithdrawalRequestModel from '@/lib/models/WithdrawalRequest.model';
import FarmerGroupModel from '@/lib/models/FarmerGroup.model';
import GroupOrderModel from '@/lib/models/GroupOrder.model';
import MediationRequestModel from '@/lib/models/MediationRequest.model';
import MarketplaceListingModel from '@/lib/models/MarketplaceListing.model';
import ProjectEngagementModel from '@/lib/models/ProjectEngagement.model';
import PeerReviewModel from '@/lib/models/PeerReview.model';
import VerifiedSupplierModel from '@/lib/models/VerifiedSupplier.model';
import SimulatedPaymentModel from '@/lib/models/SimulatedPayment.model';
import {
  Role,
  OnboardingStage,
  UserStatus,
  VerificationStatus,
  FulfillmentType,
  ListingUnit,
  ListingStatus,
  BuyerContactPreference,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationCategory,
  MediationRequestStatus,
  ProjectTrack,
  ProjectStatus,
  StudentTier,
  PeerReviewStatus,
  SupplierInputCategory,
  SupplierVerificationStatus,
  OAuthProvider,
  WithdrawalRequestStatus,
} from '@/types';
import {
  E2E_USERS,
  AUTH_DIR,
  authFile,
  FIXTURE_ENGAGEMENT_ID,
  type E2EUserFixture,
} from './auth';

// Deterministic fixture order for UI-01 (Farmer Fulfillment Pipeline). It sits
// in the only state the "Confirm dispatch" prompt acts on — PAID +
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

// UI-07 checkout: a real AVAILABLE listing (fixed id) so the detail page renders
// the CheckoutForm with the quantity lock. The order POST + payment-status are
// intercepted in the spec, so no real Daraja call is made.
const FIXTURE_LISTING_DETAIL_ID = '000000000000000000000010';
const FIXTURE_LISTING_STOCK = 25;

// UI-08 student developer log workbench: an IN_PROGRESS engagement (id from
// auth.ts) with all 3 process documents present (each with its real SHA-256
// hash) so the workbench shows 3/3, the per-document hashes, and Finalize →
// Submit.
const FIXTURE_ENGAGEMENT_DOC_AT = new Date('2026-01-01T00:00:00.000Z');

// UI-09 peer review: a de-identified reviewee engagement (dangling author) plus
// a PeerReview ASSIGNED to the student fixture as reviewer.
const FIXTURE_PEER_ENGAGEMENT_ID = '000000000000000000000021';
const FIXTURE_PEER_REVIEW_ID = '000000000000000000000022';
const FIXTURE_PEER_AUTHOR_ID = '000000000000000000000023';

// UI-10 lecturer review: a UNDER_LECTURER_REVIEW engagement any verified
// lecturer can open. Dangling author (never populated → "Unknown student"),
// kept off the student fixture so it doesn't shadow the UI-08 `me` engagement.
const FIXTURE_LECTURER_ENGAGEMENT_ID = '000000000000000000000024';

// UI-11 supplier directory: one VERIFIED supplier so the read-only directory
// (shown in both the farmer and buyer hubs via GET /api/suppliers) renders a
// card with registrations. Upserted by businessName so re-runs are idempotent.
const FIXTURE_SUPPLIER_NAME = 'E2E Agrovet Supplies';

// UI-13 admin payout queue: one REQUESTED withdrawal so the queue renders a
// decidable row. Owned by the UNVERIFIED farmer fixture (the verified farmer's
// withdrawals are wiped for the UI-02 ledger determinism), with a fixed _id so
// re-runs reset it back to REQUESTED even if a prior run decided it.
const FIXTURE_PAYOUT_ID = '000000000000000000000030';

// Payment-simulation Lab: a PENDING_PAYMENT order the admin can force outcomes
// on. Dangling farmer (never enters the fixture farmer's ledgers/orders). Reset
// to pending each run, and its simulated-payment rows cleared, so the
// force-success e2e is idempotent.
const FIXTURE_SIM_ORDER_REF = 'E2E-SIM-0001';
const FIXTURE_SIM_CHECKOUT_ID = 'ws_CO_sim_e2e';

// ---------------------------------------------------------------------------
// Global setup: provision per-role fixtures and mint their session JWTs.
//
// The middleware (`getToken`) and server components (`getServerSession`) both
// decode the NextAuth session cookie with NEXTAUTH_SECRET and never re-read the
// DB on a page load, so a JWT signed here with the same secret is accepted as a
// real session. The token's `id` points at the upserted user so data-backed
// screens resolve real records.
// ---------------------------------------------------------------------------

// Identifies this run in the harness marker, so a database left behind by an
// interrupted run can be told apart from the one the current run built.
const RUN_ID = `e2e-${new Date().toISOString()}-${process.pid}`;

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
      // UI-12 identity records: department + staff ID are onboarding-captured,
      // read-only in the lecturer profile. oauthProvider drives the "Sign-in
      // provider" row.
      return {
        oauthProvider: OAuthProvider.GOOGLE,
        lecturerData: {
          isVerified: fixture.isVerified,
          departmentAssignment: 'Computer Science',
          academicStaffId: 'STAFF-E2E-001',
        },
      };
    case Role.STUDENT:
      // UI-12 identity records: githubUsername is OAuth-sourced, the
      // institutional fields are onboarding-captured — all read-only.
      return {
        oauthProvider: OAuthProvider.GITHUB,
        studentData: {
          githubUsername: 'e2e-student',
          institutionalEmail: 'student@uni.e2e.test',
          institutionalEmailVerified: true,
          academicRegistrationNumber: 'REG-E2E-001',
        },
      };
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

  // Everything below writes fixtures. It goes to the harness's own database or
  // it does not happen at all — see e2e/support/database.ts for why there is no
  // fallback to MONGODB_URI.
  //
  // Drop first, and before connecting the models. Dropping first means a run
  // killed mid-flight — which never reaches its teardown — cannot leave the
  // next one inheriting its state. Doing it before `connectToE2EDatabase`
  // means the ownership guard runs before any model can create a collection,
  // and the indexes Mongoose builds on connect land on a database that is not
  // about to be dropped underneath them.
  await dropE2EDatabase(resolveE2EDatabaseUri());
  await connectToE2EDatabase();
  await writeHarnessMarker(RUN_ID);

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

    // Keep the settlement ledger (UI-02) deterministic. The single PAID fixture
    // order is IN_FULFILLMENT, so under escrow its KSh 4,000 is HELD (released
    // only on buyer-confirmed receipt) and the available balance is zero. Clear
    // any withdrawal a prior run/manual test may have filed.
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

    // UI-07 checkout listing (AVAILABLE, fixed stock) owned by the verified farmer.
    await MarketplaceListingModel.findOneAndUpdate(
      { _id: FIXTURE_LISTING_DETAIL_ID },
      {
        $set: {
          farmerId,
          title: 'E2E Sukuma Wiki — Grade A',
          cropName: 'Sukuma Wiki',
          description: 'Fresh sukuma wiki harvested this morning, ready for collection.',
          quantityAvailable: FIXTURE_LISTING_STOCK,
          unit: ListingUnit.KG,
          currentPricePerUnit: 50,
          pickupCounty: 'Kiambu',
          pickupDescription: 'Pickup at the Kiambu town depot, weekday mornings.',
          listingStatus: ListingStatus.AVAILABLE,
          isVerifiedListing: true,
          buyerContactPreference: [BuyerContactPreference.PHONE],
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
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

  // UI-08 student developer log workbench: an IN_PROGRESS engagement with all 3
  // process documents present (each with its real SHA-256 hash).
  const studentId = idsByKey.get('student');
  if (studentId) {
    const buildDoc = (content: string) => ({
      content,
      hash: createHash('sha256').update(content).digest('hex'),
      submittedAt: FIXTURE_ENGAGEMENT_DOC_AT,
    });
    await ProjectEngagementModel.findOneAndUpdate(
      { _id: FIXTURE_ENGAGEMENT_ID },
      {
        $set: {
          studentId,
          track: ProjectTrack.AI_BRIEF,
          tier: StudentTier.BEGINNER,
          status: ProjectStatus.IN_PROGRESS,
          brief: {
            title: 'E2E Developer Log',
            clientPersona: {
              businessType: 'Agrovet',
              county: 'Nakuru',
              context: 'A two-branch agrovet tracking seed and fertiliser stock by hand.',
            },
            problemStatement:
              'The agrovet cannot see stock levels across both shops and frequently runs out of fast-moving inputs.',
            coreRequirements: ['Track stock per shop', 'Low-stock alerts'],
            technicalConstraints: [],
            kenyanContextConstraints: [],
            deliverables: ['Inventory CRUD', 'Daily low-stock summary'],
            suggestedTechStack: ['Next.js', 'MongoDB'],
            estimatedComplexity: 'MEDIUM',
          },
          documents: {
            problemBreakdown: buildDoc(
              'The client, a Nakuru agrovet, needs a simple stock tracker for seed and fertiliser inventory across two shops.'
            ),
            approachPlan: buildDoc(
              "Build a Next.js app with a MongoDB inventory model, role-based access, and a daily low-stock SMS summary via Africa's Talking."
            ),
            finalReflection: buildDoc(
              'I learned to scope tightly: shipping the stock CRUD first, then layering alerts, kept the build focused and testable.'
            ),
            blockerLog: [],
            aiUsageLog: [],
          },
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // UI-09: reviewee engagement (dangling author — never populated, so the
    // reviewer never sees an identity) + a PeerReview assigned to the student.
    await ProjectEngagementModel.findOneAndUpdate(
      { _id: FIXTURE_PEER_ENGAGEMENT_ID },
      {
        $set: {
          studentId: FIXTURE_PEER_AUTHOR_ID,
          track: ProjectTrack.AI_BRIEF,
          tier: StudentTier.BEGINNER,
          status: ProjectStatus.UNDER_PEER_REVIEW,
          brief: { title: 'Peer Project — Market Stall Tracker' },
          documents: {
            problemBreakdown: buildDoc(
              'Market stall vendors in Nairobi need a lightweight way to record daily sales and restock reminders.'
            ),
            approachPlan: buildDoc(
              'A mobile-first PWA with offline-first storage syncing to a small API; daily totals and a restock list.'
            ),
            finalReflection: buildDoc(
              'Offline sync was the hardest part; I would add conflict resolution and a clearer empty state next time.'
            ),
            blockerLog: [],
            aiUsageLog: [],
          },
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await PeerReviewModel.findOneAndUpdate(
      { _id: FIXTURE_PEER_REVIEW_ID },
      {
        $set: {
          engagementId: FIXTURE_PEER_ENGAGEMENT_ID,
          reviewerId: studentId,
          status: PeerReviewStatus.ASSIGNED,
        },
        // Reset to a clean unsubmitted state so the review form renders each run.
        $unset: { scores: '', comments: '', submittedAt: '' },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  // UI-10 lecturer review engagement (dangling author, UNDER_LECTURER_REVIEW).
  await ProjectEngagementModel.findOneAndUpdate(
    { _id: FIXTURE_LECTURER_ENGAGEMENT_ID },
    {
      $set: {
        studentId: FIXTURE_PEER_AUTHOR_ID,
        track: ProjectTrack.AI_BRIEF,
        tier: StudentTier.INTERMEDIATE,
        status: ProjectStatus.UNDER_LECTURER_REVIEW,
        brief: { title: 'Lecturer Review Project' },
        documents: {
          problemBreakdown: {
            content:
              'The cooperative needs a shared ledger so member deliveries reconcile against payouts each week.',
            hash: createHash('sha256')
              .update('lecturer-review-problem')
              .digest('hex'),
            submittedAt: FIXTURE_ENGAGEMENT_DOC_AT,
          },
          approachPlan: {
            content:
              'A Next.js dashboard backed by MongoDB with weekly reconciliation jobs and an export to CSV.',
            hash: createHash('sha256').update('lecturer-review-approach').digest('hex'),
            submittedAt: FIXTURE_ENGAGEMENT_DOC_AT,
          },
          finalReflection: {
            content:
              'Reconciliation edge cases around partial deliveries took the most time and taught me to model state explicitly.',
            hash: createHash('sha256').update('lecturer-review-reflection').digest('hex'),
            submittedAt: FIXTURE_ENGAGEMENT_DOC_AT,
          },
          blockerLog: [
            {
              stuckOn: 'Weekly job double-counted re-submitted deliveries.',
              resolution: 'Added an idempotency key per delivery before aggregating.',
              durationHours: 3,
              loggedAt: FIXTURE_ENGAGEMENT_DOC_AT,
            },
          ],
          aiUsageLog: [
            {
              toolUsed: 'ChatGPT',
              prompt: 'How do I dedupe records before a sum aggregation in MongoDB?',
              outputReceived: 'Suggested a $group on the idempotency key first.',
              studentAction: 'Adapted the suggestion into the reconciliation pipeline.',
              loggedAt: FIXTURE_ENGAGEMENT_DOC_AT,
              source: 'manual',
            },
          ],
        },
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // Payment-simulation Lab fixture: a PENDING_PAYMENT order (dangling farmer)
  // the admin Payment Lab can force a real simulated outcome on. Reset to
  // pending each run; its prior simulated-payment rows are cleared.
  if (buyerId) {
    const simOrder = await OrderModel.findOneAndUpdate(
      { orderReferenceId: FIXTURE_SIM_ORDER_REF },
      {
        $set: {
          listingId: FIXTURE_LISTING_ID,
          farmerId: FIXTURE_ORDER2_FARMER_ID,
          buyerId,
          cropName: 'Maize',
          quantityOrdered: 20,
          unit: ListingUnit.KG,
          pricePerUnit: 50,
          totalAmountKES: 1000,
          fulfillmentType: FulfillmentType.PICKUP,
          buyerPhone: '+254700000012',
          paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
          fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
          mpesaCheckoutRequestId: FIXTURE_SIM_CHECKOUT_ID,
        },
        $unset: {
          mpesaTransactionId: '',
          paidAt: '',
          confirmedByFarmerAt: '',
          receivedByBuyerAt: '',
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    if (simOrder) {
      await SimulatedPaymentModel.deleteMany({ orderId: simOrder._id });
    }
  }

  // UI-13 admin payout queue: a REQUESTED withdrawal owned by the unverified
  // farmer fixture so the queue has a decidable row. Fixed _id + $set status
  // makes it idempotent (a prior run's decision is reset back to REQUESTED).
  if (unverifiedFarmerId) {
    await WithdrawalRequestModel.findOneAndUpdate(
      { _id: FIXTURE_PAYOUT_ID },
      {
        $set: {
          farmerId: unverifiedFarmerId,
          amountKES: 2500,
          status: WithdrawalRequestStatus.REQUESTED,
        },
        $unset: { resolvedBy: '', resolvedAt: '', note: '' },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  // UI-11 supplier directory: a single VERIFIED supplier with registrations so
  // the read-only directory renders a populated card in both hubs.
  await VerifiedSupplierModel.findOneAndUpdate(
    { businessName: FIXTURE_SUPPLIER_NAME },
    {
      $set: {
        businessName: FIXTURE_SUPPLIER_NAME,
        contactPhone: '+254700000020',
        contactEmail: 'supplies@e2e.test',
        county: 'Nakuru',
        physicalAddress: 'Nakuru Industrial Area, Plot 14',
        inputCategories: [SupplierInputCategory.FERTILIZER, SupplierInputCategory.SEED],
        registrations: { kebsNumber: 'KEBS-E2E-001', kephisNumber: 'KEPHIS-E2E-001' },
        verificationStatus: SupplierVerificationStatus.VERIFIED,
        verifiedAt: FIXTURE_ENGAGEMENT_DOC_AT,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await mongoose.disconnect();
}
