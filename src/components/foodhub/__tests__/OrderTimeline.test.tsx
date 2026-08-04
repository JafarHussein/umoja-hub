import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrderTimelineDetailed } from '../OrderTimeline';
import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

// The order journey is a custody record for someone else's money. These tests
// pin the two properties that matter: it is always visible, and it always says
// who has to act next.

const PAID = {
  paymentStatus: OrderPaymentStatus.PAID,
  fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
  paidAt: '2026-08-01T10:00:00Z',
} as const;

describe('OrderTimelineDetailed', () => {
  it('shows the whole journey while an order is in fulfilment', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('Payment confirmed')).toBeInTheDocument();
    expect(screen.getByText('Farmer dispatched')).toBeInTheDocument();
    expect(screen.getByText('Buyer received')).toBeInTheDocument();
    expect(screen.getByText('Payment released')).toBeInTheDocument();
  });

  it('keeps the journey when the order is disputed, and adds the review stage', () => {
    // Regression: a dispute used to replace the entire timeline with one red
    // banner, so the record of where the money was disappeared at exactly the
    // moment the buyer most needed to see it.
    render(
      <OrderTimelineDetailed
        {...PAID}
        fulfillmentStatus={OrderFulfillmentStatus.DISPUTED}
        viewer="BUYER"
      />
    );
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('Payment confirmed')).toBeInTheDocument();
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByText('Payment released')).toBeInTheDocument();
    expect(screen.getByText(/On hold until the review concludes/)).toBeInTheDocument();
  });

  it('keeps the journey on a refund, and ends it with the refund rather than a release', () => {
    render(
      <OrderTimelineDetailed
        {...PAID}
        paymentStatus={OrderPaymentStatus.REFUNDED}
        viewer="BUYER"
      />
    );
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('Payment refunded')).toBeInTheDocument();
    expect(screen.queryByText('Payment released')).not.toBeInTheDocument();
  });

  it('addresses the buyer directly about the step the buyer must take', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.getByText(/Confirm receipt once the produce reaches you/)).toBeInTheDocument();
  });

  it('tells the farmer whom the same step is waiting on', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="FARMER" />);
    expect(screen.getByText(/Waiting for the buyer to confirm receipt/)).toBeInTheDocument();
  });

  it('attributes custody of the funds to the platform, not to either party', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="FARMER" />);
    expect(screen.getByText('· UmojaHub holds the funds')).toBeInTheDocument();
  });

  it('addresses the buyer the same way in both steps that describe their act', () => {
    // "Confirm receipt once the produce reaches you" and "held in escrow until
    // the buyer confirms receipt" describe one act by one person. Mixing the
    // second and third person across two adjacent steps made a single timeline
    // read as though it were written about someone else halfway down.
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.getByText(/Held in escrow until you confirm receipt/)).toBeInTheDocument();
    expect(screen.queryByText(/until the buyer confirms receipt/)).not.toBeInTheDocument();
  });

  it('stops saying a paid order is awaiting payment', () => {
    // The detail under "Order placed" was static, so a completed first step
    // went on describing a state that had already passed.
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.queryByText('Awaiting M-Pesa confirmation')).not.toBeInTheDocument();
  });

  it('still says so while payment is genuinely outstanding', () => {
    render(
      <OrderTimelineDetailed
        paymentStatus={OrderPaymentStatus.PENDING_PAYMENT}
        fulfillmentStatus={OrderFulfillmentStatus.AWAITING_PAYMENT}
        viewer="BUYER"
      />
    );
    expect(screen.getByText('Awaiting M-Pesa confirmation')).toBeInTheDocument();
  });
});
