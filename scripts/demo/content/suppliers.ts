// Verified input suppliers — real, KEBS/PCPB-registered Kenyan agro-dealers.
// Carried over verbatim from the retired scripts/seed.ts: these are named
// businesses with genuine registration numbers, which is the point of the
// verified-supplier directory, so they are authored rather than generated.

import type mongoose from 'mongoose';
import { SupplierInputCategory, SupplierVerificationStatus } from '../../../src/types';

export function verifiedSuppliers(
  adminId: mongoose.Types.ObjectId,
  verifiedAt: Date
): Record<string, unknown>[] {
  return [
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
      verifiedBy: adminId,
      verifiedAt,
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
      verifiedBy: adminId,
      verifiedAt,
    },
    {
      businessName: 'Kenya Seed Company',
      contactPhone: '+254320030000',
      contactEmail: 'info@kenyaseed.com',
      county: 'Nakuru',
      inputCategories: [SupplierInputCategory.SEED],
      registrations: {},
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      verifiedBy: adminId,
      verifiedAt,
    },
  ];
}
