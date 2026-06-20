'use client';

import React from 'react';
import { Alert } from '@/components/app';

const DEFAULT_STEPS = ['Role', 'Identity', 'Verification'];

export interface IOnboardingShellProps {
  step: number;
  /** Step labels for the progress rail. Defaults to the legacy funnel labels. */
  steps?: string[];
  title: string;
  subtitle?: string;
  /** Optional centered hero illustration (public path), shown above the content. */
  illustration?: string;
  children: React.ReactNode;
}

// Shared chrome for the onboarding funnel (SCR-ONB-001…005). Carries the
// `.theme-app` scope for the whole surface (Phase 6 migration) and renders
// against the app token group + type ramp. Light mode (warm canvas).
export function OnboardingShell({
  step,
  steps = DEFAULT_STEPS,
  title,
  subtitle,
  illustration,
  children,
}: IOnboardingShellProps): React.ReactElement {
  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand rail — desktop only. Wordmark, vertical step progress, and the
          step illustration framed on the brand surface. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-app-hairline bg-app-brand-surface px-12 py-12 lg:flex">
        <div className="max-w-sm">
          <div className="flex items-center gap-1">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>
          <h2 className="app-h1 mt-8 text-app-ink">Set up your verified account</h2>
          <p className="app-body mt-2 text-app-muted">
            Three quick steps. We tailor the rest of the platform to how you will use it.
          </p>
        </div>

        <div className="max-w-sm">
          <ol className="space-y-4" aria-label="Onboarding progress">
            {steps.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    aria-current={active ? 'step' : undefined}
                    className={[
                      'app-meta flex h-7 w-7 shrink-0 items-center justify-center rounded-app-pill border',
                      done
                        ? 'border-app-brand bg-app-brand text-app-on-brand'
                        : active
                          ? 'border-app-brand bg-app-brand-surface text-app-brand'
                          : 'border-app-hairline text-app-faint',
                    ].join(' ')}
                  >
                    {done ? '✓' : n}
                  </span>
                  <span
                    className={[
                      'app-body',
                      active ? 'text-app-ink' : done ? 'text-app-muted' : 'text-app-faint',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {illustration && (
            <div className="mt-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={illustration}
                alt=""
                aria-hidden="true"
                className="h-48 w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>

        <p className="app-meta text-app-muted">A few steps to set up your verified account.</p>
      </aside>

      {/* Content panel — centered step card on every breakpoint. */}
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Mobile-only wordmark + compact horizontal stepper (rail is hidden < lg). */}
          <div className="lg:hidden">
            <div className="mb-6 flex items-center gap-1">
              <span className="app-h2 text-app-ink">Umoja</span>
              <span className="app-h2 text-app-brand">Hub</span>
            </div>
            <ol className="mb-6 flex items-center gap-2" aria-label="Onboarding progress">
              {steps.map((label, i) => {
                const n = i + 1;
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
                    <span
                      className={['app-meta', active ? 'text-app-ink' : 'text-app-faint'].join(' ')}
                    >
                      {label}
                    </span>
                    {n < steps.length && <span className="text-app-faint">›</span>}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 sm:p-8">
            <h1 className="app-h1 mb-1 text-app-ink">{title}</h1>
            {subtitle && <p className="app-body text-app-muted">{subtitle}</p>}
            <div className={subtitle ? 'mt-6' : ''}>{children}</div>
          </div>
        </div>
      </main>
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
