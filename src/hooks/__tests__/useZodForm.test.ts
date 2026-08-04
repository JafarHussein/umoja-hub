import { act, renderHook } from '@testing-library/react';
import { z } from 'zod';
import { useZodForm } from '../useZodForm';
import { buyerIdentitySchema } from '@/lib/validation/onboardingSchema';
import { BuyerType } from '@/types';

// Written the way the real schemas are: one message covering both "you left
// this blank" and "the field never arrived", so a missing key never surfaces
// Zod's own `expected string, received undefined`.
const simple = z.object({
  lastName: z.string({ message: 'Last name is required' }).min(1, 'Last name is required'),
  county: z.string({ message: 'County is required' }).min(1, 'County is required'),
});

describe('useZodForm', () => {
  it('says nothing before the first submit', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    // Opening a form already covered in red is worse than saying nothing.
    expect(result.current.errorFor('lastName')).toBeUndefined();
    expect(result.current.isValid).toBe(false);
  });

  it('shows every error once submitted, and refuses to hand back data', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    act(() => {
      expect(result.current.submit().ok).toBe(false);
    });
    expect(result.current.errorFor('lastName')).toBe('Last name is required');
    expect(result.current.errorFor('county')).toBe('County is required');
  });

  it('clears a message as soon as its field becomes valid', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    act(() => {
      result.current.submit();
    });
    expect(result.current.errorFor('lastName')).toBeDefined();
    act(() => {
      result.current.setValue('lastName', 'Otieno');
    });
    expect(result.current.errorFor('lastName')).toBeUndefined();
    // The other field is untouched, so it still says what it said.
    expect(result.current.errorFor('county')).toBe('County is required');
  });

  it('returns the parsed value when the schema accepts it', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    act(() => {
      result.current.setValue('lastName', 'Otieno');
    });
    act(() => {
      result.current.setValue('county', 'Kisumu');
    });
    let out: { ok: boolean } = { ok: false };
    act(() => {
      out = result.current.submit();
    });
    expect(out).toEqual({ ok: true, data: { lastName: 'Otieno', county: 'Kisumu' } });
  });

  it('lets the server have the last word, then yields when the field changes', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    act(() => {
      result.current.setValue('lastName', 'Otieno');
    });
    act(() => {
      // Something the schema cannot know — only the database can.
      result.current.setServerErrors({ lastName: ['That name is already registered'] });
    });
    expect(result.current.errorFor('lastName')).toBe('That name is already registered');
    act(() => {
      result.current.setValue('lastName', 'Otieno-Ochieng');
    });
    expect(result.current.errorFor('lastName')).toBeUndefined();
  });

  it('reports a discriminated union against its discriminator', () => {
    // The buyer schema branches on `buyerType`, so a buyer who has not chosen
    // an archetype cannot be judged field-by-field. This is the case that rules
    // out per-field validation, and it must land on the question actually asked.
    const { result } = renderHook(() => useZodForm(buyerIdentitySchema, {}));
    act(() => {
      result.current.submit();
    });
    expect(result.current.errorFor('buyerType')).toBeDefined();
  });

  it('asks a business buyer for what a business has, and never asks an individual', () => {
    const { result } = renderHook(() =>
      useZodForm(buyerIdentitySchema, {
        lastName: 'Kimani',
        phoneNumber: '0712345678',
        county: 'Nairobi',
      })
    );

    act(() => {
      result.current.setValue('buyerType', BuyerType.BUSINESS);
    });
    act(() => {
      result.current.submit();
    });
    expect(result.current.errorFor('organizationName')).toBeDefined();

    act(() => {
      result.current.setValue('buyerType', BuyerType.INDIVIDUAL);
    });
    // The same values now satisfy the schema: an individual is never asked for
    // an organisation name, which is what "NOT APPLICABLE" was invented to fill.
    expect(result.current.errorFor('organizationName')).toBeUndefined();
    expect(result.current.isValid).toBe(true);
  });

  it('resets back to quiet', () => {
    const { result } = renderHook(() => useZodForm(simple, {}));
    act(() => {
      result.current.submit();
    });
    expect(result.current.errorFor('county')).toBeDefined();
    act(() => {
      result.current.reset();
    });
    expect(result.current.errorFor('county')).toBeUndefined();
  });
});
