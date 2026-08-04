'use client';

import React from 'react';
import Link from 'next/link';
import { Alert, SessionMenu } from '@/components/app';

// AUTH_ONBOARDING_FLOW_V3 funnel. Verification is role-specific, so it is not
// in the shared rail — the verification screen supplies its own longer list.
const DEFAULT_STEPS = ['Password', 'Role', 'Details'];

export interface IOnboardingShellProps {
  step: number;
  /** Step labels for the progress rail. Defaults to the legacy funnel labels. */
  steps?: string[];
  title: string;
  subtitle?: string;
  /**
   * A short note on the rail answering the question this step tends to raise —
   * why we are asking, or what happens to what you hand over. It replaced a
   * decorative illustration: at the moment someone is deciding whether to give
   * a platform their ID, an answer is worth more than a picture.
   */
  note?: { title: string; body: string };
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
  note,
  children,
}: IOnboardingShellProps): React.ReactElement {
  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand rail — desktop only. Wordmark, vertical step progress, and a
          note answering whatever this step tends to make people hesitate over. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-app-hairline bg-app-brand-surface px-12 py-14 lg:flex xl:px-16">
        <div className="max-w-sm">
          <div className="flex items-center gap-1">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>
          <h2 className="app-h1 mt-10 text-balance text-app-ink">
            Set up your verified account
          </h2>
          <p className="app-body mt-3 text-app-muted">
            A few quick steps. We tailor the rest of the platform to how you will use it.
          </p>
        </div>

        <div className="max-w-sm">
          <ol className="space-y-5" aria-label="Onboarding progress">
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

          {note && (
            <div className="mt-10 border-t border-app-brand-border pt-6">
              <p className="app-body-strong text-app-ink">{note.title}</p>
              <p className="app-meta mt-2 text-pretty text-app-muted">{note.body}</p>
            </div>
          )}
        </div>

        <p className="app-meta text-app-muted">
          Verified identities · Honest delivery history · Recourse on every order
        </p>
      </aside>

      {/* Content panel — centered step card, under a bar that always offers a
          way out. The funnel used to have neither: the middleware holds an
          unfinished account inside these screens, and with no account control
          here, a user who could not produce a document could not reach a
          dashboard, could not finish, and could not sign out. Both exits below
          are deliberate — one leaves the session, one leaves the funnel. */}
      <main className="flex min-h-screen flex-col px-6 py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <Link
            href="/marketplace"
            className="app-meta text-app-muted transition-colors duration-150 hover:text-app-ink"
          >
            ← Look around first
          </Link>
          <SessionMenu identityOnly className="-mr-2" />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
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

          <div className="rounded-app-card border border-app-hairline bg-app-card p-7 sm:p-9">
            <h1 className="app-h1 text-balance text-app-ink">{title}</h1>
            {subtitle && <p className="app-body mt-2 text-pretty text-app-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
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
