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

  it('keeps the journey while a mediation is open, and adds the review stage', () => {
    // Two regressions in one. A dispute used to replace the entire timeline
    // with one red banner, so the record of where the money was disappeared at
    // exactly the moment the buyer most needed it. And the branch keyed on
    // fulfillmentStatus === DISPUTED, which escrowSettlement writes only when a
    // mediation is resolved WITH A REFUND — an outcome, not an open review. The
    // live fact comes from MediationRequest and is passed in.
    render(<OrderTimelineDetailed {...PAID} hasOpenMediation viewer="BUYER" />);
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
    expect(screen.getByText(/Waiting for you to confirm the produce arrived/)).toBeInTheDocument();
  });

  it('tells the farmer whom the same step is waiting on', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="FARMER" />);
    expect(screen.getByText(/Waiting for the buyer to confirm the produce reached them/)).toBeInTheDocument();
  });

  it('attributes custody of the funds to the platform, not to either party', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="FARMER" />);
    expect(screen.getByText('· UmojaHub holds the funds')).toBeInTheDocument();
  });

  it('addresses the buyer the same way in both steps that describe their act', () => {
    // Both steps describe one act by one person. Mixing the second and third
    // person across two adjacent steps made a single timeline read as though it
    // were written about someone else halfway down.
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.getByText(/Waiting for you to confirm the produce arrived/)).toBeInTheDocument();
    expect(screen.getByText(/Released to the farmer when you confirm receipt/)).toBeInTheDocument();
    expect(screen.queryByText(/the buyer confirms receipt/)).not.toBeInTheDocument();
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
    // It now says what the buyer has to DO rather than only that we are
    // waiting. "Awaiting M-Pesa confirmation" described our side of a moment
    // whose next move belongs entirely to the person reading it.
    expect(screen.getByText(/Enter your M-Pesa PIN/)).toBeInTheDocument();
  });

  it('does not describe a payment that failed as one still in progress', () => {
    // Every non-PAID state used to share one sentence about awaiting
    // confirmation, so a payment the buyer had cancelled and one still in
    // flight were indistinguishable on the timeline.
    render(
      <OrderTimelineDetailed
        paymentStatus={OrderPaymentStatus.FAILED}
        fulfillmentStatus={OrderFulfillmentStatus.AWAITING_PAYMENT}
        viewer="BUYER"
      />
    );
    expect(screen.getByText(/did not go through/)).toBeInTheDocument();
    expect(screen.queryByText(/Enter your M-Pesa PIN/)).not.toBeInTheDocument();
  });

  it('never tells anyone an unresolved payment succeeded or failed', () => {
    // The one state where the platform does not know. Saying either would be a
    // claim about someone's money that we cannot support.
    render(
      <OrderTimelineDetailed
        paymentStatus={OrderPaymentStatus.UNRESOLVED}
        fulfillmentStatus={OrderFulfillmentStatus.AWAITING_PAYMENT}
        viewer="BUYER"
      />
    );
    expect(screen.getByText(/could not tell us whether you were charged/)).toBeInTheDocument();
    expect(screen.queryByText(/did not go through/)).not.toBeInTheDocument();
  });
});

describe('OrderTimelineDetailed — what "disputed" actually means', () => {
  it('does not claim a review is under way once it has concluded in a refund', () => {
    // `fulfillmentStatus === DISPUTED` is written by escrowSettlement only when
    // an administrator resolves a mediation with a refund. Reading it as "under
    // review" told a buyer an administrator was still looking at an order whose
    // money had already gone back to them.
    render(
      <OrderTimelineDetailed
        paymentStatus={OrderPaymentStatus.REFUNDED}
        fulfillmentStatus={OrderFulfillmentStatus.DISPUTED}
        paidAt="2026-08-01T10:00:00Z"
        viewer="BUYER"
      />
    );
    expect(screen.queryByText('Under review')).not.toBeInTheDocument();
    expect(screen.getByText('Payment refunded')).toBeInTheDocument();
  });

  it('shows the review stage for an order genuinely with the platform', () => {
    // The inverse failure: an order under active mediation is still
    // IN_FULFILLMENT, so it used to render an untroubled timeline while the
    // buyer waited on a decision.
    render(<OrderTimelineDetailed {...PAID} hasOpenMediation viewer="BUYER" />);
    expect(screen.getByText('Under review')).toBeInTheDocument();
    expect(screen.getByText(/money stays where it is/i)).toBeInTheDocument();
  });

  it('says nothing about a review when there is no mediation', () => {
    render(<OrderTimelineDetailed {...PAID} viewer="BUYER" />);
    expect(screen.queryByText('Under review')).not.toBeInTheDocument();
  });
});
