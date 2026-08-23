import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterClient } from './RegisterClient';

// SCR-AUTH-REGISTER — create an account with an email and a password.
//
// Public and pre-auth: `/auth` is on the middleware's exemption list, so this
// route is reachable directly, signed out, with no callback and no session.
//
// The layout is deliberately the same two-pane shell as `/auth/login` and
// `/onboarding/welcome` — same wordmark, same brand panel, same card, same
// tokens under `.theme-app`. Someone moving between sign in and sign up should
// not feel they have changed product.
//
// The brand panel states what the platform guarantees rather than what it
// offers. This is the screen where a person decides whether to hand over an
// email and a password; the three lines below are rules the product actually
// enforces, not marketing.

export const metadata: Metadata = {
  // The root layout applies the `%s · UmojaHub` template — naming the brand
  // here as well renders it twice in the tab.
  title: 'Create your account',
  description:
    'Create a UmojaHub account to trade on the verified farmer marketplace or join the hands-on build track.',
};

const ASSURANCES: { term: string; detail: string }[] = [
  {
    term: 'Your password is never stored',
    detail:
      'Only a bcrypt hash of it is. Nobody at UmojaHub can read your password, including us.',
  },
  {
    term: 'You choose what you are here to do',
    detail:
      'Farmer, buyer, student or lecturer. Nothing is assumed from your email address, and the choice is made on the next screen.',
  },
  {
    term: 'Verification comes later, not now',
    detail:
      'You can look around, learn the platform and set up your profile before anyone asks you for a document.',
  },
];

export default function RegisterPage(): React.ReactElement {
  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand panel — desktop only (mirrors /auth/login). */}
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

          <dl className="mt-12 divide-y divide-app-brand-border border-t border-app-brand-border">
            {ASSURANCES.map((item) => (
              <div key={item.term} className="py-5">
                <dt className="app-body-strong text-app-ink">{item.term}</dt>
                <dd className="app-meta mt-1.5 text-pretty text-app-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="app-meta text-app-muted">
          Built for farmers, buyers, students and lecturers across Kenya.
        </p>
      </aside>

      {/* Form panel. */}
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
              Four fields to get started. We ask for the rest once we know what you do here.
            </p>

            <RegisterClient />

            {/* Never a dead end: the way back to sign-in is on the page, not in
                the browser's history. */}
            <p className="app-body mt-8 border-t border-app-hairline pt-6 text-app-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-app-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="app-meta mt-6 text-center text-app-faint">
            <Link href="/marketplace" className="hover:text-app-muted">
              Or look around the marketplace first
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
