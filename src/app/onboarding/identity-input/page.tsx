'use client';

import React, { useRef, useState } from 'react';
import type { ZodType } from 'zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Input,
  Select,
  Button,
  ChipGroup,
  TokenSelect,
  ChoiceCard,
  ChoiceCardGroup,
} from '@/components/app';
import { Role, KENYAN_COUNTIES, ListingCategory, BuyerType, BUYER_TYPE_LABEL } from '@/types';
import { GRADUATION_YEARS, identitySchemaForRole } from '@/lib/validation/onboardingSchema';
import { homeForRole } from '@/lib/auth/dashboards';
import { useZodForm, focusFirstInvalid } from '@/hooks/useZodForm';
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

export default function IdentityInputPage(): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? null;
  // Resolved here rather than inside the form so the form can hold a hook that
  // needs it, unconditionally, with no fallback schema to keep in step.
  const schema = identitySchemaForRole(role);

  // Two different states used to share one message. While the session is still
  // resolving there is nothing wrong, so saying "if this persists, go back"
  // hands the user an error and an escape route for a page that is simply
  // loading — and on a slow connection that is the first thing they read.
  if (status === 'loading') {
    return (
      <OnboardingShell step={3} title="Tell us about you">
        <p className="app-body text-app-muted" role="status">
          Loading your details…
        </p>
      </OnboardingShell>
    );
  }

  // Genuinely no role, or a role with no setup step: the middleware should not
  // have allowed this, so offer the way back.
  if (role === null || !schema) {
    return (
      <OnboardingShell step={3} title="Tell us about you">
        <p className="app-body text-app-muted">
          We could not tell which role you chose. Return to{' '}
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

  return <IdentityForm role={role} schema={schema} />;
}

function IdentityForm({ role, schema }: { role: Role; schema: ZodType }): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  // The same schema the API route validates with. It stops being a gate the
  // user discovers by failing and becomes something that answers them here.
  const form = useZodForm(schema, {});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reading a value back out of the widened state. The text inputs need a
  // string and the multi-selects need an array; keeping the narrowing here
  // stops every call site from repeating a cast.
  function text(field: string): string {
    const v = form.values[field];
    return typeof v === 'string' ? v : '';
  }
  function list(field: string): string[] {
    const v = form.values[field];
    return Array.isArray(v) ? v : [];
  }
  // Numeric inputs hold a string in the DOM but must reach the schema as a
  // number, so the empty case is `undefined` rather than 0 or ''.
  function num(field: string): string {
    const v = form.values[field];
    return typeof v === 'number' ? String(v) : '';
  }
  function toggle(field: string, value: string): void {
    const current = list(field);
    set(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  function set(field: string, value: FieldValue): void {
    form.setValue(field, value);
  }

  const err = form.errorFor;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');

    // Checked here first, so a missing county costs nothing and lands the
    // cursor on the field rather than a scroll to the top of the page.
    const checked = form.submit();
    if (!checked.ok) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checked.data),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data as { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
        if (body.details?.fieldErrors) {
          form.setServerErrors(body.details.fieldErrors);
          focusFirstInvalid(formRef.current);
        } else {
          setError(body.error ?? 'Could not save your details.');
        }
        return;
      }
      await update();
      // Setup is finished here. Verification is collected later, on demand, at
      // /dashboard/verify — so a new member lands in the product rather than at
      // a document upload they may not be able to satisfy today.
      router.push(homeForRole(role));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingShell step={3} title="Tell us about you" subtitle="A few details so we can set up your account.">
      {error && <OnboardingError message={error} />}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Last name"
          placeholder="Kamau"
          value={text('lastName')}
          onChange={(e) => set('lastName', e.target.value)}
          error={err('lastName')}
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
          error={err('phoneNumber')}
          autoComplete="tel"
          required
        />

        <Select
          id="county"
          label="County"
          value={text('county')}
          onChange={(e) => set('county', e.target.value)}
          error={err('county')}
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
              label="What do you grow?"
              optional
              hint="Pick as many as apply. You can change this any time."
              options={PRODUCE_OPTIONS}
              selected={list('cropsGrown')}
              onToggle={(v) => toggle('cropsGrown', v)}
              error={err('cropsGrown')}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              label="Farm size in acres"
              optional
              placeholder="e.g. 3"
              value={num('farmSizeAcres')}
              onChange={(e) =>
                set('farmSizeAcres', e.target.value === '' ? undefined : Number(e.target.value))
              }
              error={err('farmSizeAcres')}
            />
            <Input
              label="Cooperative"
              optional
              hint="Leave blank if you farm independently."
              placeholder="e.g. Kirinyaga Growers Cooperative"
              value={text('cooperativeName')}
              onChange={(e) => set('cooperativeName', e.target.value)}
              error={err('cooperativeName')}
            />
            <Input
              label="Primary language"
              optional
              placeholder="e.g. Kiswahili"
              value={text('primaryLanguage')}
              onChange={(e) => set('primaryLanguage', e.target.value)}
              error={err('primaryLanguage')}
            />
          </>
        )}

        {role === Role.BUYER && (
          <>
            {/* Everything a buyer is asked for follows from this answer. The
                screen used to require an organisation name, a registration
                number and a KRA certificate of every buyer, which an individual
                cannot supply — so they supplied "NOT APPLICABLE" instead, and
                the platform stored it as fact. Asking first costs one tap and
                removes three impossible questions. */}
            <div className="flex flex-col gap-2">
              <p className="app-label text-app-body">What kind of buyer are you?</p>
              <ChoiceCardGroup label="What kind of buyer are you?">
                <ChoiceCard
                  title={BUYER_TYPE_LABEL[BuyerType.INDIVIDUAL]}
                  description="Buying for yourself, your family or your household."
                  selected={text('buyerType') === BuyerType.INDIVIDUAL}
                  onSelect={() => set('buyerType', BuyerType.INDIVIDUAL)}
                />
                <ChoiceCard
                  title={BUYER_TYPE_LABEL[BuyerType.BUSINESS]}
                  description="Buying for a registered company, hotel, school or cooperative."
                  selected={text('buyerType') === BuyerType.BUSINESS}
                  onSelect={() => set('buyerType', BuyerType.BUSINESS)}
                />
              </ChoiceCardGroup>
              {err('buyerType') && (
                <p className="app-meta text-app-danger">{err('buyerType')}</p>
              )}
            </div>

            {text('buyerType') === BuyerType.BUSINESS && (
              <>
                <Input
                  label="Organisation name"
                  placeholder="Mavuno Foods Ltd"
                  value={text('organizationName')}
                  onChange={(e) => set('organizationName', e.target.value)}
                  error={err('organizationName')}
                  required
                />
                <Input
                  label="Business registration number"
                  placeholder="PVT-XXXXXX"
                  value={text('businessRegistrationNumber')}
                  onChange={(e) => set('businessRegistrationNumber', e.target.value)}
                  error={err('businessRegistrationNumber')}
                  required
                />
                <Input
                  label="Corporate paybill"
                  optional
                  placeholder="e.g. 400200"
                  value={text('corporatePaybill')}
                  onChange={(e) => set('corporatePaybill', e.target.value)}
                  error={err('corporatePaybill')}
                />
                <Input
                  label="Procurement scale"
                  optional
                  placeholder="e.g. 5–10 tonnes / month"
                  value={text('procurementScale')}
                  onChange={(e) => set('procurementScale', e.target.value)}
                  error={err('procurementScale')}
                />
              </>
            )}
            <ChipGroup
              label="What do you buy?"
              optional
              hint="We put these first in your marketplace. You can still order anything."
              options={PRODUCE_OPTIONS}
              selected={list('purchaseInterests')}
              onToggle={(v) => toggle('purchaseInterests', v)}
              error={err('purchaseInterests')}
            />
            <TokenSelect
              id="preferredCounties"
              label="Counties you prefer to source from"
              optional
              hint="Add as many as you like — this ranks results, it does not limit them."
              placeholder="Add a county"
              options={KENYAN_COUNTIES}
              selected={list('preferredCounties')}
              onChange={(next) => set('preferredCounties', next)}
              error={err('preferredCounties')}
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
              error={err('universityAffiliation')}
              required
            />
            <Input
              label="Academic registration number"
              placeholder="e.g. SCT221-0001/2024"
              value={text('academicRegistrationNumber')}
              onChange={(e) => set('academicRegistrationNumber', e.target.value)}
              error={err('academicRegistrationNumber')}
              required
            />
            <Input
              label="Programme"
              placeholder="e.g. BSc Computer Science"
              value={text('programme')}
              onChange={(e) => set('programme', e.target.value)}
              error={err('programme')}
              required
            />
            <Select
              id="graduationYear"
              label="Expected graduation year"
              value={num('graduationYear')}
              onChange={(e) =>
                set('graduationYear', e.target.value === '' ? undefined : Number(e.target.value))
              }
              error={err('graduationYear')}
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
              label="Primary interest"
              optional
              placeholder="e.g. Backend engineering"
              value={text('primaryInterest')}
              onChange={(e) => set('primaryInterest', e.target.value)}
              error={err('primaryInterest')}
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
              error={err('universityAffiliation')}
              required
            />
            <Input
              label="Department"
              placeholder="Computer Science"
              value={text('departmentAssignment')}
              onChange={(e) => set('departmentAssignment', e.target.value)}
              error={err('departmentAssignment')}
              required
            />
            <Input
              label="Position"
              hint="Your academic title, as your institution writes it."
              placeholder="e.g. Senior Lecturer"
              value={text('position')}
              onChange={(e) => set('position', e.target.value)}
              error={err('position')}
              required
            />
            <Input
              label="Academic staff ID"
              placeholder="STAFF-XXXX"
              value={text('academicStaffId')}
              onChange={(e) => set('academicStaffId', e.target.value)}
              error={err('academicStaffId')}
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
