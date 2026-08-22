'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Input, Alert, ProviderButton } from '@/components/app';
import { registrationSchema, type RegistrationInput } from '@/lib/validation/onboardingSchema';
import { useZodForm, focusFirstInvalid } from '@/hooks/useZodForm';

// The email + password half of account creation. The provider buttons below the
// divider are the same OAuth entry `/onboarding/welcome` offers, so this one
// screen is the whole answer to "create an account" and neither path is a
// second-class citizen.
//
// Validation is `registrationSchema` — the same object the API route parses.
// The client copy is guidance (no round-trip to learn a password is too short);
// the server copy is the boundary, and `setServerErrors` lets it have the last
// word on what a schema cannot know, such as whether an email is still free.

// After the account exists the funnel takes over. `role-selection` is the stage
// the account is created at, and the middleware routes from the token's stage
// anyway — this is a direct push so the transition has no visible bounce.
const POST_REGISTER = '/onboarding/role-selection';

export function RegisterClient(): React.ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useZodForm<RegistrationInput>(registrationSchema, {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  function text(field: keyof RegistrationInput): string {
    const v = form.values[field];
    return typeof v === 'string' ? v : '';
  }

  function set(field: keyof RegistrationInput, value: string): void {
    if (field === 'email') setEmailTaken(false);
    form.setValue(field, value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    // A second submit while the first is in flight would create a second
    // account, or race the first into a duplicate-key 409. The guard is here as
    // well as on the button because a form also submits on Enter.
    if (isLoading) return;

    setError('');
    setEmailTaken(false);

    const checked = form.submit();
    if (!checked.ok) {
      // Land the cursor on the first thing that is wrong, rather than disabling
      // the button and leaving the reason unspoken.
      focusFirstInvalid(formRef.current);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checked.data),
      });
      const payload: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const body = payload as {
          error?: string;
          code?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        if (body.code === 'EMAIL_TAKEN') {
          setEmailTaken(true);
          form.setServerErrors({ email: ['An account with this email already exists.'] });
          focusFirstInvalid(formRef.current);
          return;
        }
        if (body.details?.fieldErrors) {
          form.setServerErrors(body.details.fieldErrors);
          focusFirstInvalid(formRef.current);
          return;
        }
        setError(body.error ?? 'We could not create your account. Please try again.');
        return;
      }

      // Signed in through the ordinary credentials path — the same
      // `authorize()` a returning user goes through, with the same throttle and
      // the same lockout. Registration does not mint its own session.
      const signedIn = await signIn('credentials', {
        username: checked.data.email,
        password: checked.data.password,
        redirect: false,
      });

      if (!signedIn || signedIn.error) {
        // The account exists; only the automatic sign-in failed. Say so plainly
        // and send them somewhere that works, rather than implying the
        // registration itself did not happen.
        setError('Your account was created, but we could not sign you in. Please sign in below.');
        router.push('/auth/login');
        return;
      }

      router.push(POST_REGISTER);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function connect(provider: 'google' | 'github'): void {
    setOauthLoading(provider);
    void signIn(provider, { callbackUrl: '/onboarding/welcome' });
  }

  const busy = isLoading || oauthLoading !== null;

  return (
    <>
      {error && (
        <div className="mt-6">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {emailTaken && (
        <div className="mt-6">
          <Alert tone="info">
            That email is already registered.{' '}
            <Link href="/auth/login" className="text-app-brand underline">
              Sign in instead
            </Link>
            , or use a different address.
          </Alert>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Input
          label="Full name"
          placeholder="Mercy Wairimu"
          value={text('fullName')}
          onChange={(e) => set('fullName', e.target.value)}
          error={form.errorFor('fullName')}
          autoComplete="name"
          autoFocus
          required
        />

        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={text('email')}
          onChange={(e) => set('email', e.target.value)}
          error={form.errorFor('email')}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />

        <Input
          type="password"
          label="Password"
          value={text('password')}
          onChange={(e) => set('password', e.target.value)}
          error={form.errorFor('password')}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter, and a number."
          autoComplete="new-password"
          required
        />

        <Input
          type="password"
          label="Confirm password"
          value={text('confirmPassword')}
          onChange={(e) => set('confirmPassword', e.target.value)}
          error={form.errorFor('confirmPassword')}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          disabled={busy}
          className="mt-1 w-full"
        >
          Create account
        </Button>
      </form>

      <p className="app-meta mt-4 text-app-faint">
        We ask what you do, and for the details your role needs, on the next two screens.
      </p>

      <div className="my-8 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-app-hairline" />
        <span className="app-meta text-app-faint">or</span>
        <span className="h-px flex-1 bg-app-hairline" />
      </div>

      <div className="flex flex-col gap-3">
        <ProviderButton
          provider="google"
          isLoading={oauthLoading === 'google'}
          disabled={busy}
          onClick={() => connect('google')}
          className="w-full"
        />
        <ProviderButton
          provider="github"
          isLoading={oauthLoading === 'github'}
          disabled={busy}
          onClick={() => connect('github')}
          className="w-full"
        />
      </div>

      <p className="app-meta mt-5 text-app-faint">
        Signing up with GitHub creates a student account; Google covers farmers, buyers and
        lecturers. An email and password can be any of the four.
      </p>
    </>
  );
}
