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

// What signing up involves, said before it is asked. Someone weighing whether
// to start should be able to see the whole shape of it from here.
const SIGNUP_STEPS: { term: string; detail: string }[] = [
  {
    term: 'Sign in with an account you already have',
    detail: 'Google or GitHub — no new password to invent or remember.',
  },
  {
    term: 'Tell us what you do',
    detail:
      'Farmer, buyer, student or lecturer. Your answer decides what the rest of the platform shows you.',
  },
  {
    term: 'Verify who you are',
    detail:
      'An ID document, or a university email if you are a student. A person reviews it, usually within two working days.',
  },
];

export default function WelcomePage(): React.ReactElement {
  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand panel — desktop only. The space beneath the promise sets out
          what signing up actually involves, so nobody has to start the funnel
          to find out how long it is or what will be asked of them. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-app-hairline bg-app-brand-surface px-12 py-14 lg:flex xl:px-16">
        <div className="flex items-center gap-1">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">Hub</span>
        </div>

        <div className="max-w-md">
          <h2 className="app-display text-balance text-app-ink">
            Trade you can verify. Skills you can prove.
          </h2>
          <p className="app-body mt-4 text-app-muted">
            One account for the verified farmer marketplace and the hands-on build track.
          </p>

          <ol className="mt-12 divide-y divide-app-brand-border border-t border-app-brand-border">
            {SIGNUP_STEPS.map((item, index) => (
              <li key={item.term} className="flex gap-4 py-5">
                <span className="app-data-m shrink-0 pt-0.5 text-app-brand">{index + 1}</span>
                <span>
                  <span className="app-body-strong block text-app-ink">{item.term}</span>
                  <span className="app-meta mt-1.5 block text-pretty text-app-muted">
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="app-meta text-app-muted">
          Verified identities · Honest delivery history · Recourse on every order
        </p>
      </aside>

      {/* Content panel. */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Wordmark shown here on mobile (the brand panel is hidden < lg). */}
          <div className="mb-8 flex items-center gap-1 lg:hidden">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-7 sm:p-9">
            <h1 className="app-h1 text-app-ink">Create your account</h1>
            <p className="app-body mt-2 text-app-muted">
              Start with the account you already have. We&apos;ll ask what you do next.
            </p>

            <div className="mt-8">
              <WelcomeClient />
            </div>

            <p className="app-meta mt-5 text-app-faint">
              Students sign up with GitHub. Farmers, buyers and lecturers use Google.
            </p>

            <p className="app-body mt-8 border-t border-app-hairline pt-6 text-app-muted">
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
