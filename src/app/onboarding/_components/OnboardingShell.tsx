'use client';

import React from 'react';
import { Alert } from '@/components/app';

const STEPS = ['Role', 'Identity', 'Verification'];

export interface IOnboardingShellProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Shared chrome for the onboarding funnel (SCR-ONB-001…005). Carries the
// `.theme-app` scope for the whole surface (Phase 6 migration) and renders
// against the app token group + type ramp. Light mode (warm canvas).
export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
}: IOnboardingShellProps): React.ReactElement {
  return (
    <div className="theme-app flex min-h-screen items-center justify-center bg-app-canvas px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-1">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">Hub</span>
        </div>

        <ol className="mb-6 flex items-center gap-2" aria-label="Onboarding progress">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = n === step;
            const done = n < step;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={[
                    'app-meta flex h-6 w-6 items-center justify-center rounded-app-pill border',
                    done
                      ? 'border-app-brand bg-app-brand-surface text-app-brand'
                      : active
                        ? 'border-app-brand text-app-brand'
                        : 'border-app-hairline text-app-faint',
                  ].join(' ')}
                >
                  {done ? '✓' : n}
                </span>
                <span className={['app-meta', active ? 'text-app-ink' : 'text-app-faint'].join(' ')}>
                  {label}
                </span>
                {n < STEPS.length && <span className="text-app-faint">›</span>}
              </li>
            );
          })}
        </ol>

        <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
          <h1 className="app-h1 mb-1 text-app-ink">{title}</h1>
          {subtitle && <p className="app-body mb-6 text-app-muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared inline error — a danger Alert from the app library.
export function OnboardingError({ message }: { message: string }): React.ReactElement {
  return (
    <div className="mb-4">
      <Alert tone="danger">{message}</Alert>
    </div>
  );
}
