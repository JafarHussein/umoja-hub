import React from 'react';
import Link from 'next/link';
import { WelcomeClient } from './WelcomeClient';

// SCR-ONB-V3-000 — sign-up entry (AUTH_ONBOARDING_FLOW_V3).
//
// Pre-auth: no account exists. The only decision on this page is which identity
// provider to use; everything the platform needs about the person is collected
// afterwards, and only once it knows who they are.
//
// Mirrors the login two-pane brand layout under .theme-app (warm canvas).
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
          <h2 className="app-display text-app-ink">Trade you can verify. Skills you can prove.</h2>
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
        <div className="w-full max-w-sm">
          {/* Wordmark shown here on mobile (the brand panel is hidden < lg). */}
          <div className="mb-8 flex items-center gap-1 lg:hidden">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 sm:p-8">
            <h1 className="app-h1 mb-1 text-app-ink">Create your account</h1>
            <p className="app-body mb-6 text-app-muted">
              Start with the account you already have. We&apos;ll ask what you do next.
            </p>

            <WelcomeClient />

            <p className="app-meta mt-6 text-app-faint">
              Students sign up with GitHub. Farmers, buyers and lecturers use Google.
            </p>

            <p className="app-meta mt-6 text-app-muted">
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
