import React from 'react';
import Link from 'next/link';
import { ProcessFlow } from '@/components/website/ProcessFlow';

const steps = [
  {
    actor: 'Admin',
    action: 'Farmer verification reviewed',
    detail:
      'National ID or passport, land tenure document or signed lease, and produce photograph submitted. A UmojaHub administrator reviews the documents and approves or rejects.',
  },
  {
    actor: 'Farmer',
    action: 'Listing created',
    detail:
      'Crop type, price per kilogram, available quantity, pickup county, and preferred contact method set. The listing is visible to buyers immediately after approval.',
  },
  {
    actor: 'Buyer',
    action: 'Listing found',
    detail:
      "Buyers browse by county and crop type. Each listing shows the farmer's trust tier, completed order count, and verification status — before any payment decision is made.",
  },
  {
    actor: 'Buyer',
    action: 'Payment sent',
    detail:
      "An STK Push is sent to the buyer's registered M-Pesa number. The buyer enters their PIN. Safaricom confirms. The order status updates to Paid. UmojaHub never handles the buyer's payment credentials.",
  },
  {
    actor: 'Farmer',
    action: 'Order fulfilled',
    detail:
      "The order progresses from Paid → Dispatched → Received. Both parties leave a rating. The farmer's Trust Score recalculates on completion.",
  },
];

export function MarketplaceFlowSection(): React.ReactElement {
  return (
    <section className="bg-surface-elevated w-full py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Food Security Hub · How it works
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4">
            How the marketplace works
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-prose">
            Five steps from farmer registration to completed order. Every transaction is between a
            verified farmer and an M-Pesa payment — no cash, no broker, no bank account required on
            either side.
          </p>
        </div>

        <ProcessFlow steps={steps} />

        <div className="mt-12 border-t border-zinc-800/50 pt-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-8">
            Why the marketplace is structured this way
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why verification happens before listing
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                Without pre-verification, any person could list any produce under any name. A buyer
                would have no basis for trust. The verification requirement is not bureaucracy — it
                is the foundation of the trust system. Every listing on UmojaHub is from a person
                whose identity was reviewed by a human administrator who saw their documents. This is
                what makes the Trust Score meaningful: it accumulates on top of a verified identity,
                not an anonymous account.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why the platform uses M-Pesa STK Push
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                Cash payment requires physical presence and creates no verifiable record. Bank
                transfer requires both parties to have bank accounts — approximately 40% of Kenyan
                adults do not. The STK Push uses Safaricom&apos;s infrastructure, trusted across
                Kenya, and creates a payment record neither party can dispute. UmojaHub never handles
                the buyer&apos;s payment credentials — the PIN goes directly to Safaricom. No bank
                account is required on either side of the transaction.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why ratings accumulate rather than average
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                Without a reputation system, a farmer who fulfils every order is indistinguishable
                from one who does not. The rating component of the Trust Score rewards consistent
                performance over time. A single rating has diminishing influence as more accumulate —
                this prevents gaming. A farmer with 40 completed orders and one bad rating is not
                equivalent to a farmer with one completed order and one good rating. The system
                rewards track record, not individual impressions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Browse marketplace
          </Link>
          <Link
            href="/for/farmers"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            For farmers
          </Link>
          <Link
            href="/for/buyers"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            For buyers
          </Link>
        </div>
      </div>
    </section>
  );
}
