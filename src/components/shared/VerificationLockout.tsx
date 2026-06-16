import React from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// VerificationLockout — the "System Lockout Layer" (UI-03). A presentational
// blocking layer shown in place of a screen's body when the account is not yet
// verified for that surface. Callers map their own verification source to the
// props: farmer screens from GET /api/farmers (farmerData.verificationStatus),
// lecturer screens from the `isVerified` session/JWT claim.
// ---------------------------------------------------------------------------

export type LockoutTone = 'pending' | 'action' | 'rejected';

export interface IVerificationLockoutProps {
  title: string;
  message: string;
  /** pending = amber (under review), action = submit/resubmit, rejected = red. */
  tone?: LockoutTone;
  cta?: { label: string; href: string };
}

const TONE: Record<LockoutTone, { border: string; icon: string }> = {
  pending: { border: 'border-yellow-800/40', icon: 'text-yellow-400' },
  action: { border: 'border-white/10', icon: 'text-fg-muted' },
  rejected: { border: 'border-red-800/40', icon: 'text-red-400' },
};

export function VerificationLockout({
  title,
  message,
  tone = 'action',
  cta,
}: IVerificationLockoutProps): React.ReactElement {
  const toneClasses = TONE[tone];

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className={[
          'w-full max-w-md mx-auto rounded bg-surface border p-8 text-center',
          toneClasses.border,
        ].join(' ')}
        role="status"
      >
        <div className="w-12 h-12 rounded bg-surface-raised border border-white/5 flex items-center justify-center mx-auto mb-5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={toneClasses.icon}
            aria-hidden="true"
          >
            <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-2">
          Verification
        </p>
        <h2 className="text-t3 font-heading font-medium text-fg mb-2">{title}</h2>
        <p className="text-t5 font-body text-fg-muted">{message}</p>

        {cta && (
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center min-h-[44px] mt-6 px-5 rounded-sm bg-brand text-white text-t5 font-body font-medium transition-colors duration-150 hover:bg-brand/90"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}
