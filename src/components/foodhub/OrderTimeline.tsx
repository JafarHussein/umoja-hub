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
        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
        <span className="text-t5 text-red-400 font-body">Dispute raised</span>
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
      label: 'Paid',
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
      label: 'Complete',
      isComplete: isCompleted,
      isActive: isCompleted,
    },
  ];

  return (
    <ol
      className="flex items-center gap-0"
      aria-label="Order progress"
    >
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center">
          {/* Step node */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-150',
                step.isComplete
                  ? 'bg-accent-green'
                  : step.isActive
                  ? 'bg-accent-green/40 ring-1 ring-accent-green/40'
                  : 'bg-surface-secondary border border-white/10',
              ].join(' ')}
              aria-label={step.isComplete ? `${step.label}: done` : step.label}
            />
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div
              className={[
                'h-px w-6 mx-1',
                steps[index + 1]?.isComplete ? 'bg-accent-green' : 'bg-white/10',
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
      detail: paidAt ? formatDate(paidAt) : 'Awaiting payment',
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
      label: 'Order completed',
      detail: isCompleted ? 'Transaction closed' : 'Pending receipt confirmation',
      isComplete: isCompleted,
      isActive: isCompleted,
    },
  ];

  if (isDisputed) {
    return (
      <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
        <div>
          <p className="text-t4 text-red-400 font-body font-medium">Dispute raised</p>
          <p className="text-t5 text-text-secondary mt-0.5">
            This order has an active dispute. The UmojaHub team has been notified.
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
                'w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 transition-colors duration-150',
                step.isComplete
                  ? 'bg-accent-green'
                  : step.isActive
                  ? 'bg-accent-green/40 ring-1 ring-accent-green/40'
                  : 'bg-surface-secondary border border-white/10',
              ].join(' ')}
            />
            {index < steps.length - 1 && (
              <div
                className={[
                  'w-px flex-1 mt-1 mb-1',
                  steps[index + 1]?.isComplete ? 'bg-accent-green/40' : 'bg-white/5',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Label */}
          <div className="pb-4 min-w-0">
            <p
              className={[
                'text-t5 font-body',
                step.isComplete ? 'text-text-primary' : 'text-text-disabled',
              ].join(' ')}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-t6 text-text-disabled mt-0.5">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
