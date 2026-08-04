import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/app';

// ---------------------------------------------------------------------------
// VerificationLockout — the wall in front of a restricted action.
//
// This is the surface that carries the whole demand-driven verification model:
// an account can look around freely, and is stopped here, at the point of the
// action that actually needs trust. So it has to do more than refuse — it has
// to say what is blocked, why, and exactly what to do next.
//
// It was still rendering against the retired dark token group (`bg-surface`,
// `text-fg`, `text-t3`) while every screen around it had moved to the app
// tokens, so it appeared as a dark card dropped into a warm light page.
// ---------------------------------------------------------------------------

export type LockoutTone = 'pending' | 'action' | 'rejected';

export interface IVerificationLockoutProps {
  title: string;
  message: string;
  /** pending = under review, action = submit/resubmit, rejected = not approved. */
  tone?: LockoutTone;
  cta?: { label: string; href: string };
}

const TONE: Record<LockoutTone, { border: string; icon: string }> = {
  pending: { border: 'border-app-warning', icon: 'text-app-warning' },
  action: { border: 'border-app-hairline', icon: 'text-app-muted' },
  rejected: { border: 'border-app-danger', icon: 'text-app-danger' },
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
          'mx-auto w-full max-w-app-prose rounded-app-card border bg-app-card p-8 text-center',
          toneClasses.border,
        ].join(' ')}
        role="status"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-sunken">
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

        <p className="app-label mb-2 text-app-faint">Verification</p>
        <h2 className="app-h2 text-app-ink">{title}</h2>
        <p className="app-body mx-auto mt-2 text-pretty text-app-muted">{message}</p>

        {cta && (
          <div className="mt-6">
            <Link href={cta.href} className={buttonVariants({ variant: 'primary' })}>
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
