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
    <div className="theme-app flex min-h-screen items-center justify-center bg-app-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-1">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">Hub</span>
        </div>

        <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
          <div className="mb-5 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/concepts/concept-secure-login.svg"
              alt=""
              aria-hidden="true"
              className="h-24 w-auto max-w-[180px] object-contain"
            />
          </div>
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
    </div>
  );
}
