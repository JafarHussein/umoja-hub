'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, VerificationStatus, FarmerTrustTier, DocumentType, DOCUMENT_TYPE_LABEL } from '@/types';
import {
  Alert,
  Button,
  buttonVariants,
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

type PageState = 'loading' | 'ready' | 'error';
type SubmitState = 'idle' | 'submitting' | 'error';

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
            Verified. Document on file:{' '}
            {farmerData.documentType ? DOCUMENT_TYPE_LABEL[farmerData.documentType] : '—'}
          </Alert>
        )}

        {farmerData.verificationStatus === VerificationStatus.PENDING && (
          <Alert tone="info">
            Your verification is under review. Most submissions are decided within two working days,
            and you will be emailed either way.
          </Alert>
        )}

        {/* The form itself lives at /dashboard/verify — one screen, shared by
            every role, so the document request cannot drift between the places
            that make it. This section states where the account stands and sends
            the farmer there when there is something to do. */}
        {canSubmitVerification && (
          <Card>
            <p className="app-body text-app-body">
              {farmerData.verificationStatus === VerificationStatus.REJECTED
                ? 'Your last submission was not accepted. You can submit a new document at any time.'
                : 'You have not submitted a document yet. Until you do, you can browse and plan but not publish produce.'}
            </p>
            <div className="mt-5">
              <Link href="/dashboard/verify" className={buttonVariants({ variant: 'primary' })}>
                {farmerData.verificationStatus === VerificationStatus.REJECTED
                  ? 'Submit a new document'
                  : 'Verify my identity'}
              </Link>
            </div>
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
