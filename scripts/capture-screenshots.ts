/**
 * scripts/capture-screenshots.ts — automated documentation screenshot capture.
 *
 * Drives a running dev server with Playwright, minting a NextAuth v4 session
 * cookie per role (same mechanism as scripts/dev-session.ts) so authenticated
 * dashboards can be captured headlessly. Writes PNGs into docs/screenshots/ with
 * the exact filenames the README references. LOCAL-DEV-ONLY; refuses production.
 *
 * Prerequisites:
npm run demo
 *   3. npm run dev            # dev server on :3000 (in another terminal)
 *   4. npx playwright install chromium   # once
 *
 * Run:  tsx scripts/capture-screenshots.ts            # all shots, light + dark
 *       BASE_URL=http://localhost:3000 tsx scripts/capture-screenshots.ts
 */

if (process.env.NODE_ENV === 'production') {
  console.error('capture-screenshots: refusing to run in production.'); // eslint-disable-line no-console
  process.exit(1);
}

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { chromium, type Browser, type BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { connectDB } from '../src/lib/db';
import User from '../src/lib/models/User.model';
import { Role, OnboardingStage, ProjectStatus } from '../src/types';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots');
const VIEWPORT = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

// Preferred seeded account per role; falls back to the first user of that role
// (the NGO / employer / institution roles have generated emails).
const ROLE_EMAIL: Partial<Record<Role, string>> = {
  [Role.FARMER]: 'wanjiku.kamau@gmail.com',
  [Role.BUYER]: 'kamau.githinji@gmail.com',
  [Role.STUDENT]: 'brian.otieno@students.uonbi.ac.ke',
  [Role.LECTURER]: 'g.ndungu@uonbi.ac.ke',
  [Role.ADMIN]: 'umojahub16@gmail.com',
};

interface Shot {
  file: string;
  path: string;
  role: Role | 'public' | 'onboarding';
  viewport?: typeof MOBILE;
}

// The visual narrative — order mirrors the README showcase.
const SHOTS: Shot[] = [
  // Public surface
  { file: 'website-hero', path: '/', role: 'public' },
  { file: 'auth-login', path: '/auth/login', role: 'public' },
  // Onboarding needs a not-yet-onboarded session, else it redirects to login.
  { file: 'onboarding-role-selection', path: '/onboarding/role-selection', role: 'onboarding' },
  { file: 'onboarding-identity', path: '/onboarding/identity-input', role: 'onboarding' },
  { file: 'onboarding-verification-upload', path: '/onboarding/verification-upload', role: 'onboarding' },
  { file: 'marketplace-feed', path: '/marketplace', role: 'public' },
  { file: 'marketplace-listing-detail', path: '/marketplace/:listingId', role: 'public' },
  { file: 'knowledge-hub', path: '/knowledge', role: 'public' },
  { file: 'knowledge-article', path: '/knowledge/:articleSlug', role: 'public' },
  { file: 'portfolio-public', path: '/portfolio/:portfolioSlug', role: 'public' },
  { file: 'mobile-marketplace', path: '/marketplace', role: 'public', viewport: MOBILE },
  // Farmer
  { file: 'farmer-listings', path: '/dashboard/farmer/listings', role: Role.FARMER },
  { file: 'farmer-orders', path: '/dashboard/farmer/orders', role: Role.FARMER },
  { file: 'farmer-ledger-escrow', path: '/dashboard/farmer/ledger', role: Role.FARMER },
  { file: 'farmer-trust-profile', path: '/dashboard/farmer/profile', role: Role.FARMER },
  { file: 'farmer-prices', path: '/dashboard/farmer/prices', role: Role.FARMER },
  { file: 'farmer-assistant', path: '/dashboard/farmer/assistant', role: Role.FARMER },
  { file: 'farmer-group', path: '/dashboard/farmer/group', role: Role.FARMER },
  // Buyer
  { file: 'buyer-orders', path: '/dashboard/buyer/orders', role: Role.BUYER },
  { file: 'buyer-suppliers', path: '/dashboard/buyer/suppliers', role: Role.BUYER },
  // Student
  { file: 'student-dashboard', path: '/dashboard/student', role: Role.STUDENT },
  { file: 'student-portfolio', path: '/dashboard/student/portfolio', role: Role.STUDENT },
  { file: 'student-project-new', path: '/dashboard/student/projects/new', role: Role.STUDENT },
  { file: 'student-peer-review', path: '/dashboard/student/peer-review', role: Role.STUDENT },
  { file: 'student-mentor', path: '/dashboard/student/mentor', role: Role.STUDENT },
  // Lecturer
  { file: 'lecturer-queue', path: '/dashboard/lecturer/queue', role: Role.LECTURER },
  { file: 'lecturer-review', path: '/dashboard/lecturer/reviews/:engagementId', role: Role.LECTURER },
  // Employer / NGO / Institution
  { file: 'employer-overview', path: '/dashboard/employer', role: Role.EMPLOYER },
  { file: 'employer-talent-search', path: '/dashboard/employer/talent', role: Role.EMPLOYER },
  { file: 'ngo-dashboard', path: '/dashboard/ngo', role: Role.NGO },
  { file: 'institution-dashboard', path: '/dashboard/institution', role: Role.INSTITUTION },
  // Admin
  { file: 'admin-dashboard', path: '/dashboard/admin', role: Role.ADMIN },
  { file: 'admin-verification-queue', path: '/dashboard/admin/verification-queue', role: Role.ADMIN },
  { file: 'admin-escrow', path: '/dashboard/admin/escrow', role: Role.ADMIN },
  { file: 'admin-payouts', path: '/dashboard/admin/payouts', role: Role.ADMIN },
  { file: 'admin-mediation', path: '/dashboard/admin/mediation', role: Role.ADMIN },
  { file: 'admin-impact-summary', path: '/dashboard/admin/impact-summary', role: Role.ADMIN },
];

function logLine(msg: string): void {
  console.log(`[capture] ${msg}`); // eslint-disable-line no-console
}

async function resolveDynamicParams(): Promise<Record<string, string>> {
  const [{ default: MarketplaceListing }, { default: KnowledgeArticle }, { default: StudentPortfolioStatus }, { default: ProjectEngagement }] =
    await Promise.all([
      import('../src/lib/models/MarketplaceListing.model'),
      import('../src/lib/models/KnowledgeArticle.model'),
      import('../src/lib/models/StudentPortfolioStatus.model'),
      import('../src/lib/models/ProjectEngagement.model'),
    ]);
  const listing = await MarketplaceListing.findOne().select('_id').lean();
  const article = await KnowledgeArticle.findOne({ isPublished: true }).select('slug').lean();
  const portfolio = await StudentPortfolioStatus.findOne({ publicSlug: { $exists: true, $ne: null } }).select('publicSlug').lean();
  // Prefer an engagement still pending lecturer review, so the review page renders
  // the rubric rather than "already reviewed".
  const engagement =
    (await ProjectEngagement.findOne({ status: ProjectStatus.UNDER_LECTURER_REVIEW }).select('_id').lean()) ??
    (await ProjectEngagement.findOne().select('_id').lean());
  return {
    ':listingId': listing ? String(listing._id) : '',
    ':articleSlug': article?.slug ?? '',
    ':portfolioSlug': portfolio?.publicSlug ?? '',
    ':engagementId': engagement ? String(engagement._id) : '',
  };
}

// A not-yet-onboarded session (role null, ROLE_SELECTION) for the onboarding funnel.
async function mintOnboardingCookie(secret: string): Promise<string> {
  return encode({
    token: {
      id: '000000000000000000000000',
      role: null,
      firstName: 'New',
      onboardingStage: OnboardingStage.ROLE_SELECTION,
      isOnboarded: false,
      isVerified: false,
    },
    secret,
    maxAge: 24 * 60 * 60,
  });
}

async function mintCookie(role: Role, secret: string): Promise<string | null> {
  const email = ROLE_EMAIL[role];
  const user = (await (email ? User.findOne({ email }) : User.findOne({ role }))
    .select('role firstName onboardingStage farmerData.isVerified buyerData.isVerified lecturerData.isVerified')
    .lean()) as {
    _id: unknown;
    role?: Role | null;
    firstName?: string;
    onboardingStage?: string;
    farmerData?: { isVerified?: boolean };
    buyerData?: { isVerified?: boolean };
    lecturerData?: { isVerified?: boolean };
  } | null;
  if (!user) {
    logLine(`no user found for role ${role} — skipping its shots.`);
    return null;
  }
  const isVerified =
    role === Role.FARMER ? Boolean(user.farmerData?.isVerified)
    : role === Role.BUYER ? Boolean(user.buyerData?.isVerified)
    : role === Role.LECTURER ? Boolean(user.lecturerData?.isVerified)
    : false;
  return encode({
    token: {
      id: String(user._id),
      role: user.role ?? role,
      firstName: user.firstName ?? 'User',
      onboardingStage: (user.onboardingStage as OnboardingStage) ?? OnboardingStage.COMPLETED,
      isOnboarded: true,
      isVerified,
    },
    secret,
    maxAge: 24 * 60 * 60,
  });
}

async function capture(context: BrowserContext, shot: Shot, params: Record<string, string>): Promise<void> {
  let url = shot.path;
  for (const [key, value] of Object.entries(params)) url = url.replace(key, value);
  if (url.includes(':')) {
    logLine(`skipping ${shot.file} — unresolved dynamic param (seed more data).`);
    return;
  }
  const page = await context.newPage();
  await page.setViewportSize(shot.viewport ?? VIEWPORT);
  try {
    // Warm-up navigation compiles the route in dev; the real load then renders fast.
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    // Wait for client-side data fetches to resolve: loading skeletons must clear.
    await page
      .waitForFunction(() => document.querySelectorAll('.skeleton, .animate-pulse').length === 0, { timeout: 10_000 })
      .catch(() => undefined);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT_DIR, `${shot.file}.png`), fullPage: !shot.viewport });
    logLine(`captured ${shot.file}.png`);
  } catch (err) {
    logLine(`FAILED ${shot.file}: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const secret = process.env['NEXTAUTH_SECRET'];
  if (!secret) {
    console.error('capture-screenshots: NEXTAUTH_SECRET is not set.'); // eslint-disable-line no-console
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await connectDB();
  const params = await resolveDynamicParams();

  const browser: Browser = await chromium.launch();
  try {
    // Public shots first (no auth).
    const publicCtx = await browser.newContext();
    for (const shot of SHOTS.filter((s) => s.role === 'public')) {
      await capture(publicCtx, shot, params);
    }
    await publicCtx.close();

    // Onboarding shots use a not-yet-onboarded session.
    const onboardingShots = SHOTS.filter((s) => s.role === 'onboarding');
    if (onboardingShots.length) {
      const onbCtx = await browser.newContext();
      await onbCtx.addCookies([
        { name: 'next-auth.session-token', value: await mintOnboardingCookie(secret), domain: new URL(BASE_URL).hostname, path: '/', httpOnly: true, sameSite: 'Lax' },
      ]);
      for (const shot of onboardingShots) await capture(onbCtx, shot, params);
      await onbCtx.close();
    }

    // Authenticated shots, grouped per role so we mint one cookie each.
    const roles = [
      ...new Set(SHOTS.filter((s) => s.role !== 'public' && s.role !== 'onboarding').map((s) => s.role as Role)),
    ];
    for (const role of roles) {
      const jwe = await mintCookie(role, secret);
      if (!jwe) continue;
      const ctx = await browser.newContext();
      await ctx.addCookies([
        { name: 'next-auth.session-token', value: jwe, domain: new URL(BASE_URL).hostname, path: '/', httpOnly: true, sameSite: 'Lax' },
      ]);
      for (const shot of SHOTS.filter((s) => s.role === role)) {
        await capture(ctx, shot, params);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  logLine(`done — PNGs written to ${OUT_DIR}`);
  process.exit(0);
}

void main();
