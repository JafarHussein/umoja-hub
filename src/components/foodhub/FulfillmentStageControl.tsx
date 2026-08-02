'use client';

import React, { useState } from 'react';
import { Alert, Button } from '@/components/app';
import {
  FULFILLMENT_STAGE_LABEL,
  FULFILLMENT_STAGE_ORDER,
  FulfillmentStage,
} from '@/types';

// ---------------------------------------------------------------------------
// FulfillmentStageControl — the farmer narrates where the produce is.
//
// Forward-only by construction: stages already passed are shown as done and
// cannot be re-selected, and the control only offers stages ahead of the
// current one. The buyer has already been told about each step, so walking one
// back would make the recorded trail a lie — the API refuses it too.
//
// This changes no money and no escrow state. It exists because a buyer whose
// cash is held for days deserves to know whether their maize is still on the
// farm or already on a matatu.
// ---------------------------------------------------------------------------

export interface IFulfillmentStageControlProps {
  orderId: string;
  currentStage: FulfillmentStage | null;
  onAdvanced: (stage: FulfillmentStage) => void;
}

export function FulfillmentStageControl({
  orderId,
  currentStage,
  onAdvanced,
}: IFulfillmentStageControlProps): React.ReactElement {
  const [submitting, setSubmitting] = useState<FulfillmentStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = currentStage ? FULFILLMENT_STAGE_ORDER.indexOf(currentStage) : -1;
  const remaining = FULFILLMENT_STAGE_ORDER.slice(currentIndex + 1);

  async function advance(stage: FulfillmentStage): Promise<void> {
    setSubmitting(stage);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not update progress.');
        setSubmitting(null);
        return;
      }
      onAdvanced(stage);
      setSubmitting(null);
    } catch {
      setError('Could not update progress. Check your connection and try again.');
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="app-label text-app-muted">Fulfilment progress</p>
        <p className="app-meta text-app-faint">
          Tell the buyer where their order is. This does not release the payment — that happens
          when they confirm receipt.
        </p>
      </div>

      {/* What has already happened */}
      <ol className="space-y-1">
        {FULFILLMENT_STAGE_ORDER.slice(0, currentIndex + 1).map((stage) => (
          <li key={stage} className="flex items-center gap-2">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-app-pill bg-app-brand"
              aria-hidden="true"
            />
            <span className="app-body text-app-ink">{FULFILLMENT_STAGE_LABEL[stage]}</span>
          </li>
        ))}
        {currentIndex < 0 && (
          <li className="app-body text-app-muted">No progress reported yet.</li>
        )}
      </ol>

      {error && <Alert tone="danger">{error}</Alert>}

      {remaining.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {remaining.map((stage, index) => (
            <Button
              key={stage}
              size="sm"
              variant={index === 0 ? 'primary' : 'secondary'}
              isLoading={submitting === stage}
              onClick={() => void advance(stage)}
            >
              {FULFILLMENT_STAGE_LABEL[stage]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="app-meta text-app-faint">
          You have reported every step. Waiting for the buyer to confirm receipt.
        </p>
      )}
    </div>
  );
}
