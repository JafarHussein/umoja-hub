import React from 'react';

interface ChainStep {
  step: string;
  actor: string;
  action: string;
  produces: string;
}

const foodSecurityChain: ChainStep[] = [
  {
    step: '01',
    actor: 'Platform Admin',
    action:
      "Reviews the farmer's identity document (National ID or passport), land documentation, and produce photograph for consistency and plausibility.",
    produces: 'APPROVED status — verified identity recorded on platform',
  },
  {
    step: '02',
    actor: 'System',
    action: 'Initializes Trust Score with the verification component on approval.',
    produces: 'Trust Score: 40 pts · Trust Tier: ESTABLISHED · listing enabled',
  },
  {
    step: '03',
    actor: 'Farmer',
    action:
      'Completes orders — dispatches produce after PAID confirmation, buyer marks received, payment releases via M-Pesa.',
    produces:
      'Transaction component: 0 → 25 pts (logarithmic scale — volume alone does not saturate it)',
  },
  {
    step: '04',
    actor: 'Buyer',
    action: 'Rates each completed order with a 1–5 star rating and optional written comment.',
    produces: 'Rating component: 0 → 20 pts (recency-weighted — recent orders count more)',
  },
  {
    step: '05',
    actor: 'System',
    action:
      'Tracks ratio of fulfilled orders to accepted orders over a rolling window.',
    produces:
      'Reliability component: 0 → 15 pts (a high rating score does not compensate for non-dispatch)',
  },
];

const educationChain: ChainStep[] = [
  {
    step: '01',
    actor: 'Platform Admin',
    action:
      'Reviews academic credentials and institutional affiliation documents submitted by the lecturer applicant.',
    produces:
      'Named reviewer with recorded credentials — publicly associated with every future review decision',
  },
  {
    step: '02',
    actor: 'Student',
    action:
      'Submits three process documents and a code or repository link. Submission is one-way and cannot be undone.',
    produces:
      'SHA-256 hash of document content recorded in audit log with timestamp — integrity anchored at submission',
  },
  {
    step: '03',
    actor: 'Peer Student',
    action:
      'Scores the submission on four dimensions (1–5) and writes commentary for each. Score is locked before the submission advances to the lecturer queue.',
    produces:
      'Peer score and commentary — locked; cannot be changed after the lecturer receives the submission',
  },
  {
    step: '04',
    actor: 'Verified Lecturer',
    action:
      'Reviews all three documents, the code, and the peer score independently. Issues a decision with substantive commentary for each of the four dimensions.',
    produces:
      'VERIFIED / REVISION_REQUIRED / DENIED — named reviewer publicly associated with the decision',
  },
];

function StepBox({ step, actor, action, produces }: ChainStep): React.ReactElement {
  return (
    <div className="border border-zinc-800/50 rounded-sm bg-surface-primary overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center gap-3">
        <span className="font-mono text-t6 text-text-disabled tabular-nums shrink-0">{step}</span>
        <span className="font-body text-t5 font-medium text-text-primary">{actor}</span>
      </div>
      <div className="px-4 py-3">
        <p className="font-body text-t5 text-text-secondary leading-relaxed mb-3">{action}</p>
        <div className="bg-accent-green/10 border border-accent-green/20 rounded-sm px-3 py-2">
          <p className="font-mono text-t6 text-accent-green leading-relaxed">→ {produces}</p>
        </div>
      </div>
    </div>
  );
}

function ChainConnector(): React.ReactElement {
  return (
    <div className="flex justify-center py-0.5">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-px h-3 bg-zinc-700/50" />
        <span className="font-mono text-t6 text-text-disabled">▼</span>
      </div>
    </div>
  );
}

export function TrustChainDiagram(): React.ReactElement {
  return (
    <div className="border border-zinc-800/50 bg-surface-elevated rounded-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/50">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
          Trust architecture
        </p>
        <p className="font-heading text-t3 font-semibold text-text-primary">
          How trust is built and transferred on UmojaHub
        </p>
        <p className="font-body text-t5 text-text-secondary mt-2">
          Nothing on the platform is self-asserted. Each trust signal requires an independent actor
          to produce it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/50">
        <div className="p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-5">
            Food Security Hub — Trust Score
          </p>
          {foodSecurityChain.map((s, i) => (
            <React.Fragment key={s.step}>
              <StepBox {...s} />
              {i < foodSecurityChain.length - 1 && <ChainConnector />}
            </React.Fragment>
          ))}
          <div className="mt-3 border border-zinc-800/50 rounded-sm px-4 py-3 bg-surface-primary">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
              What a buyer can conclude
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              The Trust Tier on every listing is backed by verified identity, real transaction
              history, buyer-issued ratings, and platform-tracked fulfilment ratio. Nothing in the
              score is self-reported by the farmer.
            </p>
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-5">
            Education Hub — Portfolio Verification
          </p>
          {educationChain.map((s, i) => (
            <React.Fragment key={s.step}>
              <StepBox {...s} />
              {i < educationChain.length - 1 && <ChainConnector />}
            </React.Fragment>
          ))}
          <div className="mt-3 border border-zinc-800/50 rounded-sm px-4 py-3 bg-surface-primary">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
              What an employer can conclude
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              The portfolio entry names the reviewer and their institution — independently
              searchable. The document hash confirms nothing was changed after the reviewer read it.
              The peer scores show four independent dimensions, locked before the lecturer's
              assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/50 px-5 py-4 bg-surface-primary">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
          Shared principle
        </p>
        <p className="font-body text-t4 text-text-secondary leading-relaxed">
          In both hubs, the trust signal is constructed from actions by independent parties — not
          claimed by the actor whose trustworthiness is at stake. A farmer cannot improve their
          Trust Score by asserting reliability; only buyers can, through ratings. A student cannot
          verify their own portfolio; only a named, credentials-confirmed lecturer can.
        </p>
      </div>
    </div>
  );
}
