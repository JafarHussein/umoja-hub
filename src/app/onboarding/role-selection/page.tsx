'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, ChoiceCard } from '@/components/app';
import { Role } from '@/types';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

// SCR-ONB-001 — role cards (Stage 1). ADMIN is never self-selectable.
// Provider↔role is enforced server-side (GitHub = STUDENT only); a mismatch
// returns 403 and is surfaced inline since the JWT does not carry the provider.
const ROLE_OPTIONS: { value: Role; label: string; description: string; illustration: string }[] = [
  {
    value: Role.FARMER,
    label: 'Farmer',
    description: 'List produce, manage orders, access price intelligence',
    illustration: '/illustrations/characters/char-farmer.svg',
  },
  {
    value: Role.BUYER,
    label: 'Buyer',
    description: 'Browse verified listings, purchase direct from farms',
    illustration: '/illustrations/characters/char-buyer.svg',
  },
  {
    value: Role.STUDENT,
    label: 'Student',
    description: 'Build a verified project portfolio through real work',
    illustration: '/illustrations/characters/char-student.svg',
  },
  {
    value: Role.LECTURER,
    label: 'Lecturer',
    description: 'Review student submissions and mentor project work',
    illustration: '/illustrations/characters/char-lecturer.svg',
  },
];

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
    <OnboardingShell step={1} title="How will you use UmojaHub?" subtitle="Choose the role that fits you. This shapes the rest of your setup.">
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset>
          <legend className="sr-only">Select your role</legend>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_OPTIONS.map(({ value, label, description, illustration }) => (
              <ChoiceCard
                key={value}
                title={label}
                description={description}
                selected={role === value}
                onSelect={() => setRole(value)}
                visual={
                  <span className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-app-control bg-app-sunken">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={illustration}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-contain p-1.5"
                    />
                  </span>
                }
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" isLoading={isLoading} disabled={!role} className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
