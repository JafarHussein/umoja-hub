'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/app';
import { Role } from '@/types';
import { OnboardingShell } from '../_components/OnboardingShell';

const STEPS = ['Details', 'Connect'];

// Provider↔role policy (mirrors providerAllowsRole on the server): Student is a
// developer identity (GitHub); every other role uses Google. The reconcile step
// in the signIn callback re-enforces this from the draft, so the client choice
// is a convenience, not the security boundary.
function providerForRole(role: Role): 'google' | 'github' {
  return role === Role.STUDENT ? 'github' : 'google';
}

export interface IConnectClientProps {
  role: Role;
  username: string;
}

export function ConnectClient({ role, username }: IConnectClientProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const provider = providerForRole(role);
  const providerLabel = provider === 'github' ? 'GitHub' : 'Google';

  function handleConnect(): void {
    setLoading(true);
    // After OAuth, the signIn callback reconciles the draft into a real account
    // and establishes the session. The callback target is an /onboarding route,
    // so the middleware bounces the now-onboarded user to their dashboard.
    void signIn(provider, { callbackUrl: '/onboarding/welcome' });
  }

  return (
    <OnboardingShell
      step={2}
      steps={STEPS}
      title="Connect your sign-in"
      subtitle={`You'll sign in as @${username}. Connect ${providerLabel} to confirm your email and finish setting up your account.`}
    >
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          size="lg"
          isLoading={loading}
          onClick={handleConnect}
          className="w-full"
        >
          Continue with {providerLabel}
        </Button>

        <p className="app-meta text-app-faint">
          {provider === 'github'
            ? 'Students verify their developer identity with GitHub.'
            : 'We use Google only to confirm a verified email address.'}
        </p>
      </div>
    </OnboardingShell>
  );
}
