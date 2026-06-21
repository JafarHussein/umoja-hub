// Shared enums — import from here, never use magic strings in the codebase
// ---------------------------------------------------------------------------

export enum Role {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  STUDENT = 'STUDENT',
  LECTURER = 'LECTURER',
  ADMIN = 'ADMIN',
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

// Progressive onboarding funnel (Decision 02-A). A new OAuth user has no role
// and walks ROLE_SELECTION → IDENTITY_INPUT → VERIFICATION_UPLOAD → COMPLETED.
// AUTH-02 writes the starting stage on OAuth account creation; AUTH-05 advances
// it as each onboarding step is submitted.
export enum OnboardingStage {
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
}

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
