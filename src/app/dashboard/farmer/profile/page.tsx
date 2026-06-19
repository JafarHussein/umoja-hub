'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, VerificationStatus, FarmerTrustTier, DocumentType } from '@/types';
import { Button, Input, Select, Alert, VerificationBadge } from '@/components/app';
import { LinkGroupTokenForm } from '@/components/foodhub/LinkGroupTokenForm';

interface IFarmerData {
  cropsGrown: string[];
  farmSizeAcres: number | null;
  verificationStatus: VerificationStatus;
  documentType: DocumentType | null;
  isVerified: boolean;
}

interface ITrustScore {
  compositeScore: number;
  tier: FarmerTrustTier;
  verificationScore: number;
  transactionScore: number;
  ratingScore: number;
  reliabilityScore: number;
}

interface IFarmerProfile {
  firstName: string | undefined;
  lastName: string | undefined;
  county: string | undefined;
  phoneNumber: string | undefined;
  farmerData: IFarmerData;
  trustScore: ITrustScore;
}

interface IProfileResponse {
  farmer: IFarmerProfile;
  onboarded: boolean;
}

interface IVerifyForm {
  documentType: DocumentType;
  documentNumber: string;
  documentImageUrl: string;
}

type PageState = 'loading' | 'ready' | 'error';
type SubmitState = 'idle' | 'submitting' | 'error';
type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface ICloudinaryUploadResponse {
  secure_url: string;
}

// Key/value row inside a bordered summary card.
function InfoRow({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="app-label text-app-muted">{label}</span>
      <span className="app-body text-right text-app-ink">{children}</span>
    </div>
  );
}

// Verification status rendered as a trust badge (verified/pending/denied) or a
// neutral "not submitted" pill — status by icon + text, never colour alone.
function VerificationStatusValue({ status }: { status: VerificationStatus }): React.ReactElement {
  switch (status) {
    case VerificationStatus.APPROVED:
      return <VerificationBadge state="verified" />;
    case VerificationStatus.PENDING:
      return <VerificationBadge state="pending" label="Under review" />;
    case VerificationStatus.REJECTED:
      return <VerificationBadge state="denied" label="Rejected" />;
    default:
      return (
        <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 text-app-muted">
          Not submitted
        </span>
      );
  }
}

export default function FarmerProfilePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<IProfileResponse | null>(null);

  const [cropsInput, setCropsInput] = useState('');
  const [cropState, setCropState] = useState<SubmitState>('idle');
  const [cropError, setCropError] = useState<string | null>(null);

  const [verifyForm, setVerifyForm] = useState<IVerifyForm>({
    documentType: DocumentType.NATIONAL_ID,
    documentNumber: '',
    documentImageUrl: '',
  });
  const [verifyState, setVerifyState] = useState<SubmitState>('idle');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/farmers');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as IProfileResponse;
      setProfile(data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.FARMER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchProfile();
    }
  }, [status, session, router, fetchProfile]);

  async function handleCropSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setCropError(null);
    setCropState('submitting');
    const cropsGrown = cropsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cropsGrown.length === 0) {
      setCropError('Enter at least one crop.');
      setCropState('error');
      return;
    }
    try {
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropsGrown }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Submission failed.');
      }
      setCropState('idle');
      void fetchProfile();
    } catch (err) {
      setCropError(err instanceof Error ? err.message : 'An error occurred.');
      setCropState('error');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setUploadError('Cloudinary is not configured. Contact support.');
      setUploadState('error');
      return;
    }

    setUploadState('uploading');
    setUploadError(null);
    setVerifyForm((prev) => ({ ...prev, documentImageUrl: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = (await res.json()) as ICloudinaryUploadResponse;
      setVerifyForm((prev) => ({ ...prev, documentImageUrl: data.secure_url }));
      setUploadState('done');
    } catch {
      setUploadError('Upload failed. Try again.');
      setUploadState('error');
    }
  }

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setVerifyError(null);
    setVerifyState('submitting');
    try {
      const res = await fetch('/api/farmers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyForm),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Submission failed.');
      }
      setVerifyState('idle');
      void fetchProfile();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'An error occurred.');
      setVerifyState('error');
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-48 rounded-app-card" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Failed to load profile</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchProfile()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!profile) return <></>;

  const { farmer, onboarded } = profile;
  const { farmerData, trustScore } = farmer;
  const canSubmitVerification =
    farmerData.verificationStatus === VerificationStatus.UNSUBMITTED ||
    farmerData.verificationStatus === VerificationStatus.REJECTED;

  const scoreFactors: { label: string; score: number; max: number }[] = [
    { label: 'Identity verification', score: trustScore.verificationScore, max: 40 },
    { label: 'Transactions', score: trustScore.transactionScore, max: 25 },
    { label: 'Buyer ratings', score: trustScore.ratingScore, max: 20 },
    { label: 'Reliability', score: trustScore.reliabilityScore, max: 15 },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Profile summary ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h1 className="app-h1 text-app-ink">Farmer Profile</h1>
        <div className="divide-y divide-app-hairline rounded-app-card border border-app-hairline bg-app-card">
          <InfoRow label="Name">
            {farmer.firstName ?? '—'} {farmer.lastName ?? ''}
          </InfoRow>
          <InfoRow label="County">{farmer.county ?? '—'}</InfoRow>
          <InfoRow label="Phone">{farmer.phoneNumber ?? '—'}</InfoRow>
          <InfoRow label="Trust tier">
            <span className="capitalize">{trustScore.tier.toLowerCase()}</span> ·{' '}
            <span className="app-data-m text-app-ink">{trustScore.compositeScore}</span>
          </InfoRow>
          <InfoRow label="Verification">
            <VerificationStatusValue status={farmerData.verificationStatus} />
          </InfoRow>
        </div>
      </section>

      {/* ── Farm details / onboarding ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Farm Details</h2>
        {onboarded ? (
          <div className="divide-y divide-app-hairline rounded-app-card border border-app-hairline bg-app-card">
            <InfoRow label="Crops grown">{farmerData.cropsGrown.join(', ') || '—'}</InfoRow>
            <InfoRow label="Farm size">
              {farmerData.farmSizeAcres != null ? `${farmerData.farmSizeAcres} acres` : '—'}
            </InfoRow>
          </div>
        ) : (
          <form
            className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4"
            onSubmit={(e) => void handleCropSubmit(e)}
          >
            <p className="app-body text-app-muted">
              Profile incomplete. Add your crops to activate your account.
            </p>
            <Input
              label="Crops grown (comma-separated)"
              type="text"
              value={cropsInput}
              onChange={(e) => setCropsInput(e.target.value)}
              placeholder="Maize, Beans, Tomatoes"
              required
              {...(cropError ? { error: cropError } : {})}
            />
            <Button type="submit" isLoading={cropState === 'submitting'} className="self-start">
              Save crops
            </Button>
          </form>
        )}
      </section>

      {/* ── Identity verification ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Identity Verification</h2>

        {farmerData.verificationStatus === VerificationStatus.APPROVED && (
          <Alert tone="success">
            Verified. Document on file: {farmerData.documentType ?? '—'}
          </Alert>
        )}

        {farmerData.verificationStatus === VerificationStatus.PENDING && (
          <Alert tone="info">Your verification is under review.</Alert>
        )}

        {canSubmitVerification && (
          <form
            className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-4"
            onSubmit={(e) => void handleVerifySubmit(e)}
          >
            {farmerData.verificationStatus === VerificationStatus.REJECTED && (
              <Alert tone="danger">
                Previous submission was rejected. Please resubmit with a valid document.
              </Alert>
            )}

            <Select
              label="Document type"
              value={verifyForm.documentType}
              onChange={(e) =>
                setVerifyForm((prev) => ({
                  ...prev,
                  documentType: e.target.value as DocumentType,
                }))
              }
            >
              <option value={DocumentType.NATIONAL_ID}>National ID</option>
              <option value={DocumentType.COOPERATIVE_CARD}>Cooperative Card</option>
              <option value={DocumentType.PASSPORT}>Passport</option>
            </Select>

            <Input
              label="Document number"
              type="text"
              value={verifyForm.documentNumber}
              onChange={(e) =>
                setVerifyForm((prev) => ({ ...prev, documentNumber: e.target.value }))
              }
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="documentImage" className="app-label text-app-body">
                Document image
              </label>
              <input
                id="documentImage"
                type="file"
                accept="image/*"
                onChange={(e) => void handleFileUpload(e)}
                disabled={uploadState === 'uploading'}
                className="app-body text-app-body file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-2 file:text-app-ink hover:file:bg-app-sunken"
              />
              {uploadState === 'uploading' && (
                <p className="app-meta text-app-muted">Uploading...</p>
              )}
              {uploadState === 'done' && (
                <p className="app-meta text-app-success">Upload complete.</p>
              )}
              {uploadError !== null && (
                <p role="alert" className="app-meta text-app-danger">
                  {uploadError}
                </p>
              )}
            </div>

            {verifyError !== null && <Alert tone="danger">{verifyError}</Alert>}

            <Button
              type="submit"
              isLoading={verifyState === 'submitting'}
              disabled={uploadState === 'uploading' || verifyForm.documentImageUrl === ''}
              className="self-start"
            >
              Submit for verification
            </Button>
          </form>
        )}
      </section>

      {/* ── Group membership (UI-05) ─────────────────────────────────────── */}
      <LinkGroupTokenForm />

      {/* ── Trust score breakdown — shown only when APPROVED ─────────────── */}
      {farmerData.verificationStatus === VerificationStatus.APPROVED && (
        <section className="space-y-3">
          <h2 className="app-h2 text-app-ink">Trust Score Breakdown</h2>
          <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-4">
            {scoreFactors.map(({ label, score, max }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="app-body text-app-ink">{label}</span>
                  <span className="app-data-m text-app-muted">
                    {score} / {max}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-app-pill bg-app-sunken">
                  <div
                    className="h-full rounded-app-pill bg-app-brand"
                    style={{ width: `${Math.round((score / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-app-hairline pt-3">
              <span className="app-body-strong text-app-ink">Composite score</span>
              <span className="app-data-l text-app-brand">
                {trustScore.compositeScore} / 100
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
