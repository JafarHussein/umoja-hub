/**
 * @jest-environment node
 *
 * Tests for POST /api/orders/[orderId]/mediation/response.
 * The point of this route is that a case is not decided on one account alone,
 * so the tests centre on who may answer, and that they may answer only once.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockMRFindOne = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: { findOne: (...a: unknown[]) => mockMRFindOne(...a) },
}));

jest.mock('@/lib/notifications/notify', () => ({
  notify: jest.fn(),
  notifyAdmins: jest.fn(),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';

const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };
const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Wanjiku' } };

const STATEMENT = 'I delivered this order to the buyer’s shop on Tuesday and they signed for it.';

interface MediationDocMock {
  _id: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  initiatedBy: string;
  respondentStatement?: string | undefined;
  respondentRespondedAt?: Date | undefined;
  evidence: { url: string; publicId: string; uploadedByRole: string; uploadedAt: Date }[];
  save: jest.Mock;
}

function mediationDoc(overrides: Partial<MediationDocMock> = {}): MediationDocMock {
  return {
    _id: 'mr-1',
    orderId: ORDER_ID,
    buyerId: BUYER_ID,
    farmerId: FARMER_ID,
    initiatedBy: 'BUYER',
    evidence: [],
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function wireFind(doc: unknown): void {
  mockMRFindOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(doc) });
}

function req(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/mediation/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

describe('POST /api/orders/[orderId]/mediation/response', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unauthenticated request with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(req({ statement: STATEMENT }), params());
    expect(res.status).toBe(401);
  });

  it('rejects a too-short statement with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(req({ statement: 'no' }), params());
    expect(res.status).toBe(400);
  });

  it('returns 404 when there is no open case to answer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    wireFind(null);
    const res = await POST(req({ statement: STATEMENT }), params());
    expect(res.status).toBe(404);
  });

  it('lets the farmer answer a case the buyer raised', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const doc = mediationDoc();
    wireFind(doc);

    const res = await POST(req({ statement: STATEMENT }), params());

    expect(res.status).toBe(200);
    expect(doc.respondentStatement).toBe(STATEMENT);
    expect(doc.respondentRespondedAt).toBeInstanceOf(Date);
    expect(doc.save).toHaveBeenCalled();
  });

  it('refuses to let the filer answer their own case', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const doc = mediationDoc();
    wireFind(doc);

    const res = await POST(req({ statement: STATEMENT }), params());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_NOT_RESPONDENT');
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('lets the buyer answer a case the farmer raised', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const doc = mediationDoc({ initiatedBy: 'FARMER' });
    wireFind(doc);

    const res = await POST(req({ statement: STATEMENT }), params());
    expect(res.status).toBe(200);
  });

  it('allows only one statement per respondent', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const doc = mediationDoc({ respondentStatement: 'Already said my piece.' });
    wireFind(doc);

    const res = await POST(req({ statement: STATEMENT }), params());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_ALREADY_ANSWERED');
  });

  it('rejects someone who is not a party to the order', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'stranger', role: 'FARMER', firstName: 'Nosy' },
    });
    wireFind(mediationDoc());

    const res = await POST(req({ statement: STATEMENT }), params());
    expect(res.status).toBe(403);
  });

  it('attaches the respondent’s photos, tagged to their side', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const doc = mediationDoc();
    wireFind(doc);

    await POST(
      req({
        statement: STATEMENT,
        evidence: [{ url: 'https://res.cloudinary.com/x/b.jpg', publicId: 'b' }],
      }),
      params()
    );

    expect(doc.evidence).toHaveLength(1);
    expect(doc.evidence[0]).toMatchObject({
      url: 'https://res.cloudinary.com/x/b.jpg',
      uploadedByRole: 'FARMER',
    });
  });
});
