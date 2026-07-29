/**
 * scripts/seed.ts — UmojaHub database seed script
 *
 * Run with: npm run db:seed
 * Never runs in production (safety guard at top of file).
 *
 * Execution order respects foreign-key references:
 *   1. Drop all collections
 *   2. Users
 *   3. FarmerTrustScores
 *   4. MarketplaceListings
 *   5. KnowledgeArticles
 *   6. VerifiedSuppliers
 *   7. BriefContextLibrary (singleton)
 *   8. MarketInsight records
 *   9. StudentPortfolioStatus records
 *  10. Orders
 *  11. Log completion
 */

// ---------------------------------------------------------------------------
// Safety guard — never seed production
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === 'production') {
  console.error('DANGER: Seed script cannot run in production environment.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load environment variables (Next.js .env / .env.local)
// ---------------------------------------------------------------------------

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/lib/db';
import {
  Role,
  VerificationStatus,
  ListingStatus,
  ListingUnit,
  ListingCategory,
  FarmerTrustTier,
  KnowledgeCategory,
  SupplierInputCategory,
  SupplierVerificationStatus,
  StudentTier,
  PortfolioStrength,
  BCRYPT_SALT_ROUNDS,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  ProjectTrack,
  ProjectStatus,
  PeerReviewStatus,
  LecturerDecision,
  PriceHistorySource,
} from '../src/types';

// ---------------------------------------------------------------------------
// Model imports (must come after loadEnvConfig to avoid MONGODB_URI errors)
// ---------------------------------------------------------------------------

import User from '../src/lib/models/User.model';
import FarmerTrustScore from '../src/lib/models/FarmerTrustScore.model';
import MarketplaceListing from '../src/lib/models/MarketplaceListing.model';
import KnowledgeArticle from '../src/lib/models/KnowledgeArticle.model';
import VerifiedSupplier from '../src/lib/models/VerifiedSupplier.model';
import BriefContextLibrary from '../src/lib/models/BriefContextLibrary.model';
import MarketInsight from '../src/lib/models/MarketInsight.model';
import StudentPortfolioStatus from '../src/lib/models/StudentPortfolioStatus.model';
import Order from '../src/lib/models/Order.model';
import ProjectEngagement from '../src/lib/models/ProjectEngagement.model';
import PeerReview from '../src/lib/models/PeerReview.model';
import LecturerReview from '../src/lib/models/LecturerReview.model';
import LecturerEffectiveness from '../src/lib/models/LecturerEffectiveness.model';
import Rating from '../src/lib/models/Rating.model';
import PriceHistory from '../src/lib/models/PriceHistory.model';
import VerificationAuditLog from '../src/lib/models/VerificationAuditLog.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[seed] ${msg}`); // eslint-disable-line no-console
}

async function hashPw(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_SALT_ROUNDS);
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function docDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

interface IPriceSeriesOptions {
  cropName: string;
  county: string;
  unit: ListingUnit;
  farmerId: mongoose.Types.ObjectId;
  /** Price at the most recent point in the series. */
  endPrice: number;
  /** Percent change across the whole span; positive means rising. */
  driftPct: number;
  /** Number of observations. Must clear MIN_POINTS (3) after unit filtering. */
  points: number;
  /** Age in days of the oldest observation. */
  spanDays: number;
  /** Attached to the most recent ORDER_COMPLETED point, when supplied. */
  orderId?: mongoose.Types.ObjectId;
}

/**
 * Builds a back-dated price series for one crop/county/unit.
 *
 * Dates are relative to the seed run, not absolute. The Price Intelligence
 * Engine weights points on a 21-day half-life inside a 90-day window, so the
 * previous hard-coded 2024 timestamps put every row outside the window and the
 * recommendation panel rendered its empty state on a freshly seeded database.
 *
 * Sources alternate so the engine sees both aspirational asking prices and
 * settled sales — the split that drives its confidence score.
 */
function priceSeries(options: IPriceSeriesOptions): Record<string, unknown>[] {
  const { cropName, county, unit, farmerId, endPrice, driftPct, points, spanDays } = options;
  const startPrice = endPrice / (1 + driftPct / 100);

  return Array.from({ length: points }, (_, i) => {
    const progress = points === 1 ? 1 : i / (points - 1);
    const daysAgo = Math.round(spanDays * (1 - progress));
    // Alternating jitter keeps the series from looking synthetic without
    // introducing outliers that would distort the weighted median.
    const jitter = i % 2 === 0 ? 1 : -1;
    const price = Math.round(startPrice + (endPrice - startPrice) * progress + jitter * endPrice * 0.01);
    const isSale = i % 2 === 1;

    return {
      cropName,
      county,
      pricePerUnit: price,
      unit,
      source: isSale ? PriceHistorySource.ORDER_COMPLETED : PriceHistorySource.LISTING_CREATED,
      farmerId,
      ...(isSale && i === points - 1 && options.orderId ? { orderId: options.orderId } : {}),
      recordedAt: docDate(daysAgo),
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  await connectDB();
  log('Connected to MongoDB Atlas.');

  // -------------------------------------------------------------------------
  // 1. Drop all collections
  // -------------------------------------------------------------------------

  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    log(`Dropped collection: ${col.name}`);
  }

  // -------------------------------------------------------------------------
  // 2. Users
  // -------------------------------------------------------------------------

  log('Inserting users...');

  const farmerPassword = await hashPw('Farmer@2024!');
  const buyerPassword = await hashPw('Buyer@2024!');
  const studentPassword = await hashPw('Student@2024!');
  const lecturerPassword = await hashPw('Lecturer@2024!');
  const adminPassword = await hashPw('Admin@Umoja2024!');

  const users = await User.insertMany([
    // Farmers
    {
      firstName: 'Wanjiku',
      lastName: 'Kamau',
      email: 'wanjiku.kamau@gmail.com',
      hashedPassword: farmerPassword,
      role: Role.FARMER,
      phoneNumber: '+254712345678',
      county: 'Kirinyaga',
      status: 'ACTIVE',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        cropsGrown: ['tomatoes', 'rice', 'capsicum'],
        livestockKept: [],
        farmSizeAcres: 3,
        primaryLanguage: 'kikuyu',
      },
    },
    {
      firstName: 'Kipchoge',
      lastName: 'Mutai',
      email: 'kipchoge.mutai@gmail.com',
      hashedPassword: farmerPassword,
      role: Role.FARMER,
      phoneNumber: '+254723456789',
      county: 'Uasin Gishu',
      status: 'ACTIVE',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        cropsGrown: ['maize', 'wheat', 'beans'],
        livestockKept: ['dairy cows'],
        farmSizeAcres: 8,
        primaryLanguage: 'kalenjin',
      },
    },
    {
      firstName: 'Achieng',
      lastName: 'Odhiambo',
      email: 'achieng.odhiambo@gmail.com',
      hashedPassword: farmerPassword,
      role: Role.FARMER,
      phoneNumber: '+254734567890',
      county: 'Kisumu',
      status: 'ACTIVE',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        cropsGrown: ['maize', 'kale', 'sweet potatoes'],
        livestockKept: ['tilapia fish (pond)'],
        farmSizeAcres: 2,
        primaryLanguage: 'luo',
      },
    },
    {
      firstName: 'Njoroge',
      lastName: 'Mwangi',
      email: 'njoroge.mwangi@gmail.com',
      hashedPassword: farmerPassword,
      role: Role.FARMER,
      phoneNumber: '+254745678901',
      county: 'Nyandarua',
      status: 'ACTIVE',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        cropsGrown: ['potatoes', 'peas', 'carrots'],
        livestockKept: ['dairy cows', 'sheep'],
        farmSizeAcres: 5,
        primaryLanguage: 'kikuyu',
      },
    },
    {
      firstName: 'Chebet',
      lastName: 'Koech',
      email: 'chebet.koech@gmail.com',
      hashedPassword: farmerPassword,
      role: Role.FARMER,
      phoneNumber: '+254756789012',
      county: 'Kericho',
      status: 'ACTIVE',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        cropsGrown: ['tea', 'maize'],
        livestockKept: ['dairy cows'],
        farmSizeAcres: 4,
        primaryLanguage: 'kalenjin',
      },
    },
    // Buyers
    {
      firstName: 'Kamau',
      lastName: 'Githinji',
      email: 'kamau.githinji@gmail.com',
      hashedPassword: buyerPassword,
      role: Role.BUYER,
      phoneNumber: '+254767890123',
      county: 'Nairobi',
      status: 'ACTIVE',
    },
    {
      firstName: 'Fatuma',
      lastName: 'Hassan',
      email: 'fatuma.hassan@gmail.com',
      hashedPassword: buyerPassword,
      role: Role.BUYER,
      phoneNumber: '+254778901234',
      county: 'Mombasa',
      status: 'ACTIVE',
    },
    {
      firstName: 'Peter',
      lastName: 'Otieno',
      email: 'peter.otieno@gmail.com',
      hashedPassword: buyerPassword,
      role: Role.BUYER,
      phoneNumber: '+254789012345',
      county: 'Kisumu',
      status: 'ACTIVE',
    },
    // Students
    {
      firstName: 'Brian',
      lastName: 'Otieno',
      email: 'brian.otieno@students.uonbi.ac.ke',
      hashedPassword: studentPassword,
      role: Role.STUDENT,
      phoneNumber: '+254790123456',
      county: 'Nairobi',
      status: 'ACTIVE',
      studentData: {
        currentTier: StudentTier.BEGINNER,
        githubUsername: 'brianotieno-dev',
        primaryInterest: 'backend',
        techStackPreferences: ['Node.js', 'MongoDB', 'Express'],
        universityAffiliation: 'University of Nairobi',
        completedProjectCount: 0,
      },
    },
    {
      firstName: 'Amina',
      lastName: 'Waweru',
      email: 'amina.waweru@strathmore.edu',
      hashedPassword: studentPassword,
      role: Role.STUDENT,
      phoneNumber: '+254701234567',
      county: 'Nairobi',
      status: 'ACTIVE',
      studentData: {
        currentTier: StudentTier.INTERMEDIATE,
        githubUsername: 'aminawaweru',
        primaryInterest: 'fullstack',
        techStackPreferences: ['React', 'Next.js', 'TypeScript', 'MongoDB'],
        universityAffiliation: 'Strathmore University',
        completedProjectCount: 0,
      },
    },
    {
      firstName: 'Dennis',
      lastName: 'Kariuki',
      email: 'dennis.kariuki@jkuat.ac.ke',
      hashedPassword: studentPassword,
      role: Role.STUDENT,
      phoneNumber: '+254712345670',
      county: 'Kiambu',
      status: 'ACTIVE',
      studentData: {
        currentTier: StudentTier.BEGINNER,
        githubUsername: 'dkariuki-jkuat',
        primaryInterest: 'mobile',
        techStackPreferences: ['React Native', 'JavaScript', 'Firebase'],
        universityAffiliation: 'Jomo Kenyatta University of Agriculture and Technology',
        completedProjectCount: 0,
      },
    },
    // Lecturers
    {
      firstName: 'Dr. Grace',
      lastName: "Ndung'u",
      email: 'g.ndungu@uonbi.ac.ke',
      hashedPassword: lecturerPassword,
      role: Role.LECTURER,
      phoneNumber: '+254723456780',
      county: 'Nairobi',
      status: 'ACTIVE',
      lecturerData: {
        universityAffiliation: 'University of Nairobi — School of Computing and Informatics',
        isVerified: true,
      },
    },
    {
      firstName: 'Prof. James',
      lastName: 'Mwangi',
      email: 'j.mwangi@strathmore.edu',
      hashedPassword: lecturerPassword,
      role: Role.LECTURER,
      phoneNumber: '+254734567801',
      county: 'Nairobi',
      status: 'ACTIVE',
      lecturerData: {
        universityAffiliation: 'Strathmore University — Faculty of Information Technology',
        isVerified: false,
      },
    },
    // Admin
    {
      firstName: 'UmojaHub',
      lastName: 'Admin',
      email: 'umojahub16@gmail.com',
      hashedPassword: adminPassword,
      role: Role.ADMIN,
      phoneNumber: '+254700000001',
      county: 'Nairobi',
      status: 'ACTIVE',
    },
  ]);

  // V2 credentials login (AUTH_ONBOARDING_FLOW_V2): every seeded account gets a
  // deterministic username derived from its email local-part so the demo users
  // can sign in with username + password (the validation rule is 3–20 chars of
  // [a-z0-9_]). Uniqueness is guarded with a numeric suffix.
  const usedUsernames = new Set<string>();
  for (const u of users) {
    let base = (u.email.split('@')[0] ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 20);
    if (base.length < 3) base = `${base}_user`.slice(0, 20);
    let username = base;
    let n = 1;
    while (usedUsernames.has(username)) {
      username = `${base.slice(0, 18)}_${n}`.slice(0, 20);
      n += 1;
    }
    usedUsernames.add(username);
    u.username = username;
    await u.save();
  }
  log(`Assigned usernames to ${users.length} users.`);

  // Build lookup maps by email for foreign key references
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  const wanjiku = userByEmail.get('wanjiku.kamau@gmail.com')!;
  const kipchoge = userByEmail.get('kipchoge.mutai@gmail.com')!;
  const achieng = userByEmail.get('achieng.odhiambo@gmail.com')!;
  const njoroge = userByEmail.get('njoroge.mwangi@gmail.com')!;
  const chebet = userByEmail.get('chebet.koech@gmail.com')!;
  const kamau = userByEmail.get('kamau.githinji@gmail.com')!;
  const fatuma = userByEmail.get('fatuma.hassan@gmail.com')!;
  const peter = userByEmail.get('peter.otieno@gmail.com')!;
  const brian = userByEmail.get('brian.otieno@students.uonbi.ac.ke')!;
  const amina = userByEmail.get('amina.waweru@strathmore.edu')!;
  const dennis = userByEmail.get('dennis.kariuki@jkuat.ac.ke')!;
  const admin = userByEmail.get('umojahub16@gmail.com')!;

  log(`Inserted ${users.length} users.`);

  // -------------------------------------------------------------------------
  // 3. FarmerTrustScores
  // -------------------------------------------------------------------------

  log('Inserting FarmerTrustScores...');

  const now = new Date();

  await FarmerTrustScore.insertMany([
    {
      farmerId: wanjiku._id,
      verificationScore: 40,
      transactionScore: {
        completedOrders: 12,
        totalVolumeKES: 85000,
        scoreContribution: 18,
      },
      ratingScore: {
        averageRating: 4.6,
        totalRatings: 10,
        scoreContribution: 17,
      },
      reliabilityScore: {
        onTimeConfirmationRate: 0.92,
        disputeCount: 0,
        disputesRuledAgainst: 0,
        scoreContribution: 12,
      },
      compositeScore: 87,
      tier: FarmerTrustTier.TRUSTED,
      lastCalculatedAt: now,
    },
    {
      farmerId: kipchoge._id,
      verificationScore: 40,
      transactionScore: {
        completedOrders: 28,
        totalVolumeKES: 320000,
        scoreContribution: 25,
      },
      ratingScore: {
        averageRating: 4.8,
        totalRatings: 22,
        scoreContribution: 19,
      },
      reliabilityScore: {
        onTimeConfirmationRate: 0.96,
        disputeCount: 1,
        disputesRuledAgainst: 0,
        scoreContribution: 13,
      },
      compositeScore: 94,
      tier: FarmerTrustTier.PREMIUM,
      lastCalculatedAt: now,
    },
    {
      farmerId: achieng._id,
      verificationScore: 40,
      transactionScore: {
        completedOrders: 6,
        totalVolumeKES: 32000,
        scoreContribution: 10,
      },
      ratingScore: {
        averageRating: 4.3,
        totalRatings: 5,
        scoreContribution: 14,
      },
      reliabilityScore: {
        onTimeConfirmationRate: 0.85,
        disputeCount: 1,
        disputesRuledAgainst: 0,
        scoreContribution: 8,
      },
      compositeScore: 72,
      tier: FarmerTrustTier.ESTABLISHED,
      lastCalculatedAt: now,
    },
    {
      farmerId: njoroge._id,
      verificationScore: 40,
      transactionScore: {
        completedOrders: 17,
        totalVolumeKES: 140000,
        scoreContribution: 22,
      },
      ratingScore: {
        averageRating: 4.5,
        totalRatings: 14,
        scoreContribution: 16,
      },
      reliabilityScore: {
        onTimeConfirmationRate: 0.94,
        disputeCount: 0,
        disputesRuledAgainst: 0,
        scoreContribution: 13,
      },
      compositeScore: 81,
      tier: FarmerTrustTier.TRUSTED,
      lastCalculatedAt: now,
    },
    {
      farmerId: chebet._id,
      verificationScore: 40,
      transactionScore: {
        completedOrders: 4,
        totalVolumeKES: 18000,
        scoreContribution: 7,
      },
      ratingScore: {
        averageRating: 4.2,
        totalRatings: 3,
        scoreContribution: 13,
      },
      reliabilityScore: {
        onTimeConfirmationRate: 0.88,
        disputeCount: 0,
        disputesRuledAgainst: 0,
        scoreContribution: 9,
      },
      compositeScore: 69,
      tier: FarmerTrustTier.ESTABLISHED,
      lastCalculatedAt: now,
    },
  ]);

  log('Inserted 5 FarmerTrustScores.');

  // -------------------------------------------------------------------------
  // 4. MarketplaceListings
  // -------------------------------------------------------------------------

  log('Inserting MarketplaceListings...');

  const listings = await MarketplaceListing.insertMany([
    {
      farmerId: wanjiku._id,
      title: 'Grade A Tomatoes — Kirinyaga Central',
      cropName: 'Tomatoes',
      category: ListingCategory.VEGETABLES,
      description:
        'Fresh tomatoes harvested this week from well-irrigated farm in Kirinyaga. Grade A — firm, red, uniform size. Available for pickup at Kerugoya town.',
      quantityAvailable: 200,
      unit: ListingUnit.KG,
      currentPricePerUnit: 55,
      pickupCounty: 'Kirinyaga',
      pickupDescription:
        'Kerugoya Market — opposite KCB Bank. Available Mon-Sat 7am-6pm. Call before coming.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: wanjiku._id,
      title: 'Green and Red Capsicum — Kirinyaga',
      cropName: 'Capsicum',
      category: ListingCategory.VEGETABLES,
      description:
        'Mixed green and red capsicum, 2-3 weeks post-harvest. Well-suited for restaurants and hotels. No pesticide residue — last spray was 3 weeks ago.',
      quantityAvailable: 80,
      unit: ListingUnit.KG,
      currentPricePerUnit: 90,
      pickupCounty: 'Kirinyaga',
      pickupDescription: 'Kerugoya Market — opposite KCB Bank.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: kipchoge._id,
      title: 'Dry Maize — H614D Variety, Uasin Gishu',
      cropName: 'Maize',
      category: ListingCategory.CEREALS,
      description:
        'H614D hybrid maize, well dried to 13.5% moisture content. 90kg bags. Grown in Uasin Gishu highland. No aflatoxin issues — stored in certified grain store.',
      quantityAvailable: 50,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 3800,
      pickupCounty: 'Uasin Gishu',
      pickupDescription: 'Turbo town, off Eldoret-Kisumu road. GPS coordinates available on request.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: kipchoge._id,
      title: 'Rose Coco Beans — Uasin Gishu',
      cropName: 'Beans',
      category: ListingCategory.LEGUMES,
      description:
        'Rose coco beans, clean and well dried. 90kg bags. This season harvest — no storage treatment used.',
      quantityAvailable: 20,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 9500,
      pickupCounty: 'Uasin Gishu',
      pickupDescription: 'Turbo town, off Eldoret-Kisumu road.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: achieng._id,
      title: 'Sukuma Wiki (Kale) — Kisumu West',
      cropName: 'Kale',
      category: ListingCategory.VEGETABLES,
      description:
        'Fresh sukuma wiki harvested twice weekly. Large bunches, dark green. Grown without chemical fertilizer — only organic compost. Consistent supply available.',
      quantityAvailable: 300,
      unit: ListingUnit.KG,
      currentPricePerUnit: 18,
      pickupCounty: 'Kisumu',
      pickupDescription: 'Mamboleo area, Kisumu-Kakamega road. Pickup from 6am daily.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: achieng._id,
      title: 'Orange-Fleshed Sweet Potatoes — Kisumu',
      cropName: 'Sweet Potatoes',
      category: ListingCategory.VEGETABLES,
      description:
        'Vita-rich orange-fleshed variety. Good for direct consumption and processing. 50kg bags. High demand from nutrition programs — selling direct to reduce middleman cut.',
      quantityAvailable: 30,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 2200,
      pickupCounty: 'Kisumu',
      pickupDescription: 'Mamboleo area, Kisumu-Kakamega road.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: njoroge._id,
      title: 'Shangi Potatoes — Nyandarua',
      cropName: 'Potatoes',
      category: ListingCategory.VEGETABLES,
      description:
        'Shangi variety potatoes from Nyandarua highlands. Consistent size, no green spots. 110kg bags. Grown at 2,500m altitude — natural cold storage effect, longer shelf life.',
      quantityAvailable: 40,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 2800,
      pickupCounty: 'Nyandarua',
      pickupDescription: 'Ol Kalou town centre — near the bus stage. Call 24 hours in advance.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: njoroge._id,
      title: 'Snow Peas (Minji) — Nyandarua Export Grade',
      cropName: 'Snow Peas',
      category: ListingCategory.LEGUMES,
      description:
        'Export-grade snow peas, GlobalGAP farming practices applied. Suitable for export and high-end hotels. Harvested twice per week for freshness.',
      quantityAvailable: 50,
      unit: ListingUnit.KG,
      currentPricePerUnit: 180,
      pickupCounty: 'Nyandarua',
      pickupDescription: 'Ol Kalou town centre.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: njoroge._id,
      title: 'Nantes Carrots — Nyandarua',
      cropName: 'Carrots',
      category: ListingCategory.VEGETABLES,
      description:
        'Nantes variety carrots. Uniform orange colour, no forking. Washed and ready. 50kg bags.',
      quantityAvailable: 25,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 1800,
      pickupCounty: 'Nyandarua',
      pickupDescription: 'Ol Kalou town centre.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
    {
      farmerId: wanjiku._id,
      title: 'Pishori Rice — Mwea, Kirinyaga',
      cropName: 'Rice',
      category: ListingCategory.CEREALS,
      description:
        'Authentic Mwea Pishori rice. 50kg bags. Directly from our family farm in Mwea irrigation scheme. No blending with imported rice. Certificate of origin available.',
      quantityAvailable: 60,
      unit: ListingUnit.BAG,
      currentPricePerUnit: 6500,
      pickupCounty: 'Kirinyaga',
      pickupDescription:
        'Mwea town, near the rice milling cooperative. Wanjiku Kamau — confirm via SMS before pickup.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
      isVerifiedListing: true,
      buyerContactPreference: ['PHONE'],
    },
  ]);

  log('Inserted 10 MarketplaceListings.');

  // -------------------------------------------------------------------------
  // 5. KnowledgeArticles
  // -------------------------------------------------------------------------

  log('Inserting KnowledgeArticles...');

  const publishedAt = new Date('2024-01-15T08:00:00Z');

  await KnowledgeArticle.insertMany([
    {
      slug: 'identify-genuine-can-fertilizer',
      title: 'How to Identify Genuine CAN Fertilizer Before You Buy',
      category: KnowledgeCategory.FERTILIZER_VERIFICATION,
      sourceInstitution: 'KEBS',
      sourceUrl: 'https://www.kebs.org/index.php/services/standards/fertilizer-standards',
      cropTags: ['maize', 'wheat', 'potatoes', 'vegetables'],
      summary:
        'Counterfeit Calcium Ammonium Nitrate (CAN) fertilizer is a documented problem in Kenya. This guide explains the KEBS-certified verification steps any farmer can perform before purchase to protect their investment and crops.',
      content: `## Why Counterfeit CAN Fertilizer Is a Crisis

Every planting season, Kenyan farmers lose millions of shillings to counterfeit Calcium Ammonium Nitrate (CAN) fertilizer. In genuine CAN, the nitrogen content is 26%. In counterfeits, the content may be 0%. Your crops will germinate but fail to yield.

## The KEBS Certification Mark

Genuine CAN manufactured or imported into Kenya must carry the KEBS Diamond Mark (the Kenya Standard Mark). This is a diamond-shaped symbol with the letters "KS" inside and a certification number.

**What to look for on the bag:**
- Diamond Mark printed clearly on the packaging
- Batch number and manufacturer details
- Net weight and nitrogen percentage (26% N)
- KEBS approval reference number

## Field Test — The Water Test

1. Fill a clean glass with water
2. Add a tablespoon of the fertilizer granules
3. Stir and observe

**Genuine CAN:** Dissolves slowly with a slight fizzing. Water becomes slightly milky.
**Counterfeit/diluted:** Dissolves immediately and completely without reaction, or leaves a heavy residue that doesn't dissolve.

## The Touch Test

Genuine CAN granules are:
- Slightly rough to the touch
- Off-white to beige in colour
- Similar in size (uniform granulation)

Counterfeit products often use ground limestone or rock salt as filler. These feel powdery rather than granular and may smell different.

## Buying from Verified Suppliers

The safest way to avoid counterfeit inputs is to purchase only from KEBS-licensed agro-dealers. UmojaHub maintains a verified supplier directory — use it before every purchase.

## What to Do If You Suspect Counterfeit

Report immediately to KEBS Consumer Affairs: 0722 201 211, or to the nearest KEBS regional office. Take photographs of the bag including the Diamond Mark (or lack thereof). Your report protects other farmers.`,
      isPublished: true,
      publishedAt,
      createdBy: admin._id,
    },
    {
      slug: 'long-rains-planting-calendar-2024',
      title: 'Long Rains Planting Calendar 2024: What to Plant and When by County',
      category: KnowledgeCategory.SEASONAL_CALENDAR,
      sourceInstitution: 'KALRO',
      sourceUrl: 'https://www.kalro.org/crop-farming/seasonal-calendar',
      cropTags: ['maize', 'beans', 'tomatoes', 'potatoes', 'kale'],
      summary:
        'KALRO county-by-county planting recommendations for the long rains season. Includes optimal planting windows, spacing recommendations, and early warning signs of seasonal stress for the major Kenyan food crops.',
      content: `## Long Rains 2024 — Season Overview

The long rains season (March–May) is Kenya's primary agricultural season, accounting for approximately 60% of annual food production. KALRO's 2024 county-specific advisories reflect updated variety recommendations and adjusted planting windows based on shifting rainfall patterns.

## Planting Windows by Zone

### Central Highlands (Kiambu, Murang'a, Nyeri, Kirinyaga)
- **Onset:** 3rd week of March
- **Maize:** Plant by April 5th for full season. Use H614D or DH04.
- **Beans:** Rose coco, plant late March. Spacing 30cm × 60cm.
- **Potatoes:** Shangi or Tigoni, plant early April in well-drained soils.

### Rift Valley (Nakuru, Nyandarua, Laikipia, Uasin Gishu)
- **Onset:** 1st week of April
- **Maize:** H614D recommended. Plant April 1–15 window.
- **Wheat:** Fahari variety, plant same window.
- **Potatoes:** Excellent zone. Nyandarua highlands — target 2nd week of April.

### Western Kenya (Kakamega, Bungoma, Trans Nzoia)
- **Onset:** 2nd week of March
- **Maize:** H614D, H629 recommended. Long-season varieties perform well.
- **Beans:** High potential area. Multiple planting windows available.

### Nyanza (Kisumu, Siaya, Homa Bay, Migori)
- **Onset:** 2nd week of March
- **Maize:** DH04, H614D recommended for wet lowlands.
- **Sorghum:** Strongly recommended for areas with bimodal stress (flood/drought cycling).
- **Sweet Potatoes:** Orange-fleshed varieties in program areas.

## Early Season Warning Signs

Watch for these indicators that your season may be stressed:

1. **Staggered germination** (>30% variation in emergence timing) — may indicate seed quality issue or uneven soil moisture
2. **Yellowing in V3 stage** — check nitrogen availability; may need top-dressing
3. **Insect pressure in first 2 weeks** — armyworm is highest risk during this period; scout daily

## KALRO Advisory Lines

For county-specific advisories: 0800 720 222 (toll-free)`,
      isPublished: true,
      publishedAt,
      createdBy: admin._id,
    },
    {
      slug: 'spot-counterfeit-veterinary-drugs',
      title: 'Protecting Your Livestock: How to Spot Counterfeit Veterinary Drugs',
      category: KnowledgeCategory.ANIMAL_HEALTH,
      sourceInstitution: 'Kenya Veterinary Board',
      sourceUrl: 'https://www.kvb.go.ke/',
      cropTags: ['dairy cows', 'goats', 'poultry'],
      summary:
        "Counterfeit veterinary drugs cause livestock deaths and economic loss for Kenyan farmers every year. This article explains how to verify a drug's authenticity, what to look for on packaging, and how to report suspected fakes to the Kenya Veterinary Board.",
      content: `## The Scale of the Problem

Kenya Veterinary Board investigations have identified counterfeit veterinary drugs in markets across 18 counties. The most commonly counterfeited products are: broad-spectrum antibiotics (oxytetracycline, penicillin), dewormers (albendazole, levamisole), and acaricides (amitraz-based tick treatments).

## The KVB Registration Mark

Every veterinary drug sold legally in Kenya must be registered with the Kenya Veterinary Board (KVB). Look for:

- **KVB Registration Number** printed on the label (format: KVB/VDR/XXXX/XXXX)
- **Batch number and expiry date** — clearly printed, not handwritten
- **Manufacturer and importer details** — with physical address
- **Storage instructions** — cold-chain products should be refrigerated upon receipt

## How to Verify Registration

Visit kvb.go.ke or call +254 020 2731028 to verify a KVB registration number before purchase. This takes 2 minutes and can save your herd.

## Packaging Red Flags

**Reject immediately if you see:**
- Blurry or smudged printing on the label
- Inconsistent font sizes or colours across the label
- Batch numbers or expiry dates that appear to be stickers placed over original text
- Spelling errors in the drug name or instructions
- Vials that have been resealed (broken then re-crimped aluminium caps)
- Injections that are discoloured, cloudy, or have visible particles

## After Treatment — What to Watch For

If you administer a drug and the animal shows no improvement within the expected clinical window (24–72 hours for bacterial infections), or worsens rapidly, suspect substandard medication. Document this and report to KVB.

## Reporting Counterfeit Products

KVB Complaints Line: +254 020 2731028
Email: info@kvb.go.ke
You may also report to the Kenya Anti-Counterfeit Agency (ACA): +254 020 6950000`,
      isPublished: true,
      publishedAt,
      createdBy: admin._id,
    },
    {
      slug: 'reducing-post-harvest-tomato-losses',
      title: 'Reducing Post-Harvest Tomato Losses: Storage, Handling, and Timing',
      category: KnowledgeCategory.POST_HARVEST,
      sourceInstitution: 'FAO Kenya',
      sourceUrl: 'https://www.fao.org/kenya/en/',
      cropTags: ['tomatoes', 'capsicum'],
      summary:
        'Post-harvest losses account for up to 40% of tomato production in Kenya. This guide covers the critical handling decisions made in the 24 hours after harvest that determine whether a farmer captures full value or loses their crop to spoilage.',
      content: `## Understanding the 40% Loss Problem

FAO Kenya estimates that 30–40% of fresh tomatoes grown in Kenya are lost before reaching the consumer. Most of this loss occurs in the first 48 hours after harvest — during handling, transport, and storage. This is not inevitable.

## Harvest Timing Is Everything

Tomatoes harvested at the correct maturity stage last significantly longer:

- **Breaker stage** (first signs of colour change): 7–10 days shelf life at ambient temperature
- **Pink stage** (25–75% colour change): 4–6 days shelf life
- **Red ripe stage** (fully coloured): 1–3 days shelf life

For transport to Nairobi or Mombasa, harvest at breaker or turning stage. For local market same-day, harvest at pink or early red.

## The Handling Chain

### At Harvest
- Harvest in the early morning when temperatures are lowest
- Use clean, dry harvesting containers — no metal buckets
- Place fruit gently — no dropping or throwing into containers
- Remove and dispose of damaged, diseased, and pest-affected fruit at harvest

### At Packing
- Sort by size and maturity before packing
- Use wooden crates or ventilated plastic crates lined with clean paper
- Do not pack more than 15kg per crate — deep stacking crushes lower layers
- Leave 3–5cm of airspace at the top of each crate for ventilation

### At Storage
- Store in a well-ventilated, shaded space (never in direct sunlight)
- Target temperature: 12–15°C if possible (cool room, shade structure, or elevated floor)
- Separate tomatoes from onions and garlic — ethylene from tomatoes accelerates onion sprouting

## The Platform Advantage

Listing your tomatoes on UmojaHub at breaker stage, before they are fully ripe, allows you to sell at full price to buyers who want to transport them. Waiting until they are red risks losses if they are not sold within 48 hours.`,
      isPublished: true,
      publishedAt,
      createdBy: admin._id,
    },
    {
      slug: 'when-to-sell-your-maize',
      title: "When to Sell Your Maize: Understanding Kenya's Seasonal Price Cycle",
      category: KnowledgeCategory.MARKET_DYNAMICS,
      sourceInstitution: 'Kenya Markets Trust',
      sourceUrl: 'https://kenyamarketstrust.org/',
      cropTags: ['maize', 'beans'],
      summary:
        "Maize prices in Kenya follow a predictable seasonal cycle driven by harvest timing and post-harvest glut. This analysis of 5 years of Wakulima Market data shows farmers the optimal holding periods and the price recovery windows that make the difference between profit and loss.",
      content: `## The Seasonal Price Pattern

Kenya's maize price follows a predictable annual cycle that most farmers know but many do not have the data to navigate precisely. Understanding this cycle is the difference between selling at 2,800 KES/bag and selling at 4,500 KES/bag — from the same harvest.

## The Harvest Glut (April–June)

When the long rains harvest comes in (typically May–June for Rift Valley, June–July for Central), prices fall sharply. In the Wakulima Market Nairobi data from 2019–2023:

- Average price at harvest season: **3,100–3,400 KES per 90kg bag**
- Lowest point: typically 2,600–2,900 KES per 90kg bag (July–August for Rift Valley harvest)
- Duration of low prices: 8–12 weeks

Farmers who sell immediately at harvest lock in these low prices. Farmers who can store and wait recover significantly.

## The Price Recovery Window

From September onward, as post-harvest stocks are consumed, prices recover:

- **September–October:** 3,600–4,000 KES per bag (early recovery)
- **November–December:** 4,200–4,600 KES per bag (peak season)
- **January–February:** 4,400–5,000 KES per bag (planting season, low stocks)

The premium for holding 4–6 months is typically **40–60% over harvest price**.

## The Break-Even Calculation

Before deciding to hold, calculate your break-even:

**Storage costs include:**
- Certified grain store rental: ~150 KES/bag/month (or opportunity cost of your own store)
- Grain protectant (Actellic Super): ~30 KES/bag applied at storage
- Moisture loss: ~1% per month

For a 4-month hold: storage cost ≈ 650 KES/bag. This means you need the price to rise by at least 650 KES/bag to break even.

## Using the UmojaHub Price Alert

Set a UmojaHub Price Alert for your target sell price. When the Nairobi benchmark crosses your threshold, you will receive an SMS and can list immediately on the marketplace while prices are favourable.`,
      isPublished: true,
      publishedAt,
      createdBy: admin._id,
    },
  ]);

  log('Inserted 5 KnowledgeArticles.');

  // -------------------------------------------------------------------------
  // 6. VerifiedSuppliers
  // -------------------------------------------------------------------------

  log('Inserting VerifiedSuppliers...');

  await VerifiedSupplier.insertMany([
    {
      businessName: 'Amiran Kenya Limited',
      contactPhone: '+254722206700',
      contactEmail: 'info@amiran.co.ke',
      county: 'Nairobi',
      inputCategories: [
        SupplierInputCategory.FERTILIZER,
        SupplierInputCategory.SEED,
        SupplierInputCategory.PESTICIDE,
      ],
      registrations: {
        kebsNumber: 'KEBS/F/2019/001234',
        pcpbNumber: 'PCPB/2019/05678',
      },
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      verifiedBy: admin._id,
      verifiedAt: new Date('2024-01-01T08:00:00Z'),
    },
    {
      businessName: 'MEA Fertilizers Limited',
      contactPhone: '+254722203808',
      contactEmail: 'sales@meafertilizers.co.ke',
      county: 'Nairobi',
      inputCategories: [SupplierInputCategory.FERTILIZER],
      registrations: {
        kebsNumber: 'KEBS/F/2018/000891',
      },
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      verifiedBy: admin._id,
      verifiedAt: new Date('2024-01-01T08:00:00Z'),
    },
    {
      businessName: 'Kenya Seed Company',
      contactPhone: '+254320030000',
      contactEmail: 'info@kenyaseed.com',
      county: 'Nakuru',
      inputCategories: [SupplierInputCategory.SEED],
      registrations: {},
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      verifiedBy: admin._id,
      verifiedAt: new Date('2024-01-01T08:00:00Z'),
    },
  ]);

  log('Inserted 3 VerifiedSuppliers.');

  // -------------------------------------------------------------------------
  // 7. BriefContextLibrary (singleton)
  // -------------------------------------------------------------------------

  log('Inserting BriefContextLibrary...');

  await BriefContextLibrary.create({
    version: 1,
    updatedBy: admin._id,
    contexts: [
      {
        id: 'agri-supply-chain',
        industryName: 'Agricultural Supply Chain',
        description:
          'Systems that connect smallholder farmers with buyers, track produce quality, manage inventory, and enable direct market access without middleman dependency.',
        clientPersonaTemplate: {
          businessTypes: [
            'farmer cooperative',
            'agro-dealer network',
            'export fresh produce company',
          ],
          counties: ['Nyandarua', 'Uasin Gishu', 'Kirinyaga', 'Nakuru', 'Meru'],
          contexts: [
            'post-harvest loss reduction',
            'direct buyer-farmer connectivity',
            'input supply verification',
          ],
        },
        problemDomains: [
          'traceability from farm to market',
          'quality grading and certification',
          'payment timing and M-Pesa integration',
          'cold chain logistics coordination',
        ],
        kenyanConstraints: [
          'unreliable mobile data connectivity in rural areas',
          'USSD-first design for feature phone users',
          'KES currency, M-Pesa as primary payment rail',
          'road condition variability affecting delivery windows',
        ],
        exampleProjects: [
          'Farmer produce listing and order management system',
          'Input supply verification and counterfeit detection tool',
          'Cooperative group buying platform',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'health-community',
        industryName: 'Community Health Systems',
        description:
          'Digital tools supporting community health workers (CHWs) in Kenya — patient tracking, referral management, supply chain for health commodities, and reporting to county health offices.',
        clientPersonaTemplate: {
          businessTypes: ['county health department', 'NGO health programme', 'community clinic'],
          counties: ['Kisumu', 'Homa Bay', 'Siaya', 'Migori', 'Turkana'],
          contexts: [
            'last-mile health delivery',
            'maternal and child health tracking',
            'malaria and TB case management',
          ],
        },
        problemDomains: [
          'offline-first patient records for CHWs without data',
          'referral pathway management from village to hospital',
          'commodity stock tracking (ARVs, bed nets, vaccines)',
          'routine reporting aggregation for county dashboards',
        ],
        kenyanConstraints: [
          'offline-capable design — no data connectivity assumed',
          'Swahili and local language support required',
          'low-literacy interface considerations',
          'solar charging contexts — battery-conscious design',
        ],
        exampleProjects: [
          'CHW patient visit and referral tracking app',
          'Community health commodity stock management system',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'fintech-sme',
        industryName: 'SME Financial Services',
        description:
          'Digital finance tools for small and medium enterprises in Kenya — invoice financing, M-Pesa business API integration, simple bookkeeping, and SACCO loan management.',
        clientPersonaTemplate: {
          businessTypes: ['informal retailer', 'SACCO', 'chama (investment group)', 'market trader'],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
          contexts: [
            'working capital management',
            'group savings and lending',
            'digital invoice and receipt management',
          ],
        },
        problemDomains: [
          'M-Pesa payment reconciliation and reporting',
          'group savings (chama) management and transparency',
          'invoice and expense tracking for informal businesses',
          'credit scoring from transaction history',
        ],
        kenyanConstraints: [
          'KES currency only, M-Pesa primary payment rail',
          'mixed digital-cash transaction environments',
          'Central Bank of Kenya (CBK) regulatory compliance awareness',
          'WhatsApp and USSD as primary communication channels',
        ],
        exampleProjects: [
          'Chama group savings and loan management platform',
          'SME invoice management and M-Pesa reconciliation tool',
          'SACCO member portal with loan application and tracking',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'edtech-secondary',
        industryName: 'Secondary Education Technology',
        description:
          'Digital tools supporting Kenya\'s CBC (Competency-Based Curriculum) transition — student progress tracking, teacher resource libraries, formative assessment tools, and parent communication systems.',
        clientPersonaTemplate: {
          businessTypes: ['public secondary school', 'private academy', 'county education office'],
          counties: ['Nairobi', 'Kiambu', 'Mombasa', 'Nyeri', 'Uasin Gishu'],
          contexts: [
            'CBC transition support',
            'student performance monitoring',
            'teacher professional development',
          ],
        },
        problemDomains: [
          'student competency tracking across CBC strands',
          'teacher lesson planning and resource sharing',
          'formative assessment and feedback collection',
          'parent-teacher communication without email dependency',
        ],
        kenyanConstraints: [
          'WhatsApp-first parent communication',
          'limited device availability per student',
          'intermittent electricity and connectivity in rural schools',
          'KICD curriculum alignment required',
        ],
        exampleProjects: [
          'CBC student portfolio and competency tracking system',
          'School resource library and lesson planning tool',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'transport-logistics',
        industryName: 'Road Transport and Logistics',
        description:
          'Fleet management, cargo booking, and route optimisation systems for Kenya\'s matatu operators, boda boda networks, and long-haul trucking companies.',
        clientPersonaTemplate: {
          businessTypes: [
            'matatu SACCO',
            'boda boda cooperative',
            'logistics company',
            'clearing and forwarding agent',
          ],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru'],
          contexts: [
            'urban passenger transport',
            'inter-county cargo movement',
            'last-mile delivery coordination',
          ],
        },
        problemDomains: [
          'real-time vehicle tracking and driver management',
          'cargo booking and customer communication',
          'fuel consumption monitoring and cost allocation',
          'NTSA compliance and vehicle licensing tracking',
        ],
        kenyanConstraints: [
          'GPS coverage gaps in Northern Kenya',
          'NTSA regulatory compliance requirements',
          'KES pricing and M-Pesa payment integration',
          'driver literacy and USSD interface considerations',
        ],
        exampleProjects: [
          'Matatu route and capacity management system',
          'Cargo booking and tracking platform for SME logistics',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'water-utilities',
        industryName: 'Water Utility Management',
        description:
          'Digital systems for water service providers — meter reading, billing, leak detection reporting, and customer service management for county water utilities and community water projects.',
        clientPersonaTemplate: {
          businessTypes: [
            'county water utility',
            'community water project',
            'water bowser operator',
          ],
          counties: ['Nairobi', 'Mombasa', 'Machakos', 'Nakuru', 'Kisumu'],
          contexts: [
            'meter-to-billing workflow automation',
            'leak reporting and maintenance tracking',
            'prepaid water token management',
          ],
        },
        problemDomains: [
          'mobile meter reading and billing cycle management',
          'customer billing disputes and payment reconciliation',
          'non-revenue water tracking (leaks and illegal connections)',
          'prepaid token generation and distribution',
        ],
        kenyanConstraints: [
          'WASREB regulatory compliance',
          'M-Pesa and cash payment mix',
          'field workforce with varying digital literacy',
          'intermittent connectivity in field operations',
        ],
        exampleProjects: [
          'Mobile meter reading and billing platform',
          'Water leak report and repair tracking system',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'tourism-hospitality',
        industryName: 'Tourism and Hospitality',
        description:
          'Booking, operations, and guest management systems for Kenya\'s tourism sector — safari lodges, eco-camps, tour operators, and cultural experience providers.',
        clientPersonaTemplate: {
          businessTypes: [
            'safari lodge',
            'eco-camp',
            'tour operator',
            'cultural tourism enterprise',
          ],
          counties: ['Narok', 'Laikipia', 'Samburu', 'Kilifi', 'Taita-Taveta'],
          contexts: [
            'online booking and availability management',
            'guide and vehicle scheduling',
            'wildlife and activity itinerary building',
          ],
        },
        problemDomains: [
          'multi-channel booking management (direct, agent, OTA)',
          'guide and vehicle availability scheduling',
          'guest experience documentation and upsell',
          'conservation fee and park levy tracking',
        ],
        kenyanConstraints: [
          'KTB and county tourism board compliance',
          'USD and KES dual-currency pricing',
          'satellite internet dependency in remote lodges',
          'KWS conservation area requirements',
        ],
        exampleProjects: [
          'Safari lodge booking and operations management system',
          'Tour itinerary builder and guide scheduling platform',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'waste-recycling',
        industryName: 'Waste Management and Recycling',
        description:
          'Digital platforms supporting Kenya\'s informal recycling sector and formal waste management companies — collection routing, waste picker coordination, material tracking, and buyer-seller matching for recyclables.',
        clientPersonaTemplate: {
          businessTypes: [
            'waste collection company',
            'recycling aggregator',
            'informal waste picker cooperative',
            'county environment department',
          ],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
          contexts: [
            'waste collection route optimisation',
            'recyclable material price discovery',
            'informal sector formalisation',
          ],
        },
        problemDomains: [
          'waste picker registration and payment management',
          'recyclable material price tracking (paper, plastic, metal)',
          'collection route planning and real-time tracking',
          'county waste permit and compliance management',
        ],
        kenyanConstraints: [
          'NEMA regulatory compliance',
          'informal sector inclusion — basic phone and USSD support',
          'M-Pesa micro-payment for waste pickers',
          'Nairobi County waste management by-laws',
        ],
        exampleProjects: [
          'Waste picker registration and M-Pesa payment platform',
          'Recyclable material marketplace and price discovery tool',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
    ],
  });

  log('Inserted BriefContextLibrary (8 industry contexts).');

  // -------------------------------------------------------------------------
  // 8. MarketInsight records
  // -------------------------------------------------------------------------

  log('Inserting MarketInsight records...');

  const weekOf = new Date('2024-01-08T00:00:00Z'); // First Monday of 2024

  await MarketInsight.insertMany([
    {
      cropName: 'Tomatoes',
      county: 'Nairobi',
      weekOf,
      pricing: {
        averageListingPrice: 55,
        averageTransactionPrice: 62,
        lowestPrice: 40,
        highestPrice: 90,
        middlemanBenchmark: 48,
        platformPremium: 29.2,
        dataPointCount: 24,
      },
    },
    {
      cropName: 'Maize',
      county: 'Nairobi',
      weekOf,
      pricing: {
        averageListingPrice: 3800,
        averageTransactionPrice: 4100,
        lowestPrice: 3200,
        highestPrice: 4800,
        middlemanBenchmark: 3400,
        platformPremium: 20.6,
        dataPointCount: 18,
      },
    },
    {
      cropName: 'Potatoes',
      county: 'Nairobi',
      weekOf,
      pricing: {
        averageListingPrice: 2800,
        averageTransactionPrice: 3100,
        lowestPrice: 2200,
        highestPrice: 3600,
        middlemanBenchmark: 2500,
        platformPremium: 24.0,
        dataPointCount: 15,
      },
    },
    {
      cropName: 'Beans',
      county: 'Nairobi',
      weekOf,
      pricing: {
        averageListingPrice: 9500,
        averageTransactionPrice: 10200,
        lowestPrice: 8500,
        highestPrice: 11500,
        middlemanBenchmark: 8800,
        platformPremium: 15.9,
        dataPointCount: 12,
      },
    },
    {
      cropName: 'Kale',
      county: 'Nairobi',
      weekOf,
      pricing: {
        averageListingPrice: 18,
        averageTransactionPrice: 22,
        lowestPrice: 12,
        highestPrice: 30,
        middlemanBenchmark: 15,
        platformPremium: 46.7,
        dataPointCount: 30,
      },
    },
  ]);

  log('Inserted 5 MarketInsight records.');

  // -------------------------------------------------------------------------
  // 9. StudentPortfolioStatus
  // -------------------------------------------------------------------------

  log('Inserting StudentPortfolioStatus records...');

  await StudentPortfolioStatus.insertMany(([
    {
      studentId: brian._id,
      currentTier: StudentTier.BEGINNER,
      portfolioStrength: PortfolioStrength.BUILDING,
      verifiedProjects: [],
      verifiedSkills: [],
      tierProgressionTimeline: [
        { tier: StudentTier.BEGINNER, unlockedAt: new Date('2024-01-01T00:00:00Z') },
      ],
      stats: {
        verifiedProjectCount: 0,
        totalProjectCount: 0,
        averageScore: 0,
        techStacksUsed: [],
        reviewerInstitutions: [],
      },
      lastRecalculatedAt: new Date(),
    },
    {
      studentId: amina._id,
      currentTier: StudentTier.INTERMEDIATE,
      portfolioStrength: PortfolioStrength.DEVELOPING,
      verifiedProjects: [],
      verifiedSkills: [],
      tierProgressionTimeline: [
        { tier: StudentTier.BEGINNER, unlockedAt: new Date('2023-01-01T00:00:00Z') },
        { tier: StudentTier.INTERMEDIATE, unlockedAt: new Date('2023-06-15T00:00:00Z') },
      ],
      stats: {
        verifiedProjectCount: 0,
        totalProjectCount: 0,
        averageScore: 0,
        techStacksUsed: ['React', 'Next.js', 'TypeScript', 'MongoDB'],
        reviewerInstitutions: [],
      },
      lastRecalculatedAt: new Date(),
    },
    {
      studentId: dennis._id,
      currentTier: StudentTier.BEGINNER,
      portfolioStrength: PortfolioStrength.BUILDING,
      verifiedProjects: [],
      verifiedSkills: [],
      tierProgressionTimeline: [
        { tier: StudentTier.BEGINNER, unlockedAt: new Date('2024-01-01T00:00:00Z') },
      ],
      stats: {
        verifiedProjectCount: 0,
        totalProjectCount: 0,
        averageScore: 0,
        techStacksUsed: [],
        reviewerInstitutions: [],
      },
      lastRecalculatedAt: new Date(),
    },
  ] as Parameters<typeof StudentPortfolioStatus.insertMany>[0]));

  log('Inserted 3 StudentPortfolioStatus records.');

  // -------------------------------------------------------------------------
  // 10. ProjectEngagements (3 demo states)
  // -------------------------------------------------------------------------

  log('Inserting ProjectEngagements...');

  const PB_CONTENT = `## Problem Statement
Smallholder farmers in Kenya sell produce through intermediaries who capture 30–50% of the final retail price. Direct digital market access could close this gap.

## Root Cause Analysis
The gap exists due to: (1) information asymmetry between farmers and buyers on pricing, (2) lack of trust verification for both parties, (3) payment friction — cash-only has theft risk for high-value transactions.

## Proposed Solution Scope
A mobile-first marketplace where farmers post listings, buyers browse and pay via M-Pesa, and trust scores accumulate from transaction history. Scope is restricted to crops, not livestock.

## Success Criteria
- A farmer can list produce in under 5 minutes
- A buyer can browse and initiate payment from any smartphone
- M-Pesa confirmation is automated without manual farmer intervention`;

  const AP_CONTENT = `## Technical Architecture
Frontend: Next.js 15 with App Router, deployed on Vercel. Mobile-responsive Tailwind UI.
Backend: API Routes (serverless) + MongoDB Atlas. No dedicated server.
Payments: Daraja STK Push API for M-Pesa integration.
Auth: NextAuth v4 with role-based JWT (FARMER, BUYER, ADMIN).

## Implementation Phases
Phase 1: Auth + user registration (2 weeks)
Phase 2: Marketplace listings CRUD (1 week)
Phase 3: Order flow + M-Pesa integration (2 weeks)
Phase 4: Trust score computation (1 week)
Phase 5: Testing, hardening, deployment (1 week)

## Key Technical Risks
1. Daraja sandbox reliability — mitigation: Ngrok for local webhook testing
2. MongoDB cold-start latency — mitigation: connection pooling singleton
3. M-Pesa PIN timeout (30s) — mitigation: client-side countdown with polling`;

  const FR_CONTENT = `## What I Built
A full-stack agricultural marketplace with M-Pesa payments, role-based authentication, and a trust scoring system. The platform has 15+ API endpoints, Mongoose models with proper indexing, and a Groq-powered AI farm assistant.

## Biggest Technical Challenge
Implementing atomic inventory reservation on order creation. The naive read-check-then-write pattern allows overselling under concurrent load. I solved it using MongoDB's findOneAndUpdate with a conditional $inc operator that atomically decrements stock and returns the pre-update count.

## What I Would Do Differently
I would implement Redis distributed locking from day one rather than relying on MongoDB atomicity alone. At higher concurrency, even findOneAndUpdate has limitations without proper session-level isolation.

## Skills Demonstrated
TypeScript strict mode with zero any types, Next.js App Router, MongoDB aggregation pipelines, M-Pesa Daraja API integration, and rate limiting.`;

  const brianEngagement = await ProjectEngagement.create({
    studentId: brian._id,
    track: ProjectTrack.AI_BRIEF,
    tier: StudentTier.BEGINNER,
    status: ProjectStatus.VERIFIED,
    brief: {
      title: 'Agricultural Marketplace with M-Pesa Payments',
      problem: 'Smallholder farmers lack direct market access and lose 30–50% of produce value to intermediaries.',
      clientPersona: {
        businessType: 'farmer cooperative',
        county: 'Kirinyaga',
        context: 'post-harvest loss reduction, direct buyer-farmer connectivity',
      },
      requirements: [
        'Farmer produce listing and management',
        'Buyer discovery and ordering',
        'M-Pesa STK Push payment integration',
        'Trust scoring from transaction history',
      ],
      constraints: ['Mobile-first', 'M-Pesa integration', 'Swahili UI option'],
    },
    documents: {
      problemBreakdown: {
        content: PB_CONTENT,
        hash: sha256(PB_CONTENT),
        submittedAt: docDate(28),
      },
      approachPlan: {
        content: AP_CONTENT,
        hash: sha256(AP_CONTENT),
        submittedAt: docDate(21),
      },
      blockerLog: [
        {
          stuckOn: 'M-Pesa STK Push callback not reaching local dev environment',
          resolution: 'Used Ngrok to expose localhost port 3000. Updated MPESA_CALLBACK_URL in .env.local to the Ngrok public URL.',
          durationHours: 4,
          loggedAt: docDate(20),
        },
      ],
      aiUsageLog: [
        {
          toolUsed: 'ChatGPT-4o',
          prompt: 'Explain MongoDB findOneAndUpdate with conditional update for atomic inventory decrement',
          outputReceived: 'Explanation of using $inc with a conditional filter to atomically decrement only when sufficient stock exists, returning the pre-update document for verification.',
          studentAction: 'Implemented the pattern using Mongoose findOneAndUpdate with returnDocument: before. Adapted the approach to also handle SOLD_OUT status transition.',
          loggedAt: docDate(15),
          source: 'MANUAL',
        },
      ],
      finalReflection: {
        content: FR_CONTENT,
        hash: sha256(FR_CONTENT),
        submittedAt: docDate(12),
      },
    },
    verifiedAt: docDate(3),
  });

  await ProjectEngagement.findByIdAndUpdate(brianEngagement._id, {
    verificationUrl: `/verify/${(brianEngagement._id as mongoose.Types.ObjectId).toHexString()}`,
  });

  const DENNIS_PB = `## Problem
Students in Kenyan secondary schools struggle to track progress under the new Competency-Based Curriculum (CBC). Teachers maintain paper records which get lost or are inconsistent across the school.

## Root Cause
The CBC transition happened rapidly (2017–2023) without digital infrastructure. Schools remain paper-dependent.

## Proposed Solution
A mobile app for teachers to log student competency assessments, generate progress reports, and share summaries with parents via SMS — no app download required for parents.

## Success Criteria
- Teacher can log an assessment in under 2 minutes
- Parent receives SMS summary weekly without downloading anything
- County education officer can export aggregate reports`;

  const DENNIS_AP = `## Architecture
React Native (Expo) frontend for teachers. Node.js + MongoDB backend. Africa's Talking SMS API for parent notifications.

## Implementation Plan
Week 1-2: Auth + school/teacher setup
Week 3-4: Student and competency database
Week 5-6: Assessment logging UI
Week 7: SMS parent notifications via Africa's Talking
Week 8: Reporting and CSV export

## Risks
1. Expo managed workflow limitations — switch to bare workflow if needed
2. Africa's Talking sandbox rate limits during load testing`;

  const DENNIS_FR = `## Summary
Built a CBC student tracking system with React Native, MongoDB, and Africa's Talking SMS integration for Kenyan secondary schools.

## Key Learning
React Native state management with AsyncStorage for offline support — critical for school environments with intermittent connectivity.

## What I Would Improve
Add biometric authentication for teacher login. Password reuse is a real risk in shared-device school environments where multiple teachers use the same tablet.`;

  const dennisEngagement = await ProjectEngagement.create({
    studentId: dennis._id,
    track: ProjectTrack.AI_BRIEF,
    tier: StudentTier.BEGINNER,
    status: ProjectStatus.UNDER_LECTURER_REVIEW,
    brief: {
      title: 'CBC Student Competency Tracking System',
      problem: 'Secondary school teachers in Kenya lack digital tools for CBC competency tracking and parent communication.',
      clientPersona: {
        businessType: 'public secondary school',
        county: 'Kiambu',
        context: 'CBC transition support, student performance monitoring',
      },
      requirements: [
        'Teacher assessment logging interface',
        'Student competency progress tracking',
        'SMS parent notifications via Africa\'s Talking',
        'Aggregate reporting for county education officers',
      ],
      constraints: ['Offline-capable', 'WhatsApp-first parent communication'],
    },
    documents: {
      problemBreakdown: {
        content: DENNIS_PB,
        hash: sha256(DENNIS_PB),
        submittedAt: docDate(14),
      },
      approachPlan: {
        content: DENNIS_AP,
        hash: sha256(DENNIS_AP),
        submittedAt: docDate(10),
      },
      blockerLog: [
        {
          stuckOn: 'React Native AsyncStorage not persisting data after app restart in Expo Go',
          resolution: 'Expo Go clears AsyncStorage on reload during development. Switched to expo-secure-store for persistent token storage.',
          durationHours: 3,
          loggedAt: docDate(9),
        },
      ],
      aiUsageLog: [
        {
          toolUsed: 'Claude 3.5 Sonnet',
          prompt: 'How do I structure a MongoDB schema for CBC competency strands with multiple assessment points per student?',
          outputReceived: 'Suggested embedding assessment arrays within student documents with strand identifiers as keys, with a reference to a national competency taxonomy collection.',
          studentAction: 'Used the embedded array pattern but added a separate CompetencyDefinition collection to avoid duplicating taxonomy data across every student document.',
          loggedAt: docDate(8),
          source: 'MANUAL',
        },
      ],
      finalReflection: {
        content: DENNIS_FR,
        hash: sha256(DENNIS_FR),
        submittedAt: docDate(5),
      },
    },
  });

  const AMINA_PB = `## Problem
Kenya's informal waste pickers have no digital platform to connect with recycling aggregators. They sell materials at whatever price the buyer offers, with no price transparency or payment security.

## Root Cause
Waste pickers are often unregistered, unbanked, and lack smartphones. Aggregators prefer cash to avoid records. This creates a structural power imbalance that keeps picker incomes artificially low.

## Proposed Solution
A USSD-accessible platform (no smartphone required) where waste pickers register via national ID, log material weights, and receive M-Pesa micro-payments. Aggregators post current prices visible to pickers before they travel.

## Success Criteria
- Picker can check current prices and register a delivery via USSD (*123#)
- M-Pesa payment arrives within 15 minutes of delivery confirmation
- Aggregator has a full audit trail of all purchases`;

  const AMINA_AP = `## Technical Design
USSD interface: Africa's Talking USSD API. Backend: Node.js + MongoDB. Payments: Daraja B2C API.

## User Flows
Picker: Dial *123# → Select material → Enter weight → Confirm pickup point → Receive M-Pesa
Aggregator: Web portal → Post prices → Confirm deliveries → View reports

## GitHub Repository
https://github.com/aminawaweru/waste-connect-ke

## Implementation Status
main: stable USSD flow
feature/ussd-flow: multi-step menu refactor
feature/mpesa-b2c: payment integration (in progress)`;

  const AMINA_FR = `## What Was Built
A USSD waste picker registration and pricing platform. The core USSD flow works end-to-end in the Africa's Talking sandbox environment.

## Challenges
Daraja B2C API requires a registered business shortcode which is not available in sandbox. Worked around this by mocking the B2C callback response locally and testing the full state machine.

## Impact Potential
If deployed, this could improve income predictability for Nairobi's estimated 30,000 informal waste pickers by providing price transparency before they invest time in transport to aggregator sites.`;

  const aminaEngagement = await ProjectEngagement.create({
    studentId: amina._id,
    track: ProjectTrack.OPEN_SOURCE,
    tier: StudentTier.INTERMEDIATE,
    status: ProjectStatus.UNDER_PEER_REVIEW,
    brief: {
      title: 'Waste Connect KE — USSD Platform for Informal Recycling',
      problem: 'Kenya\'s informal waste pickers lack price transparency and secure payment for recycled materials.',
      githubRepoUrl: 'https://github.com/aminawaweru/waste-connect-ke',
      requirements: [
        'USSD interface accessible without smartphone',
        'Waste picker registration via national ID',
        'Real-time material price display',
        'M-Pesa B2C micro-payment integration',
      ],
    },
    githubRepoUrl: 'https://github.com/aminawaweru/waste-connect-ke',
    documents: {
      problemBreakdown: {
        content: AMINA_PB,
        hash: sha256(AMINA_PB),
        submittedAt: docDate(7),
      },
      approachPlan: {
        content: AMINA_AP,
        hash: sha256(AMINA_AP),
        submittedAt: docDate(5),
      },
      blockerLog: [
        {
          stuckOn: 'Africa\'s Talking USSD API returning session timeout in local testing',
          resolution: 'USSD sessions have a strict 30-second timeout. Rewrote the menu handler to be stateless — storing session state in MongoDB with a 25-second TTL index instead of expecting AT to maintain state.',
          durationHours: 6,
          loggedAt: docDate(4),
        },
      ],
      aiUsageLog: [
        {
          toolUsed: 'ChatGPT-4',
          prompt: 'How to handle stateless USSD sessions with MongoDB session tracking in Node.js',
          outputReceived: 'Pattern for storing USSD session state in MongoDB with TTL index matching the USSD timeout. Each menu step reads from DB, updates state, and responds to AT in under 3 seconds.',
          studentAction: 'Implemented the pattern with a 25-second TTL (5-second buffer before AT timeout) and added a cleanup cron for orphaned sessions.',
          loggedAt: docDate(3),
          source: 'MANUAL',
        },
      ],
      finalReflection: {
        content: AMINA_FR,
        hash: sha256(AMINA_FR),
        submittedAt: docDate(2),
      },
    },
  });

  log('Inserted 3 ProjectEngagements.');

  // -------------------------------------------------------------------------
  // 11. PeerReviews
  // -------------------------------------------------------------------------

  log('Inserting PeerReviews...');

  const peerComment = (strong: boolean): string =>
    strong
      ? 'The work demonstrates a solid understanding of the technical constraints specific to the Kenyan context. Design decisions are clearly explained and the process documentation is thorough enough that another developer could continue the work without additional briefing. Particularly impressed by the handling of connectivity edge cases.'
      : 'The work covers the main technical points but lacks depth in some areas. More detail on the reasoning behind key architectural choices would strengthen this considerably. The process documentation reads as a retrospective rather than a live log — recommend logging blockers in real time going forward.';

  const brianPeerReview = await PeerReview.create({
    engagementId: brianEngagement._id,
    reviewerId: dennis._id,
    status: PeerReviewStatus.SUBMITTED,
    submittedAt: docDate(8),
    scores: { codeQuality: 4, documentationClarity: 5 },
    comments: {
      codeQuality: peerComment(true),
      documentationClarity: peerComment(true),
    },
  });

  const dennisPeerReview = await PeerReview.create({
    engagementId: dennisEngagement._id,
    reviewerId: amina._id,
    status: PeerReviewStatus.SUBMITTED,
    submittedAt: docDate(3),
    scores: { codeQuality: 4, documentationClarity: 3 },
    comments: {
      codeQuality: peerComment(true),
      documentationClarity: peerComment(false),
    },
  });

  const aminaPeerReview = await PeerReview.create({
    engagementId: aminaEngagement._id,
    reviewerId: brian._id,
    status: PeerReviewStatus.ASSIGNED,
  });

  await ProjectEngagement.findByIdAndUpdate(brianEngagement._id, { peerReviewId: brianPeerReview._id });
  await ProjectEngagement.findByIdAndUpdate(dennisEngagement._id, { peerReviewId: dennisPeerReview._id });
  await ProjectEngagement.findByIdAndUpdate(aminaEngagement._id, { peerReviewId: aminaPeerReview._id });

  log('Inserted 3 PeerReviews.');

  // -------------------------------------------------------------------------
  // 12. LecturerReview + VerificationAuditLog + LecturerEffectiveness
  // -------------------------------------------------------------------------

  log('Inserting LecturerReview for Brian\'s VERIFIED engagement...');

  const grace = userByEmail.get('g.ndungu@uonbi.ac.ke')!;

  const lComment = (dim: string): string =>
    `The ${dim} demonstrates solid understanding of the problem domain and the technical constraints of the Kenyan agricultural context. The student made well-reasoned design decisions and documented the rationale clearly. The implementation reflects practical knowledge of the technologies used, and the process documentation shows genuine engagement with the iterative development process rather than a retrospective write-up. A strong foundation for INTERMEDIATE tier work.`;

  const lecturerReview = await LecturerReview.create({
    engagementId: brianEngagement._id,
    lecturerId: grace._id,
    decision: LecturerDecision.VERIFIED,
    scores: {
      problemUnderstanding: 4,
      solutionQuality: 4,
      processQuality: 5,
      aiUsage: 4,
    },
    comments: {
      problemUnderstanding: lComment('problem breakdown'),
      solutionQuality: lComment('solution architecture and implementation'),
      processQuality: lComment('development process documentation including the blocker log'),
      aiUsage: lComment('AI usage log and attribution practices'),
      overallFeedback: 'Strong first project demonstrating both technical competence and contextual awareness. Ready for the INTERMEDIATE tier. For the next project, focus on a domain with more complex data relationships to push your schema design skills.',
    },
  });

  await ProjectEngagement.findByIdAndUpdate(brianEngagement._id, { lecturerReviewId: lecturerReview._id });

  await VerificationAuditLog.create({
    engagementId: brianEngagement._id,
    studentId: brian._id,
    lecturerId: grace._id,
    decision: LecturerDecision.VERIFIED,
    documentHashes: {
      problemBreakdown: sha256(PB_CONTENT),
      approachPlan: sha256(AP_CONTENT),
      finalReflection: sha256(FR_CONTENT),
    },
    reviewScores: {
      problemUnderstanding: 4,
      solutionQuality: 4,
      processQuality: 5,
      aiUsage: 4,
    },
    recordedAt: docDate(3),
  });

  await LecturerEffectiveness.create({
    lecturerId: grace._id,
    totalReviews: 1,
    verifiedCount: 1,
    deniedCount: 0,
    revisionCount: 0,
    averageScoresGiven: {
      problemUnderstanding: 4,
      solutionQuality: 4,
      processQuality: 5,
      aiUsage: 4,
      overall: 4.25,
    },
    averageCommentWordCount: 62,
    lastReviewAt: docDate(3),
  });

  log('Inserted LecturerReview, VerificationAuditLog, LecturerEffectiveness.');

  // -------------------------------------------------------------------------
  // 13. Update Brian's StudentPortfolioStatus (reflect verified project)
  // -------------------------------------------------------------------------

  await StudentPortfolioStatus.findOneAndUpdate(
    { studentId: brian._id },
    {
      portfolioStrength: PortfolioStrength.DEVELOPING,
      $push: {
        verifiedProjects: {
          engagementId: brianEngagement._id,
          title: 'Agricultural Marketplace with M-Pesa Payments',
          tier: StudentTier.BEGINNER,
          techStack: ['Next.js', 'TypeScript', 'MongoDB', 'M-Pesa Daraja API'],
          verifiedAt: docDate(3),
          averageScore: 4.25,
          lecturerInstitution: 'University of Nairobi',
        },
      },
      'stats.verifiedProjectCount': 1,
      'stats.totalProjectCount': 1,
      'stats.averageScore': 4.25,
      'stats.techStacksUsed': ['Next.js', 'TypeScript', 'MongoDB', 'M-Pesa Daraja API'],
      'stats.reviewerInstitutions': ['University of Nairobi'],
      lastRecalculatedAt: new Date(),
    }
  );

  log('Updated Brian\'s StudentPortfolioStatus with verified project.');

  // -------------------------------------------------------------------------
  // 14. Ratings (for the 2 completed Food Hub orders)
  // -------------------------------------------------------------------------

  log('Inserting Ratings...');

  const insertedOrders = await Order.insertMany([
    {
      orderReferenceId: 'ORD-2024-001',
      listingId: listings[0]!._id,
      farmerId: wanjiku._id,
      buyerId: kamau._id,
      cropName: 'Tomatoes',
      quantityOrdered: 50,
      unit: ListingUnit.KG,
      pricePerUnit: 55,
      totalAmountKES: 2750,
      fulfillmentType: FulfillmentType.PICKUP,
      paymentStatus: OrderPaymentStatus.PAID,
      mpesaTransactionId: 'QF12AB3C45',
      buyerPhone: '+254767890123',
      fulfillmentStatus: OrderFulfillmentStatus.RECEIVED,
      paidAt: new Date('2024-02-10T08:00:00Z'),
      confirmedByFarmerAt: new Date('2024-02-10T09:30:00Z'),
      receivedByBuyerAt: new Date('2024-02-10T14:00:00Z'),
    },
    {
      orderReferenceId: 'ORD-2024-002',
      listingId: listings[2]!._id,
      farmerId: kipchoge._id,
      buyerId: fatuma._id,
      cropName: 'Maize',
      quantityOrdered: 5,
      unit: ListingUnit.BAG,
      pricePerUnit: 3800,
      totalAmountKES: 19000,
      fulfillmentType: FulfillmentType.PICKUP,
      paymentStatus: OrderPaymentStatus.PAID,
      mpesaTransactionId: 'QG34CD5E67',
      buyerPhone: '+254778901234',
      fulfillmentStatus: OrderFulfillmentStatus.RECEIVED,
      paidAt: new Date('2024-02-12T08:00:00Z'),
      confirmedByFarmerAt: new Date('2024-02-12T10:00:00Z'),
      receivedByBuyerAt: new Date('2024-02-13T14:00:00Z'),
    },
    {
      orderReferenceId: 'ORD-2024-003',
      listingId: listings[4]!._id,
      farmerId: achieng._id,
      buyerId: peter._id,
      cropName: 'Kale',
      quantityOrdered: 30,
      unit: ListingUnit.KG,
      pricePerUnit: 18,
      totalAmountKES: 540,
      fulfillmentType: FulfillmentType.PICKUP,
      paymentStatus: OrderPaymentStatus.PAID,
      mpesaTransactionId: 'QH56EF7G89',
      buyerPhone: '+254789012345',
      fulfillmentStatus: OrderFulfillmentStatus.RECEIVED,
      paidAt: new Date('2024-02-15T08:00:00Z'),
      confirmedByFarmerAt: new Date('2024-02-15T11:00:00Z'),
      receivedByBuyerAt: new Date('2024-02-16T09:00:00Z'),
    },
  ]);

  await Rating.insertMany([
    {
      orderId: insertedOrders[0]!._id,
      farmerId: wanjiku._id,
      buyerId: kamau._id,
      rating: 5,
      comment: 'Excellent tomatoes — exactly as described. Grade A quality and Wanjiku was very responsive on timing. Will definitely order again.',
    },
    {
      orderId: insertedOrders[1]!._id,
      farmerId: kipchoge._id,
      buyerId: fatuma._id,
      rating: 5,
      comment: 'Kipchoge\'s maize is the best I\'ve found on this platform. 13.5% moisture as stated, clean bags, no complaints. Premium quality deserves premium rating.',
    },
  ]);

  log('Inserted 3 Orders and 2 Ratings.');

  // -------------------------------------------------------------------------
  // 15. PriceHistory — back-dated series the Price Intelligence Engine can use
  //
  // Each series clears MIN_POINTS (3) on its own crop + county + unit, since the
  // engine compares like with like and never mixes units. Tomatoes rise, maize
  // is roughly flat and potatoes fall, so the trend classifier has all three
  // directions to show.
  // -------------------------------------------------------------------------

  log('Inserting PriceHistory records...');

  const priceHistoryDocs = [
    ...priceSeries({
      cropName: 'Tomatoes',
      county: 'Kirinyaga',
      unit: ListingUnit.KG,
      farmerId: wanjiku._id as mongoose.Types.ObjectId,
      endPrice: 80,
      driftPct: 18,
      points: 12,
      spanDays: 55,
      orderId: insertedOrders[0]!._id as mongoose.Types.ObjectId,
    }),
    ...priceSeries({
      cropName: 'Maize',
      county: 'Uasin Gishu',
      unit: ListingUnit.BAG,
      farmerId: kipchoge._id as mongoose.Types.ObjectId,
      endPrice: 3800,
      driftPct: 3,
      points: 10,
      spanDays: 70,
      orderId: insertedOrders[1]!._id as mongoose.Types.ObjectId,
    }),
    ...priceSeries({
      cropName: 'Potatoes',
      county: 'Nyandarua',
      unit: ListingUnit.BAG,
      farmerId: njoroge._id as mongoose.Types.ObjectId,
      endPrice: 2400,
      driftPct: -12,
      points: 10,
      spanDays: 60,
    }),
  ];

  await PriceHistory.insertMany(priceHistoryDocs);

  log(`Inserted ${priceHistoryDocs.length} PriceHistory records.`);

  // -------------------------------------------------------------------------
  // 16. Orders (moved — inserted above with Ratings)
  // -------------------------------------------------------------------------

  log('Inserted 3 Orders (see section 14).');

  // -------------------------------------------------------------------------
  // Complete
  // -------------------------------------------------------------------------

  await mongoose.disconnect();
  log('Disconnected from MongoDB Atlas.');
  console.log('\nSeed complete. Platform ready for demonstration.'); // eslint-disable-line no-console
}

seed().catch((err: unknown) => {
  console.error('[seed] Fatal error:', err); // eslint-disable-line no-console
  process.exit(1);
});
