'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">
            Sign in to UmojaHub
          </h1>
          <p className="font-body text-t5 text-text-secondary mb-6">
            Continue with Google or GitHub. New here? This creates your account.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="primary"
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
              variant="outline"
              size="lg"
              isLoading={loading === 'github'}
              disabled={loading !== null}
              onClick={() => handleSignIn('github')}
              className="w-full"
            >
              Continue with GitHub
            </Button>
          </div>

          <p className="mt-6 font-body text-t6 text-text-disabled">
            Students sign in with GitHub. Farmers, buyers and lecturers use Google.
          </p>
        </div>
      </div>
    </div>
  );
}
