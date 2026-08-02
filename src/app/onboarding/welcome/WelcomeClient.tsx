'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ProviderButton } from '@/components/app';

// The sign-up entry (AUTH_ONBOARDING_FLOW_V3). This screen used to be an
// interstitial that explained the upcoming steps and then made the visitor click
// "Get started" to reach a form. It now *is* the first step: the two provider
// buttons are the whole interaction.
//
// After OAuth the callback creates the account and the middleware routes to
// /onboarding/password from the stage on the token, so no callbackUrl needs to
// encode the next screen.
const POST_OAUTH = '/onboarding/welcome';

export function WelcomeClient(): React.ReactElement {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  function connect(provider: 'google' | 'github'): void {
    setLoading(provider);
    void signIn(provider, { callbackUrl: POST_OAUTH });
  }

  return (
    <div className="flex flex-col gap-3">
      <ProviderButton
        provider="google"
        isLoading={loading === 'google'}
        disabled={loading !== null}
        onClick={() => connect('google')}
        className="w-full"
      />
      <ProviderButton
        provider="github"
        isLoading={loading === 'github'}
        disabled={loading !== null}
        onClick={() => connect('github')}
        className="w-full"
      />
    </div>
  );
}
