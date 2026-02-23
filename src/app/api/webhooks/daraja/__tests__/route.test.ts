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

jest.mock('@/lib/integrations/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/integrations/darajaService', () => ({
  verifyDarajaSignature: jest.fn().mockReturnValue(true),
  initiateSTKPush: jest.fn(),
}));

import { POST } from '../route';

function makeWebhookRequest(payload: unknown): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/daraja', {
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
  cropName: 'Tomatoes',
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

  it('returns HTTP 200 on payment failure — no order update to PAID', async () => {
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
  });

  it('returns HTTP 200 on invalid signature — does NOT process payment', async () => {
    const { verifyDarajaSignature } = jest.requireMock('@/lib/integrations/darajaService') as {
      verifyDarajaSignature: jest.MockedFunction<() => boolean>;
    };
    verifyDarajaSignature.mockReturnValueOnce(false);

    const req = makeWebhookRequest(validSuccessPayload);
    const res = await POST(req);
    const body = await res.json() as { ResultCode: number };

    expect(res.status).toBe(200);
    expect(body.ResultCode).toBe(1); // Non-zero signals Daraja to stop retrying
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
