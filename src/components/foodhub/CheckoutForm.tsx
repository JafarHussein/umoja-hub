'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FulfillmentType, ListingUnit } from '@/types';

export interface ICheckoutFormProps {
  listingId: string;
  cropName: string;
  unit: ListingUnit;
  pricePerUnit: number;
  maxQuantity: number;
  pickupCounty: string;
}

type CheckoutState = 'idle' | 'submitting' | 'awaiting_payment' | 'error';

interface IOrderResult {
  orderId: string;
  orderReferenceId: string;
  totalAmountKES: number;
  mpesaCheckoutRequestId: string;
}

export function CheckoutForm({
  listingId,
  cropName,
  unit,
  pricePerUnit,
  maxQuantity,
  pickupCounty,
}: ICheckoutFormProps): React.ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(FulfillmentType.PICKUP);
  const [state, setState] = useState<CheckoutState>('idle');
  const [orderResult, setOrderResult] = useState<IOrderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalKES = quantity * pricePerUnit;

  function adjustQuantity(delta: number): void {
    setQuantity((q) => Math.min(maxQuantity, Math.max(1, q + delta)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          quantityOrdered: quantity,
          fulfillmentType,
          buyerPhone: phone,
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg =
          typeof data['error'] === 'string'
            ? data['error']
            : 'Failed to place order. Please try again.';
        setErrorMessage(msg);
        setState('error');
        return;
      }

      setOrderResult(data as unknown as IOrderResult);
      setState('awaiting_payment');
    } catch {
      setErrorMessage('Network error. Check your connection and try again.');
      setState('error');
    }
  }

  // ── Awaiting M-Pesa confirmation ─────────────────────────────────────────
  if (state === 'awaiting_payment' && orderResult) {
    return (
      <div className="bg-surface-elevated border border-white/5 rounded p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8L6.5 11.5L13 4"
                stroke="#007F4E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-t4 font-body font-medium text-text-primary">
              M-Pesa prompt sent
            </p>
            <p className="text-t5 font-body text-text-secondary mt-0.5">
              Enter your PIN on your phone to confirm payment
            </p>
          </div>
        </div>

        <div className="bg-surface-secondary border border-white/5 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-t5 font-body text-text-secondary">Reference</span>
            <span className="text-t5 font-mono text-text-primary">
              {orderResult.orderReferenceId}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-t5 font-body text-text-secondary">Amount</span>
            <span className="text-t5 font-mono text-text-primary">
              KES {orderResult.totalAmountKES.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-t5 font-body text-text-secondary">Crop</span>
            <span className="text-t5 font-body text-text-primary capitalize">{cropName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-t5 font-body text-text-secondary">Collection</span>
            <span className="text-t5 font-body text-text-primary">
              {fulfillmentType === FulfillmentType.PICKUP ? `Pickup · ${pickupCounty}` : 'Delivery'}
            </span>
          </div>
        </div>

        <p className="text-t6 font-body text-text-disabled">
          You will receive an M-Pesa SMS once payment is confirmed. Save your order reference:{' '}
          <span className="font-mono text-text-secondary">{orderResult.orderReferenceId}</span>
        </p>
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-elevated border border-white/5 rounded p-6 space-y-5"
    >
      <h2 className="text-t3 font-heading font-semibold text-text-primary">Pay with M-Pesa</h2>

      {/* Quantity stepper */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">
          Quantity ({unit.toLowerCase()})
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= 1}
            className="w-11 h-11 bg-surface-secondary border border-white/10 rounded-sm text-text-primary flex items-center justify-center hover:border-white/20 disabled:opacity-40 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green"
            aria-label="Decrease quantity"
          >
            <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor" aria-hidden="true">
              <rect width="12" height="2" rx="1" />
            </svg>
          </button>

          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.min(maxQuantity, Math.max(1, parseInt(e.target.value, 10) || 1)),
              )
            }
            aria-label="Quantity"
            className="w-20 h-11 bg-surface-secondary border border-white/10 rounded-sm text-t4 font-mono text-text-primary text-center focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
          />

          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= maxQuantity}
            className="w-11 h-11 bg-surface-secondary border border-white/10 rounded-sm text-text-primary flex items-center justify-center hover:border-white/20 disabled:opacity-40 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green"
            aria-label="Increase quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <rect y="5" width="12" height="2" rx="1" />
              <rect x="5" width="2" height="12" rx="1" />
            </svg>
          </button>

          <span className="text-t5 font-body text-text-secondary">
            of {maxQuantity.toLocaleString()} available
          </span>
        </div>
      </div>

      {/* Fulfillment type */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">Collection method</p>
        <div className="flex gap-2" role="group" aria-label="Collection method">
          {(Object.values(FulfillmentType) as FulfillmentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFulfillmentType(type)}
              aria-pressed={fulfillmentType === type}
              className={[
                'flex-1 min-h-[44px] rounded-sm text-t5 font-body border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green',
                fulfillmentType === type
                  ? 'bg-accent-green text-surface-primary border-accent-green'
                  : 'bg-surface-secondary text-text-secondary border-white/10 hover:border-white/20',
              ].join(' ')}
            >
              {type === FulfillmentType.PICKUP ? `Pickup · ${pickupCounty}` : 'Delivery'}
            </button>
          ))}
        </div>
      </div>

      {/* M-Pesa phone */}
      <Input
        type="tel"
        label="M-Pesa phone number"
        placeholder="+254700000000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="Enter the number registered with your M-Pesa account"
        required
      />

      {/* Total */}
      <div className="bg-surface-secondary border border-white/5 rounded p-3 flex items-center justify-between">
        <span className="text-t5 font-body text-text-secondary">Total</span>
        <span className="text-t2 font-mono font-semibold text-text-primary">
          KES {totalKES.toLocaleString()}
        </span>
      </div>

      {/* Error */}
      {state === 'error' && errorMessage && (
        <p
          className="text-t5 font-body text-red-400 bg-red-950/20 border border-red-900/30 rounded p-3"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={state === 'submitting'}
        disabled={!phone || quantity < 1}
        className="w-full"
      >
        Pay KES {totalKES.toLocaleString()} with M-Pesa
      </Button>
    </form>
  );
}
