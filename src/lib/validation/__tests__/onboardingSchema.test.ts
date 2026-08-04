import {
  roleSelectionSchema,
  usernameSchema,
  passwordSchema,
  passwordSetupSchema,
  credentialsLoginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
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
  it('accepts a password with uppercase, lowercase, and a number', () => {
    expect(passwordSchema.safeParse('Farmer2024').success).toBe(true);
  });

  it('rejects a too-short password', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false);
  });

  it('rejects a password missing a lowercase letter', () => {
    expect(passwordSchema.safeParse('FARMER2024').success).toBe(false);
  });

  it('rejects a password missing an uppercase letter', () => {
    expect(passwordSchema.safeParse('farmer2024').success).toBe(false);
  });

  it('rejects a password missing a number', () => {
    expect(passwordSchema.safeParse('FarmerPass').success).toBe(false);
  });

  it('rejects a password over the bcrypt 72-char input limit', () => {
    // 73 chars with upper + lower + digit — fails only on the max(72) rule.
    expect(passwordSchema.safeParse(`Aa1${'a'.repeat(70)}`).success).toBe(false);
  });
});

describe('passwordSetupSchema (AUTH_ONBOARDING_FLOW_V3)', () => {
  it('accepts a matching username and password pair', () => {
    expect(
      passwordSetupSchema.safeParse({
        username: 'wanjiku',
        password: 'Farmer2024',
        confirmPassword: 'Farmer2024',
      }).success
    ).toBe(true);
  });

  it('rejects a mismatched confirmation', () => {
    const result = passwordSetupSchema.safeParse({
      username: 'wanjiku',
      password: 'Farmer2024',
      confirmPassword: 'Farmer2025',
    });
    expect(result.success).toBe(false);
    // The error must land on the confirm field so the form highlights the box
    // the user has to fix, not the one they got right.
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });

  it('rejects a weak password even when both entries match', () => {
    expect(
      passwordSetupSchema.safeParse({
        username: 'wanjiku',
        password: 'alllowercase',
        confirmPassword: 'alllowercase',
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

describe('passwordResetRequestSchema (AUTH_ONBOARDING_FLOW_V2 §10)', () => {
  it('accepts and lowercases a valid email', () => {
    const r = passwordResetRequestSchema.safeParse({ email: 'Jane@Gmail.COM' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('jane@gmail.com');
  });

  it('rejects a malformed email', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('passwordResetConfirmSchema (AUTH_ONBOARDING_FLOW_V2 §10)', () => {
  it('accepts a token with a valid new password', () => {
    expect(
      passwordResetConfirmSchema.safeParse({ token: 'abc123', password: 'Renewed2024' }).success
    ).toBe(true);
  });

  it('rejects a missing token', () => {
    expect(passwordResetConfirmSchema.safeParse({ token: '', password: 'Renewed2024' }).success).toBe(
      false
    );
  });

  it('rejects a weak new password (reuses passwordSchema)', () => {
    expect(passwordResetConfirmSchema.safeParse({ token: 'abc123', password: 'short' }).success).toBe(
      false
    );
  });
});

describe('roleSelectionSchema', () => {
  it.each(['FARMER', 'BUYER', 'STUDENT', 'LECTURER'])('accepts %s', (role) => {
    expect(roleSelectionSchema.safeParse({ role }).success).toBe(true);
  });

  it('rejects ADMIN (allowlist only)', () => {
    // Under V3 role selection happens after OAuth, so this schema is the last
    // thing standing between a signed-in stranger and an admin account.
    expect(roleSelectionSchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
  });

  it.each(['NGO', 'EMPLOYER', 'INSTITUTION'])('rejects the provisioned role %s', (role) => {
    // Organisation accounts are provisioned out of band, never self-claimed.
    expect(roleSelectionSchema.safeParse({ role }).success).toBe(false);
  });

  it('rejects a missing role', () => {
    expect(roleSelectionSchema.safeParse({}).success).toBe(false);
  });
});

describe('identity schemas', () => {
  const base = { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' as const };
  const student = {
    ...base,
    academicRegistrationNumber: 'SCT-001-2024',
    universityAffiliation: 'University of Nairobi',
    programme: 'BSc Computer Science',
    graduationYear: new Date().getFullYear() + 1,
  };
  const lecturer = {
    ...base,
    departmentAssignment: 'Computer Science',
    academicStaffId: 'STAFF-9',
    universityAffiliation: 'JKUAT',
    position: 'Senior Lecturer',
  };

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

  describe('buyer identity is branched on the kind of buyer', () => {
    it('requires a buyerType — there is no unbranched buyer', () => {
      expect(buyerIdentitySchema.safeParse(base).success).toBe(false);
    });

    it('a business must name itself and its registration', () => {
      expect(
        buyerIdentitySchema.safeParse({ ...base, buyerType: 'BUSINESS' }).success
      ).toBe(false);
      expect(
        buyerIdentitySchema.safeParse({
          ...base,
          buyerType: 'BUSINESS',
          organizationName: 'Mavuno Foods Ltd',
          businessRegistrationNumber: 'PVT-12345',
        }).success
      ).toBe(true);
    });

    it('an individual is never asked for business details', () => {
      expect(buyerIdentitySchema.safeParse({ ...base, buyerType: 'INDIVIDUAL' }).success).toBe(
        true
      );
    });

    // The defect this branch exists to prevent: a live account reached
    // COMPLETED carrying "NOT APPLICABLE" in both business fields, because
    // every buyer was required to be a business and no other answer existed.
    it.each([
      'NOT APPLICABLE',
      'not applicable',
      'N/A',
      'n/a',
      'na',
      'none',
      'NIL',
      '-',
      '...',
      'xxx',
      '0000',
    ])('rejects %p as an organisation name', (value) => {
      expect(
        buyerIdentitySchema.safeParse({
          ...base,
          buyerType: 'BUSINESS',
          organizationName: value,
          businessRegistrationNumber: 'PVT-12345',
        }).success
      ).toBe(false);
    });

    it('rejects a placeholder registration number', () => {
      expect(
        buyerIdentitySchema.safeParse({
          ...base,
          buyerType: 'BUSINESS',
          organizationName: 'Mavuno Foods Ltd',
          businessRegistrationNumber: 'N/A',
        }).success
      ).toBe(false);
    });

    it('does not reject a real name that merely contains a placeholder word', () => {
      expect(
        buyerIdentitySchema.safeParse({
          ...base,
          buyerType: 'BUSINESS',
          organizationName: 'Nile Trading Company',
          businessRegistrationNumber: 'PVT-000123',
        }).success
      ).toBe(true);
    });
  });

  it('student requires registration, university, programme and graduation year', () => {
    expect(studentIdentitySchema.safeParse(base).success).toBe(false);
    expect(studentIdentitySchema.safeParse(student).success).toBe(true);
  });

  it('student schema ignores a hand-typed githubUsername', () => {
    // githubUsername is OAuth-sourced (UI-12) and must never be client-settable.
    const result = studentIdentitySchema.safeParse({ ...student, githubUsername: 'attacker' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('githubUsername' in result.data).toBe(false);
    }
  });

  it('lecturer requires department, staff ID and position', () => {
    expect(lecturerIdentitySchema.safeParse(base).success).toBe(false);
    expect(lecturerIdentitySchema.safeParse(lecturer).success).toBe(true);
    const { position: _omitted, ...withoutPosition } = lecturer;
    expect(lecturerIdentitySchema.safeParse(withoutPosition).success).toBe(false);
  });

  describe('farm details (V3 role setup)', () => {
    it('accepts produce categories and a farm size', () => {
      expect(
        farmerIdentitySchema.safeParse({
          ...base,
          cropsGrown: ['VEGETABLES', 'CEREALS'],
          farmSizeAcres: 3.5,
          cooperativeName: 'Kirinyaga Growers Cooperative',
        }).success
      ).toBe(true);
    });

    it('leaves an independent farmer free to skip every optional field', () => {
      // A farmer who has not planted this season must still be able to finish.
      expect(farmerIdentitySchema.safeParse(base).success).toBe(true);
    });

    it('rejects a crop outside the shared produce vocabulary', () => {
      expect(farmerIdentitySchema.safeParse({ ...base, cropsGrown: ['UNOBTAINIUM'] }).success).toBe(
        false
      );
    });

    it('rejects a zero or negative farm size', () => {
      expect(farmerIdentitySchema.safeParse({ ...base, farmSizeAcres: 0 }).success).toBe(false);
      expect(farmerIdentitySchema.safeParse({ ...base, farmSizeAcres: -2 }).success).toBe(false);
    });
  });

  describe('buyer sourcing preferences (V3 role setup)', () => {
    const buyer = {
      ...base,
      buyerType: 'BUSINESS',
      organizationName: 'Mavuno Foods Ltd',
      businessRegistrationNumber: 'PVT-12345',
    };

    it('accepts preferred counties and purchase interests', () => {
      expect(
        buyerIdentitySchema.safeParse({
          ...buyer,
          preferredCounties: ['Kirinyaga', 'Nyandarua'],
          purchaseInterests: ['VEGETABLES'],
        }).success
      ).toBe(true);
    });

    it('treats both as optional — they rank results, they do not gate them', () => {
      expect(buyerIdentitySchema.safeParse(buyer).success).toBe(true);
    });

    it('rejects a county that does not exist', () => {
      expect(
        buyerIdentitySchema.safeParse({ ...buyer, preferredCounties: ['Atlantis'] }).success
      ).toBe(false);
    });
  });

  describe('graduation year bounds', () => {
    const year = new Date().getFullYear();

    it('accepts a year inside the plausible window', () => {
      expect(studentIdentitySchema.safeParse({ ...student, graduationYear: year }).success).toBe(
        true
      );
    });

    it('rejects a year far in the past or future (typo guard)', () => {
      expect(
        studentIdentitySchema.safeParse({ ...student, graduationYear: year - 20 }).success
      ).toBe(false);
      expect(
        studentIdentitySchema.safeParse({ ...student, graduationYear: year + 20 }).success
      ).toBe(false);
    });

    it('rejects a non-integer year', () => {
      expect(
        studentIdentitySchema.safeParse({ ...student, graduationYear: year + 0.5 }).success
      ).toBe(false);
    });
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

  it('a business buyer accepts a Cloudinary certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({
        buyerType: 'BUSINESS',
        taxComplianceCertificate: CLOUDINARY,
      }).success
    ).toBe(true);
  });

  it('a business buyer rejects a non-Cloudinary certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({
        buyerType: 'BUSINESS',
        taxComplianceCertificate: 'https://example.com/c.pdf',
      }).success
    ).toBe(false);
  });

  it('an individual buyer submits an identity document, not a certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({
        buyerType: 'INDIVIDUAL',
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: CLOUDINARY,
      }).success
    ).toBe(true);
  });

  // The shape that produced the wrong email: a certificate field satisfied by
  // an individual's uploaded PNG. An individual can no longer submit one at all.
  it('an individual buyer cannot submit a tax compliance certificate', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({
        buyerType: 'INDIVIDUAL',
        taxComplianceCertificate: CLOUDINARY,
      }).success
    ).toBe(false);
  });

  it('a buyer verification without a buyerType is rejected', () => {
    expect(
      buyerOnboardingVerificationSchema.safeParse({ taxComplianceCertificate: CLOUDINARY }).success
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
