import {
  farmerProfileSchema,
  verificationDocSchema,
  cropListingSchema,
  adminVerifyFarmerSchema,
} from '../farmerSchema';

// ---------------------------------------------------------------------------
// farmerProfileSchema
// ---------------------------------------------------------------------------

describe('farmerProfileSchema', () => {
  const valid = {
    cropsGrown: ['maize', 'beans'],
    county: 'Kiambu' as const,
    phoneNumber: '0712345678',
  };

  it('accepts a valid farmer profile', () => {
    expect(farmerProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts +254 phone format', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, phoneNumber: '+254712345678' }).success
    ).toBe(true);
  });

  it('accepts 07 phone format', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, phoneNumber: '0712345678' }).success
    ).toBe(true);
  });

  it('rejects invalid phone format (06 prefix)', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, phoneNumber: '0612345678' }).success
    ).toBe(false);
  });

  it('rejects phone without country prefix or leading zero', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, phoneNumber: '712345678' }).success
    ).toBe(false);
  });

  it('rejects empty cropsGrown array', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, cropsGrown: [] }).success
    ).toBe(false);
  });

  it('rejects missing cropsGrown', () => {
    const { cropsGrown: _, ...nocrops } = valid;
    expect(farmerProfileSchema.safeParse(nocrops).success).toBe(false);
  });

  it('rejects invalid county', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, county: 'FakeCounty' }).success
    ).toBe(false);
  });

  it('accepts optional fields when omitted', () => {
    const result = farmerProfileSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.livestockKept).toBeUndefined();
      expect(result.data.farmSizeAcres).toBeUndefined();
    }
  });

  it('accepts optional livestock and farm size', () => {
    const result = farmerProfileSchema.safeParse({
      ...valid,
      livestockKept: ['dairy cows'],
      farmSizeAcres: 5.5,
      primaryLanguage: 'Swahili',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative farm size', () => {
    expect(
      farmerProfileSchema.safeParse({ ...valid, farmSizeAcres: -1 }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verificationDocSchema
// ---------------------------------------------------------------------------

describe('verificationDocSchema', () => {
  const valid = {
    documentType: 'NATIONAL_ID' as const,
    documentNumber: 'ID-123456',
    documentImageUrl: 'https://res.cloudinary.com/dqs2dwrjx/image/upload/v1/doc.jpg',
  };

  it('accepts a valid verification document', () => {
    expect(verificationDocSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts COOPERATIVE_CARD type', () => {
    expect(
      verificationDocSchema.safeParse({ ...valid, documentType: 'COOPERATIVE_CARD' }).success
    ).toBe(true);
  });

  it('accepts PASSPORT type', () => {
    expect(
      verificationDocSchema.safeParse({ ...valid, documentType: 'PASSPORT' }).success
    ).toBe(true);
  });

  it('rejects invalid document type', () => {
    expect(
      verificationDocSchema.safeParse({ ...valid, documentType: 'DRIVERS_LICENSE' }).success
    ).toBe(false);
  });

  it('rejects empty document number', () => {
    expect(
      verificationDocSchema.safeParse({ ...valid, documentNumber: '' }).success
    ).toBe(false);
  });

  it('rejects non-Cloudinary image URL', () => {
    expect(
      verificationDocSchema.safeParse({
        ...valid,
        documentImageUrl: 'https://example.com/image.jpg',
      }).success
    ).toBe(false);
  });

  it('rejects missing documentType', () => {
    const { documentType: _, ...noType } = valid;
    expect(verificationDocSchema.safeParse(noType).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cropListingSchema
// ---------------------------------------------------------------------------

describe('cropListingSchema', () => {
  const valid = {
    title: 'Fresh Kiambu Tomatoes',
    cropName: 'tomatoes',
    description: 'Grade-A tomatoes freshly harvested from Limuru highlands.',
    quantityAvailable: 100,
    unit: 'KG' as const,
    currentPricePerUnit: 50,
    pickupCounty: 'Kiambu' as const,
    pickupDescription: 'Available at Githunguri junction daily.',
    imageUrls: ['https://res.cloudinary.com/dqs2dwrjx/image/upload/v1/tomato.jpg'],
    buyerContactPreference: ['PHONE'] as const,
  };

  it('accepts a valid crop listing', () => {
    expect(cropListingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid unit types', () => {
    for (const unit of ['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE'] as const) {
      expect(
        cropListingSchema.safeParse({ ...valid, unit }).success
      ).toBe(true);
    }
  });

  it('rejects price less than 0', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, currentPricePerUnit: -1 }).success
    ).toBe(false);
  });

  it('accepts price of 0', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, currentPricePerUnit: 0 }).success
    ).toBe(true);
  });

  it('rejects negative quantity', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, quantityAvailable: -5 }).success
    ).toBe(false);
  });

  it('accepts quantity of 0', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, quantityAvailable: 0 }).success
    ).toBe(true);
  });

  it('rejects empty imageUrls array', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, imageUrls: [] }).success
    ).toBe(false);
  });

  it('rejects more than 5 images', () => {
    const urls = Array.from({ length: 6 }, (_, i) =>
      `https://res.cloudinary.com/dqs2dwrjx/image/upload/v${i}/img.jpg`
    );
    expect(cropListingSchema.safeParse({ ...valid, imageUrls: urls }).success).toBe(false);
  });

  it('accepts up to 5 images', () => {
    const urls = Array.from({ length: 5 }, (_, i) =>
      `https://res.cloudinary.com/dqs2dwrjx/image/upload/v${i}/img.jpg`
    );
    expect(cropListingSchema.safeParse({ ...valid, imageUrls: urls }).success).toBe(true);
  });

  it('rejects non-Cloudinary image URL', () => {
    expect(
      cropListingSchema.safeParse({
        ...valid,
        imageUrls: ['https://picsum.photos/200'],
      }).success
    ).toBe(false);
  });

  it('rejects title shorter than 5 characters', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, title: 'Hi' }).success
    ).toBe(false);
  });

  it('rejects description shorter than 20 characters', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, description: 'Short' }).success
    ).toBe(false);
  });

  it('rejects pickup description shorter than 10 characters', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, pickupDescription: 'Here' }).success
    ).toBe(false);
  });

  it('rejects invalid pickup county', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, pickupCounty: 'Atlantis' }).success
    ).toBe(false);
  });

  it('rejects invalid unit', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, unit: 'TONNE' }).success
    ).toBe(false);
  });

  it('rejects empty buyerContactPreference', () => {
    expect(
      cropListingSchema.safeParse({ ...valid, buyerContactPreference: [] }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// adminVerifyFarmerSchema
// ---------------------------------------------------------------------------

describe('adminVerifyFarmerSchema', () => {
  it('accepts an APPROVED decision', () => {
    expect(
      adminVerifyFarmerSchema.safeParse({ farmerId: '507f1f77bcf86cd799439011', decision: 'APPROVED' }).success
    ).toBe(true);
  });

  it('accepts a REJECTED decision with reason', () => {
    expect(
      adminVerifyFarmerSchema.safeParse({
        farmerId: '507f1f77bcf86cd799439011',
        decision: 'REJECTED',
        rejectionReason: 'Document unclear',
      }).success
    ).toBe(true);
  });

  it('rejects missing farmerId', () => {
    expect(
      adminVerifyFarmerSchema.safeParse({ farmerId: '', decision: 'APPROVED' }).success
    ).toBe(false);
  });

  it('rejects invalid decision', () => {
    expect(
      adminVerifyFarmerSchema.safeParse({ farmerId: '507f1f77bcf86cd799439011', decision: 'PENDING' }).success
    ).toBe(false);
  });
});
