// People + organisations generator. Creates users for every role with behaviour
// archetypes, the institutions/NGOs/suppliers/cooperatives they belong to, and
// the relationships between them. All records are backdated to the actor's join
// date. Verified farmers/lecturers are set up so downstream generators can
// legitimately produce listings, orders, and reviews.

import type { SimContext, World, PersonRef } from '../world';
import { emptyWorld } from '../world';
import { createDoc } from '../helpers';
import { joinDate } from '../clock';
import { faceUrl } from '../images';
import {
  FIRST_NAMES,
  LAST_NAMES,
  FARMING_COUNTIES,
  URBAN_COUNTIES,
  CROPS,
  KENYAN_UNIVERSITIES,
  NGO_NAMES,
  EMPLOYERS,
  DEPARTMENTS,
  FARMER_BIOS,
  BUYER_ORGS,
  STUDENT_INTERESTS,
  TECH_STACKS,
  type NamePart,
} from '../dictionaries';
import {
  Role,
  UserStatus,
  OnboardingStage,
  VerificationStatus,
  DocumentType,
  StudentTier,
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

export async function generatePeople(ctx: SimContext): Promise<World> {
  const { rng, ledger } = ctx;
  const world = emptyWorld();

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: Institution } = await import('../../../src/lib/models/Institution.model');
  const { default: NgoOrganization } = await import('../../../src/lib/models/NgoOrganization.model');
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

  // ---- Institutions (org + admin account) ----
  const chosenUnis = rng.sample(KENYAN_UNIVERSITIES, 3);
  for (const uni of chosenUnis) {
    const joinedAt = joinDate(rng, 9);
    const inst = ledger.track(
      'Institution',
      await createDoc(Institution, {
        name: uni.name,
        type: InstitutionType.UNIVERSITY,
        county: uni.county,
        emailDomains: uni.domains,
        accreditationBody: 'Commission for University Education',
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
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
        role: Role.INSTITUTION,
        county: uni.county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `${uni.name} — partnerships and student outcomes.`,
        institutionData: {
          institutionId: inst._id,
          institutionName: uni.name,
          institutionType: InstitutionType.UNIVERSITY,
          contactRole: 'Partnerships Office',
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    await Institution.updateOne({ _id: inst._id }, { $set: { adminUserId: user._id } });
    world.institutions.push({ id: inst._id, name: uni.name, county: uni.county });
  }

  // ---- NGOs (org + admin account) ----
  const chosenNgos = rng.sample(NGO_NAMES, 2);
  for (const ngo of chosenNgos) {
    const joinedAt = joinDate(rng, 9);
    const counties = rng.sample(FARMING_COUNTIES, rng.int(2, 4));
    const org = ledger.track(
      'NgoOrganization',
      await createDoc(NgoOrganization, {
        name: ngo.name,
        focusAreas: ngo.focus,
        countiesServed: counties,
        description: `${ngo.name} supports smallholder cooperatives across ${counties.join(', ')}.`,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
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
        role: Role.NGO,
        county: counties[0],
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: ngo.focus.join(' · '),
        ngoData: {
          organizationId: org._id,
          organizationName: ngo.name,
          focusAreas: ngo.focus,
          countiesServed: counties,
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    await NgoOrganization.updateOne({ _id: org._id }, { $set: { adminUserId: user._id } });
    world.ngos.push({ id: org._id, name: ngo.name });
  }

  // ---- Farmers ----
  const FARMER_ARCHETYPES: Array<[string, number]> = [
    ['commercial', 3], ['cooperative', 3], ['veteran', 2], ['seasonal', 3], ['new', 2],
  ];
  for (let i = 0; i < 16; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const county = rng.pick(FARMING_COUNTIES);
    const archetype = rng.weighted(FARMER_ARCHETYPES);
    const joinedAt = joinDate(rng, 9);
    const isNew = archetype === 'new';
    const email = makeEmail(p.name, last);
    const crops = rng.sample(CROPS.map((c) => c.name), rng.int(1, 3));
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        role: Role.FARMER,
        county,
        status: UserStatus.ACTIVE,
        onboardingStage: isNew ? OnboardingStage.VERIFICATION_UPLOAD : OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: rng.pick(FARMER_BIOS),
        farmerData: {
          verificationStatus: isNew ? VerificationStatus.PENDING : VerificationStatus.APPROVED,
          isVerified: !isNew,
          documentType: DocumentType.NATIONAL_ID,
          documentNumber: String(rng.int(20000000, 39999999)),
          cropsGrown: crops,
          farmSizeAcres: rng.int(1, 12),
          primaryLanguage: rng.pick(['English', 'Kiswahili', 'Kikuyu', 'Luo', 'Kalenjin']),
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.farmers.push(person(p, last, county, archetype, user._id, joinedAt));
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
  for (let i = 0; i < 3; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const inst = world.institutions[i % world.institutions.length]!;
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
    world.lecturers.push(person(p, last, inst.county, archetype, user._id, joinedAt));
  }

  // ---- Students (assigned to institutions) ----
  const STUDENT_ARCHETYPES: Array<[string, number]> = [
    ['high', 3], ['average', 4], ['portfolio', 2], ['revision', 2], ['new', 2],
  ];
  for (let i = 0; i < 12; i++) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const inst = rng.pick(world.institutions);
    const archetype = rng.weighted(STUDENT_ARCHETYPES);
    const joinedAt = joinDate(rng, 9);
    const tier = rng.weighted<string>([
      [StudentTier.BEGINNER, 4],
      [StudentTier.INTERMEDIATE, 3],
      [StudentTier.ADVANCED, 2],
    ]);
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
        role: Role.STUDENT,
        county: inst.county,
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `${rng.pick(STUDENT_INTERESTS)} student at ${inst.name}.`,
        studentData: {
          currentTier: tier,
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
    world.students.push(person(p, last, inst.county, archetype, user._id, joinedAt));
  }

  // ---- Employers ----
  const chosenEmployers = rng.sample(EMPLOYERS, 3);
  for (const emp of chosenEmployers) {
    const p = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const joinedAt = joinDate(rng, 6);
    const email = makeEmail(p.name, last);
    const user = ledger.track(
      'User',
      await createDoc(User, {
        email,
        username: makeUsername(p.name, last),
        firstName: p.name,
        lastName: last,
        phoneNumber: makePhone(rng),
        role: Role.EMPLOYER,
        county: 'Nairobi',
        status: UserStatus.ACTIVE,
        onboardingStage: OnboardingStage.COMPLETED,
        isEmailVerified: true,
        profilePhotoUrl: nextFace(p.gender),
        bio: `Hiring at ${emp.name}.`,
        employerData: {
          companyName: emp.name,
          industry: emp.industry,
          website: `https://${emp.name.toLowerCase().replace(/[^a-z]/g, '')}.co.ke`,
          hiringInterests: rng.sample(TECH_STACKS, rng.int(2, 4)),
        },
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
    world.employers.push(person(p, last, 'Nairobi', 'employer', user._id, joinedAt));
  }

  // ---- Admin steward ----
  // Reuse an existing admin (e.g. the seeded platform admin) as the mediation /
  // payout actor so escrow records reference a real steward. It is referenced,
  // never tracked or mutated. Only create one if the platform has no admin yet.
  {
    const joinedAt = joinDate(rng, 9);
    const existingAdmin = await User.findOne({ role: Role.ADMIN })
      .select('_id firstName lastName county')
      .lean();
    if (existingAdmin) {
      world.admin = person(
        { name: existingAdmin.firstName ?? 'Platform', gender: 'm' },
        existingAdmin.lastName ?? 'Steward',
        existingAdmin.county ?? 'Nairobi',
        'admin',
        existingAdmin._id,
        joinedAt
      );
    } else {
      const user = ledger.track(
        'User',
        await createDoc(User, {
          email: 'admin@umojahub.co.ke',
          username: 'admin',
          firstName: 'Platform',
          lastName: 'Steward',
          phoneNumber: makePhone(rng),
          role: Role.ADMIN,
          county: 'Nairobi',
          status: UserStatus.ACTIVE,
          onboardingStage: OnboardingStage.COMPLETED,
          isEmailVerified: true,
          createdAt: joinedAt,
          updatedAt: joinedAt,
        })
      );
      world.admin = person({ name: 'Platform', gender: 'm' }, 'Steward', 'Nairobi', 'admin', user._id, joinedAt);
    }
  }

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
  const verifiedFarmers = world.farmers.filter((f) => f.archetype !== 'new');
  for (let i = 0; i < 3 && verifiedFarmers.length >= 4; i++) {
    const founder = rng.pick(verifiedFarmers);
    const memberPool = verifiedFarmers.filter((f) => f.county === founder.county && f.id !== founder.id);
    const members = [founder, ...rng.sample(memberPool, rng.int(2, Math.max(2, memberPool.length)))];
    const sponsor = rng.bool(0.6) && world.ngos.length > 0 ? rng.pick(world.ngos) : null;
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
        sponsoredByNgoId: sponsor?.id,
        createdAt: joinedAt,
        updatedAt: joinedAt,
      })
    );
  }

  return world;
}
