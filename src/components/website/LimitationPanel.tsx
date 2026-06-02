import React from 'react';

interface LimitationPanelProps {
  eyebrow: string;
  children: React.ReactNode;
}

export function LimitationPanel({ eyebrow, children }: LimitationPanelProps): React.ReactElement {
  return (
    <div
      className="border-l-[3px] border-ws-status-pending bg-ws-status-pending-tint px-4 py-3"
      role="note"
    >
      <p className="font-geist-mono text-ws-caption text-ws-status-pending uppercase mb-2">
        {eyebrow}
      </p>
      <div className="font-geist text-[15px] leading-[22px] text-ws-text-secondary">{children}</div>
    </div>
  );
}
