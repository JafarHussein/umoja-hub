'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ChoiceCard, Input } from '@/components/app';
import { Role } from '@/types';
import { usernameSchema, passwordSchema } from '@/lib/validation/onboardingSchema';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

const STEPS = ['Details', 'Connect'];

// SCR-ONB-V2-002 — details step (AUTH_ONBOARDING_FLOW_V2). Pre-auth: collects
// role + username + password and creates the signed OnboardingDraft via
// POST /api/onboarding/draft, then advances to the connect step. ADMIN is never
// offered (security invariant #1); Student connects with GitHub, the rest Google
// (gating happens on the connect step from the draft role).
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

export default function DetailsPage(): React.ReactElement {
  const router = useRouter();
  const [role, setRole] = useState<Role | ''>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cheap server-side uniqueness probe on blur (User + live drafts).
  async function checkUsername(): Promise<void> {
    const value = username.trim().toLowerCase();
    const parsed = usernameSchema.safeParse(value);
    if (!parsed.success) {
      setUsernameError(parsed.error.issues[0]?.message ?? 'Invalid username');
      return;
    }
    setUsernameError('');
    try {
      const res = await fetch(`/api/onboarding/username-available?u=${encodeURIComponent(value)}`);
      const json: unknown = await res.json();
      const available = (json as { data?: { available?: boolean } }).data?.available;
      if (available === false) setUsernameError('That username is taken.');
    } catch {
      // Network hiccup — leave the final check to the submit, which is authoritative.
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!role) return;

    const u = usernameSchema.safeParse(username);
    const p = passwordSchema.safeParse(password);
    setUsernameError(u.success ? '' : (u.error.issues[0]?.message ?? 'Invalid username'));
    setPasswordError(p.success ? '' : (p.error.issues[0]?.message ?? 'Invalid password'));
    if (!u.success || !p.success) return;

    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.data, password, role }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const code = (data as { code?: string }).code;
        if (code === 'USERNAME_TAKEN') {
          setUsernameError('That username is taken.');
        } else {
          setError((data as { error?: string }).error ?? 'Could not save your details.');
        }
        return;
      }
      router.push('/onboarding/connect');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      steps={STEPS}
      title="Your details"
      subtitle="Choose your role and set the username and password you'll sign in with."
    >
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="app-label mb-2 text-app-body">How will you use UmojaHub?</legend>
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

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => void checkUsername()}
          error={usernameError || undefined}
          hint="3–20 characters: lowercase letters, numbers, and underscores."
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
          hint="At least 8 characters, including a letter and a number."
          autoComplete="new-password"
        />

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          disabled={!role}
          className="mt-1 w-full"
        >
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
