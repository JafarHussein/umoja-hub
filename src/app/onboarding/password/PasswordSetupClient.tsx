'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Input, GoogleIcon, GitHubIcon } from '@/components/app';
import { usernameSchema, passwordSchema } from '@/lib/validation/onboardingSchema';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

export interface IPasswordSetupClientProps {
  initialUsername: string;
  fullName: string;
  email: string;
  photoUrl: string;
  provider: 'google' | 'github';
}

export function PasswordSetupClient({
  initialUsername,
  fullName,
  email,
  photoUrl,
  provider,
}: IPasswordSetupClientProps): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ProviderMark = provider === 'google' ? GoogleIcon : GitHubIcon;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate everything in one pass so the user sees every problem at once
    // rather than fixing them one submit at a time.
    const u = usernameSchema.safeParse(username.trim().toLowerCase());
    const p = passwordSchema.safeParse(password);
    const mismatch = password !== confirm;
    setUsernameError(u.success ? '' : (u.error.issues[0]?.message ?? 'Invalid username'));
    setPasswordError(p.success ? '' : (p.error.issues[0]?.message ?? 'Invalid password'));
    setConfirmError(mismatch ? 'Both passwords must match' : '');
    if (!u.success || !p.success || mismatch) return;

    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.data, password, confirmPassword: confirm }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        if ((data as { code?: string }).code === 'USERNAME_TAKEN') {
          setUsernameError('That username is taken.');
        } else {
          setError((data as { error?: string }).error ?? 'Could not save your password.');
        }
        return;
      }
      // Refresh the JWT so the middleware sees the new stage before we navigate.
      await update();
      router.push('/onboarding/role-selection');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      title="Set a password"
      subtitle="You're signed in. Add a password so you can also get in without your provider — useful when the network is poor."
    >
      {error && <OnboardingError message={error} />}

      {/* Identity confirmation. This is the "we already know you" moment: it
          shows what the provider gave us instead of asking for it again. */}
      <div className="mb-6 flex items-center gap-3 rounded-app-card border border-app-hairline bg-app-sunken p-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0 rounded-app-pill object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="app-title flex size-10 shrink-0 items-center justify-center rounded-app-pill bg-app-brand-surface text-app-brand"
          >
            {(fullName || email).charAt(0).toUpperCase()}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          {fullName && <span className="app-body-strong truncate text-app-ink">{fullName}</span>}
          <span className="app-meta truncate text-app-muted">{email}</span>
        </span>
        <span
          className="ml-auto flex shrink-0 items-center gap-1.5 text-app-muted"
          title={`Verified with ${provider === 'google' ? 'Google' : 'GitHub'}`}
        >
          <ProviderMark className="size-4" />
          <span className="app-meta hidden sm:inline">Verified</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={usernameError || undefined}
          hint="We picked this from your account — change it if you'd like."
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError || undefined}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter, and a number."
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError || undefined}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" isLoading={isLoading} className="mt-1 w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
