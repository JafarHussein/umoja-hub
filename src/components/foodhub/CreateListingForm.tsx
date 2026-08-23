'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Modal, Select, Textarea } from '@/components/app';
import { PriceRecommendationPanel, usePriceRecommendation } from './PriceRecommendationPanel';
import { CROP_IDS, CROP_REGISTRY } from '@/lib/taxonomy/crops';
import {
  describePhotoProblem,
  formatBytes,
  MAX_UPLOAD_BYTES,
  PHOTO_ACCEPT_ATTRIBUTE,
  uploadFile,
} from '@/lib/uploads';
import {
  ListingUnit,
  ListingCategory,
  LISTING_CATEGORY_ORDER,
  LISTING_CATEGORY_LABEL,
  BuyerContactPreference,
  KENYAN_COUNTIES,
} from '@/types';

export interface ICreateListingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IFormState {
  title: string;
  cropName: string;
  category: ListingCategory | '';
  description: string;
  quantityAvailable: string;
  unit: ListingUnit;
  currentPricePerUnit: string;
  pickupCounty: string;
  pickupDescription: string;
  buyerContactPreference: BuyerContactPreference[];
}

const INITIAL_STATE: IFormState = {
  title: '',
  cropName: '',
  category: '',
  description: '',
  quantityAvailable: '',
  unit: ListingUnit.KG,
  currentPricePerUnit: '',
  pickupCounty: '',
  pickupDescription: '',
  buyerContactPreference: [BuyerContactPreference.PHONE],
};

/**
 * The crops a farmer may choose, derived from the platform's crop registry.
 *
 * A hand-written list of ten lowercase strings stood here, and it was the
 * parallel list the registry exists to prevent: it offered seven fewer crops
 * than the platform actually prices, wrote `kale (sukuma wiki)` where every
 * other surface writes `Kale (Sukuma Wiki)`, and drifted from the categories
 * and units the same crop carries everywhere else.
 */
const CROP_OPTIONS = CROP_IDS.map((id) => CROP_REGISTRY[id]);

/** At most five images per listing — the ceiling `cropListingSchema` enforces. */
const MAX_IMAGES = 5;

export function CreateListingForm({ isOpen, onClose }: ICreateListingFormProps): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState<IFormState>(INITIAL_STATE);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof IFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose(): void {
    setForm(INITIAL_STATE);
    setImageUrls([]);
    setImageError(null);
    setErrors({});
    setSubmitError(null);
    onClose();
  }

  function set<K extends keyof IFormState>(key: K, value: IFormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /**
   * Take the photo the farmer chose and store it.
   *
   * This form used to ask for a Cloudinary delivery URL and told the farmer to
   * *"upload your image to Cloudinary and paste the URL here"* — a step no
   * smallholder can take, on the one screen that stands between them and their
   * first sale. `/api/upload` already held the credentials and already allowed
   * this folder; the form simply never reached for it.
   *
   * The URL is only added to the list once the upload has actually completed,
   * so the listing can never carry a reference to a file that was not stored.
   */
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const chosen = Array.from(e.target.files ?? []);
    // Let the same file be chosen again after a failure.
    e.target.value = '';
    if (chosen.length === 0) return;

    setImageError(null);
    const room = MAX_IMAGES - imageUrls.length;
    if (room <= 0) {
      setImageError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const files = chosen.slice(0, room);
    if (chosen.length > room) {
      setImageError(`Only the first ${room} of those were added — the limit is ${MAX_IMAGES}.`);
    }

    setUploading(true);
    try {
      for (const file of files) {
        const problem = describePhotoProblem(file);
        if (problem) {
          setImageError(problem);
          continue;
        }
        const url = await uploadFile(file, 'umojahub/listings');
        setImageUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
      }
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'The upload did not complete. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string): void {
    setImageUrls((prev) => prev.filter((u) => u !== url));
    setImageError(null);
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
    if (!form.category) newErrors.category = 'Select a category';
    if (form.description.length < 20)
      newErrors.description = 'Description must be at least 20 characters';
    if (!form.quantityAvailable || parseInt(form.quantityAvailable, 10) < 1)
      newErrors.quantityAvailable = 'Enter a valid quantity';
    if (!form.currentPricePerUnit || parseFloat(form.currentPricePerUnit) <= 0)
      newErrors.currentPricePerUnit = 'Enter a valid price';
    if (!form.pickupCounty) newErrors.pickupCounty = 'Select a county';
    if (form.pickupDescription.length < 10)
      newErrors.pickupDescription = 'Provide at least 10 characters for pickup details';
    if (form.buyerContactPreference.length === 0)
      newErrors.buyerContactPreference = 'Select at least one contact method';

    setErrors(newErrors);
    if (imageUrls.length === 0) {
      setImageError('Add at least one photo of your produce.');
    }
    return Object.keys(newErrors).length === 0 && imageUrls.length > 0;
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
          category: form.category,
          description: form.description,
          quantityAvailable: parseInt(form.quantityAvailable, 10),
          unit: form.unit,
          currentPricePerUnit: parseFloat(form.currentPricePerUnit),
          pickupCounty: form.pickupCounty,
          pickupDescription: form.pickupDescription,
          imageUrls,
          buyerContactPreference: form.buyerContactPreference,
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg =
          typeof data['error'] === 'string'
            ? data['error']
            : 'Could not post your produce. Please try again.';
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

  // Price Intelligence — fires once a crop and county are chosen. Quantity, when
  // entered, drives the earnings projection.
  const quantityForQuery = parseInt(form.quantityAvailable, 10);
  const { data: recommendation, isLoading: isRecLoading } = usePriceRecommendation(
    form.cropName,
    form.pickupCounty,
    form.unit,
    Number.isFinite(quantityForQuery) && quantityForQuery > 0 ? quantityForQuery : undefined
  );

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Add your produce"
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-listing"
            variant="primary"
            isLoading={isSubmitting}
            disabled={uploading}
          >
            Publish produce
          </Button>
        </>
      }
    >
      <form id="create-listing" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="app-meta text-app-muted">
          Your produce will be visible to buyers across Kenya once you post it.
        </p>

        <Input
          label="Produce title"
          placeholder="e.g. Fresh Nakuru Tomatoes — Grade A"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          required
        />

        <Select
          label="Crop"
          value={form.cropName}
          onChange={(e) => {
            const label = e.target.value;
            set('cropName', label);
            // The registry already knows which category a crop belongs to, so
            // the farmer is not asked to classify their own produce. Tea and
            // coffee carry no marketplace category, and those they still choose.
            const crop = CROP_OPTIONS.find((c) => c.label === label);
            if (crop?.category) set('category', crop.category);
            if (crop?.typicalUnits[0]) set('unit', crop.typicalUnits[0]);
          }}
          error={errors.cropName}
        >
          <option value="">Select a crop</option>
          {CROP_OPTIONS.map((crop) => (
            <option key={crop.id} value={crop.label}>
              {crop.label}
            </option>
          ))}
        </Select>

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => set('category', e.target.value as ListingCategory)}
          error={errors.category}
        >
          <option value="">Select a category</option>
          {LISTING_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {LISTING_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>

        <Textarea
          label="Description"
          placeholder="Describe your produce: variety, condition, harvest date, organic status..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          rows={3}
        />

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
          <Select
            label="Unit"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value as ListingUnit)}
          >
            {(Object.values(ListingUnit) as ListingUnit[]).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Price per unit (KSh)"
          type="number"
          placeholder="65"
          value={form.currentPricePerUnit}
          onChange={(e) => set('currentPricePerUnit', e.target.value)}
          error={errors.currentPricePerUnit}
          required
        />

        {/* Price Intelligence — guidance, never enforcement */}
        {form.cropName && form.pickupCounty && (
          <PriceRecommendationPanel
            recommendation={recommendation}
            isLoading={isRecLoading}
            onUsePrice={(price) => set('currentPricePerUnit', String(price))}
          />
        )}

        <Select
          label="Pickup county"
          value={form.pickupCounty}
          onChange={(e) => set('pickupCounty', e.target.value)}
          error={errors.pickupCounty}
        >
          <option value="">Select your county</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Input
          label="Pickup location details"
          placeholder="e.g. Wakulima Market, Gate 3, Nakuru Town"
          value={form.pickupDescription}
          onChange={(e) => set('pickupDescription', e.target.value)}
          error={errors.pickupDescription}
        />

        {/* Photos */}
        <div className="flex flex-col gap-2">
          <label htmlFor="listing-photos" className="app-label text-app-body">
            Photos of your produce
          </label>

          {imageUrls.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <li
                  key={url}
                  className="relative h-20 w-20 overflow-hidden rounded-app-control border border-app-hairline bg-app-sunken"
                >
                  {/* Deliberately a plain <img>: these are just-uploaded
                      Cloudinary URLs in a transient form preview, and routing
                      them through the image optimiser buys nothing here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1} of your produce`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-0 top-0 rounded-bl-app-control bg-app-ink/70 px-1.5 py-0.5 text-[11px] leading-4 text-app-canvas hover:bg-app-ink"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            id="listing-photos"
            type="file"
            multiple
            accept={PHOTO_ACCEPT_ATTRIBUTE}
            onChange={(e) => void handleFiles(e)}
            disabled={uploading || imageUrls.length >= MAX_IMAGES}
            className="app-meta text-app-muted file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-1.5 file:text-app-ink hover:file:bg-app-sunken"
          />
          <p className="app-meta text-app-faint">
            JPG, PNG or WebP · up to {formatBytes(MAX_UPLOAD_BYTES)} each · {MAX_IMAGES} photos
            maximum. Take the photo in daylight — buyers decide on it.
          </p>
          {uploading && (
            <p className="app-meta text-app-muted" role="status">
              Uploading…
            </p>
          )}
          {imageError && (
            <p className="app-meta text-app-danger" role="alert">
              {imageError}
            </p>
          )}
        </div>

        {/* Contact preference */}
        <div className="flex flex-col gap-2">
          <p className="app-label text-app-body">Buyer contact preference</p>
          <div className="flex gap-2" role="group" aria-label="Contact preference">
            {(Object.values(BuyerContactPreference) as BuyerContactPreference[]).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleContactPref(pref)}
                aria-pressed={form.buyerContactPreference.includes(pref)}
                className={[
                  'app-body min-h-[44px] flex-1 rounded-app-control border transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
                  form.buyerContactPreference.includes(pref)
                    ? 'border-app-brand bg-app-brand text-app-on-brand'
                    : 'border-app-border-strong bg-app-card text-app-muted hover:text-app-ink',
                ].join(' ')}
              >
                {pref === BuyerContactPreference.PHONE ? 'Phone call' : 'Platform message'}
              </button>
            ))}
          </div>
          {errors.buyerContactPreference && (
            <p className="app-meta text-app-danger" role="alert">
              {errors.buyerContactPreference}
            </p>
          )}
        </div>

        {submitError && <Alert tone="danger">{submitError}</Alert>}
      </form>
    </Modal>
  );
}
