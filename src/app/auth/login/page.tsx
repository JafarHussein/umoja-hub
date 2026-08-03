'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Alert, Input, ProviderButton } from '@/components/app';

// Sign-in for existing accounts (AUTH_ONBOARDING_FLOW_V2). New users create an
// account through /onboarding/welcome; OAuth here reconciles an existing account.
// The callback lands on an /onboarding route so the middleware bounces an
// already-onboarded user on to their dashboard. An OAuth sign-in without an
// account (no draft) is redirected back into onboarding by the signIn callback.
const POST_AUTH_CALLBACK = '/onboarding/welcome';

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

// What the platform guarantees, stated on the panel where someone decides
// whether to trust it. Each line is a rule the product actually enforces.
const ASSURANCES: { term: string; detail: string }[] = [
  {
    term: 'Every seller is verified by a person',
    detail:
      'Identity documents are reviewed by an administrator before anyone can list produce for sale.',
  },
  {
    term: 'Money is held, never sent blind',
    detail:
      'A buyer’s payment sits in escrow until they confirm what arrived. Only then is it released to the farmer.',
  },
  {
    term: 'Either side can ask for a review',
    detail:
      'If an order goes wrong, buyer or farmer can escalate it and UmojaHub decides what happens to the funds.',
  },
];

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const urlError = errorCode ? (ERROR_COPY[errorCode] ?? 'Sign-in failed. Please try again.') : '';

  const [loading, setLoading] = useState<'google' | 'github' | 'credentials' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const error = formError || urlError;

  function handleSignIn(provider: 'google' | 'github'): void {
    setLoading(provider);
    void signIn(provider, { callbackUrl: POST_AUTH_CALLBACK });
  }

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!username || !password) return;
    setFormError('');
    setLoading('credentials');
    try {
      const res = await signIn('credentials', { username, password, redirect: false });
      if (!res || res.error) {
        setFormError('Invalid login or password.');
        return;
      }
      // Onboarded account → the middleware routes /onboarding/welcome to the
      // role's dashboard.
      router.push(POST_AUTH_CALLBACK);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="theme-app grid min-h-screen bg-app-canvas lg:grid-cols-2">
      {/* Brand panel — desktop only. The left half carries the wordmark, the
          promise, and the three guarantees that promise rests on. It used to
          hold an illustration; stating what the platform actually does for
          someone about to trust it with money is worth more than a picture. */}
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

      {/* Form panel — centered, full-height on every breakpoint. */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Wordmark shown here on mobile (the brand panel is hidden < lg). */}
          <div className="mb-8 flex items-center gap-1 lg:hidden">
            <span className="app-h2 text-app-ink">Umoja</span>
            <span className="app-h2 text-app-brand">Hub</span>
          </div>

          <div className="rounded-app-card border border-app-hairline bg-app-card p-7 sm:p-9">
            <h1 className="app-h1 text-app-ink">Sign in to UmojaHub</h1>
            <p className="app-body mt-2 text-app-muted">
              Use your username or email and password, or continue with your connected provider.
            </p>

            {error && (
              <div className="mt-6">
                <Alert tone="danger">{error}</Alert>
              </div>
            )}

            <form onSubmit={handleCredentials} className="mt-8 flex flex-col gap-5">
              <Input
                label="Username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                size="lg"
                isLoading={loading === 'credentials'}
                disabled={loading !== null || !username || !password}
                className="w-full"
              >
                Sign in
              </Button>
              <Link
                href="/auth/forgot-password"
                className="app-meta self-start text-app-brand hover:underline"
              >
                Forgot password?
              </Link>
            </form>

            <div className="my-8 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-app-hairline" />
              <span className="app-meta text-app-faint">or</span>
              <span className="h-px flex-1 bg-app-hairline" />
            </div>

            <div className="flex flex-col gap-3">
              <ProviderButton
                provider="google"
                isLoading={loading === 'google'}
                disabled={loading !== null}
                onClick={() => handleSignIn('google')}
                className="w-full"
              />
              <ProviderButton
                provider="github"
                isLoading={loading === 'github'}
                disabled={loading !== null}
                onClick={() => handleSignIn('github')}
                className="w-full"
              />
            </div>

            <p className="app-meta mt-5 text-app-faint">
              Students sign in with GitHub. Farmers, buyers and lecturers use Google.
            </p>

            <p className="app-body mt-8 border-t border-app-hairline pt-6 text-app-muted">
              New to UmojaHub?{' '}
              <Link href="/onboarding/welcome" className="text-app-brand hover:underline">
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
