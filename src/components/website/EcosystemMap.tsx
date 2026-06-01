import React from 'react';

interface ActorProps {
  label: string;
  sub?: string;
}

interface EdgeProps {
  from: ActorProps;
  rel: string;
  to: ActorProps;
}

function Actor({ label, sub }: ActorProps): React.ReactElement {
  return (
    <div className="border border-zinc-800/50 bg-surface-elevated rounded-sm px-2.5 py-2 shrink-0">
      <p className="font-body text-t5 text-text-primary leading-tight">{label}</p>
      {sub && (
        <p className="font-mono text-t6 text-text-disabled mt-0.5 leading-tight">{sub}</p>
      )}
    </div>
  );
}

function Edge({ from, rel, to }: EdgeProps): React.ReactElement {
  return (
    <div className="flex items-center gap-0">
      <Actor {...from} />
      <div className="flex flex-col items-center flex-1 min-w-[56px] px-1.5">
        <span className="font-mono text-t6 text-text-disabled text-center leading-tight mb-1">
          {rel}
        </span>
        <div className="flex items-center w-full">
          <div className="flex-1 h-px bg-zinc-700/50" />
          <span className="font-mono text-t6 text-text-disabled">▶</span>
        </div>
      </div>
      <Actor {...to} />
    </div>
  );
}

const foodEdges: EdgeProps[] = [
  {
    from: { label: 'Admin' },
    rel: 'verifies',
    to: { label: 'Farmer', sub: 'ID + land docs' },
  },
  {
    from: { label: 'Admin' },
    rel: 'approves listing',
    to: { label: 'Supplier', sub: 'KEBS / PCPB / KEPHIS' },
  },
  {
    from: { label: 'Farmer' },
    rel: 'lists produce on',
    to: { label: 'Marketplace' },
  },
  {
    from: { label: 'Buyer' },
    rel: 'places order via',
    to: { label: 'Marketplace' },
  },
  {
    from: { label: 'Marketplace' },
    rel: 'STK Push via',
    to: { label: 'M-Pesa → Buyer phone' },
  },
  {
    from: { label: 'Platform' },
    rel: 'holds escrow → releases to',
    to: { label: "Farmer's M-Pesa" },
  },
  {
    from: { label: 'Farmer group' },
    rel: 'forms',
    to: { label: 'Cooperative Group' },
  },
  {
    from: { label: 'Cooperative Group' },
    rel: 'bulk orders from',
    to: { label: 'Supplier' },
  },
];

const educationEdges: EdgeProps[] = [
  {
    from: { label: 'Admin' },
    rel: 'verifies credentials',
    to: { label: 'Lecturer' },
  },
  {
    from: { label: 'Institution' },
    rel: 'provides faculty to',
    to: { label: 'Reviewer pool' },
  },
  {
    from: { label: 'Student' },
    rel: 'submits (hash created)',
    to: { label: 'Review Queue' },
  },
  {
    from: { label: 'Peer Student' },
    rel: 'scores 4 dimensions',
    to: { label: 'Lecturer Queue' },
  },
  {
    from: { label: 'Verified Lecturer' },
    rel: 'reviews, issues decision on',
    to: { label: 'Portfolio' },
  },
  {
    from: { label: 'Portfolio' },
    rel: 'read and verified by',
    to: { label: 'Employer' },
  },
  {
    from: { label: 'AI Mentor' },
    rel: 'guides via questions',
    to: { label: 'Student' },
  },
];

const sharedLayer = [
  { label: 'Platform Admin', sub: 'Human review — both hubs' },
  { label: 'Verification', sub: 'Document consistency review' },
  { label: 'Trust Architecture', sub: 'Trust Score + portfolio hash' },
  { label: 'M-Pesa (Daraja)', sub: 'STK Push + payment release' },
  { label: 'SMS Notifications', sub: "Africa's Talking" },
];

export function EcosystemMap(): React.ReactElement {
  return (
    <div className="border border-zinc-800/50 bg-surface-elevated rounded-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/50">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
          Platform overview
        </p>
        <p className="font-heading text-t3 font-semibold text-text-primary">
          Every participant in UmojaHub and their role
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/50">
        <div className="p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-5">
            Food Security Hub
          </p>
          <div className="space-y-4 overflow-x-auto">
            {foodEdges.map((edge, i) => (
              <Edge key={i} {...edge} />
            ))}
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-5">
            Education Hub
          </p>
          <div className="space-y-4 overflow-x-auto">
            {educationEdges.map((edge, i) => (
              <Edge key={i} {...edge} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/50 px-5 py-4 bg-surface-primary">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Shared platform layer
        </p>
        <div className="flex flex-wrap gap-2">
          {sharedLayer.map((item) => (
            <div
              key={item.label}
              className="border border-zinc-800/50 rounded-sm px-3 py-2 bg-surface-elevated"
            >
              <p className="font-body text-t5 text-text-secondary">{item.label}</p>
              <p className="font-mono text-t6 text-text-disabled mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
