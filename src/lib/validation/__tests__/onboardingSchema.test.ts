import {
  roleSelectionSchema,
  usernameSchema,
  passwordSchema,
  onboardingDraftSchema,
  credentialsLoginSchema,
  farmerIdentitySchema,
  buyerIdentitySchema,
  studentIdentitySchema,
  lecturerIdentitySchema,
  farmerOnboardingVerificationSchema,
  buyerOnboardingVerificationSchema,
  lecturerOnboardingVerificationSchema,
  institutionalEmailSchema,
  institutionalEmailVerifySchema,
} from '../onboardingSchema';

const CLOUDINARY = 'https://res.cloudinary.com/umojahub/image/upload/x.jpg';

describe('usernameSchema (AUTH_ONBOARDING_FLOW_V2)', () => {
  it('accepts and lowercases a valid username', () => {
    const result = usernameSchema.safeParse('Wanjiku_01');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('wanjiku_01');
  });

  it('rejects too-short and too-long usernames', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    expect(usernameSchema.safeParse('a'.repeat(21)).success).toBe(false);
  });

  it('rejects disallowed characters', () => {
    expect(usernameSchema.safeParse('has space').success).toBe(false);
    expect(usernameSchema.safeParse('dot.name').success).toBe(false);
    expect(usernameSchema.safeParse('hyphen-name').success).toBe(false);
  });
});

describe('passwordSchema (AUTH_ONBOARDING_FLOW_V2)', () => {
  it('accepts a password with a letter and a number', () => {
    expect(passwordSchema.safeParse('Farmer2024').success).toBe(true);
  });

  it('rejects too-short, letter-only, and number-only passwords', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false);
    expect(passwordSchema.safeParse('onlyletters').success).toBe(false);
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });

  it('rejects a password over the bcrypt 72-char input limit', () => {
    // 73 chars, with a letter and a number — fails only on the max(72) rule.
    expect(passwordSchema.safeParse(`${'a'.repeat(72)}1`).success).toBe(false);
  });
});

describe('onboardingDraftSchema (AUTH_ONBOARDING_FLOW_V2)', () => {
  it('accepts a valid farmer draft', () => {
    expect(
      onboardingDraftSchema.safeParse({
        username: 'wanjiku',
        password: 'Farmer2024',
        role: 'FARMER',
      }).success
    ).toBe(true);
  });

  it('rejects an ADMIN role at the schema boundary (security invariant #1)', () => {
    expect(
      onboardingDraftSchema.safeParse({
        username: 'sneaky',
        password: 'Sneaky2024',
        role: 'ADMIN',
      }).success
    ).toBe(false);
  });
});

describe('credentialsLoginSchema (AUTH_ONBOARDING_FLOW_V2)', () => {
  it('accepts a username and any non-empty password', () => {
    expect(credentialsLoginSchema.safeParse({ username: 'wanjiku', password: 'x' }).success).toBe(
      true
    );
  });

  it('rejects an empty password', () => {
    expect(credentialsLoginSchema.safeParse({ username: 'wanjiku', password: '' }).success).toBe(
      false
    );
  });
});

describe('roleSelectionSchema', () => {
  it.each(['FARMER', 'BUYER', 'STUDENT', 'LECTURER'])('accepts %s', (role) => {
    expect(roleSelectionSchema.safeParse({ role }).success).toBe(true);
  });

  it('rejects ADMIN (allowlist only)', () => {
    expect(roleSelectionSchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
  });

  it('rejects a missing role', () => {
    expect(roleSelectionSchema.safeParse({}).success).toBe(false);
  });
});

describe('identity schemas', () => {
  const base = { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' as const };

  it('farmer accepts base fields', () => {
    expect(farmerIdentitySchema.safeParse(base).success).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    expect(farmerIdentitySchema.safeParse({ ...base, phoneNumber: '0612345678' }).success).toBe(
      false
    );
  });

  it('rejects an invalid county', () => {
    expect(farmerIdentitySchema.safeParse({ ...base, county: 'Atlantis' }).success).toBe(false);
  });

  it('buyer requires organizationName and businessRegistrationNumber', () => {
    expect(buyerIdentitySchema.safeParse(base).success).toBe(false);
    expect(
      buyerIdentitySchema.safeParse({
        ...base,
        organizationName: 'Mavuno Foods Ltd',
        businessRegistrationNumber: 'PVT-12345',
      }).success
    ).toBe(true);
  });

  it('student requires academicRegistrationNumber and universityAffiliation', () => {
    expect(studentIdentitySchema.safeParse(base).success).toBe(false);
    expect(
      studentIdentitySchema.safeParse({
        ...base,
        academicRegistrationNumber: 'SCT-001-2024',
        universityAffiliation: 'University of Nairobi',
      }).success
    ).toBe(true);
  });

  it('student schema ignores a hand-typed githubUsername', () => {
    const result = studentIdentitySchema.safeParse({
      ...base,
      academicRegistrationNumber: 'SCT-001-2024',
      universityAffiliation: 'University of Nairobi',
      githubUsername: 'attacker',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('githubUsername' in result.data).toBe(false);
    }
  });

  it('lecturer requires department and staff ID', () => {
    expect(lecturerIdentitySchema.safeParse(base).success).toBe(false);
    expect(
      lecturerIdentitySchema.safeParse({
        ...base,
        departmentAssignment: 'Computer Science',
        academicStaffId: 'STAFF-9',
        universityAffiliation: 'JKUAT',
      }).success
    ).toBe(true);
  });
});

describe('verification schemas', () => {
  it('farmer accepts a valid document submission', () => {
    expect(
      farmerOnboardingVerificationSchema.safeParse({
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: CLOUDINARY,
      }).success
    ).toBe(true);
  });

  it('farmer rejects a non-Cloudinary document image', () => {
    expect(
      farmerOnboardingVerificationSchema.safeParse({
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: 'https://example.com/x.jpg',
      }).success
    ).toBe(false);
  });

  it('farmer rejects an unknown document type', () => {
    expect(
      farmerOnboardingVerificationSchema.safeParse({
        documentType: 'DRIVERS_LICENSE',
        documentNumber: '12345678',
        documentImageUrl: CLOUDINARY,
      }).success
    ).toBe(false);
  });

  it('buyer accepts a Cloudinary certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({ taxComplianceCertificate: CLOUDINARY }).success
    ).toBe(true);
  });

  it('buyer rejects a non-Cloudinary certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({
        taxComplianceCertificate: 'https://example.com/c.pdf',
      }).success
    ).toBe(false);
  });

  it('lecturer accepts a Cloudinary credential letter', () => {
    expect(
      lecturerOnboardingVerificationSchema.safeParse({ facultyCredentialLetterUrl: CLOUDINARY })
        .success
    ).toBe(true);
  });
});

describe('institutionalEmailSchema', () => {
  it('accepts and lowercases a valid email', () => {
    const result = institutionalEmailSchema.safeParse({ institutionalEmail: 'Jane@Uonbi.AC.KE' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.institutionalEmail).toBe('jane@uonbi.ac.ke');
  });

  it('rejects a malformed email', () => {
    expect(institutionalEmailSchema.safeParse({ institutionalEmail: 'not-an-email' }).success).toBe(
      false
    );
  });
});

describe('institutionalEmailVerifySchema', () => {
  it('accepts a 6-digit pin', () => {
    expect(institutionalEmailVerifySchema.safeParse({ pin: '048213' }).success).toBe(true);
  });

  it('rejects a pin that is not 6 digits', () => {
    expect(institutionalEmailVerifySchema.safeParse({ pin: '123' }).success).toBe(false);
    expect(institutionalEmailVerifySchema.safeParse({ pin: '12345a' }).success).toBe(false);
  });
});
