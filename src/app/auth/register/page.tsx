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
// Client-side validators
// ---------------------------------------------------------------------------

function validateFirstName(v: string): string {
  if (!v.trim()) return 'First name is required.';
  if (v.trim().length < 2) return 'First name must be at least 2 characters.';
  return '';
}

function validateLastName(v: string): string {
  if (!v.trim()) return 'Last name is required.';
  if (v.trim().length < 2) return 'Last name must be at least 2 characters.';
  return '';
}

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
  return '';
}

function validatePhone(v: string): string {
  if (!v.trim()) return 'Phone number is required.';
  // Accept 07xxxxxxxx, 01xxxxxxxx, or +2547xxxxxxxx / +2541xxxxxxxx
  const normalised = v.trim().replace(/\s+/g, '');
  if (!/^(\+2547\d{8}|\+2541\d{8}|07\d{8}|01\d{8})$/.test(normalised)) {
    return 'Enter a valid Kenyan number — e.g. 0712 345 678 or +254712345678.';
  }
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Password must include at least one uppercase letter.';
  if (!/[0-9]/.test(v)) return 'Password must include at least one number.';
  return '';
}

function validateRole(v: string): string {
  if (!v) return 'Select how you are joining.';
  return '';
}

function validateCounty(v: string): string {
  if (!v) return 'Select your county.';
  return '';
}

// ---------------------------------------------------------------------------
// Password requirements indicator
// ---------------------------------------------------------------------------

interface IPasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): IPasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { label: 'One number (0–9)', met: /[0-9]/.test(password) },
  ];
}

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

type FieldErrors = Partial<Record<keyof IRegisterForm, string>>;

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

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Track which fields have been blurred (so we don't show errors before user touches a field)
  const [touched, setTouched] = useState<Partial<Record<keyof IRegisterForm, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function set<K extends keyof IRegisterForm>(field: K, value: IRegisterForm[K]): void {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Re-validate live once the field has been touched
    if (touched[field] || submitted) {
      validateField(field, value as string);
    }
  }

  function touch(field: keyof IRegisterForm): void {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function validateField(field: keyof IRegisterForm, value: string): void {
    const validators: Record<keyof IRegisterForm, (v: string) => string> = {
      firstName: validateFirstName,
      lastName: validateLastName,
      email: validateEmail,
      password: validatePassword,
      phoneNumber: validatePhone,
      role: validateRole,
      county: validateCounty,
    };
    const error = validators[field](value);
    setFieldErrors((prev) => ({ ...prev, [field]: error || undefined }));
  }

  function handleBlur(field: keyof IRegisterForm): void {
    touch(field);
    validateField(field, form[field] as string);
  }

  function validateAll(): FieldErrors {
    const errors: FieldErrors = {};
    const err = (f: keyof IRegisterForm, v: string, fn: (s: string) => string) => {
      const e = fn(v);
      if (e) errors[f] = e;
    };
    err('firstName', form.firstName, validateFirstName);
    err('lastName', form.lastName, validateLastName);
    err('email', form.email, validateEmail);
    err('password', form.password, validatePassword);
    err('phoneNumber', form.phoneNumber, validatePhone);
    err('role', form.role, validateRole);
    err('county', form.county, validateCounty);
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitted(true);
    setApiError('');

    const errors = validateAll();
    setFieldErrors(errors);
    // Mark all fields as touched so errors show
    setTouched({ firstName: true, lastName: true, email: true, password: true, phoneNumber: true, role: true, county: true });

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error
      setTimeout(() => {
        const el = document.querySelector('[aria-invalid="true"]');
        if (el) (el as HTMLElement).focus();
      }, 50);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const body = data as {
          error?: string;
          code?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };

        if (body.details?.fieldErrors) {
          // Map server field errors into our FieldErrors shape
          const serverErrors: FieldErrors = {};
          for (const [k, msgs] of Object.entries(body.details.fieldErrors)) {
            const key = k as keyof IRegisterForm;
            if (msgs[0]) serverErrors[key] = msgs[0];
          }
          setFieldErrors(serverErrors);
        } else if (body.code === 'DB_DUPLICATE_EMAIL') {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'An account with this email already exists.',
          }));
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

  const passwordRequirements = getPasswordRequirements(form.password);
  const showPasswordRequirements = (touched.password || submitted) && form.password.length > 0;

  const errorCount = Object.values(fieldErrors).filter(Boolean).length;

  const selectClasses = (hasError: boolean) =>
    [
      'w-full min-h-[44px] px-3 py-2 rounded-sm font-body text-t5',
      'bg-surface-secondary text-text-primary',
      'border transition-all duration-150',
      hasError
        ? 'border-red-700/60 focus:border-red-500 focus:ring-red-500'
        : 'border-white/10 focus:border-accent-green focus:ring-accent-green',
      'focus:outline-none focus:ring-1',
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

          {/* API-level error */}
          {apiError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
            >
              {apiError}
            </div>
          )}

          {/* Summary error when submit attempted with validation failures */}
          {submitted && errorCount > 0 && !apiError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
            >
              {errorCount === 1
                ? 'Please fix the error below before continuing.'
                : `Please fix the ${errorCount} errors below before continuing.`}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Role selector */}
            <fieldset>
              <legend className="font-body text-t6 text-text-secondary mb-2">
                I am joining as <span className="text-red-400">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      set('role', value);
                      touch('role');
                    }}
                    aria-pressed={form.role === value}
                    className={[
                      'min-h-[64px] px-3 py-2 rounded-sm text-left border transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                      form.role === value
                        ? 'border-accent-green bg-accent-green/10 text-text-primary'
                        : fieldErrors.role
                        ? 'border-red-700/60 bg-surface-secondary text-text-secondary hover:border-red-500 hover:text-text-primary'
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
              {fieldErrors.role && (
                <p role="alert" className="mt-1.5 font-body text-t6 text-red-400">
                  {fieldErrors.role}
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
                onBlur={() => handleBlur('firstName')}
                error={fieldErrors.firstName}
                autoComplete="given-name"
              />
              <Input
                type="text"
                label="Last name"
                placeholder="Kamau"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                error={fieldErrors.lastName}
                autoComplete="family-name"
              />
            </div>

            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={fieldErrors.email}
              autoComplete="email"
            />

            <Input
              type="tel"
              label="Phone number"
              placeholder="0712 345 678"
              hint="+254 format also accepted"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
              onBlur={() => handleBlur('phoneNumber')}
              error={fieldErrors.phoneNumber}
              autoComplete="tel"
            />

            {/* Password with requirements */}
            <div className="flex flex-col gap-1.5">
              <Input
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={fieldErrors.password}
                autoComplete="new-password"
              />
              {showPasswordRequirements && (
                <ul className="flex flex-col gap-1 mt-0.5">
                  {passwordRequirements.map(({ label, met }) => (
                    <li key={label} className="flex items-center gap-1.5 font-body text-t6">
                      {met ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                          className="shrink-0"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="#007F4E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                          className="shrink-0"
                        >
                          <circle cx="6" cy="6" r="4" stroke="#484F58" strokeWidth="1.5" />
                        </svg>
                      )}
                      <span className={met ? 'text-accent-green' : 'text-text-disabled'}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* County */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="county" className="font-body text-t6 text-text-secondary">
                County
              </label>
              <select
                id="county"
                className={selectClasses(!!fieldErrors.county)}
                value={form.county}
                onChange={(e) => {
                  set('county', e.target.value as KenyanCounty);
                  touch('county');
                }}
                onBlur={() => handleBlur('county')}
                aria-invalid={!!fieldErrors.county}
                aria-describedby={fieldErrors.county ? 'county-error' : undefined}
              >
                <option value="">Select your county</option>
                {KENYAN_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              {fieldErrors.county && (
                <p id="county-error" role="alert" className="font-body text-t6 text-red-400">
                  {fieldErrors.county}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
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
