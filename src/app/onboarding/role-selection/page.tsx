'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Role } from '@/types';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

// SCR-ONB-001 — role cards (Stage 1). ADMIN is never self-selectable.
// Provider↔role is enforced server-side (GitHub = STUDENT only); a mismatch
// returns 403 and is surfaced inline since the JWT does not carry the provider.
const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: Role.FARMER,
    label: 'Farmer',
    description: 'List produce, manage orders, access price intelligence',
  },
  {
    value: Role.BUYER,
    label: 'Buyer',
    description: 'Browse verified listings, purchase direct from farms',
  },
  {
    value: Role.STUDENT,
    label: 'Student',
    description: 'Build a verified project portfolio through real work',
  },
  {
    value: Role.LECTURER,
    label: 'Lecturer',
    description: 'Review student submissions and mentor project work',
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
            {ROLE_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={[
                  'min-h-[56px] px-3 py-2 rounded-sm text-left border transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  role === value
                    ? 'border-brand bg-brand/10 text-fg'
                    : 'border-white/10 bg-surface-raised text-fg-muted hover:border-white/20 hover:text-fg',
                ].join(' ')}
              >
                <span className="block font-body font-medium text-t5">{label}</span>
                <span className="block font-body text-t6 text-fg-disabled mt-0.5 leading-tight">
                  {description}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={!role} className="w-full mt-2">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
