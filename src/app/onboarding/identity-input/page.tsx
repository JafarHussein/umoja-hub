'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input, Select, Button, ChipGroup, TokenSelect } from '@/components/app';
import { Role, KENYAN_COUNTIES, ListingCategory } from '@/types';
import { GRADUATION_YEARS } from '@/lib/validation/onboardingSchema';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

// SCR-ONB-002 — role-conditional identity (Stage 2). Common identity fields plus
// the role-specific profile fields. githubUsername is OAuth-sourced and never
// shown here.

// The produce vocabulary is shared: what a farmer grows and what a buyer sources
// are drawn from the same list, so the two sides can be matched on it later.
const PRODUCE_OPTIONS = Object.values(ListingCategory).map((value) => ({
  value,
  label: value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
}));

// Fields are no longer all strings: the multi-selects hold arrays and two
// numeric fields are sent as numbers, because the Zod schema expects them that
// way rather than as coerced strings.
type FieldValue = string | string[] | number | undefined;
type FormState = Record<string, FieldValue>;

export default function IdentityInputPage(): React.ReactElement {
  const router = useRouter();
  const { data: session, update } = useSession();
  const role = session?.user?.role ?? null;

  const [form, setForm] = useState<FormState>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reading a value back out of the widened state. The text inputs need a
  // string and the multi-selects need an array; keeping the narrowing here
  // stops every call site from repeating a cast.
  function text(field: string): string {
    const v = form[field];
    return typeof v === 'string' ? v : '';
  }
  function list(field: string): string[] {
    const v = form[field];
    return Array.isArray(v) ? v : [];
  }
  function toggle(field: string, value: string): void {
    const current = list(field);
    set(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  function set(field: string, value: FieldValue): void {
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
      <OnboardingShell step={3} title="Tell us about you">
        <p className="app-body text-app-muted">
          Loading your details… If this persists, return to{' '}
          <button
            type="button"
            onClick={() => router.push('/onboarding/role-selection')}
            className="text-app-brand hover:opacity-80"
          >
            role selection
          </button>
          .
        </p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={3} title="Tell us about you" subtitle="A few details so we can set up your account.">
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Last name"
          placeholder="Kamau"
          value={text('lastName')}
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
          value={text('phoneNumber')}
          onChange={(e) => set('phoneNumber', e.target.value)}
          error={fieldErrors['phoneNumber']?.[0]}
          autoComplete="tel"
          required
        />

        <Select
          id="county"
          label="County"
          value={text('county')}
          onChange={(e) => set('county', e.target.value)}
          error={fieldErrors['county']?.[0]}
          required
        >
          <option value="">Select your county</option>
          {KENYAN_COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </Select>

        {role === Role.FARMER && (
          <>
            <ChipGroup
              label="What do you grow? (optional)"
              hint="Pick as many as apply. You can change this any time."
              options={PRODUCE_OPTIONS}
              selected={list('cropsGrown')}
              onToggle={(v) => toggle('cropsGrown', v)}
              error={fieldErrors['cropsGrown']?.[0]}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              label="Farm size in acres (optional)"
              placeholder="e.g. 3"
              value={typeof form.farmSizeAcres === 'number' ? String(form.farmSizeAcres) : ''}
              onChange={(e) =>
                set('farmSizeAcres', e.target.value === '' ? undefined : Number(e.target.value))
              }
              error={fieldErrors['farmSizeAcres']?.[0]}
            />
            <Input
              label="Cooperative (optional)"
              hint="Leave blank if you farm independently."
              placeholder="e.g. Kirinyaga Growers Cooperative"
              value={text('cooperativeName')}
              onChange={(e) => set('cooperativeName', e.target.value)}
              error={fieldErrors['cooperativeName']?.[0]}
            />
            <Input
              label="Primary language (optional)"
              placeholder="e.g. Kiswahili"
              value={text('primaryLanguage')}
              onChange={(e) => set('primaryLanguage', e.target.value)}
              error={fieldErrors['primaryLanguage']?.[0]}
            />
          </>
        )}

        {role === Role.BUYER && (
          <>
            <Input
              label="Organisation name"
              placeholder="Mavuno Foods Ltd"
              value={text('organizationName')}
              onChange={(e) => set('organizationName', e.target.value)}
              error={fieldErrors['organizationName']?.[0]}
              required
            />
            <Input
              label="Business registration number"
              placeholder="PVT-XXXXXX"
              value={text('businessRegistrationNumber')}
              onChange={(e) => set('businessRegistrationNumber', e.target.value)}
              error={fieldErrors['businessRegistrationNumber']?.[0]}
              required
            />
            <Input
              label="Corporate paybill (optional)"
              placeholder="e.g. 400200"
              value={text('corporatePaybill')}
              onChange={(e) => set('corporatePaybill', e.target.value)}
              error={fieldErrors['corporatePaybill']?.[0]}
            />
            <Input
              label="Procurement scale (optional)"
              placeholder="e.g. 5–10 tonnes / month"
              value={text('procurementScale')}
              onChange={(e) => set('procurementScale', e.target.value)}
              error={fieldErrors['procurementScale']?.[0]}
            />
            <ChipGroup
              label="What do you buy? (optional)"
              hint="We put these first in your marketplace. You can still order anything."
              options={PRODUCE_OPTIONS}
              selected={list('purchaseInterests')}
              onToggle={(v) => toggle('purchaseInterests', v)}
              error={fieldErrors['purchaseInterests']?.[0]}
            />
            <TokenSelect
              id="preferredCounties"
              label="Counties you prefer to source from (optional)"
              hint="Add as many as you like — this ranks results, it does not limit them."
              placeholder="Add a county"
              options={KENYAN_COUNTIES}
              selected={list('preferredCounties')}
              onChange={(next) => set('preferredCounties', next)}
              error={fieldErrors['preferredCounties']?.[0]}
            />
          </>
        )}

        {role === Role.STUDENT && (
          <>
            <Input
              label="University"
              placeholder="University of Nairobi"
              value={text('universityAffiliation')}
              onChange={(e) => set('universityAffiliation', e.target.value)}
              error={fieldErrors['universityAffiliation']?.[0]}
              required
            />
            <Input
              label="Academic registration number"
              placeholder="e.g. SCT221-0001/2024"
              value={text('academicRegistrationNumber')}
              onChange={(e) => set('academicRegistrationNumber', e.target.value)}
              error={fieldErrors['academicRegistrationNumber']?.[0]}
              required
            />
            <Input
              label="Programme"
              placeholder="e.g. BSc Computer Science"
              value={text('programme')}
              onChange={(e) => set('programme', e.target.value)}
              error={fieldErrors['programme']?.[0]}
              required
            />
            <Select
              id="graduationYear"
              label="Expected graduation year"
              value={typeof form.graduationYear === 'number' ? String(form.graduationYear) : ''}
              onChange={(e) =>
                set('graduationYear', e.target.value === '' ? undefined : Number(e.target.value))
              }
              error={fieldErrors['graduationYear']?.[0]}
              required
            >
              <option value="">Select a year</option>
              {GRADUATION_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Input
              label="Primary interest (optional)"
              placeholder="e.g. Backend engineering"
              value={text('primaryInterest')}
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
              value={text('universityAffiliation')}
              onChange={(e) => set('universityAffiliation', e.target.value)}
              error={fieldErrors['universityAffiliation']?.[0]}
              required
            />
            <Input
              label="Department"
              placeholder="Computer Science"
              value={text('departmentAssignment')}
              onChange={(e) => set('departmentAssignment', e.target.value)}
              error={fieldErrors['departmentAssignment']?.[0]}
              required
            />
            <Input
              label="Position"
              hint="Your academic title, as your institution writes it."
              placeholder="e.g. Senior Lecturer"
              value={text('position')}
              onChange={(e) => set('position', e.target.value)}
              error={fieldErrors['position']?.[0]}
              required
            />
            <Input
              label="Academic staff ID"
              placeholder="STAFF-XXXX"
              value={text('academicStaffId')}
              onChange={(e) => set('academicStaffId', e.target.value)}
              error={fieldErrors['academicStaffId']?.[0]}
              required
            />
          </>
        )}

        <Button type="submit" size="lg" isLoading={isLoading} className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
