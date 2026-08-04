// The canonical demo accounts — the only identities with a password, and the
// ones the presentation is driven from. Everyone else in the world is generated,
// so these are pinned: fixed names, counties, emails and roles that never move
// between runs, because the runbook and the presenter's muscle memory depend on
// them. Carried over from the retired scripts/seed.ts.
//
// Passwords are per-role, not per-person, so the presenter memorises five
// strings rather than fifteen. They are demo credentials for a local database
// and are printed by the runbook on purpose.

import {
  Role,
  VerificationStatus,
  StudentTier,
  DocumentType,
  OnboardingStage,
  UserStatus,
} from '../../../src/types';

export const DEMO_PASSWORDS: Record<string, string> = {
  [Role.FARMER]: 'Farmer@2024!',
  [Role.BUYER]: 'Buyer@2024!',
  [Role.STUDENT]: 'Student@2024!',
  [Role.LECTURER]: 'Lecturer@2024!',
  [Role.ADMIN]: 'Admin@Umoja2024!',
  [Role.INSTITUTION]: 'Institution@2024!',
};

export interface DemoAccount {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phoneNumber: string;
  county: string;
  /** Why this account exists in the runbook — surfaced in PRESENTATION_GUIDE. */
  purpose: string;
  extra?: Record<string, unknown>;
}

// Every canonical account is fully onboarded and email-verified so a demo never
// lands in the onboarding funnel by accident. The funnel is demonstrated by
// registering a fresh user live, not by an account left half-finished.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  // ---- Farmers ----
  {
    firstName: 'Wanjiku',
    lastName: 'Kamau',
    email: 'wanjiku.kamau@gmail.com',
    role: Role.FARMER,
    phoneNumber: '+254712345678',
    county: 'Kirinyaga',
    purpose: 'Primary farmer. Verified, high trust — the farmer side of the main demo.',
    extra: {
      bio: 'I farm three acres at Mwea — tomatoes and capsicum under drip, and rice on the scheme. I have supplied the same two Nairobi grocers for years and they have never had to send anything back.',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: '28451903',
        documentImageUrl: '/images/documents/sample-national-id.svg',
        cropsGrown: ['Tomatoes', 'Rice', 'Capsicum'],
        livestockKept: [],
        farmSizeAcres: 3,
        primaryLanguage: 'kikuyu',
      },
    },
  },
  {
    firstName: 'Kipchoge',
    lastName: 'Mutai',
    email: 'kipchoge.mutai@gmail.com',
    role: Role.FARMER,
    phoneNumber: '+254723456789',
    county: 'Uasin Gishu',
    purpose: 'Large-acreage cereal farmer — shows a different crop mix and county.',
    extra: {
      bio: 'Eight acres of maize with beans in rotation, and a few dairy cows for the daily income. I have my own drying floor, so I store and sell when the price is worth taking rather than off the field.',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: '31220847',
        documentImageUrl: '/images/documents/sample-national-id.svg',
        cropsGrown: ['Maize', 'Wheat', 'Beans'],
        livestockKept: ['dairy cows'],
        farmSizeAcres: 8,
        primaryLanguage: 'kalenjin',
      },
    },
  },
  {
    firstName: 'Achieng',
    lastName: 'Odhiambo',
    email: 'achieng.odhiambo@gmail.com',
    role: Role.FARMER,
    phoneNumber: '+254734567890',
    county: 'Kisumu',
    purpose: 'Smallholder with aquaculture — the small-farm end of the spectrum.',
    extra: {
      bio: 'Two acres in Kisumu, mixed. Maize and sukuma for the market, and a fish pond that started as an experiment and now feeds the family. I grow for the house first and sell what is genuinely spare.',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: '29803416',
        documentImageUrl: '/images/documents/sample-national-id.svg',
        cropsGrown: ['Maize', 'Kale (Sukuma Wiki)', 'Sweet Potatoes'],
        livestockKept: ['tilapia fish (pond)'],
        farmSizeAcres: 2,
        primaryLanguage: 'luo',
      },
    },
  },
  {
    firstName: 'Njoroge',
    lastName: 'Mwangi',
    email: 'njoroge.mwangi@gmail.com',
    role: Role.FARMER,
    phoneNumber: '+254745678901',
    county: 'Nyandarua',
    purpose: 'Potato grower in the Price Intelligence demo county.',
    extra: {
      bio: 'Five acres on the cold side of the Nyandarua ridge, which is what potatoes and carrots want. Certified seed every season, and a ventilated store so I can sell through the year instead of all at harvest.',
      farmerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: '30117254',
        documentImageUrl: '/images/documents/sample-national-id.svg',
        cropsGrown: ['Potatoes', 'Peas', 'Carrots'],
        livestockKept: ['dairy cows', 'sheep'],
        farmSizeAcres: 5,
        primaryLanguage: 'kikuyu',
      },
    },
  },
  {
    firstName: 'Chebet',
    lastName: 'Koech',
    email: 'chebet.koech@gmail.com',
    role: Role.FARMER,
    phoneNumber: '+254756789012',
    county: 'Kericho',
    purpose:
      'PENDING verification — the farmer sitting in the admin verification queue for the live approval demo.',
    extra: {
      onboardingStage: OnboardingStage.VERIFICATION_UPLOAD,
      bio: 'Four acres in Kericho — tea on the slope, maize on the flat, and a few dairy cows. New here and still getting my documents in order.',
      farmerData: {
        verificationStatus: VerificationStatus.PENDING,
        isVerified: false,
        documentType: DocumentType.NATIONAL_ID,
        documentNumber: '33940188',
        documentImageUrl: '/images/documents/sample-national-id.svg',
        cropsGrown: ['Tea', 'Maize'],
        livestockKept: ['dairy cows'],
        farmSizeAcres: 4,
        primaryLanguage: 'kalenjin',
      },
    },
  },

  // ---- Buyers ----
  {
    firstName: 'Kamau',
    lastName: 'Githinji',
    email: 'kamau.githinji@gmail.com',
    role: Role.BUYER,
    phoneNumber: '+254767890123',
    county: 'Nairobi',
    purpose: 'Primary buyer. Drives the checkout → escrow → completion walkthrough.',
    extra: {
      buyerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        organizationName: 'Mama Oliech Restaurant',
        procurementScale: 'Medium',
      },
    },
  },
  {
    firstName: 'Fatuma',
    lastName: 'Hassan',
    email: 'fatuma.hassan@gmail.com',
    role: Role.BUYER,
    phoneNumber: '+254778901234',
    county: 'Mombasa',
    purpose: 'Coastal bulk buyer — shows cross-county sourcing.',
    extra: {
      buyerData: {
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        organizationName: 'Coast Fresh Distributors',
        procurementScale: 'Large',
      },
    },
  },
  {
    firstName: 'Peter',
    lastName: 'Otieno',
    email: 'peter.otieno@gmail.com',
    role: Role.BUYER,
    phoneNumber: '+254789012345',
    county: 'Kisumu',
    purpose: 'Unverified individual buyer — the low-trust counterpart.',
    extra: {
      buyerData: {
        verificationStatus: VerificationStatus.UNSUBMITTED,
        isVerified: false,
        procurementScale: 'Small',
      },
    },
  },

  // ---- Students ----
  {
    firstName: 'Brian',
    lastName: 'Otieno',
    email: 'brian.otieno@students.uonbi.ac.ke',
    role: Role.STUDENT,
    phoneNumber: '+254790123456',
    county: 'Nairobi',
    purpose: 'Primary student. Carries the brief → review → verified project walkthrough.',
    extra: {
      studentData: {
        currentTier: StudentTier.BEGINNER,
        githubUsername: 'brianotieno-dev',
        institutionalEmail: 'brian.otieno@students.uonbi.ac.ke',
        institutionalEmailVerified: true,
        academicRegistrationNumber: 'SCT-221-2022',
        primaryInterest: 'backend',
        techStackPreferences: ['Node.js', 'MongoDB', 'Express'],
        universityAffiliation: 'University of Nairobi',
        completedProjectCount: 0,
      },
    },
  },
  {
    firstName: 'Amina',
    lastName: 'Waweru',
    email: 'amina.waweru@strathmore.edu',
    role: Role.STUDENT,
    phoneNumber: '+254701234567',
    county: 'Nairobi',
    purpose: 'Intermediate student with several projects already signed off.',
    extra: {
      studentData: {
        currentTier: StudentTier.INTERMEDIATE,
        githubUsername: 'aminawaweru',
        institutionalEmail: 'amina.waweru@strathmore.edu',
        institutionalEmailVerified: true,
        academicRegistrationNumber: 'BSE-104-2021',
        primaryInterest: 'fullstack',
        techStackPreferences: ['React', 'Next.js', 'TypeScript', 'MongoDB'],
        universityAffiliation: 'Strathmore University',
        completedProjectCount: 0,
      },
    },
  },
  {
    firstName: 'Dennis',
    lastName: 'Kariuki',
    email: 'dennis.kariuki@jkuat.ac.ke',
    role: Role.STUDENT,
    phoneNumber: '+254712345670',
    county: 'Kiambu',
    purpose: 'Third student — supplies a peer reviewer who is not the demo student.',
    extra: {
      studentData: {
        currentTier: StudentTier.BEGINNER,
        githubUsername: 'dkariuki-jkuat',
        institutionalEmail: 'dennis.kariuki@jkuat.ac.ke',
        institutionalEmailVerified: true,
        academicRegistrationNumber: 'ENG-318-2022',
        primaryInterest: 'mobile',
        techStackPreferences: ['React Native', 'JavaScript', 'Firebase'],
        universityAffiliation: 'Jomo Kenyatta University of Agriculture and Technology',
        completedProjectCount: 0,
      },
    },
  },

  // ---- Lecturers ----
  {
    firstName: 'Dr. Grace',
    lastName: "Ndung'u",
    email: 'g.ndungu@uonbi.ac.ke',
    role: Role.LECTURER,
    phoneNumber: '+254723456780',
    county: 'Nairobi',
    purpose: 'Verified lecturer. Runs the live review-and-verify demo.',
    extra: {
      lecturerData: {
        universityAffiliation: 'University of Nairobi — School of Computing and Informatics',
        isVerified: true,
        departmentAssignment: 'Computing and Informatics',
        academicStaffId: 'STAFF-4417',
      },
    },
  },
  {
    firstName: 'Prof. James',
    lastName: 'Mwangi',
    email: 'j.mwangi@strathmore.edu',
    role: Role.LECTURER,
    phoneNumber: '+254734567801',
    county: 'Nairobi',
    purpose: 'UNVERIFIED lecturer — shows the gate that keeps unverified staff from reviewing.',
    extra: {
      lecturerData: {
        universityAffiliation: 'Strathmore University — Faculty of Information Technology',
        isVerified: false,
        departmentAssignment: 'Information Technology',
      },
    },
  },

  // ---- Admin ----
  {
    firstName: 'UmojaHub',
    lastName: 'Admin',
    email: 'umojahub16@gmail.com',
    role: Role.ADMIN,
    phoneNumber: '+254700000001',
    county: 'Nairobi',
    purpose: 'Platform administrator. Verification queue, escrow settlement, payouts, analytics.',
  },
];

// Deterministic username from the email local-part, matching the credentials
// validation rule (3-20 chars of [a-z0-9_]). Uniqueness is guarded by the
// caller, which owns the run-wide set.
export function usernameFor(email: string, taken: Set<string>): string {
  let base = (email.split('@')[0] ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
  if (base.length < 3) base = `${base}_user`.slice(0, 20);
  let username = base;
  let n = 1;
  while (taken.has(username)) {
    username = `${base.slice(0, 18)}_${n}`.slice(0, 20);
    n += 1;
  }
  taken.add(username);
  return username;
}

// Defaults every canonical account gets unless its `extra` overrides them.
export const ACCOUNT_DEFAULTS = {
  status: UserStatus.ACTIVE,
  onboardingStage: OnboardingStage.COMPLETED,
  isEmailVerified: true,
};
