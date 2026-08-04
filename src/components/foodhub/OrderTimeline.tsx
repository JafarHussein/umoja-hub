import React from 'react';
import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

export interface IOrderTimelineProps {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paidAt?: Date | string | null | undefined;
  confirmedByFarmerAt?: Date | string | null | undefined;
  receivedByBuyerAt?: Date | string | null | undefined;
  /**
   * Who is reading. The journey is the same for everyone; only the pronouns
   * change. "Waiting for you to confirm receipt" is a different sentence from
   * "waiting for the buyer to confirm receipt", and only one of them tells the
   * reader they are the one holding things up.
   */
  viewer?: TimelineViewer | undefined;
}

export type TimelineViewer = 'BUYER' | 'FARMER' | 'ADMIN';

interface IStep {
  key: string;
  label: string;
  detail?: string | undefined;
  isComplete: boolean;
  isActive: boolean;
  /** Who the order is waiting on at this step. */
  party?: string | undefined;
  /** A branch off the happy path — dispute or refund — rather than a stage of it. */
  tone?: 'danger' | 'info' | undefined;
}

// "You" where it applies, the other party's role where it does not.
function who(viewer: TimelineViewer | undefined, party: 'BUYER' | 'FARMER'): string {
  if (viewer === party) return 'You';
  return party === 'BUYER' ? 'The buyer' : 'The farmer';
}

function formatDate(ts: Date | string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders a horizontal step timeline showing the order lifecycle.
 * Compact variant for use inside order cards and tables.
 */
export function OrderTimeline({
  paymentStatus,
  fulfillmentStatus,
  paidAt,
  confirmedByFarmerAt,
  receivedByBuyerAt,
}: IOrderTimelineProps): React.ReactElement {
  const isDisputed = fulfillmentStatus === OrderFulfillmentStatus.DISPUTED;
  const isPaid = paymentStatus === OrderPaymentStatus.PAID;
  const isInFulfillment = [
    OrderFulfillmentStatus.IN_FULFILLMENT,
    OrderFulfillmentStatus.RECEIVED,
    OrderFulfillmentStatus.COMPLETED,
  ].includes(fulfillmentStatus);
  const isReceived = [
    OrderFulfillmentStatus.RECEIVED,
    OrderFulfillmentStatus.COMPLETED,
  ].includes(fulfillmentStatus);
  const isCompleted = fulfillmentStatus === OrderFulfillmentStatus.COMPLETED;

  const isRefunded = paymentStatus === OrderPaymentStatus.REFUNDED;

  const steps: IStep[] = [
    {
      key: 'ordered',
      label: 'Placed',
      isComplete: true,
      isActive: !isPaid,
    },
    {
      key: 'paid',
      label: 'Paid — held in escrow',
      ...(paidAt ? { detail: formatDate(paidAt) } : {}),
      isComplete: isPaid,
      isActive: isPaid && !isInFulfillment,
    },
    {
      key: 'fulfillment',
      label: 'Dispatched',
      ...(confirmedByFarmerAt ? { detail: formatDate(confirmedByFarmerAt) } : {}),
      isComplete: isInFulfillment,
      isActive: isInFulfillment && !isReceived,
    },
    {
      key: 'received',
      label: 'Received',
      ...(receivedByBuyerAt ? { detail: formatDate(receivedByBuyerAt) } : {}),
      isComplete: isReceived,
      isActive: isReceived && !isCompleted,
    },
    {
      key: 'completed',
      label: isRefunded ? 'Payment refunded' : 'Payment released',
      isComplete: isCompleted || isRefunded,
      isActive: isCompleted || isRefunded,
      ...(isRefunded ? { tone: 'info' as const } : {}),
    },
  ];

  // Consistent with the detailed view: a dispute is a stage of this order, not
  // a replacement for its history. Collapsing the row to "Dispute raised" made
  // the two views disagree about whether a disputed order had a past at all.
  if (isDisputed) {
    steps.splice(steps.length - 1, 0, {
      key: 'review',
      label: 'Under review',
      isComplete: false,
      isActive: true,
      tone: 'danger',
    });
  }

  return (
    <ol className="flex items-center gap-0" aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center">
          {/* Step node */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'h-2.5 w-2.5 flex-shrink-0 rounded-app-pill transition-colors duration-150',
                step.tone === 'danger'
                  ? 'bg-app-danger'
                  : step.tone === 'info'
                    ? 'bg-app-info'
                    : step.isComplete
                      ? 'bg-app-brand'
                      : step.isActive
                        ? 'bg-app-brand/40 ring-1 ring-app-brand/40'
                        : 'border border-app-hairline bg-app-sunken',
              ].join(' ')}
              aria-label={step.isComplete ? `${step.label}: done` : step.label}
            />
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div
              className={[
                'mx-1 h-px w-6',
                steps[index + 1]?.isComplete ? 'bg-app-brand' : 'bg-app-hairline',
              ].join(' ')}
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Vertical detailed timeline — used on the order detail view.
 */
export function OrderTimelineDetailed({
  paymentStatus,
  fulfillmentStatus,
  paidAt,
  confirmedByFarmerAt,
  receivedByBuyerAt,
  viewer,
}: IOrderTimelineProps): React.ReactElement {
  const isDisputed = fulfillmentStatus === OrderFulfillmentStatus.DISPUTED;
  const isRefunded = paymentStatus === OrderPaymentStatus.REFUNDED;
  const isPaid = paymentStatus === OrderPaymentStatus.PAID;
  const isInFulfillment = [
    OrderFulfillmentStatus.IN_FULFILLMENT,
    OrderFulfillmentStatus.RECEIVED,
    OrderFulfillmentStatus.COMPLETED,
  ].includes(fulfillmentStatus);
  const isReceived = [
    OrderFulfillmentStatus.RECEIVED,
    OrderFulfillmentStatus.COMPLETED,
  ].includes(fulfillmentStatus);
  const isCompleted = fulfillmentStatus === OrderFulfillmentStatus.COMPLETED;

  const steps: IStep[] = [
    {
      key: 'ordered',
      label: 'Order placed',
      detail: 'Awaiting M-Pesa confirmation',
      isComplete: true,
      isActive: !isPaid,
      party: who(viewer, 'BUYER'),
    },
    {
      key: 'paid',
      label: 'Payment confirmed',
      detail: paidAt ? `${formatDate(paidAt)} · held in escrow` : 'Awaiting payment',
      isComplete: isPaid,
      isActive: isPaid && !isInFulfillment,
      party: 'UmojaHub holds the funds',
    },
    {
      key: 'fulfillment',
      label: 'Farmer dispatched',
      detail: confirmedByFarmerAt
        ? formatDate(confirmedByFarmerAt)
        : 'Waiting for the farmer to confirm dispatch',
      isComplete: isInFulfillment,
      isActive: isInFulfillment && !isReceived,
      party: who(viewer, 'FARMER'),
    },
    {
      key: 'received',
      label: 'Buyer received',
      detail: receivedByBuyerAt
        ? formatDate(receivedByBuyerAt)
        : viewer === 'BUYER'
          ? 'Confirm receipt once the produce reaches you'
          : 'Waiting for the buyer to confirm receipt',
      isComplete: isReceived,
      isActive: isReceived && !isCompleted,
      party: who(viewer, 'BUYER'),
    },
  ];

  // A dispute and a refund are branches off this journey, not replacements for
  // it. Both used to swap the whole timeline for a single banner — so at the one
  // moment when someone most needs to see where their money is and what has
  // happened to it so far, the record vanished and left a sentence behind.
  if (isDisputed) {
    steps.push({
      key: 'review',
      label: 'Under review',
      detail: 'An administrator is reviewing this order. The funds stay in escrow meanwhile.',
      isComplete: false,
      isActive: true,
      party: 'UmojaHub',
      tone: 'danger',
    });
  }

  if (isRefunded) {
    steps.push({
      key: 'refunded',
      label: 'Payment refunded',
      detail: 'Returned to the buyer from escrow following the mediation decision.',
      isComplete: true,
      isActive: true,
      party: 'UmojaHub',
      tone: 'info',
    });
  } else {
    steps.push({
      key: 'completed',
      label: 'Payment released',
      detail: isCompleted
        ? 'Released to the farmer from escrow'
        : isDisputed
          ? 'On hold until the review concludes'
          : 'Held in escrow until the buyer confirms receipt',
      isComplete: isCompleted,
      isActive: isCompleted,
      party: 'UmojaHub',
    });
  }

  return (
    <ol className="space-y-0" aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step.key} className="flex gap-3">
          {/* Spine */}
          <div className="flex flex-col items-center">
            <div
              className={[
                'mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-app-pill transition-colors duration-150',
                step.tone === 'danger'
                  ? 'bg-app-danger'
                  : step.tone === 'info'
                    ? 'bg-app-info'
                    : step.isComplete
                      ? 'bg-app-brand'
                      : step.isActive
                        ? 'bg-app-brand/40 ring-1 ring-app-brand/40'
                        : 'border border-app-hairline bg-app-sunken',
              ].join(' ')}
            />
            {index < steps.length - 1 && (
              <div
                className={[
                  'mb-1 mt-1 w-px flex-1',
                  steps[index + 1]?.isComplete ? 'bg-app-brand/40' : 'bg-app-hairline',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Label */}
          <div className="min-w-0 pb-4">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p
                className={[
                  'app-body',
                  step.tone === 'danger'
                    ? 'text-app-danger'
                    : step.tone === 'info'
                      ? 'text-app-info'
                      : step.isComplete
                        ? 'text-app-ink'
                        : 'text-app-faint',
                ].join(' ')}
              >
                {step.label}
              </p>
              {/* Who the order is waiting on. The timeline said what had
                  happened but never who had to act next, which is the one thing
                  someone checking on a stalled order is trying to find out. */}
              {step.party && <span className="app-meta text-app-faint">· {step.party}</span>}
            </div>
            {step.detail && <p className="app-meta mt-0.5 text-app-faint">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
