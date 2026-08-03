'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, ChoiceCard, ChoiceCardGroup } from '@/components/app';
import { Role } from '@/types';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';
import { ROLE_OPTIONS } from '../_components/roleOptions';

// SCR-ONB-001 — role cards (Stage 1). ADMIN is never self-selectable.
// Provider↔role is enforced server-side (GitHub = STUDENT only); a mismatch
// returns 403 and is surfaced inline since the JWT does not carry the provider.

export default function RoleSelectionPage(): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = useState<Role | ''>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!role) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not save your selection.');
        return;
      }
      await update();
      router.push('/onboarding/identity-input');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingShell step={2} title="How will you use UmojaHub?" subtitle="Choose the role that fits you. This shapes the rest of your setup.">
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset>
          <legend className="sr-only">Select your role</legend>
          <ChoiceCardGroup label="Select your role">
            {ROLE_OPTIONS.map(({ value, label, description, icon }) => (
              <ChoiceCard
                key={value}
                title={label}
                description={description}
                icon={icon}
                selected={role === value}
                onSelect={() => setRole(value)}
              />
            ))}
          </ChoiceCardGroup>
        </fieldset>

        <Button type="submit" size="lg" isLoading={isLoading} disabled={!role} className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
