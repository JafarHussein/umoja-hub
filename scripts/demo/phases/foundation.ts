// Foundation phase. Everything the demo world is anchored on and that must be
// identical on every run: the partner institutions, the canonical login
// accounts, and the authored reference content (Knowledge Hub, verified supplier
// directory, AI brief context library).
//
// This runs before every other phase and returns the World those phases build
// on, so the accounts the presenter signs in as are ordinary members of the
// ecosystem — they get listings, orders, reviews and notifications from the
// same generators as everyone else. Nothing about them is special-cased
// downstream; only their identity is pinned.
//
// Passwords: one bcrypt hash per distinct password, reused across the accounts
// that share it. Hashing fifteen times would add seconds to the run for no
// benefit — these are demo credentials on a local database.

import type { SimContext, World, PersonRef } from '../world';
import { emptyWorld } from '../world';
import { createDoc, demoPasswordHash } from '../helpers';
import { daysAgo } from '../clock';
import { faceUrl } from '../images';
import { knowledgeArticles } from '../content/knowledge';
import { verifiedSuppliers } from '../content/suppliers';
import { briefContextLibrary } from '../content/briefs';
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORDS,
  ACCOUNT_DEFAULTS,
  usernameFor,
  type DemoAccount,
} from '../content/accounts';
import { KENYAN_UNIVERSITIES, CROPS_BY_ID, cropsGrownIn, type SeedCropId } from '../dictionaries';
import { resolveCrop } from '../../../src/lib/taxonomy/crops';
import { Role, InstitutionType } from '../../../src/types';

// The three universities the canonical students and lecturers belong to. Pinned
// (not sampled) because the accounts reference them by name.
const FOUNDATION_UNIVERSITIES = [
  'University of Nairobi',
  'Strathmore University',
  'Jomo Kenyatta University of Agriculture and Technology',
];

/**
 * What a canonical farmer can legitimately list, derived from the `cropsGrown`
 * they already declare in accounts.ts rather than from a second map that could
 * drift from it. Free text ("tomatoes", "irish", "sweet potatoes") is resolved
 * through the canonical taxonomy, dropped if the platform does not trade it —
 * Chebet's tea has no marketplace category, and wheat and peas are not in the
 * registry at all — and then narrowed to what their pinned county actually
 * grows. Wanjiku is in Kirinyaga and declares tomatoes, rice and capsicum, so
 * she lists exactly those; Mwea rice is genuinely a Kirinyaga crop.
 *
 * A farmer whose declared crops survive none of that falls back to their
 * county's produce, so the pinned accounts can never end up with nothing to
 * sell. Demo validation asserts the result stayed consistent.
 */
function listableCropsFor(account: DemoAccount): SeedCropId[] {
  const declared = (account.extra?.['farmerData'] as { cropsGrown?: string[] } | undefined)?.cropsGrown ?? [];
  const resolved: SeedCropId[] = [];
  for (const name of declared) {
    const id = resolveCrop(name);
    if (!id || !(id in CROPS_BY_ID)) continue;
    const crop = CROPS_BY_ID[id as SeedCropId];
    if (crop.grownIn.includes(account.county) && !resolved.includes(crop.id)) resolved.push(crop.id);
  }
  return resolved.length > 0 ? resolved : cropsGrownIn(account.county).map((c) => c.id);
}

// Which institution each canonical academic belongs to, keyed by email.
const ACCOUNT_INSTITUTION: Record<string, string> = {
  'brian.otieno@students.uonbi.ac.ke': 'University of Nairobi',
  'amina.waweru@strathmore.edu': 'Strathmore University',
  'dennis.kariuki@jkuat.ac.ke': 'Jomo Kenyatta University of Agriculture and Technology',
  'g.ndungu@uonbi.ac.ke': 'University of Nairobi',
  'j.mwangi@strathmore.edu': 'Strathmore University',
};

// Behaviour archetype per canonical account. This is what makes their
// dashboards rich: the commerce and education phases read the archetype to
// decide how much history to generate, so pinning these pins the shape of the
// demo (Wanjiku always busy, Chebet always awaiting verification).
const ACCOUNT_ARCHETYPE: Record<string, string> = {
  'wanjiku.kamau@gmail.com': 'commercial',
  'kipchoge.mutai@gmail.com': 'veteran',
  'achieng.odhiambo@gmail.com': 'cooperative',
  'njoroge.mwangi@gmail.com': 'commercial',
  'chebet.koech@gmail.com': 'new',
  'kamau.githinji@gmail.com': 'restaurant',
  'fatuma.hassan@gmail.com': 'reseller',
  'peter.otieno@gmail.com': 'individual',
  'brian.otieno@students.uonbi.ac.ke': 'high',
  'amina.waweru@strathmore.edu': 'prolific',
  'dennis.kariuki@jkuat.ac.ke': 'average',
  'g.ndungu@uonbi.ac.ke': 'balanced',
  'j.mwangi@strathmore.edu': 'balanced',
  'umojahub16@gmail.com': 'admin',
};

// Canonical accounts are the platform's earliest members — pinned join dates,
// old enough to carry months of history, and stable across runs.
const ACCOUNT_AGE_DAYS: Record<string, number> = {
  'wanjiku.kamau@gmail.com': 255,
  'kipchoge.mutai@gmail.com': 240,
  'achieng.odhiambo@gmail.com': 228,
  'njoroge.mwangi@gmail.com': 212,
  'chebet.koech@gmail.com': 9,
  'kamau.githinji@gmail.com': 246,
  'fatuma.hassan@gmail.com': 219,
  'peter.otieno@gmail.com': 74,
  'brian.otieno@students.uonbi.ac.ke': 198,
  'amina.waweru@strathmore.edu': 234,
  'dennis.kariuki@jkuat.ac.ke': 121,
  'g.ndungu@uonbi.ac.ke': 262,
  'j.mwangi@strathmore.edu': 41,
  'lydia.wanjala@twiga.co.ke': 96,
  'umojahub16@gmail.com': 275,
};

// Female first names among the canonical accounts, so profile portraits match.
const FEMALE_FIRST_NAMES = new Set([
  'Wanjiku',
  'Achieng',
  'Chebet',
  'Fatuma',
  'Amina',
  'Lydia',
  'Dr. Grace',
]);

export interface FoundationResult {
  world: World;
  /** email → plaintext password, for the runbook's account table. */
  credentials: Array<{ account: DemoAccount; username: string; password: string }>;
}

// Nothing here is random: the foundation is the fixed part of the world, so it
// takes the ledger but never touches the RNG.
export async function generateFoundation(ctx: SimContext): Promise<FoundationResult> {
  const { ledger } = ctx;
  const world = emptyWorld();

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: Institution } = await import('../../../src/lib/models/Institution.model');
  const { default: VerifiedSupplier } = await import('../../../src/lib/models/VerifiedSupplier.model');
  const { default: KnowledgeArticle } = await import('../../../src/lib/models/KnowledgeArticle.model');
  const { default: BriefContextLibrary } = await import('../../../src/lib/models/BriefContextLibrary.model');

  // ---- Partner institutions ----
  // Created first so the canonical students and lecturers can be linked to a
  // real Institution document rather than a bare affiliation string.
  const institutionByName = new Map<string, { id: import('mongoose').Types.ObjectId; county: string }>();
  for (const name of FOUNDATION_UNIVERSITIES) {
    const uni = KENYAN_UNIVERSITIES.find((u) => u.name === name);
    if (!uni) continue;
    const createdAt = daysAgo(280);
    const inst = ledger.track(
      'Institution',
      await createDoc(Institution, {
        name: uni.name,
        type: InstitutionType.UNIVERSITY,
        county: uni.county,
        emailDomains: uni.domains,
        accreditationBody: 'Commission for University Education',
        createdAt,
        updatedAt: createdAt,
      })
    );
    institutionByName.set(uni.name, { id: inst._id, county: uni.county });
    world.institutions.push({ id: inst._id, name: uni.name, county: uni.county });
  }

  // ---- Canonical accounts ----
  const takenUsernames = new Set<string>();
  const credentials: FoundationResult['credentials'] = [];
  let faceM = 40;
  let faceF = 40;

  for (const account of DEMO_ACCOUNTS) {
    const password = DEMO_PASSWORDS[account.role] ?? DEMO_PASSWORDS[Role.BUYER]!;
    const username = usernameFor(account.email, takenUsernames);
    const joinedAt = daysAgo(ACCOUNT_AGE_DAYS[account.email] ?? 180);
    const gender: 'm' | 'f' = FEMALE_FIRST_NAMES.has(account.firstName) ? 'f' : 'm';
    const face = gender === 'f' ? faceUrl('f', faceF++) : faceUrl('m', faceM++);

    // Link academics to their Institution document.
    const institutionName = ACCOUNT_INSTITUTION[account.email];
    const institution = institutionName ? institutionByName.get(institutionName) : undefined;
    const extra = { ...(account.extra ?? {}) };
    if (institution && account.role === Role.STUDENT) {
      extra['studentData'] = {
        ...(extra['studentData'] as Record<string, unknown> | undefined),
        institutionId: institution.id,
      };
    }
    if (institution && account.role === Role.LECTURER) {
      extra['lecturerData'] = {
        ...(extra['lecturerData'] as Record<string, unknown> | undefined),
        institutionId: institution.id,
      };
    }

    const user = ledger.track(
      'User',
      await createDoc(User, {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        username,
        hashedPassword: await demoPasswordHash(account.role),
        role: account.role,
        phoneNumber: account.phoneNumber,
        county: account.county,
        profilePhotoUrl: face,
        ...ACCOUNT_DEFAULTS,
        ...extra,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );

    credentials.push({ account, username, password });

    const ref: PersonRef = {
      id: user._id,
      firstName: account.firstName,
      lastName: account.lastName,
      fullName: `${account.firstName} ${account.lastName}`,
      county: account.county,
      phone: account.phoneNumber,
      gender,
      joinedAt,
      archetype: ACCOUNT_ARCHETYPE[account.email] ?? 'average',
      ...(institution ? { institutionId: institution.id } : {}),
      ...(account.role === Role.FARMER ? { crops: listableCropsFor(account) } : {}),
    };

    switch (account.role) {
      case Role.FARMER:
        world.farmers.push(ref);
        break;
      case Role.BUYER:
        world.buyers.push(ref);
        break;
      case Role.STUDENT:
        world.students.push(ref);
        break;
      case Role.LECTURER:
        // Only verified lecturers join the reviewer pool. Prof. Mwangi is
        // deliberately unverified — he exists to show the gate, and letting him
        // author reviews would contradict that.
        if ((account.extra?.['lecturerData'] as { isVerified?: boolean } | undefined)?.isVerified) {
          world.lecturers.push(ref);
        }
        break;
      case Role.ADMIN:
        world.admin = ref;
        break;
      default:
        break;
    }
  }

  const adminId = world.admin?.id;
  if (!adminId) throw new Error('foundation: no admin account was created');

  // ---- Authored reference content ----
  for (const supplier of verifiedSuppliers(adminId, daysAgo(270))) {
    ledger.track('VerifiedSupplier', await createDoc(VerifiedSupplier, supplier));
  }

  for (const article of knowledgeArticles(adminId, daysAgo(200))) {
    ledger.track('KnowledgeArticle', await createDoc(KnowledgeArticle, article));
  }

  ledger.track(
    'BriefContextLibrary',
    await createDoc(BriefContextLibrary, briefContextLibrary(adminId))
  );

  return { world, credentials };
}
