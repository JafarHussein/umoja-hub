/**
 * @jest-environment node
 */
import { processStkCallback } from '../processCallback';
import type { DarajaCallbackInput } from '@/lib/validation/orderSchema';

// ---------------------------------------------------------------------------
// The shared STK-callback processor is the single definition of what a payment
// DOES to the platform, and both the real Daraja webhook and the simulator feed
// it. It had no direct test — it was only ever exercised through the modules
// that mock it.
//
// These pin what the audit row must carry. A payment log that records only
// "FAILED" cannot tell a buyer who cancelled from a prompt that expired from a
// network that dropped, and those are three different conversations to have
// with a buyer whose money is missing.
// ---------------------------------------------------------------------------

const ORDER_ID = 'order-1';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindOne = jest.fn();
const mockOrderFindByIdAndUpdate = jest.fn().mockResolvedValue({});
// The failure path is a guarded conditional update now, not a blind write.
const mockOrderFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockOrderFindOne(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockOrderFindByIdAndUpdate(...a),
    findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a),
  },
}));

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }) },
}));

jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: jest.fn().mockResolvedValue({}) },
}));

jest.mock('@/lib/models/EscrowEventLog.model', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));

// The processor writes through `new PaymentEventLog()` + set() + save(), so the
// mock has to be a constructor rather than a bare object with create(). The
// `mock` prefix is what lets a jest.mock factory close over it.
const mockWritten: Record<string, unknown>[] = [];
jest.mock('@/lib/models/PaymentEventLog.model', () => ({
  __esModule: true,
  default: class {
    private fields: Record<string, unknown> = {};
    set(fields: Record<string, unknown>): void {
      this.fields = fields;
    }
    save(): Promise<void> {
      mockWritten.push(this.fields);
      return Promise.resolve();
    }
  },
}));

jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/notifications/notify', () => ({ notify: jest.fn() }));
jest.mock('@/lib/env', () => ({ env: () => '+254700000000' }));

function order(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    listingId: 'listing-1',
    quantityOrdered: 10,
    cropName: 'tomatoes',
    buyerId: 'buyer-1',
    farmerId: 'farmer-1',
    totalAmountKES: 5000,
    paymentStatus: 'PENDING_PAYMENT',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    ...overrides,
  };
}

function callback(resultCode: number, receipt?: string): DarajaCallbackInput {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: 'merchant-1',
        CheckoutRequestID: 'checkout-1',
        ResultCode: resultCode,
        ResultDesc: 'desc',
        ...(receipt
          ? {
              CallbackMetadata: {
                Item: [
                  { Name: 'Amount', Value: 5000 },
                  { Name: 'MpesaReceiptNumber', Value: receipt },
                ],
              },
            }
          : {}),
      },
    },
  } as DarajaCallbackInput;
}

/** The audit rows written during one call, by event type. */
function row(eventType: string): Record<string, unknown> | undefined {
  return mockWritten.find((e) => e['eventType'] === eventType);
}

beforeEach(() => {
  mockWritten.length = 0;
  jest.clearAllMocks();
  mockOrderFindByIdAndUpdate.mockResolvedValue({});
  mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }) });
});

describe('processStkCallback — the audit row', () => {
  it('credits the buyer, not M-Pesa, with a payment the buyer authorised', async () => {
    // The trail used to attribute every payment event to M-Pesa. The act that
    // moves the money is a PIN entered on a handset; M-Pesa only carries word
    // of it. An audit that says otherwise credits the network with the buyer's
    // decisions and the platform's.
    mockOrderFindOne.mockResolvedValueOnce(order()).mockResolvedValueOnce(null);

    await processStkCallback(callback(0, 'QK12345678'), {
      provider: 'simulation',
      requestId: 'req-1',
    });

    expect(row('SUCCESS')).toMatchObject({
      actor: 'BUYER',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'PAID',
      correlationId: 'req-1',
    });
    expect(String(row('SUCCESS')?.['reason'])).toContain('QK12345678');
  });

  it('distinguishes a buyer who cancelled from a network that failed', async () => {
    mockOrderFindOne.mockResolvedValue(order());

    await processStkCallback(callback(1032), { provider: 'simulation' });

    expect(row('FAILED')).toMatchObject({
      actor: 'BUYER',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'FAILED',
    });
    expect(String(row('FAILED')?.['reason'])).toMatch(/cancelled the prompt/i);
  });

  it('attributes an expired prompt to the provider and records it as a timeout', async () => {
    mockOrderFindOne.mockResolvedValue(order());

    await processStkCallback(callback(1037), { provider: 'simulation' });

    // 1037 is Safaricom's "cannot reach the subscriber" code, and it is a
    // timeout rather than a refusal — the buyer never decided anything.
    expect(row('TIMEOUT')).toMatchObject({ actor: 'PROVIDER', newStatus: 'FAILED' });
    expect(row('FAILED')).toBeUndefined();
  });

  it('explains an unmapped failure by its code rather than silently omitting a reason', async () => {
    mockOrderFindOne.mockResolvedValue(order());

    await processStkCallback(callback(9999), { provider: 'simulation' });

    expect(String(row('FAILED')?.['reason'])).toContain('9999');
  });

  it('records a duplicate as having moved nothing, rather than not recording it', async () => {
    // A duplicate that left no trace would be indistinguishable from one that
    // was never sent. The row exists to prove the guard fired.
    mockOrderFindOne
      .mockResolvedValueOnce(order())
      .mockResolvedValueOnce(order({ paymentStatus: 'PAID' }));

    const result = await processStkCallback(callback(0, 'QK12345678'), {
      provider: 'simulation',
    });

    expect(result.processed).toBe(false);
    expect(row('DUPLICATE')).toMatchObject({
      actor: 'PROVIDER',
      previousStatus: 'PAID',
      newStatus: 'PAID',
    });
    // Nothing was written to the order on a duplicate.
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('does not let a late failure callback demote a payment that already settled', async () => {
    // Safaricom retries callbacks, and a real STK Push against the sandbox
    // answers `1037 · No response from user` about thirty seconds after the
    // push. If that lands on an order that has since been paid — a retry, a
    // recovered payment, a demonstration confirmation — the failure branch used
    // to run `findByIdAndUpdate(..., FAILED)` unconditionally: the order would
    // be marked failed and its produce handed back to the marketplace, after
    // the buyer had been debited and the farmer told to dispatch.
    mockOrderFindOne.mockResolvedValue(order({ paymentStatus: 'PAID' }));
    // The guarded update matches nothing, because the order is no longer
    // PENDING_PAYMENT.
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await processStkCallback(callback(1037), { provider: 'daraja-sandbox' });

    expect(result.processed).toBe(false);
    // Recorded rather than silent: the row proves the guard fired.
    expect(row('DUPLICATE')).toMatchObject({ previousStatus: 'PAID', newStatus: 'PAID' });
    expect(String(row('DUPLICATE')?.['reason'])).toMatch(/no longer open/i);
    // And nothing was written to the order or the listing.
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('still fails a payment that is genuinely still open', async () => {
    mockOrderFindOne.mockResolvedValue(order());
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    const result = await processStkCallback(callback(1032), { provider: 'daraja-sandbox' });

    expect(result.processed).toBe(true);
    expect(row('FAILED')).toMatchObject({ newStatus: 'FAILED' });
  });

  it('does not present the arrival of a callback as a state change of its own', async () => {
    // CALLBACK_RECEIVED means M-Pesa spoke. What it said is the SUCCESS or
    // FAILED row after it; recording a transition here would put a change on
    // the record that the next row then contradicts.
    mockOrderFindOne.mockResolvedValue(order());

    await processStkCallback(callback(1032), { provider: 'simulation' });

    const received = row('CALLBACK_RECEIVED');
    expect(received?.['previousStatus']).toBe(received?.['newStatus']);
    expect(received?.['actor']).toBe('PROVIDER');
  });
});
