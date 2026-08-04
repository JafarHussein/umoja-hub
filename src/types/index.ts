// Shared enums — import from here, never use magic strings in the codebase
// ---------------------------------------------------------------------------

export enum Role {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  STUDENT = 'STUDENT',
  LECTURER = 'LECTURER',
  ADMIN = 'ADMIN',
  // An institution hosts students and lecturers, and is the Education Hub's
  // academic-context integration: it supplies what a student is actually
  // studying so project recommendations can be grounded in their coursework
  // rather than guessed. Provisioned by an administrator, never self-selected.
  //
  // NGO and EMPLOYER were removed (2026-08-04). Neither had a path to existence
  // — they were absent from `roleSelectionSchema`, so no real person could
  // become one, and they existed only in seeded data. Employers keep the
  // surface that mattered: a student portfolio is public at /portfolio/[slug]
  // and needs no account to read.
  INSTITUTION = 'INSTITUTION',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum VerificationStatus {
  UNSUBMITTED = 'UNSUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Which kind of buyer an account is. The platform serves both a hotel group
// sourcing by the tonne and a household buying a crate, and it used to model
// only the first: organisation name, business registration number and a KRA tax
// compliance certificate were required of everyone. An individual has none of
// the three, so the funnel — which had no "not applicable" and no way out —
// collected fabricated ones instead, and the platform then reported them back
// as fact. What is asked for follows from this field.
export enum BuyerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  [BuyerType.INDIVIDUAL]: 'Individual buyer',
  [BuyerType.BUSINESS]: 'Business or organisation',
};

// Progressive onboarding funnel (Decision 02-A). A new OAuth user has no role
// and walks ROLE_SELECTION → IDENTITY_INPUT → VERIFICATION_UPLOAD → COMPLETED.
// AUTH-02 writes the starting stage on OAuth account creation; AUTH-05 advances
// it as each onboarding step is submitted.
export enum OnboardingStage {
  // AUTH_ONBOARDING_FLOW_V3: OAuth comes first and creates the account, so a
  // brand-new user lands here — authenticated, but with no password and no role
  // yet. Everything before this stage is handled by the identity provider.
  PASSWORD_SETUP = 'PASSWORD_SETUP',
  ROLE_SELECTION = 'ROLE_SELECTION',
  IDENTITY_INPUT = 'IDENTITY_INPUT',
  VERIFICATION_UPLOAD = 'VERIFICATION_UPLOAD',
  COMPLETED = 'COMPLETED',
}

// Identity provider a user authenticated with (Decision 01-B). Absent for
// legacy credentials accounts until the CredentialsProvider is retired (AUTH-07).
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum OrderPaymentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum OrderFulfillmentStatus {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_FULFILLMENT = 'IN_FULFILLMENT',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

// Buyer-facing display labels for the order lifecycle. One source of truth so
// the orders list and the order detail screen never drift (Kenyan localization
// pass — display text only; the enum values above are the API/DB contract).
// Fulfilment progress within IN_FULFILLMENT — a descriptive axis, deliberately
// SEPARATE from OrderFulfillmentStatus.
//
// Escrow custody and fulfilment progress are different questions. The escrow
// held-guard, the balance aggregation, the mediation gate and the admin ledger
// all key on `fulfillmentStatus === IN_FULFILLMENT`; putting delivery progress
// on its own field means the farmer can narrate the journey without any of
// those invariants having to change. Nothing here moves money.
export enum FulfillmentStage {
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

// Forward-only. A farmer may skip ahead (produce collected straight from the
// farm never sits READY) but may never walk a stage back — the buyer has
// already been told, and a reversal would make the trail a lie.
export const FULFILLMENT_STAGE_ORDER: FulfillmentStage[] = [
  FulfillmentStage.PREPARING,
  FulfillmentStage.READY,
  FulfillmentStage.IN_TRANSIT,
  FulfillmentStage.DELIVERED,
];

export const FULFILLMENT_STAGE_LABEL: Record<FulfillmentStage, string> = {
  [FulfillmentStage.PREPARING]: 'Preparing produce',
  [FulfillmentStage.READY]: 'Ready for collection',
  [FulfillmentStage.IN_TRANSIT]: 'On the way',
  [FulfillmentStage.DELIVERED]: 'Delivered',
};

export const ORDER_FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'Awaiting payment',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'Being prepared',
  [OrderFulfillmentStatus.RECEIVED]: 'Received',
  [OrderFulfillmentStatus.COMPLETED]: 'Completed',
  [OrderFulfillmentStatus.DISPUTED]: 'Disputed',
};

export const ORDER_PAYMENT_LABEL: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.PENDING_PAYMENT]: 'Awaiting payment',
  [OrderPaymentStatus.PAID]: 'Paid',
  [OrderPaymentStatus.FAILED]: 'Payment failed',
  [OrderPaymentStatus.REFUNDED]: 'Refunded',
};

export enum ListingStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
  INACTIVE = 'INACTIVE',
}

export enum ListingUnit {
  KG = 'KG',
  BAG = 'BAG',
  CRATE = 'CRATE',
  LITRE = 'LITRE',
  PIECE = 'PIECE',
}

// Marketplace produce taxonomy (Marketplace Rebuild, Stage 3). Powers the feed
// category nav, filters, and the create-listing form. Extensible by design:
// adding a category is a one-line change to the enum + the two constants below —
// no schema migration and no admin UI required.
export enum ListingCategory {
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  CEREALS = 'CEREALS',
  LEGUMES = 'LEGUMES',
  LIVESTOCK = 'LIVESTOCK',
  DAIRY = 'DAIRY',
  POULTRY = 'POULTRY',
  SEEDS = 'SEEDS',
  FARM_INPUTS = 'FARM_INPUTS',
  EQUIPMENT = 'EQUIPMENT',
}

// Display order for the category nav and pickers — one source of truth so the
// feed, filters, and listing form never drift.
export const LISTING_CATEGORY_ORDER: ListingCategory[] = [
  ListingCategory.VEGETABLES,
  ListingCategory.FRUITS,
  ListingCategory.CEREALS,
  ListingCategory.LEGUMES,
  ListingCategory.LIVESTOCK,
  ListingCategory.DAIRY,
  ListingCategory.POULTRY,
  ListingCategory.SEEDS,
  ListingCategory.FARM_INPUTS,
  ListingCategory.EQUIPMENT,
];

export const LISTING_CATEGORY_LABEL: Record<ListingCategory, string> = {
  [ListingCategory.VEGETABLES]: 'Vegetables',
  [ListingCategory.FRUITS]: 'Fruits',
  [ListingCategory.CEREALS]: 'Cereals & Grains',
  [ListingCategory.LEGUMES]: 'Legumes',
  [ListingCategory.LIVESTOCK]: 'Livestock',
  [ListingCategory.DAIRY]: 'Dairy',
  [ListingCategory.POULTRY]: 'Poultry',
  [ListingCategory.SEEDS]: 'Seeds',
  [ListingCategory.FARM_INPUTS]: 'Farm Inputs',
  [ListingCategory.EQUIPMENT]: 'Equipment',
};

export enum DocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  COOPERATIVE_CARD = 'COOPERATIVE_CARD',
  PASSPORT = 'PASSPORT',
}

export enum FarmerTrustTier {
  NEW = 'NEW',
  ESTABLISHED = 'ESTABLISHED',
  TRUSTED = 'TRUSTED',
  PREMIUM = 'PREMIUM',
}

export enum StudentTier {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum PortfolioStrength {
  BUILDING = 'BUILDING',
  DEVELOPING = 'DEVELOPING',
  STRONG = 'STRONG',
  EXCEPTIONAL = 'EXCEPTIONAL',
}

export enum ProjectTrack {
  OPEN_SOURCE = 'OPEN_SOURCE',
  AI_BRIEF = 'AI_BRIEF',
}

export enum ProjectStatus {
  BRIEF_GENERATED = 'BRIEF_GENERATED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  UNDER_PEER_REVIEW = 'UNDER_PEER_REVIEW',
  UNDER_LECTURER_REVIEW = 'UNDER_LECTURER_REVIEW',
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  DENIED = 'DENIED',
}

export enum LecturerDecision {
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  DENIED = 'DENIED',
}

export enum PriceHistorySource {
  LISTING_CREATED = 'LISTING_CREATED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  EXTERNAL_INGESTION = 'EXTERNAL_INGESTION',
}

export enum KnowledgeCategory {
  FERTILIZER_VERIFICATION = 'FERTILIZER_VERIFICATION',
  SEED_VERIFICATION = 'SEED_VERIFICATION',
  ANIMAL_HEALTH = 'ANIMAL_HEALTH',
  PEST_DISEASE = 'PEST_DISEASE',
  SEASONAL_CALENDAR = 'SEASONAL_CALENDAR',
  POST_HARVEST = 'POST_HARVEST',
  MARKET_DYNAMICS = 'MARKET_DYNAMICS',
  NEW_METHODS = 'NEW_METHODS',
}

export enum SupplierInputCategory {
  FERTILIZER = 'FERTILIZER',
  SEED = 'SEED',
  PESTICIDE = 'PESTICIDE',
  VETERINARY = 'VETERINARY',
  EQUIPMENT = 'EQUIPMENT',
}

export enum SupplierVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  DISSOLVED = 'DISSOLVED',
}

export enum GroupOrderStatus {
  OPEN = 'OPEN',
  MINIMUM_MET = 'MINIMUM_MET',
  CLOSED = 'CLOSED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export enum PriceAlertNotificationMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH',
}

export enum PeerReviewStatus {
  ASSIGNED = 'ASSIGNED',
  SUBMITTED = 'SUBMITTED',
  WAIVED = 'WAIVED',
}

export enum FulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum BuyerContactPreference {
  PHONE = 'PHONE',
  PLATFORM_MESSAGE = 'PLATFORM_MESSAGE',
}

export enum WithdrawalRequestStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum MediationRequestStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum MediationCategory {
  NOT_DELIVERED = 'NOT_DELIVERED',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  WRONG_QUANTITY = 'WRONG_QUANTITY',
  OTHER = 'OTHER',
  // Farmer-side: the buyer has the produce but has not confirmed receipt, so
  // the escrow will not release. Previously the farmer had no way to raise this
  // at all — only buyers could escalate.
  RECEIPT_NOT_CONFIRMED = 'RECEIPT_NOT_CONFIRMED',
}

// Which party raised an escalation. Both can now; the gates and the categories
// available differ by side.
export enum MediationInitiator {
  BUYER = 'BUYER',
  FARMER = 'FARMER',
}

// Categories each side may file under.
export const BUYER_MEDIATION_CATEGORIES: MediationCategory[] = [
  MediationCategory.NOT_DELIVERED,
  MediationCategory.QUALITY_ISSUE,
  MediationCategory.WRONG_QUANTITY,
  MediationCategory.OTHER,
];

export const FARMER_MEDIATION_CATEGORIES: MediationCategory[] = [
  MediationCategory.RECEIPT_NOT_CONFIRMED,
  MediationCategory.OTHER,
];

// ---------------------------------------------------------------------------
// Payments — provider abstraction + simulation layer
// The order/webhook contract is provider-agnostic: the simulator emits the same
// Daraja-shaped callbacks the real provider would, through the same processor.
// ---------------------------------------------------------------------------

export enum PaymentProviderName {
  SIMULATION = 'simulation',
  DARAJA_SANDBOX = 'daraja-sandbox',
  DARAJA_PRODUCTION = 'daraja-production',
}

// Outcomes a simulated STK push can resolve to. Each maps to a real Daraja
// ResultCode so the downstream contract is identical to production.
export enum SimulatedOutcome {
  SUCCESS = 'SUCCESS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_CANCELLED = 'USER_CANCELLED',
  PHONE_UNREACHABLE = 'PHONE_UNREACHABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  // The callback is never delivered — exercises the stuck-payment/reconciliation
  // path (the order sits PENDING_PAYMENT until the cron reconciles it).
  LOST = 'LOST',
}

export enum SimulatedPaymentStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
}

export enum PaymentEventType {
  INITIATED = 'INITIATED',
  CALLBACK_RECEIVED = 'CALLBACK_RECEIVED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
  TIMEOUT = 'TIMEOUT',
  LOST = 'LOST',
  RECONCILED = 'RECONCILED',
}

// ---------------------------------------------------------------------------
// Escrow — a derived view over Order + MediationRequest, not a stored wallet.
// The platform receives buyer funds to its M-Pesa shortcode at payment (PAID),
// holds them through fulfilment, and they become releasable to the farmer only
// once the buyer confirms receipt (order COMPLETED). An open mediation blocks
// release; an admin refund returns the funds to the buyer (REFUNDED/DISPUTED).
// EscrowState is the per-order projection surfaced to all three roles.
// ---------------------------------------------------------------------------

export enum EscrowState {
  // Order not yet paid (PENDING_PAYMENT) or payment failed — nothing is held.
  NO_FUNDS = 'NO_FUNDS',
  // Paid and in fulfilment, farmer has not yet confirmed dispatch.
  HELD = 'HELD',
  // Paid and in fulfilment, farmer confirmed dispatch — awaiting buyer receipt.
  HELD_DISPATCHED = 'HELD_DISPATCHED',
  // An open/in-review mediation is blocking release.
  HELD_UNDER_REVIEW = 'HELD_UNDER_REVIEW',
  // Buyer confirmed receipt (COMPLETED) — funds count toward the farmer's
  // releasable balance and may be settled via a payout request.
  RELEASABLE = 'RELEASABLE',
  // Funds returned to the buyer by an admin dispute resolution.
  REFUNDED = 'REFUNDED',
}

// Admin's terminal decision when resolving a mediation, applied to the held
// funds. NONE = resolved without moving money (order continues on its track).
export enum MediationOutcome {
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  NONE = 'NONE',
}

// Append-only escrow milestone trail (mirrors PaymentEventLog). HELD when funds
// enter custody at payment; RELEASED when the buyer (or an admin resolution)
// confirms receipt and funds become the farmer's; REFUND_ISSUED when an admin
// returns held funds to the buyer.
export enum EscrowEventType {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUND_ISSUED = 'REFUND_ISSUED',
}

// ---------------------------------------------------------------------------
// Ecosystem extensions — NGO / Employer / Institution, notifications, portfolios
// ---------------------------------------------------------------------------

export enum InstitutionType {
  UNIVERSITY = 'UNIVERSITY',
  COLLEGE = 'COLLEGE',
  POLYTECHNIC = 'POLYTECHNIC',
  TVET = 'TVET',
}

// Whether a student portfolio is reachable by its public slug (employers) or
// private to the student.
export enum PortfolioVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

// Persisted in-app notification taxonomy. The channel records how it was also
// delivered out-of-band (the existing fire-and-forget SMS/email), if at all.
export enum NotificationType {
  WELCOME = 'WELCOME',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ESCROW_UPDATE = 'ESCROW_UPDATE',
  VERIFICATION_UPDATE = 'VERIFICATION_UPDATE',
  PAYOUT_UPDATE = 'PAYOUT_UPDATE',
  REVIEW_UPDATE = 'REVIEW_UPDATE',
  PORTFOLIO_VIEW = 'PORTFOLIO_VIEW',
  GROUP_UPDATE = 'GROUP_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

// Lifecycle of one ecosystem-simulation run. The SimulationRun ledger records
// every entity a run created so a reset can delete exactly those documents and
// never touch genuine user data.
export enum SimulationRunStatus {
  BUILDING = 'BUILDING',
  ACTIVE = 'ACTIVE',
  RESETTING = 'RESETTING',
  RESET = 'RESET',
}

// ---------------------------------------------------------------------------
// Kenyan counties (used in validation and seed data)
// ---------------------------------------------------------------------------

export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot',
] as const;

export type KenyanCounty = (typeof KENYAN_COUNTIES)[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_GROUP_MEMBERS = 50;
export const MIN_GROUP_ORDER_MEMBERS = 5;
export const CHAT_SESSION_TTL_DAYS = 90;
export const MENTOR_SESSION_TTL_DAYS = 30;
export const PRICE_ALERT_COOLDOWN_HOURS = 24;
export const MAX_LISTING_IMAGES = 5;
export const BCRYPT_SALT_ROUNDS = 12;
export const REVIEW_MIN_WORD_COUNT = 50;
export const MAX_ASSISTANT_MESSAGE_CHARS = 1000;
export const GITHUB_CACHE_TTL_MINUTES = 60;
export const MEDIATION_ESCALATION_HOURS = 48;

// How long a farmer waits, after confirming dispatch, before they may ask
// UmojaHub to review a buyer who has not confirmed receipt.
//
// This is also the platform's answer to "when do I get paid?": release is the
// buyer's to give, but it is not open-ended. Seven days is long enough for
// upcountry transport and a buyer's inspection, short enough that a farmer's
// money is never stranded indefinitely by silence.
export const FARMER_ESCALATION_HOURS = 168;
