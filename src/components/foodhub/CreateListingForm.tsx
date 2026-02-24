'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ListingUnit, BuyerContactPreference, KENYAN_COUNTIES } from '@/types';

export interface ICreateListingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IFormState {
  title: string;
  cropName: string;
  description: string;
  quantityAvailable: string;
  unit: ListingUnit;
  currentPricePerUnit: string;
  pickupCounty: string;
  pickupDescription: string;
  imageUrl: string;
  buyerContactPreference: BuyerContactPreference[];
}

const INITIAL_STATE: IFormState = {
  title: '',
  cropName: '',
  description: '',
  quantityAvailable: '',
  unit: ListingUnit.KG,
  currentPricePerUnit: '',
  pickupCounty: '',
  pickupDescription: '',
  imageUrl: '',
  buyerContactPreference: [BuyerContactPreference.PHONE],
};

const CROP_NAMES = [
  'maize', 'beans', 'tomatoes', 'potatoes', 'kale (sukuma wiki)',
  'capsicum', 'tea', 'coffee', 'rice', 'dairy',
];

export function CreateListingForm({ isOpen, onClose }: ICreateListingFormProps): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState<IFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof IFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose(): void {
    setForm(INITIAL_STATE);
    setErrors({});
    setSubmitError(null);
    onClose();
  }

  function set<K extends keyof IFormState>(key: K, value: IFormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleContactPref(pref: BuyerContactPreference): void {
    setForm((prev) => {
      const current = prev.buyerContactPreference;
      if (current.includes(pref)) {
        return { ...prev, buyerContactPreference: current.filter((p) => p !== pref) };
      }
      return { ...prev, buyerContactPreference: [...current, pref] };
    });
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof IFormState, string>> = {};

    if (form.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!form.cropName) newErrors.cropName = 'Select a crop';
    if (form.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!form.quantityAvailable || parseInt(form.quantityAvailable, 10) < 1)
      newErrors.quantityAvailable = 'Enter a valid quantity';
    if (!form.currentPricePerUnit || parseFloat(form.currentPricePerUnit) <= 0)
      newErrors.currentPricePerUnit = 'Enter a valid price';
    if (!form.pickupCounty) newErrors.pickupCounty = 'Select a county';
    if (form.pickupDescription.length < 10)
      newErrors.pickupDescription = 'Provide at least 10 characters for pickup details';
    if (!form.imageUrl) newErrors.imageUrl = 'Provide a Cloudinary image URL';
    if (form.buyerContactPreference.length === 0)
      newErrors.buyerContactPreference = 'Select at least one contact method';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          cropName: form.cropName,
          description: form.description,
          quantityAvailable: parseInt(form.quantityAvailable, 10),
          unit: form.unit,
          currentPricePerUnit: parseFloat(form.currentPricePerUnit),
          pickupCounty: form.pickupCounty,
          pickupDescription: form.pickupDescription,
          imageUrls: [form.imageUrl],
          buyerContactPreference: form.buyerContactPreference,
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg =
          typeof data['error'] === 'string'
            ? data['error']
            : 'Failed to create listing. Please try again.';
        setSubmitError(msg);
        return;
      }

      handleClose();
      router.refresh();
    } catch {
      setSubmitError('Network error. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New crop listing"
      description="Your listing will be visible to buyers across Kenya once submitted."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Title */}
        <Input
          label="Listing title"
          placeholder="e.g. Fresh Nakuru Tomatoes — Grade A"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          required
        />

        {/* Crop name */}
        <div className="space-y-1.5">
          <label htmlFor="crop-name" className="font-body text-t6 text-text-secondary">
            Crop
          </label>
          <select
            id="crop-name"
            value={form.cropName}
            onChange={(e) => set('cropName', e.target.value)}
            className={[
              'w-full min-h-[44px] bg-surface-secondary border rounded-sm font-body text-t5 text-text-primary px-3 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150',
              errors.cropName ? 'border-red-700/60' : 'border-white/10',
            ].join(' ')}
          >
            <option value="">Select a crop</option>
            {CROP_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          {errors.cropName && (
            <p className="font-body text-t6 text-red-400" role="alert">
              {errors.cropName}
            </p>
          )}
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe your produce: variety, condition, harvest date, organic status..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          rows={3}
        />

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity available"
            type="number"
            placeholder="500"
            value={form.quantityAvailable}
            onChange={(e) => set('quantityAvailable', e.target.value)}
            error={errors.quantityAvailable}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="unit" className="font-body text-t6 text-text-secondary">
              Unit
            </label>
            <select
              id="unit"
              value={form.unit}
              onChange={(e) => set('unit', e.target.value as ListingUnit)}
              className="w-full min-h-[44px] bg-surface-secondary border border-white/10 rounded-sm font-body text-t5 text-text-primary px-3 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
            >
              {(Object.values(ListingUnit) as ListingUnit[]).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <Input
          label="Price per unit (KES)"
          type="number"
          placeholder="65"
          value={form.currentPricePerUnit}
          onChange={(e) => set('currentPricePerUnit', e.target.value)}
          error={errors.currentPricePerUnit}
          required
        />

        {/* Pickup county */}
        <div className="space-y-1.5">
          <label htmlFor="pickup-county" className="font-body text-t6 text-text-secondary">
            Pickup county
          </label>
          <select
            id="pickup-county"
            value={form.pickupCounty}
            onChange={(e) => set('pickupCounty', e.target.value)}
            className={[
              'w-full min-h-[44px] bg-surface-secondary border rounded-sm font-body text-t5 text-text-primary px-3 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150',
              errors.pickupCounty ? 'border-red-700/60' : 'border-white/10',
            ].join(' ')}
          >
            <option value="">Select your county</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.pickupCounty && (
            <p className="font-body text-t6 text-red-400" role="alert">
              {errors.pickupCounty}
            </p>
          )}
        </div>

        {/* Pickup description */}
        <Input
          label="Pickup location details"
          placeholder="e.g. Wakulima Market, Gate 3, Nakuru Town"
          value={form.pickupDescription}
          onChange={(e) => set('pickupDescription', e.target.value)}
          error={errors.pickupDescription}
        />

        {/* Image URL */}
        <Input
          label="Crop image URL (Cloudinary)"
          type="url"
          placeholder="https://res.cloudinary.com/..."
          value={form.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          error={errors.imageUrl}
          hint="Upload your image to Cloudinary and paste the URL here"
        />

        {/* Contact preference */}
        <div className="space-y-1.5">
          <p className="font-body text-t6 text-text-secondary">Buyer contact preference</p>
          <div className="flex gap-2" role="group" aria-label="Contact preference">
            {(Object.values(BuyerContactPreference) as BuyerContactPreference[]).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleContactPref(pref)}
                aria-pressed={form.buyerContactPreference.includes(pref)}
                className={[
                  'flex-1 min-h-[44px] rounded-sm text-t5 font-body border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green',
                  form.buyerContactPreference.includes(pref)
                    ? 'bg-accent-green text-surface-primary border-accent-green'
                    : 'bg-surface-secondary text-text-secondary border-white/10 hover:border-white/20',
                ].join(' ')}
              >
                {pref === BuyerContactPreference.PHONE ? 'Phone call' : 'Platform message'}
              </button>
            ))}
          </div>
          {errors.buyerContactPreference && (
            <p className="font-body text-t6 text-red-400" role="alert">
              {errors.buyerContactPreference}
            </p>
          )}
        </div>

        {submitError && (
          <p
            className="text-t5 font-body text-red-400 bg-red-950/20 border border-red-900/30 rounded p-3"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create listing
          </Button>
        </div>
      </form>
    </Modal>
  );
}
