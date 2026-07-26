import React from 'react';
import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

export interface IOrderTimelineProps {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paidAt?: Date | string | null | undefined;
  confirmedByFarmerAt?: Date | string | null | undefined;
  receivedByBuyerAt?: Date | string | null | undefined;
}

interface IStep {
  key: string;
  label: string;
  detail?: string | undefined;
  isComplete: boolean;
  isActive: boolean;
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

  if (isDisputed) {
    return (
      <div className="flex items-center gap-2" role="status" aria-label="Order disputed">
        <div className="h-2 w-2 flex-shrink-0 rounded-app-pill bg-app-danger" aria-hidden="true" />
        <span className="app-body text-app-danger">Dispute raised</span>
      </div>
    );
  }

  if (paymentStatus === OrderPaymentStatus.REFUNDED) {
    return (
      <div className="flex items-center gap-2" role="status" aria-label="Payment refunded">
        <div className="h-2 w-2 flex-shrink-0 rounded-app-pill bg-app-info" aria-hidden="true" />
        <span className="app-body text-app-info">Refunded</span>
      </div>
    );
  }

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
      label: 'Payment released',
      isComplete: isCompleted,
      isActive: isCompleted,
    },
  ];

  return (
    <ol className="flex items-center gap-0" aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center">
          {/* Step node */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'h-2.5 w-2.5 flex-shrink-0 rounded-app-pill transition-colors duration-150',
                step.isComplete
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

  const steps: IStep[] = [
    {
      key: 'ordered',
      label: 'Order placed',
      detail: 'Awaiting M-Pesa confirmation',
      isComplete: true,
      isActive: !isPaid,
    },
    {
      key: 'paid',
      label: 'Payment confirmed',
      detail: paidAt ? `${formatDate(paidAt)} · held in escrow` : 'Awaiting payment',
      isComplete: isPaid,
      isActive: isPaid && !isInFulfillment,
    },
    {
      key: 'fulfillment',
      label: 'Farmer dispatched',
      detail: confirmedByFarmerAt
        ? formatDate(confirmedByFarmerAt)
        : 'Waiting for farmer confirmation',
      isComplete: isInFulfillment,
      isActive: isInFulfillment && !isReceived,
    },
    {
      key: 'received',
      label: 'Buyer received',
      detail: receivedByBuyerAt ? formatDate(receivedByBuyerAt) : 'Waiting for receipt',
      isComplete: isReceived,
      isActive: isReceived && !isCompleted,
    },
    {
      key: 'completed',
      label: 'Payment released',
      detail: isCompleted
        ? 'Released to the farmer from escrow'
        : 'Held in escrow until you confirm receipt',
      isComplete: isCompleted,
      isActive: isCompleted,
    },
  ];

  if (isDisputed) {
    return (
      <div className="flex items-start gap-3 rounded-app-control border border-app-danger/30 bg-app-danger-surface p-3">
        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-app-pill bg-app-danger" />
        <div>
          <p className="app-body-strong text-app-danger">Dispute raised</p>
          <p className="app-body mt-0.5 text-app-muted">
            This order has an active dispute. The UmojaHub team has been notified.
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === OrderPaymentStatus.REFUNDED) {
    return (
      <div className="flex items-start gap-3 rounded-app-control border border-app-info/30 bg-app-info-surface p-3">
        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-app-pill bg-app-info" />
        <div>
          <p className="app-body-strong text-app-info">Payment refunded</p>
          <p className="app-body mt-0.5 text-app-muted">
            Your payment was returned from escrow following the platform&apos;s mediation decision.
          </p>
        </div>
      </div>
    );
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
                step.isComplete
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
            <p className={['app-body', step.isComplete ? 'text-app-ink' : 'text-app-faint'].join(' ')}>
              {step.label}
            </p>
            {step.detail && <p className="app-meta mt-0.5 text-app-faint">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
