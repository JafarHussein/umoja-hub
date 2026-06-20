import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/app';

// SCR-ONB-V2-001 — onboarding entry (AUTH_ONBOARDING_FLOW_V2). Pre-auth: no
// account or draft exists yet. Sets expectations, then sends the visitor to the
// details step where the OnboardingDraft is created. Mirrors the login two-pane
// brand layout under .theme-app (warm canvas, light mode).
export default function WelcomePage(): React.ReactElement {
  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand panel — desktop only. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-app-hairline bg-app-brand-surface px-12 py-12 lg:flex">
        <div className="flex items-center gap-1">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">Hub</span>
        </div>

        <div className="max-w-md">
          <h2 className="app-display text-app-ink">
            Trade you can verify. Skills you can prove.
          </h2>
          <p className="app-body mt-3 text-app-muted">
            One account for the verified farmer marketplace and the hands-on build track.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/concepts/concept-secure-login.svg"
            alt=""
            aria-hidden="true"
            className="mt-10 h-56 w-auto max-w-full object-contain"
          />
        </div>

        <p className="app-meta text-app-muted">
          Verified identities · Honest delivery history · Recourse on every order
        </p>
      </aside>

      {/* Content panel. */}
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Wordmark shown here on mobile (the brand panel is hidden < lg). */}
          <div className="mb-8 flex items-center gap-1 lg:hidden">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 sm:p-8">
            <h1 className="app-h1 mb-1 text-app-ink">Create your account</h1>
            <p className="app-body text-app-muted">
              Two quick steps. Pick how you&apos;ll use UmojaHub and set a username and
              password, then connect a sign-in provider to finish.
            </p>

            <ol className="mt-6 space-y-3" aria-label="What to expect">
              <li className="flex items-start gap-3">
                <span className="app-meta flex h-7 w-7 shrink-0 items-center justify-center rounded-app-pill border border-app-brand bg-app-brand-surface text-app-brand">
                  1
                </span>
                <span className="app-body text-app-body">
                  Your details — role, username, and password.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="app-meta flex h-7 w-7 shrink-0 items-center justify-center rounded-app-pill border border-app-hairline text-app-faint">
                  2
                </span>
                <span className="app-body text-app-body">
                  Connect Google or GitHub to confirm your email.
                </span>
              </li>
            </ol>

            <Link
              href="/onboarding/details"
              className={`${buttonVariants({ size: 'lg' })} mt-8 w-full`}
            >
              Get started
            </Link>

            <p className="app-meta mt-6 text-app-faint">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-app-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
