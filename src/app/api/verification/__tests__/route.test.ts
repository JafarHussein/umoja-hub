/**
 * @jest-environment node
 *
 * /api/verification — the single verification submission path.
 *
 * The case this file exists for is `resubmission after rejection`: the three
 * routes this endpoint replaced had drifted, and the buyer one accepted only a
 * `taxComplianceCertificate`. An individual buyer whose first submission was
 * rejected was therefore asked, on the retry, for a KRA certificate they had
 * never had — the exact defect the buyer-type branch was written to end.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));
jest.mock('@/lib/notifications/notify', () => ({
  notify: jest.fn().mockResolvedValue(undefined),
  notifyAdmins: jest.fn().mockResolvedValue(undefined),
}));

type Doc = Record<string, unknown>;
let stored: Doc = {};
let lastUpdate: Doc = {};

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: () => ({ select: () => ({ lean: () => Promise.resolve({ ...stored }) }) }),
    findByIdAndUpdate: (_id: string, update: { $set: Doc }) => {
      lastUpdate = update.$set;
      return Promise.resolve({});
    },
  },
}));

import { getServerSession } from 'next-auth';
import { GET, POST } from '../route';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/doc.jpg';

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  stored = {};
  lastUpdate = {};
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
});

describe('GET /api/verification', () => {
  it('tells an individual buyer they are an individual', async () => {
    stored = { role: 'BUYER', onboardingStage: 'COMPLETED', buyerData: { buyerType: 'INDIVIDUAL' } };
    const body = (await (await GET()).json()) as { data: { buyerType: string; status: string } };
    expect(body.data.buyerType).toBe('INDIVIDUAL');
    expect(body.data.status).toBe('UNSUBMITTED');
  });

  it('treats a buyer record predating the archetype branch as an individual', async () => {
    stored = { role: 'BUYER', onboardingStage: 'COMPLETED', buyerData: {} };
    const body = (await (await GET()).json()) as { data: { buyerType: string } };
    expect(body.data.buyerType).toBe('INDIVIDUAL');
  });

  it('derives lecturer state from the credential letter on file', async () => {
    stored = {
      role: 'LECTURER',
      onboardingStage: 'COMPLETED',
      lecturerData: { facultyCredentialLetterUrl: CLOUDINARY },
    };
    const body = (await (await GET()).json()) as { data: { status: string } };
    expect(body.data.status).toBe('PENDING');
  });
});

describe('POST /api/verification — farmer', () => {
  it('records the document and moves the account to PENDING', async () => {
    stored = { role: 'FARMER', onboardingStage: 'COMPLETED', farmerData: {} };
    const res = await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '12345678', documentImageUrl: CLOUDINARY })
    );
    expect(res.status).toBe(200);
    expect(lastUpdate['farmerData.verificationStatus']).toBe('PENDING');
    expect(lastUpdate['farmerData.documentImageUrl']).toBe(CLOUDINARY);
  });

  it('rejects a document image that is not a Cloudinary upload', async () => {
    stored = { role: 'FARMER', onboardingStage: 'COMPLETED', farmerData: {} };
    const res = await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '1', documentImageUrl: 'http://evil/x.jpg' })
    );
    expect(res.status).toBe(400);
  });

  it('refuses a second submission while one is under review', async () => {
    stored = {
      role: 'FARMER',
      onboardingStage: 'COMPLETED',
      farmerData: { verificationStatus: 'PENDING' },
    };
    const res = await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '1', documentImageUrl: CLOUDINARY })
    );
    expect(res.status).toBe(409);
  });

  it('refuses a submission from an already-verified account', async () => {
    stored = {
      role: 'FARMER',
      onboardingStage: 'COMPLETED',
      farmerData: { verificationStatus: 'APPROVED', isVerified: true },
    };
    const res = await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '1', documentImageUrl: CLOUDINARY })
    );
    expect(res.status).toBe(409);
  });
});

describe('POST /api/verification — buyer archetypes', () => {
  it('accepts an identity document from a rejected individual buyer', async () => {
    stored = {
      role: 'BUYER',
      onboardingStage: 'COMPLETED',
      buyerData: { buyerType: 'INDIVIDUAL', verificationStatus: 'REJECTED' },
    };
    const res = await POST(
      post({
        buyerType: 'INDIVIDUAL',
        documentType: 'NATIONAL_ID',
        documentNumber: '12345678',
        documentImageUrl: CLOUDINARY,
      })
    );
    expect(res.status).toBe(200);
    expect(lastUpdate['buyerData.documentImageUrl']).toBe(CLOUDINARY);
    // Nothing is written to the certificate field, so nothing downstream can
    // describe this upload as a tax compliance certificate.
    expect(lastUpdate['buyerData.taxComplianceCertificate']).toBeUndefined();
  });

  it('stores a business certificate under the certificate field', async () => {
    stored = {
      role: 'BUYER',
      onboardingStage: 'COMPLETED',
      buyerData: { buyerType: 'BUSINESS' },
    };
    const res = await POST(post({ buyerType: 'BUSINESS', taxComplianceCertificate: CLOUDINARY }));
    expect(res.status).toBe(200);
    expect(lastUpdate['buyerData.taxComplianceCertificate']).toBe(CLOUDINARY);
    expect(lastUpdate['buyerData.documentImageUrl']).toBeUndefined();
  });

  it('refuses a business submission from an individual account', async () => {
    stored = {
      role: 'BUYER',
      onboardingStage: 'COMPLETED',
      buyerData: { buyerType: 'INDIVIDUAL' },
    };
    const res = await POST(post({ buyerType: 'BUSINESS', taxComplianceCertificate: CLOUDINARY }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/verification — legacy rows', () => {
  it('completes an account left on the retired VERIFICATION_UPLOAD stage', async () => {
    stored = { role: 'FARMER', onboardingStage: 'VERIFICATION_UPLOAD', farmerData: {} };
    await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '1', documentImageUrl: CLOUDINARY })
    );
    expect(lastUpdate['onboardingStage']).toBe('COMPLETED');
  });

  it('leaves the stage of an already-complete account alone', async () => {
    stored = { role: 'FARMER', onboardingStage: 'COMPLETED', farmerData: {} };
    await POST(
      post({ documentType: 'NATIONAL_ID', documentNumber: '1', documentImageUrl: CLOUDINARY })
    );
    expect(lastUpdate['onboardingStage']).toBeUndefined();
  });
});

describe('POST /api/verification — wrong role', () => {
  it('turns a student away to the institutional-email flow', async () => {
    stored = { role: 'STUDENT', onboardingStage: 'COMPLETED' };
    const res = await POST(post({ documentType: 'NATIONAL_ID' }));
    expect(res.status).toBe(409);
  });
});
