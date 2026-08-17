import React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// MoneyStatement — the top of every payment surface, and the loudest thing on it.
//
// The buyer's order screen used to open with the crop name as its H1 and carry
// the amount as one row inside an "Order details" table, set at the same size as
// the quantity beside it. Someone opening that screen is asking where their
// money is; the screen answered "Tomatoes".
//
// Three lines, in the order the question is asked:
//
//   label      which figure this is — paid, refunded, owed, not taken
//   amount     the figure, in the tabular mono ramp at display size
//   status     where that money is right now, in one plain sentence
//   evidence   what proves it: the M-Pesa receipt, the simulation disclosure
//
// Deliberately not a card. It is the first thing on the page, so it needs no
// container to say so, and a border around it would put it at the same level as
// everything else on the screen — which is the fault this replaces.
// ---------------------------------------------------------------------------

export type MoneyTone = 'neutral' | 'held' | 'settled' | 'stopped' | 'checking';

const TONE_TEXT: Record<MoneyTone, string> = {
  // The amount itself stays ink in every state. Tone colours the status
  // sentence only: a red number reads as a loss, and a payment that failed is
  // not a loss of money, it is money that never moved.
  neutral: 'text-app-body',
  held: 'text-app-ink',
  settled: 'text-app-success',
  stopped: 'text-app-danger',
  checking: 'text-app-warning',
};

// Redundant encoding for the tone, because colour alone may not carry state.
const TONE_GLYPH: Record<MoneyTone, string | null> = {
  neutral: null,
  held: null,
  settled: '✓',
  stopped: '⊘',
  checking: '◷',
};

export interface IMoneyStatementProps {
  /** Which figure this is. "Amount paid", "You will receive", "Amount refunded". */
  label: string;
  amountKES: number;
  /** Where the money is, in one sentence. The escrow explainer's headline. */
  status: string;
  tone?: MoneyTone;
  /** Receipt code, simulation notice, reference — what substantiates the claim. */
  evidence?: React.ReactNode;
  className?: string;
}

export function MoneyStatement({
  label,
  amountKES,
  status,
  tone = 'neutral',
  evidence,
  className,
}: IMoneyStatementProps): React.ReactElement {
  const glyph = TONE_GLYPH[tone];

  return (
    <section className={cn('space-y-2', className)} aria-label={label}>
      <p className="app-label text-app-muted">{label}</p>

      {/* The figure. app-data-xl is tabular mono at 30px — it exists in the type
          scale for exactly this and no payment surface was using it. */}
      <p className="app-data-xl text-app-ink">KSh {amountKES.toLocaleString()}</p>

      <p className={cn('app-body max-w-app-prose text-pretty', TONE_TEXT[tone])}>
        {glyph && (
          <span aria-hidden className="mr-1.5">
            {glyph}
          </span>
        )}
        {status}
      </p>

      {evidence && (
        <div className="app-meta flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-app-faint">
          {evidence}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// NextStep — the one thing this person can do now.
//
// The old screens scattered actions across four or five bordered panels, each
// with its own heading, so "confirm receipt" (which pays a farmer) sat in the
// same visual container as "rate this order". At most one of these renders per
// screen, and it renders nothing at all when there is nothing to do — an action
// zone explaining that no action is available is just another card.
//
// The consequence line is required, not optional. A button on a money screen
// must say what it does to the money before it is pressed.
// ---------------------------------------------------------------------------

export interface INextStepProps {
  title: string;
  /** What pressing the button does to the money. Required for a reason. */
  consequence: React.ReactNode;
  /** The action itself. One button; two only when the second is a real refusal. */
  children?: React.ReactNode;
  className?: string;
}

export function NextStep({
  title,
  consequence,
  children,
  className,
}: INextStepProps): React.ReactElement {
  return (
    <section
      className={cn('space-y-3 border-t border-app-hairline pt-6', className)}
      aria-label={title}
    >
      <h2 className="app-h2 text-app-ink">{title}</h2>
      <p className="app-body max-w-app-prose text-pretty text-app-muted">{consequence}</p>
      {children && <div className="pt-1">{children}</div>}
    </section>
  );
}
