'use client';

import React from 'react';

const STEPS = ['Role', 'Identity', 'Verification'];

export interface IOnboardingShellProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Shared chrome for the onboarding funnel (SCR-ONB-001…005). Mirrors the
// auth-page card styling so the funnel reads as one continuous flow.
export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
}: IOnboardingShellProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        <ol className="flex items-center gap-2 mb-6" aria-label="Onboarding progress">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = n === step;
            const done = n < step;
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full font-body text-t6 border',
                    done
                      ? 'bg-accent-green/20 border-accent-green text-accent-green'
                      : active
                        ? 'border-accent-green text-accent-green'
                        : 'border-white/10 text-text-disabled',
                  ].join(' ')}
                >
                  {n}
                </span>
                <span
                  className={[
                    'font-body text-t6',
                    active ? 'text-text-primary' : 'text-text-disabled',
                  ].join(' ')}
                >
                  {label}
                </span>
                {n < STEPS.length && <span className="text-text-disabled">›</span>}
              </li>
            );
          })}
        </ol>

        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">{title}</h1>
          {subtitle && <p className="font-body text-t5 text-text-secondary mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared inline alert — matches the auth pages.
export function OnboardingError({ message }: { message: string }): React.ReactElement {
  return (
    <div
      role="alert"
      className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
    >
      {message}
    </div>
  );
}

export const onboardingSelectClasses = [
  'w-full min-h-[44px] px-3 py-2 rounded-sm font-body text-t5',
  'bg-surface-secondary text-text-primary',
  'border border-white/10',
  'transition-all duration-150',
  'focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ');
