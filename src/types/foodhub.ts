import type {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ListingStatus,
  ListingUnit,
  FarmerTrustTier,
  VerificationStatus,
  PriceHistorySource,
  KnowledgeCategory,
  SupplierInputCategory,
  SupplierVerificationStatus,
  GroupStatus,
  GroupOrderStatus,
  PriceAlertNotificationMethod,
  FulfillmentType,
  BuyerContactPreference,
} from './index';

// ---------------------------------------------------------------------------
// Farmer Trust Score
// ---------------------------------------------------------------------------

export interface IFarmerTrustScore {
  _id: string;
  farmerId: string;
  verificationScore: number;
  transactionScore: {
    completedOrders: number;
    totalVolumeKES: number;
    scoreContribution: number;
  };
  ratingScore: {
    averageRating: number;
    totalRatings: number;
    scoreContribution: number;
  };
  reliabilityScore: {
    onTimeConfirmationRate: number;
    disputeCount: number;
    disputesRuledAgainst: number;
    scoreContribution: number;
  };
  compositeScore: number;
  tier: FarmerTrustTier;
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Marketplace Listing
// ---------------------------------------------------------------------------

export interface IMarketplaceListing {
  _id: string;
  farmerId: string;
  title: string;
  cropName: string;
  description: string;
  quantityAvailable: number;
  unit: ListingUnit;
  currentPricePerUnit: number;
  pickupCounty: string;
  pickupDescription: string;
  imageUrls: string[];
  listingStatus: ListingStatus;
  isVerifiedListing: boolean;
  viewCount: number;
  buyerContactPreference: BuyerContactPreference[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export interface IOrder {
  _id: string;
  orderReferenceId: string;
  listingId: string;
  farmerId: string;
  buyerId: string;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  pricePerUnit: number;
  totalAmountKES: number;
  fulfillmentType: FulfillmentType;
  paymentStatus: OrderPaymentStatus;
  mpesaCheckoutRequestId?: string;
  mpesaTransactionId?: string;
  buyerPhone: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  paidAt?: Date;
  confirmedByFarmerAt?: Date;
  receivedByBuyerAt?: Date;
  disputeFlaggedAt?: Date;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Price History
// ---------------------------------------------------------------------------

export interface IPriceHistory {
  _id: string;
  cropName: string;
  county: string;
  pricePerUnit: number;
  unit: string;
  source: PriceHistorySource;
  farmerId?: string;
  orderId?: string;
  recordedAt: Date;
}

// ---------------------------------------------------------------------------
// Price Alert
// ---------------------------------------------------------------------------

export interface IPriceAlert {
  _id: string;
  farmerId: string;
  cropName: string;
  county: string;
  targetPricePerUnit: number;
  unit: string;
  notificationMethod: PriceAlertNotificationMethod;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

export interface IRating {
  _id: string;
  orderId: string;
  farmerId: string;
  buyerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Farmer Group
// ---------------------------------------------------------------------------

export interface IFarmerGroup {
  _id: string;
  groupName: string;
  county: string;
  createdBy: string;
  members: string[];
  memberCount: number;
  status: GroupStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Group Order
// ---------------------------------------------------------------------------

export interface IGroupOrderMember {
  userId: string;
  paymentStatus: 'PENDING' | 'PAID';
  mpesaTransactionId?: string;
  paidAt?: Date;
}

export interface IGroupOrder {
  _id: string;
  groupId: string;
  proposedBy: string;
  supplierId: string;
  inputType: string;
  quantityPerMember: number;
  pricePerMember: number;
  joiningDeadline: Date;
  minimumMembers: number;
  status: GroupOrderStatus;
  participatingMembers: IGroupOrderMember[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Verified Supplier
// ---------------------------------------------------------------------------

export interface IVerifiedSupplier {
  _id: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  county: string;
  physicalAddress?: string;
  inputCategories: SupplierInputCategory[];
  registrations: {
    kebsNumber?: string;
    pcpbNumber?: string;
    kephisNumber?: string;
  };
  verificationStatus: SupplierVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Knowledge Article
// ---------------------------------------------------------------------------

export interface IKnowledgeArticle {
  _id: string;
  slug: string;
  title: string;
  category: KnowledgeCategory;
  sourceInstitution: string;
  sourceUrl?: string;
  author?: string;
  cropTags: string[];
  summary: string;
  content: string;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Chat Session (Farm Assistant)
// ---------------------------------------------------------------------------

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatSession {
  _id: string;
  farmerId: string;
  messages: IChatMessage[];
  weatherContextUsed: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Market Insight (cron-only)
// ---------------------------------------------------------------------------

export interface IMarketInsight {
  _id: string;
  cropName: string;
  county: string;
  weekOf: Date;
  pricing: {
    averageListingPrice: number;
    averageTransactionPrice: number;
    lowestPrice: number;
    highestPrice: number;
    middlemanBenchmark?: number;
    platformPremium?: number;
    dataPointCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Platform Impact Summary (nightly cron singleton)
// ---------------------------------------------------------------------------

export interface IPlatformImpactSummary {
  _id: string;
  computedAt: Date;
  food: {
    verifiedFarmerCount: number;
    activeBuyerCount: number;
    completedOrderCount: number;
    totalTransactionVolumeKES: number;
    averagePlatformPremium: number;
    activeCropCount: number;
    countiesRepresented: number;
    avgTrustScore: number;
  };
  education: {
    registeredStudentCount: number;
    verifiedProjectCount: number;
    activeStudentCount: number;
    averageProjectScore: number;
    skillsIssuedCount: number;
    lecturerCount: number;
    universitiesRepresented: number;
  };
}

// ---------------------------------------------------------------------------
// Farmer verification submission payload (used in API)
// ---------------------------------------------------------------------------

export interface IFarmerVerificationDecision {
  farmerId: string;
  decision: VerificationStatus.APPROVED | VerificationStatus.REJECTED;
  rejectionReason?: string;
}
