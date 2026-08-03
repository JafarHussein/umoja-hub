'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, VerificationStatus, FarmerTrustTier, DocumentType } from '@/types';
import {
  Alert,
  Button,
  Card,
  DataItem,
  DataList,
  EmptyState,
  Form,
  FormActions,
  FormSection,
  Input,
  Page,
  PageHeader,
  PageSection,
  Select,
  VerificationBadge,
} from '@/components/app';
import { LinkGroupTokenForm } from '@/components/foodhub/LinkGroupTokenForm';
import { loginUrlWithIntent } from '@/lib/auth/intent';

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
      router.push(loginUrlWithIntent());
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

    setUploadState('uploading');
    setUploadError(null);
    setVerifyForm((prev) => ({ ...prev, documentImageUrl: '' }));

    try {
      // Server-side upload — uses the validated CLOUDINARY_* credentials, so it
      // works regardless of build-time NEXT_PUBLIC_* configuration.
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'umojahub/verification');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = (await res.json()) as { data?: { url?: string }; error?: string };
      if (!res.ok || !data.data?.url) throw new Error(data.error ?? 'Upload failed');
      setVerifyForm((prev) => ({ ...prev, documentImageUrl: data.data!.url! }));
      setUploadState('done');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Try again.');
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
      <Page width="focus">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page width="focus">
        <PageHeader title="Farmer Profile" />
        <EmptyState
          title="We could not load your profile"
          description="Nothing has been changed or lost — this screen just could not reach your details. Trying again usually clears it."
          action={{ label: 'Try again', onClick: () => void fetchProfile() }}
        />
      </Page>
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
    <Page width="focus">
      <PageHeader
        title="Farmer Profile"
        description="What buyers see when they consider ordering from you. Your verification and trust score decide how high you appear when they search."
      />

      {/* ── Profile summary ─────────────────────────────────────────────── */}
      <PageSection title="Your details">
        <Card pad="none" className="px-6">
          <DataList>
            <DataItem label="Name">
              {farmer.firstName ?? '—'} {farmer.lastName ?? ''}
            </DataItem>
            <DataItem label="County">{farmer.county ?? '—'}</DataItem>
            <DataItem label="Phone">{farmer.phoneNumber ?? '—'}</DataItem>
            <DataItem label="Trust tier">
              <span className="capitalize">{trustScore.tier.toLowerCase()}</span> ·{' '}
              <span className="app-data-m text-app-ink">{trustScore.compositeScore}</span>
            </DataItem>
            <DataItem label="Verification">
              <VerificationStatusValue status={farmerData.verificationStatus} />
            </DataItem>
          </DataList>
        </Card>
      </PageSection>

      {/* ── Farm details / onboarding ────────────────────────────────────── */}
      <PageSection title="Farm details">
        {onboarded ? (
          <Card pad="none" className="px-6">
            <DataList>
              <DataItem label="Crops grown">{farmerData.cropsGrown.join(', ') || '—'}</DataItem>
              <DataItem label="Farm size">
                {farmerData.farmSizeAcres != null ? `${farmerData.farmSizeAcres} acres` : '—'}
              </DataItem>
            </DataList>
          </Card>
        ) : (
          <Card>
            <Form onSubmit={(e) => void handleCropSubmit(e)}>
              <FormSection
                title="Tell us what you grow"
                description="Buyers search by crop, so this is what puts you in front of them. You can change it whenever your season changes."
                divided={false}
              >
                <Input
                  label="Crops grown (comma-separated)"
                  type="text"
                  value={cropsInput}
                  onChange={(e) => setCropsInput(e.target.value)}
                  placeholder="Maize, Beans, Tomatoes"
                  required
                  {...(cropError ? { error: cropError } : {})}
                />
              </FormSection>
              <FormActions note="Your account becomes active as soon as this is saved.">
                <Button type="submit" isLoading={cropState === 'submitting'}>
                  Save crops
                </Button>
              </FormActions>
            </Form>
          </Card>
        )}
      </PageSection>

      {/* ── Identity verification ────────────────────────────────────────── */}
      <PageSection
        title="Identity verification"
        description="Verified farmers can list produce and carry a badge buyers can see. UmojaHub checks the document you submit against the name on your account."
      >
        {farmerData.verificationStatus === VerificationStatus.APPROVED && (
          <Alert tone="success">
            Verified. Document on file: {farmerData.documentType ?? '—'}
          </Alert>
        )}

        {farmerData.verificationStatus === VerificationStatus.PENDING && (
          <Alert tone="info">
            Your verification is under review. Most submissions are decided within two working days,
            and you will be emailed either way.
          </Alert>
        )}

        {canSubmitVerification && (
          <Card>
            <form className="space-y-6" onSubmit={(e) => void handleVerifySubmit(e)}>
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

            <div className="flex flex-col gap-2">
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

            <FormActions note="An administrator reviews every submission by hand. You will be emailed with the decision.">
              <Button
                type="submit"
                isLoading={verifyState === 'submitting'}
                disabled={uploadState === 'uploading' || verifyForm.documentImageUrl === ''}
              >
                Submit for verification
              </Button>
            </FormActions>
            </form>
          </Card>
        )}
      </PageSection>

      {/* ── Group membership (UI-05) ─────────────────────────────────────── */}
      <LinkGroupTokenForm />

      {/* ── Trust score breakdown — shown only when APPROVED ─────────────── */}
      {farmerData.verificationStatus === VerificationStatus.APPROVED && (
        <PageSection
          title="Trust score breakdown"
          description="Buyers see your composite score before they order. Each part below moves independently, so you can tell exactly what would raise it."
        >
          <Card pad="generous" className="space-y-6">
            {scoreFactors.map(({ label, score, max }) => (
              <div key={label} className="space-y-2">
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
            <div className="flex items-center justify-between gap-3 border-t border-app-hairline pt-5">
              <span className="app-body-strong text-app-ink">Composite score</span>
              <span className="app-data-l text-app-brand">
                {trustScore.compositeScore} / 100
              </span>
            </div>
          </Card>
        </PageSection>
      )}
    </Page>
  );
}
