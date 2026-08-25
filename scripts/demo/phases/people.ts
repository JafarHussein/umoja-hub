// People + organisations phase. Grows the population around the canonical
// accounts the foundation phase pinned: users for every role with behaviour
// archetypes, the institution admins / NGOs / suppliers / cooperatives they
// belong to, and the relationships between them. All records are backdated to
// the actor's join date. Verified farmers and lecturers are set up so the later
// phases can legitimately produce listings, orders, and reviews.
//
// This phase EXTENDS the World the foundation returned — it never replaces it.
// The canonical accounts are already in the arrays, so a generated cooperative
// can include Wanjiku and a generated buyer can order from her.

import type { SimContext, World, PersonRef } from '../world';
import { createDoc, demoPasswordHash } from '../helpers';
import { joinDate } from '../clock';
import { faceUrl } from '../images';
import {
  FIRST_NAMES,
  LAST_NAMES,
  FARMING_COUNTIES,
  URBAN_COUNTIES,
  FARM_PROFILES,
  countiesFor,
  listableCrops,
  KENYAN_UNIVERSITIES,
  DEPARTMENTS,
  BUYER_ORGS,
  STUDENT_INTERESTS,
  TECH_STACKS,
  type NamePart,
  type FarmProfileId,
  type SeedCrop,
} from '../dictionaries';
import {
  Role,
  UserStatus,
  OnboardingStage,
  VerificationStatus,
  DocumentType,
  InstitutionType,
  SupplierInputCategory,
  SupplierVerificationStatus,
  GroupStatus,
} from '../../../src/types';

// Run-scoped identity dedup. Cleared and pre-loaded from the DB at the start of
// each run so generated emails/usernames never collide with seed or genuine
// users already present (the engine only ever creates).
const usedEmails = new Set<string>();
const usedUsernames = new Set<string>();

function fullName(p: NamePart, last: string): string {
  return `${p.name} ${last}`;
}

function makeEmail(first: string, last: string): string {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
  let email = `${base}@gmail.com`;
  let n = 1;
  while (usedEmails.has(email)) {
    email = `${base}${n}@gmail.com`;
    n++;
  }
  usedEmails.add(email);
  return email;
}

// Valid username (3-20 chars of [a-z0-9_]), globally unique against the DB.
function makeUsername(first: string, last: string): string {
  let base = `${first}_${last}`.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  if (base.length < 3) base = `${base}_user`.slice(0, 20);
  let username = base;
  let n = 1;
  while (usedUsernames.has(username)) {
    username = `${base.slice(0, 17)}_${n}`.slice(0, 20);
    n++;
  }
  usedUsernames.add(username);
  return username;
}

function makePhone(rng: { int(a: number, b: number): number }): string {
  return `+2547${rng.int(10000000, 99999999)}`;
}

export async function generatePeople(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger } = ctx;

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: Institution } = await import('../../../src/lib/models/Institution.model');
  const { default: VerifiedSupplier } = await import('../../../src/lib/models/VerifiedSupplier.model');
  const { default: FarmerGroup } = await import('../../../src/lib/models/FarmerGroup.model');

  // Pre-load existing identities so generated users never collide with seed or
  // genuine accounts already in the database.
  usedEmails.clear();
  usedUsernames.clear();
  const existingUsers = await User.find({}, 'email username').lean();
  for (const u of existingUsers) {
    if (u.email) usedEmails.add(u.email);
    if (u.username) usedUsernames.add(u.username);
  }

  let faceM = rng.int(0, 99);
  let faceF = rng.int(0, 99);
  function nextFace(gender: 'm' | 'f'): string {
    if (gender === 'f') {
      faceF = (faceF + 1) % 100;
      return faceUrl('f', faceF);
    }
    faceM = (faceM + 1) % 100;
    return faceUrl('m', faceM);
  }

  function person(p: NamePart, last: string, county: string, archetype: string, id: import('mongoose').Types.ObjectId, joinedAt: Date): PersonRef {
    return {
      id,
      firstName: p.name,
      lastName: last,
      fullName: fullName(p, last),
      county,
      phone: makePhone(rng),
      gender: p.gender,
      joinedAt,
      archetype,
    };
  }

  // ---- Institutions ----
  // The foundation already created the three partner universities the canonical
  // students and lecturers belong to. Add one more for breadth, then give every
  // institution — foundation's included — a partnerships-office admin account so
  // none of them is an orphan org with no one to sign in as.
  const extraUni = KENYAN_UNIVERSITIES.find(
    (u) => !world.institutions.some((i) => i.name === u.name)
  );
  if (extraUni) {
    const joinedAt = joinDate(rng, 9);
    const inst = ledger.track(
      'Institution',
      await createDoc(Institution, {
        name: extraUni.name,
        type: InstitutionType.UNIVERSITY,
        county: extraUni.county,
        emailDomains: extraUni.domains,
        accreditationBody: 'Commission for University Education',
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.institutions.push({ id: inst._id, name: extraUni.name, county: extraUni.county });
  }

  for (const inst of world.institutions) {
    const joinedAt = joinDate(rng, 9);
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const email = makeEmail(p.name, last);
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        hashedPassword: await demoPasswordHash(Role.INSTITUTION),
        role: Role.INSTITUTION,
        county: inst.county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `${inst.name} — partnerships and student outcomes.`,
        institutionData: {
          institutionId: inst.id,
          institutionName: inst.name,
          institutionType: InstitutionType.UNIVERSITY,
          contactRole: 'Partnerships Office',
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    await Institution.updateOne({ _id: inst.id }, { $set: { adminUserId: user._id } });
  }

  // ---- Farmers ----
  // A farmer is built specialisation-first: profile, then a county that profile
  // is actually farmed in, then the crops that profile grows in that county.
  // Bio, acreage, `cropsGrown` and every later listing all follow from it, so a
  // dairy farmer in Uasin Gishu never turns up selling avocados from Nyandarua.
  const FARMER_ARCHETYPES: Array<[string, number]> = [
    ['commercial', 3], ['cooperative', 3], ['veteran', 2], ['seasonal', 3], ['new', 2],
  ];
  const FARM_PROFILE_WEIGHTS: Array<[FarmProfileId, number]> = [
    ['horticulture', 4], ['highland-roots', 3], ['cereals', 3],
    ['dairy', 3], ['fruit', 3], ['mixed', 3], ['pulses', 2],
  ];
  // Acreage follows the enterprise: a grain farm is not a two-acre plot, and a
  // vegetable grower on twelve acres would not be a smallholder.
  const ACREAGE: Record<FarmProfileId, [number, number]> = {
    horticulture: [2, 6], 'highland-roots': [3, 9], cereals: [8, 40],
    pulses: [5, 20], dairy: [4, 15], fruit: [3, 12], mixed: [1, 5],
  };

  // Every profile is dealt once before any is repeated, and those first farmers
  // are never the unverified 'new' archetype — an unverified farmer cannot list,
  // so leaving coverage to a weighted draw is how the feed ends up with a fruit
  // category containing nothing. The remainder is weighted for a realistic mix.
  const seedProfiles = rng.shuffle(FARM_PROFILE_WEIGHTS.map(([id]) => id));
  const ESTABLISHED = FARMER_ARCHETYPES.filter(([a]) => a !== 'new');

  for (let i = 0; i < 16; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const guaranteed = i < seedProfiles.length;
    const profile = guaranteed ? (seedProfiles[i] as FarmProfileId) : rng.weighted(FARM_PROFILE_WEIGHTS);
    const county = rng.pick(countiesFor(profile));
    const archetype = rng.weighted(guaranteed ? ESTABLISHED : FARMER_ARCHETYPES);
    const joinedAt = joinDate(rng, 9);
    const isNew = archetype === 'new';
    const email = makeEmail(p.name, last);
    // Ordered, not sampled: the defining crop stays first — it is the one they
    // lead with and the one their bio speaks about — and commerce posts their
    // listings in this order. Only the secondary crops are shuffled.
    // Two or three crops, not one to three: a single-crop farmer posts the same
    // produce every time, and with sixteen of them the feed loses the secondary
    // vegetables entirely.
    const available = listableCrops(profile, county);
    const crops = [available[0] as SeedCrop, ...rng.shuffle(available.slice(1))].slice(
      0,
      rng.int(2, 3)
    );
    const acres = ACREAGE[profile];
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        hashedPassword: await demoPasswordHash(Role.FARMER),
        role: Role.FARMER,
        county,
        status: UserStatus.ACTIVE,
        // A new farmer has finished setup like everyone else — what differs is
        // that their verification is still with an administrator, which is the
        // `verificationStatus` below, not an unfinished account.
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: rng.pick(FARM_PROFILES[profile].bios),
        farmerData: {
          verificationStatus: isNew ? VerificationStatus.PENDING : VerificationStatus.APPROVED,
          isVerified: !isNew,
          documentType: DocumentType.NATIONAL_ID,
          documentNumber: String(rng.int(20000000, 39999999)),
          // Sample identity document so the admin verification queue has real
          // evidence to review (specimen image, clearly marked, served locally).
          documentImageUrl: '/images/documents/sample-national-id.svg',
          cropsGrown: crops.map((c) => c.name),
          farmSizeAcres: rng.int(acres[0], acres[1]),
          primaryLanguage: rng.pick(['English', 'Kiswahili', 'Kikuyu', 'Luo', 'Kalenjin']),
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.farmers.push({
      ...person(p, last, county, archetype, user._id, joinedAt),
      farmProfile: profile,
      crops: crops.map((c) => c.id),
    });
  }

  // ---- Buyers ----
  const BUYER_ARCHETYPES: Array<[string, number]> = [
    ['restaurant', 3], ['reseller', 3], ['ngo-procurement', 1], ['individual', 2],
  ];
  for (let i = 0; i < 9; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const county = rng.pick(URBAN_COUNTIES);
    const archetype = rng.weighted(BUYER_ARCHETYPES);
    const joinedAt = joinDate(rng, 9);
    const verified = archetype !== 'individual' && rng.bool(0.7);
    const email = makeEmail(p.name, last);
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        hashedPassword: await demoPasswordHash(Role.BUYER),
        role: Role.BUYER,
        county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        buyerData: {
          verificationStatus: verified ? VerificationStatus.APPROVED : VerificationStatus.UNSUBMITTED,
          isVerified: verified,
          organizationName: archetype === 'individual' ? undefined : rng.pick(BUYER_ORGS),
          procurementScale: rng.pick(['Small', 'Medium', 'Large']),
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.buyers.push(person(p, last, county, archetype, user._id, joinedAt));
  }

  // ---- Lecturers (verified so they can review) ----
  const LECTURER_ARCHETYPES = ['strict', 'balanced', 'detailed'];
  // One verified lecturer per institution, not three spread at random. A
  // lecturer may only review their own institution's students, so an
  // institution with no lecturer is an institution whose students can never
  // have their work read by anybody.
  for (let i = 0; i < world.institutions.length; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const inst = world.institutions[i]!;
    const archetype = LECTURER_ARCHETYPES[i % LECTURER_ARCHETYPES.length]!;
    const joinedAt = joinDate(rng, 9);
    const email = makeEmail(p.name, last);
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        hashedPassword: await demoPasswordHash(Role.LECTURER),
        role: Role.LECTURER,
        county: inst.county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `Lecturer at ${inst.name}. Reviews and verifies student engineering work.`,
        lecturerData: {
          universityAffiliation: inst.name,
          institutionId: inst.id,
          isVerified: true,
          departmentAssignment: rng.pick(DEPARTMENTS),
          academicStaffId: `STAFF-${rng.int(1000, 9999)}`,
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.lecturers.push({ ...person(p, last, inst.county, archetype, user._id, joinedAt), institutionId: inst.id });
  }

  // ---- Students (assigned to institutions) ----
  const STUDENT_ARCHETYPES: Array<[string, number]> = [
    ['high', 3], ['average', 4], ['prolific', 2], ['revision', 2], ['new', 2],
  ];
  // Sixteen, so the deal below is exactly four per university.
  //
  // It was twelve, and twelve was one short. Each institution has to fund a
  // review queue that survives a rehearsal, two demonstrations promoted out of
  // that queue per lecturer, and enough finished projects for the completed
  // states to exist — and a cohort of three, one of whom may be the 'new'
  // archetype with no projects at all, cannot always do it. The seed said so
  // itself: `every institution has a confirmed demonstration coming up` failed
  // for one university while every other check passed.
  //
  // The cost of a larger cohort is a few seconds of seeding. The cost of a
  // short one is a lecturer's screen that is empty in front of a panel.
  for (let i = 0; i < 16; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    // Dealt round-robin, not picked at random. Independent picks over four
    // universities leave one of them with almost nobody often enough to
    // matter, and a university with no cohort is a lecturer with nothing to
    // read — discovered in front of the panel rather than here. Which
    // archetype a student is stays random; where they study does not.
    const inst = world.institutions[i % world.institutions.length]!;
    const archetype = rng.weighted(STUDENT_ARCHETYPES);
    const joinedAt = joinDate(rng, 9);
    const email = makeEmail(p.name, last);
    const domain = rng.pick(KENYAN_UNIVERSITIES.find((u) => u.name === inst.name)?.domains ?? ['students.uonbi.ac.ke']);
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        hashedPassword: await demoPasswordHash(Role.STUDENT),
        role: Role.STUDENT,
        county: inst.county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `${rng.pick(STUDENT_INTERESTS)} student at ${inst.name}.`,
        studentData: {
          techStackPreferences: rng.sample(TECH_STACKS, rng.int(2, 5)),
          universityAffiliation: inst.name,
          institutionId: inst.id,
          primaryInterest: rng.pick(STUDENT_INTERESTS),
          githubUsername: `${p.name.toLowerCase()}-dev`,
          institutionalEmail: `${p.name.toLowerCase()}.${last.toLowerCase()}@${domain}`,
          institutionalEmailVerified: archetype !== 'new',
          academicRegistrationNumber: `${rng.pick(['SCT', 'ENG', 'BSE'])}-${rng.int(100, 999)}-${rng.int(2020, 2024)}`,
          completedProjectCount: 0,
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.students.push({ ...person(p, last, inst.county, archetype, user._id, joinedAt), institutionId: inst.id });
  }

  // The admin steward (mediation / payout actor) is the canonical admin account
  // created by the foundation phase — there is exactly one, and it is the same
  // account the presenter signs in as.

  // ---- Verified suppliers ----
  for (let i = 0; i < 4; i++) {
    const county = rng.pick(FARMING_COUNTIES);
    const joinedAt = joinDate(rng, 9);
    ledger.track(
      'VerifiedSupplier',
      await createDoc(VerifiedSupplier, {
        businessName: rng.pick(['Agrovet Plus', 'Mavuno Inputs', 'GreenGrowSupplies', 'Shamba Stores', 'FarmChem Ltd']) + ` ${county}`,
        contactPhone: makePhone(rng),
        contactEmail: `info@supplier${i}.co.ke`,
        county,
        physicalAddress: `${county} Town, Main Street`,
        inputCategories: rng.sample(Object.values(SupplierInputCategory), rng.int(1, 3)),
        registrations: { kebsNumber: `KEBS-${rng.int(10000, 99999)}`, pcpbNumber: `PCPB-${rng.int(1000, 9999)}` },
        verificationStatus: SupplierVerificationStatus.VERIFIED,
        verifiedBy: world.admin?.id,
        verifiedAt: joinedAt,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
  }

  // ---- Farmer cooperatives (some NGO-sponsored) ----
  // Founded by the farmers whose archetype says they are cooperative members, so
  // "cooperative farmer" is a fact in the data rather than a label. Members are
  // drawn from the founder's county first; if that county is thin the pool
  // widens rather than emitting a one-member cooperative.
  const verifiedFarmers = world.farmers.filter((f) => f.archetype !== 'new');
  const founders = verifiedFarmers.filter((f) => f.archetype === 'cooperative');
  const founderPool = founders.length > 0 ? founders : verifiedFarmers;
  const used = new Set<string>();

  for (const founder of founderPool.slice(0, 3)) {
    if (verifiedFarmers.length < 3) break;
    if (used.has(String(founder.id))) continue;
    used.add(String(founder.id));

    const sameCounty = verifiedFarmers.filter((f) => f.county === founder.county && f.id !== founder.id);
    const pool = sameCounty.length >= 2 ? sameCounty : verifiedFarmers.filter((f) => f.id !== founder.id);
    const members = [founder, ...rng.sample(pool, rng.int(2, Math.min(5, pool.length)))];
    const joinedAt = founder.joinedAt;

    ledger.track(
      'FarmerGroup',
      await createDoc(FarmerGroup, {
        groupName: `${founder.county} ${rng.pick(['Farmers', 'Growers', 'Producers'])} Cooperative`,
        county: founder.county,
        createdBy: founder.id,
        members: members.map((m) => m.id),
        memberCount: members.length,
        status: GroupStatus.ACTIVE,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
  }
}
