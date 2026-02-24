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
