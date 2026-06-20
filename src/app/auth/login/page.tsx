'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Alert } from '@/components/app';

// OAuth-only sign-in (AUTH-07 hard cutover). Sign-in and sign-up are the same
// action. The callback lands on the onboarding entry; the middleware bounces
// already-onboarded users on to their dashboard.
const POST_AUTH_CALLBACK = '/onboarding/role-selection';

// Maps NextAuth `?error=` codes (set by our signIn callback redirects) to copy.
const ERROR_COPY: Record<string, string> = {
  AccountExists:
    'An account with this email already exists under a different sign-in method. Use that method instead.',
  ProviderRoleMismatch: 'That account is not available with this sign-in method.',
  OAuthEmailUnverified:
    'We could not confirm a verified email from that provider. Verify your email and try again.',
  OAuthAccountNotLinked:
    'This email is already linked to a different sign-in method. Use that method instead.',
};

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const error = errorCode ? (ERROR_COPY[errorCode] ?? 'Sign-in failed. Please try again.') : '';
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  function handleSignIn(provider: 'google' | 'github'): void {
    setLoading(provider);
    void signIn(provider, { callbackUrl: POST_AUTH_CALLBACK });
  }

  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand panel — desktop only. Fills the left half with the wordmark, a
          value statement, and the secure-login illustration. */}
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

      {/* Form panel — centered, full-height on every breakpoint. */}
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Wordmark shown here on mobile (the brand panel is hidden < lg). */}
          <div className="mb-8 flex items-center gap-1 lg:hidden">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 sm:p-8">
            <h1 className="app-h1 mb-1 text-app-ink">Sign in to UmojaHub</h1>
            <p className="app-body mb-6 text-app-muted">
              Continue with Google or GitHub. New here? This creates your account.
            </p>

            {error && (
              <div className="mb-4">
                <Alert tone="danger">{error}</Alert>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                isLoading={loading === 'google'}
                disabled={loading !== null}
                onClick={() => handleSignIn('google')}
                className="w-full"
              >
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                isLoading={loading === 'github'}
                disabled={loading !== null}
                onClick={() => handleSignIn('github')}
                className="w-full"
              >
                Continue with GitHub
              </Button>
            </div>

            <p className="app-meta mt-6 text-app-faint">
              Students sign in with GitHub. Farmers, buyers and lecturers use Google.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
