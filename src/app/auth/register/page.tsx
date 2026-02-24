'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Role, KENYAN_COUNTIES } from '@/types';
import type { KenyanCounty } from '@/types';

// ---------------------------------------------------------------------------
// Role options visible to self-registering users (ADMIN excluded per spec)
// ---------------------------------------------------------------------------

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

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student/projects/new',
  LECTURER: '/dashboard/lecturer/reviews/pending',
  ADMIN: '/dashboard/admin/verification-queue',
};

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------

interface IRegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: Role | '';
  county: KenyanCounty | '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegisterPage(): React.ReactElement {
  const router = useRouter();

  const [form, setForm] = useState<IRegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: '',
    county: '',
  });

  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  function set<K extends keyof IRegisterForm>(field: K, value: IRegisterForm[K]): void {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the field error when the user starts correcting it
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const body = data as { error?: string; code?: string; details?: { fieldErrors?: Record<string, string[]> } };

        if (body.details?.fieldErrors) {
          setFieldErrors(body.details.fieldErrors);
        } else {
          setApiError(body.error ?? 'Registration failed. Please try again.');
        }
        return;
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!result?.ok) {
        // Registration succeeded but auto-login failed — send to login page
        router.push('/auth/login');
        return;
      }

      const destination = form.role ? (DASHBOARD_BY_ROLE[form.role] ?? '/dashboard') : '/dashboard';
      router.push(destination);
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.phoneNumber.trim() &&
    form.role &&
    form.county;

  const selectClasses = [
    'w-full min-h-[44px] px-3 py-2 rounded-sm font-body text-t5',
    'bg-surface-secondary text-text-primary',
    'border border-white/10',
    'transition-all duration-150',
    'focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        {/* Card */}
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">
            Create your account
          </h1>
          <p className="font-body text-t5 text-text-secondary mb-6">
            Join Kenya&apos;s food security and education platform.
          </p>

          {apiError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Role selector */}
            <fieldset>
              <legend className="font-body text-t6 text-text-secondary mb-2">
                I am joining as
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('role', value)}
                    aria-pressed={form.role === value}
                    className={[
                      'min-h-[64px] px-3 py-2 rounded-sm text-left border transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                      form.role === value
                        ? 'border-accent-green bg-accent-green/10 text-text-primary'
                        : 'border-white/10 bg-surface-secondary text-text-secondary hover:border-white/20 hover:text-text-primary',
                    ].join(' ')}
                  >
                    <span className="block font-body font-medium text-t5">{label}</span>
                    <span className="block font-body text-t6 text-text-disabled mt-0.5 leading-tight">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
              {fieldErrors['role'] && (
                <p role="alert" className="mt-1 font-body text-t6 text-red-400">
                  {fieldErrors['role']?.[0]}
                </p>
              )}
            </fieldset>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                label="First name"
                placeholder="Wanjiku"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                error={fieldErrors['firstName']?.[0]}
                autoComplete="given-name"
                required
              />
              <Input
                type="text"
                label="Last name"
                placeholder="Kamau"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                error={fieldErrors['lastName']?.[0]}
                autoComplete="family-name"
                required
              />
            </div>

            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={fieldErrors['email']?.[0]}
              autoComplete="email"
              required
            />

            <Input
              type="tel"
              label="Phone number"
              placeholder="e.g. 0712 345 678"
              hint="+254 format also accepted"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
              error={fieldErrors['phoneNumber']?.[0]}
              autoComplete="tel"
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={fieldErrors['password']?.[0]}
              autoComplete="new-password"
              required
            />

            {/* County */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="county" className="font-body text-t6 text-text-secondary">
                County
              </label>
              <select
                id="county"
                className={selectClasses}
                value={form.county}
                onChange={(e) => set('county', e.target.value as KenyanCounty)}
                required
                aria-invalid={!!fieldErrors['county']}
              >
                <option value="">Select your county</option>
                {KENYAN_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              {fieldErrors['county'] && (
                <p role="alert" className="font-body text-t6 text-red-400">
                  {fieldErrors['county']?.[0]}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!isFormValid}
              className="w-full mt-2"
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center font-body text-t5 text-text-secondary">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-accent-green hover:opacity-80 transition-all duration-150"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
