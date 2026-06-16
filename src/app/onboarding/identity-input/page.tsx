'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Role, KENYAN_COUNTIES } from '@/types';
import { OnboardingShell, OnboardingError, onboardingSelectClasses } from '../_components/OnboardingShell';

// SCR-ONB-002 — role-conditional identity (Stage 2). Common identity fields plus
// the role-specific profile fields. githubUsername is OAuth-sourced and never
// shown here.

type FormState = Record<string, string>;

export default function IdentityInputPage(): React.ReactElement {
  const router = useRouter();
  const { data: session, update } = useSession();
  const role = session?.user?.role ?? null;

  const [form, setForm] = useState<FormState>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function set(field: string, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setError('');
    setFieldErrors({});
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
        if (body.details?.fieldErrors) setFieldErrors(body.details.fieldErrors);
        else setError(body.error ?? 'Could not save your details.');
        return;
      }
      await update();
      router.push('/onboarding/verification-upload');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // The middleware funnels users here only with a role set; guard defensively.
  if (role === null) {
    return (
      <OnboardingShell step={2} title="Tell us about you">
        <p className="font-body text-t5 text-fg-muted">
          Loading your details… If this persists, return to{' '}
          <button
            type="button"
            onClick={() => router.push('/onboarding/role-selection')}
            className="text-brand hover:opacity-80"
          >
            role selection
          </button>
          .
        </p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={2} title="Tell us about you" subtitle="A few details so we can set up your account.">
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Last name"
          placeholder="Kamau"
          value={form.lastName ?? ''}
          onChange={(e) => set('lastName', e.target.value)}
          error={fieldErrors['lastName']?.[0]}
          autoComplete="family-name"
          required
        />

        <Input
          type="tel"
          label="Phone number"
          placeholder="e.g. 0712 345 678"
          hint="+254 format also accepted"
          value={form.phoneNumber ?? ''}
          onChange={(e) => set('phoneNumber', e.target.value)}
          error={fieldErrors['phoneNumber']?.[0]}
          autoComplete="tel"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="county" className="font-body text-t6 text-fg-muted">
            County
          </label>
          <select
            id="county"
            className={onboardingSelectClasses}
            value={form.county ?? ''}
            onChange={(e) => set('county', e.target.value)}
            required
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

        {role === Role.FARMER && (
          <Input
            label="Primary language (optional)"
            placeholder="e.g. Kiswahili"
            value={form.primaryLanguage ?? ''}
            onChange={(e) => set('primaryLanguage', e.target.value)}
            error={fieldErrors['primaryLanguage']?.[0]}
          />
        )}

        {role === Role.BUYER && (
          <>
            <Input
              label="Organisation name"
              placeholder="Mavuno Foods Ltd"
              value={form.organizationName ?? ''}
              onChange={(e) => set('organizationName', e.target.value)}
              error={fieldErrors['organizationName']?.[0]}
              required
            />
            <Input
              label="Business registration number"
              placeholder="PVT-XXXXXX"
              value={form.businessRegistrationNumber ?? ''}
              onChange={(e) => set('businessRegistrationNumber', e.target.value)}
              error={fieldErrors['businessRegistrationNumber']?.[0]}
              required
            />
            <Input
              label="Corporate paybill (optional)"
              placeholder="e.g. 400200"
              value={form.corporatePaybill ?? ''}
              onChange={(e) => set('corporatePaybill', e.target.value)}
              error={fieldErrors['corporatePaybill']?.[0]}
            />
            <Input
              label="Procurement scale (optional)"
              placeholder="e.g. 5–10 tonnes / month"
              value={form.procurementScale ?? ''}
              onChange={(e) => set('procurementScale', e.target.value)}
              error={fieldErrors['procurementScale']?.[0]}
            />
          </>
        )}

        {role === Role.STUDENT && (
          <>
            <Input
              label="University"
              placeholder="University of Nairobi"
              value={form.universityAffiliation ?? ''}
              onChange={(e) => set('universityAffiliation', e.target.value)}
              error={fieldErrors['universityAffiliation']?.[0]}
              required
            />
            <Input
              label="Academic registration number"
              placeholder="e.g. SCT221-0001/2024"
              value={form.academicRegistrationNumber ?? ''}
              onChange={(e) => set('academicRegistrationNumber', e.target.value)}
              error={fieldErrors['academicRegistrationNumber']?.[0]}
              required
            />
            <Input
              label="Primary interest (optional)"
              placeholder="e.g. Backend engineering"
              value={form.primaryInterest ?? ''}
              onChange={(e) => set('primaryInterest', e.target.value)}
              error={fieldErrors['primaryInterest']?.[0]}
            />
          </>
        )}

        {role === Role.LECTURER && (
          <>
            <Input
              label="University"
              placeholder="JKUAT"
              value={form.universityAffiliation ?? ''}
              onChange={(e) => set('universityAffiliation', e.target.value)}
              error={fieldErrors['universityAffiliation']?.[0]}
              required
            />
            <Input
              label="Department"
              placeholder="Computer Science"
              value={form.departmentAssignment ?? ''}
              onChange={(e) => set('departmentAssignment', e.target.value)}
              error={fieldErrors['departmentAssignment']?.[0]}
              required
            />
            <Input
              label="Academic staff ID"
              placeholder="STAFF-XXXX"
              value={form.academicStaffId ?? ''}
              onChange={(e) => set('academicStaffId', e.target.value)}
              error={fieldErrors['academicStaffId']?.[0]}
              required
            />
          </>
        )}

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
