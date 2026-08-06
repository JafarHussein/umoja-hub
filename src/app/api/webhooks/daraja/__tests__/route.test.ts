/**
 * @jest-environment node
 *
 * Integration tests for POST /api/webhooks/daraja
 * Tests: successful payment, failed payment, invalid signature, duplicate webhook (idempotency)
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockOrderFindOne = jest.fn();
const mockOrderFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockOrderFindOne(...args)),
    findByIdAndUpdate: jest.fn((...args: unknown[]) => mockOrderFindByIdAndUpdate(...args)),
  },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...args: unknown[]) => mockUserFindById(...args)) },
}));

const mockListingFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn((...args: unknown[]) => mockListingFindByIdAndUpdate(...args)),
  },
}));

const mockSendSMS = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/smsService', () => ({
  sendSMS: (...a: unknown[]) => mockSendSMS(...a),
}));

const mockNotify = jest.fn();
jest.mock('@/lib/notifications/notify', () => ({
  notify: (...a: unknown[]) => mockNotify(...a),
  notifyAdmins: jest.fn(),
}));

jest.mock('@/lib/integrations/darajaService', () => ({
  initiateSTKPush: jest.fn(),
  queryStkPushStatus: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  env: jest.fn().mockImplementation((key: string) => {
    if (key === 'ADMIN_PHONE_NUMBER') return '+254700000000';
    return `test-${key}`;
  }),
}));

import { POST } from '../route';

function makeWebhookRequest(payload: unknown): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/daraja?secret=test-webhook-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const validSuccessPayload = {
  Body: {
    stkCallback: {
      MerchantRequestID: 'merchant-req-001',
      CheckoutRequestID: 'checkout-req-001',
      ResultCode: 0,
      ResultDesc: 'The service request is processed successfully.',
      CallbackMetadata: {
        Item: [
          { Name: 'Amount', Value: 6500 },
          { Name: 'MpesaReceiptNumber', Value: 'QBC123XYZ' },
          { Name: 'Balance' },
          { Name: 'TransactionDate', Value: 20250301120000 },
          { Name: 'PhoneNumber', Value: 254712345678 },
        ],
      },
    },
  },
};

const failurePayload = {
  Body: {
    stkCallback: {
      MerchantRequestID: 'merchant-req-002',
      CheckoutRequestID: 'checkout-req-002',
      ResultCode: 1032, // Request cancelled by user
      ResultDesc: 'Request cancelled by user',
    },
  },
};

const mockOrder = {
  _id: 'order-abc',
  orderReferenceId: 'UMJ-2025-000001',
  farmerId: 'farmer-123',
  buyerId: 'buyer-456',
  listingId: 'listing-999',
  cropName: 'Tomatoes',
  quantityOrdered: 10,
  totalAmountKES: 6500,
  mpesaCheckoutRequestId: 'checkout-req-001',
};

describe('POST /api/webhooks/daraja', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Always returns HTTP 200 regardless of outcome
  it('returns HTTP 200 on successful payment', async () => {
    mockOrderFindOne
      .mockResolvedValueOnce(mockOrder) // findOne by CheckoutRequestID
      .mockResolvedValueOnce(null);     // idempotency check — not seen before

    mockOrderFindByIdAndUpdate.mockResolvedValue({});

    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ firstName: 'Kamau', phoneNumber: '+254712345678' }) }),
    });

    const req = makeWebhookRequest(validSuccessPayload);
    const res = await POST(req);
    const body = await res.json() as { ResultCode: number; ResultDesc: string };

    expect(res.status).toBe(200);
    expect(body.ResultCode).toBe(0);
    expect(body.ResultDesc).toBe('Success');
  });

  it('texts the farmer but not the buyer, and tells both in the app', async () => {
    // The notification policy, asserted because nothing else protects it and
    // the previous behaviour — SMS to both — passed every test.
    //
    // The buyer entered their M-Pesa PIN seconds ago and Safaricom has already
    // texted them the authoritative receipt. A second SMS repeats it, costs
    // money, and trains people to ignore the channel. The farmer is not party
    // to the STK push, gets no Safaricom message, and theirs is the only
    // immediate signal that money arrived and dispatch should begin.
    mockOrderFindOne.mockResolvedValueOnce(mockOrder).mockResolvedValueOnce(null);
    mockOrderFindByIdAndUpdate.mockResolvedValue({});
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ firstName: 'Kamau', phoneNumber: '+254712345678' }),
      }),
    });

    await POST(makeWebhookRequest(validSuccessPayload));
    // The side-effect chain is fire-and-forget; let it drain.
    await new Promise((r) => setTimeout(r, 20));

    expect(mockSendSMS).toHaveBeenCalledTimes(1);
    expect(String(mockSendSMS.mock.calls[0]?.[1])).toMatch(/New order confirmed/i);
    // Both parties are still told in the app — only the duplicated channel went.
    expect(mockNotify).toHaveBeenCalledTimes(2);
  });

  it('updates order paymentStatus to PAID on successful payment', async () => {
    mockOrderFindOne
      .mockResolvedValueOnce(mockOrder)
      .mockResolvedValueOnce(null);

    mockOrderFindByIdAndUpdate.mockResolvedValue({});
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ firstName: 'Test', phoneNumber: '+254700000000' }) }),
    });

    const req = makeWebhookRequest(validSuccessPayload);
    await POST(req);

    expect(mockOrderFindByIdAndUpdate).toHaveBeenCalledWith(
      'order-abc',
      expect.objectContaining({
        paymentStatus: 'PAID',
        mpesaTransactionId: 'QBC123XYZ',
      })
    );
  });

  it('returns HTTP 200 on payment failure — marks FAILED and restores inventory', async () => {
    mockOrderFindOne.mockResolvedValueOnce({
      ...mockOrder,
      mpesaCheckoutRequestId: 'checkout-req-002',
    });
    mockOrderFindByIdAndUpdate.mockResolvedValue({});

    const req = makeWebhookRequest(failurePayload);
    const res = await POST(req);
    const body = await res.json() as { ResultCode: number };

    expect(res.status).toBe(200);
    expect(body.ResultCode).toBe(0);
    expect(mockOrderFindByIdAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ paymentStatus: 'FAILED' })
    );
    // Inventory must be restored when payment fails
    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      'listing-999',
      expect.objectContaining({ $inc: { quantityAvailable: 10 } })
    );
  });

  it('acknowledges a payload that is not a Daraja callback without touching the order', async () => {
    // This replaces a test that mocked verifyDarajaSignature to return false.
    // That function ignored its arguments and returned true in every real call,
    // so the test could only ever exercise its own mock — it demonstrated
    // nothing about the running system. Daraja does not sign callbacks;
    // authenticity is the IP allow-list in middleware, applied before this
    // handler runs, and replay is the unique index on mpesaTransactionId.
    // What this route is genuinely responsible for is shape.
    const req = makeWebhookRequest({ not: 'a daraja callback' });
    const res = await POST(req);
    const body = (await res.json()) as { ResultCode: number };

    expect(res.status).toBe(200); // never make Safaricom retry
    expect(body.ResultCode).toBe(0);
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('is idempotent — duplicate MpesaReceiptNumber triggers no second update', async () => {
    mockOrderFindOne
      .mockResolvedValueOnce(mockOrder)          // found by CheckoutRequestID
      .mockResolvedValueOnce({ ...mockOrder, mpesaTransactionId: 'QBC123XYZ' }); // already processed

    const req = makeWebhookRequest(validSuccessPayload);
    const res = await POST(req);
    const body = await res.json() as { ResultCode: number; ResultDesc: string };

    expect(res.status).toBe(200);
    expect(body.ResultCode).toBe(0);
    expect(body.ResultDesc).toBe('Already processed');
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled(); // No write on duplicate
  });

  it('returns HTTP 200 even when order is not found', async () => {
    mockOrderFindOne.mockResolvedValueOnce(null); // No order found

    const req = makeWebhookRequest(validSuccessPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('returns HTTP 200 even when webhook causes an unexpected error', async () => {
    mockOrderFindOne.mockRejectedValue(new Error('DB connection error'));

    const req = makeWebhookRequest(validSuccessPayload);
    const res = await POST(req);

    expect(res.status).toBe(200); // CRITICAL: must always be 200
  });
});
