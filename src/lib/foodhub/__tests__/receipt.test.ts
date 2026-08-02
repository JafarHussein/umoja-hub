/**
 * Receipt derivation — the receipt and its audit trail are computed, never
 * stored, so these tests pin the derivation rules directly.
 */

import {
  buildOrderReceipt,
  buildTransactionTrail,
  escrowReferenceFor,
  hasReceipt,
} from '../receipt';
import { EscrowEventType, EscrowState, OrderPaymentStatus, PaymentEventType, Role } from '@/types';

describe('escrowReferenceFor', () => {
  it('derives the escrow reference from the order reference', () => {
    expect(escrowReferenceFor('UMJ-2026-000123')).toBe('ESC-2026-000123');
  });

  it('leaves an unrecognised reference shape untouched', () => {
    expect(escrowReferenceFor('LEGACY-9')).toBe('LEGACY-9');
  });
});

describe('hasReceipt', () => {
  it('issues a receipt once payment is confirmed', () => {
    expect(hasReceipt(OrderPaymentStatus.PAID)).toBe(true);
  });

  it('issues a receipt for a refunded order — money moved twice', () => {
    expect(hasReceipt(OrderPaymentStatus.REFUNDED)).toBe(true);
  });

  it('has nothing to attest to before payment or after failure', () => {
    expect(hasReceipt(OrderPaymentStatus.PENDING_PAYMENT)).toBe(false);
    expect(hasReceipt(OrderPaymentStatus.FAILED)).toBe(false);
  });
});

describe('buildTransactionTrail', () => {
  it('merges payment and escrow events into one chronological trail', () => {
    const trail = buildTransactionTrail(
      [
        { eventType: PaymentEventType.INITIATED, occurredAt: '2026-06-01T10:00:00Z', amount: 2000 },
        {
          eventType: PaymentEventType.SUCCESS,
          occurredAt: '2026-06-01T10:00:30Z',
          amount: 2000,
          paymentReference: 'QGR1ABCD23',
          resultCode: 0,
        },
      ],
      [
        {
          eventType: EscrowEventType.HELD,
          occurredAt: '2026-06-01T10:00:31Z',
          amountKES: 2000,
          actorRole: 'SYSTEM',
        },
      ]
    );

    expect(trail.map((e) => e.type)).toEqual([
      PaymentEventType.INITIATED,
      PaymentEventType.SUCCESS,
      EscrowEventType.HELD,
    ]);
    expect(trail[0]?.kind).toBe('PAYMENT');
    expect(trail[2]?.kind).toBe('ESCROW');
  });

  it('explains a failure by its Safaricom result code rather than just naming it', () => {
    const [event] = buildTransactionTrail(
      [
        {
          eventType: PaymentEventType.FAILED,
          occurredAt: '2026-06-01T10:00:00Z',
          resultCode: 1032,
        },
      ],
      []
    );

    expect(event?.label).toBe('Payment failed');
    expect(event?.detail).toBe('Cancelled by the buyer on their handset');
  });

  it('attributes an escrow event to the actor that caused it', () => {
    const [buyerEvent] = buildTransactionTrail(
      [],
      [
        {
          eventType: EscrowEventType.RELEASED,
          occurredAt: '2026-06-02T09:00:00Z',
          amountKES: 2000,
          actorRole: Role.BUYER,
        },
      ]
    );
    expect(buyerEvent?.actor).toBe('Buyer');

    const [adminEvent] = buildTransactionTrail(
      [],
      [
        {
          eventType: EscrowEventType.REFUND_ISSUED,
          occurredAt: '2026-06-02T09:00:00Z',
          amountKES: 2000,
          actorRole: Role.ADMIN,
          note: 'Farmer never dispatched.',
        },
      ]
    );
    expect(adminEvent?.actor).toBe('UmojaHub administrator');
    // An explicit note wins over the generic description.
    expect(adminEvent?.detail).toBe('Farmer never dispatched.');
  });

  it('weaves fulfilment progress into the same chronological trail', () => {
    const trail = buildTransactionTrail(
      [
        {
          eventType: PaymentEventType.SUCCESS,
          occurredAt: '2026-06-01T10:00:00Z',
          amount: 2000,
        },
      ],
      [
        {
          eventType: EscrowEventType.HELD,
          occurredAt: '2026-06-01T10:00:01Z',
          amountKES: 2000,
          actorRole: 'SYSTEM',
        },
        {
          eventType: EscrowEventType.RELEASED,
          occurredAt: '2026-06-05T09:00:00Z',
          amountKES: 2000,
          actorRole: Role.BUYER,
        },
      ],
      [
        { stage: 'PREPARING', at: '2026-06-02T08:00:00Z' },
        { stage: 'IN_TRANSIT', at: '2026-06-03T08:00:00Z', note: 'Sent on the Kisumu matatu.' },
      ]
    );

    expect(trail.map((e) => e.type)).toEqual([
      PaymentEventType.SUCCESS,
      EscrowEventType.HELD,
      'PREPARING',
      'IN_TRANSIT',
      EscrowEventType.RELEASED,
    ]);
    expect(trail[2]?.kind).toBe('FULFILMENT');
    expect(trail[2]?.label).toBe('Preparing produce');
    expect(trail[3]?.actor).toBe('Farmer');
    expect(trail[3]?.detail).toBe('Sent on the Kisumu matatu.');
  });

  it('returns an empty trail when nothing was recorded', () => {
    expect(buildTransactionTrail([], [])).toEqual([]);
  });
});

describe('buildOrderReceipt', () => {
  const base = {
    order: {
      orderReferenceId: 'UMJ-2026-000123',
      mpesaTransactionId: 'QGR1ABCD23',
      cropName: 'Maize',
      quantityOrdered: 20,
      unit: 'KG',
      pricePerUnit: 100,
      totalAmountKES: 2000,
      fulfillmentType: 'PICKUP',
      paymentStatus: OrderPaymentStatus.PAID,
      paidAt: '2026-06-01T10:00:30Z',
    },
    buyer: { name: 'Kamau Githinji', phone: '0712345678' },
    farmer: { name: 'Wanjiku Kamau' },
    escrowState: EscrowState.HELD,
    provider: 'simulation',
    isSimulated: true,
  };

  it('carries the M-Pesa receipt, both references and the amount', () => {
    const receipt = buildOrderReceipt(base);

    expect(receipt.receiptNumber).toBe('QGR1ABCD23');
    expect(receipt.orderReferenceId).toBe('UMJ-2026-000123');
    expect(receipt.escrowReference).toBe('ESC-2026-000123');
    expect(receipt.totalAmountKES).toBe(2000);
    expect(receipt.paymentMethod).toBe('M-PESA');
  });

  it('marks a simulated payment as simulated', () => {
    expect(buildOrderReceipt(base).isSimulated).toBe(true);
    expect(
      buildOrderReceipt({ ...base, provider: 'daraja-production', isSimulated: false }).isSimulated
    ).toBe(false);
  });

  it('reports no receipt number when the payment never confirmed', () => {
    const receipt = buildOrderReceipt({
      ...base,
      order: { ...base.order, mpesaTransactionId: null, paidAt: null },
    });
    expect(receipt.receiptNumber).toBeNull();
    expect(receipt.paidAt).toBeNull();
  });
});
