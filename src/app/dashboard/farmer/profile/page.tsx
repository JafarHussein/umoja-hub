'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, VerificationStatus, FarmerTrustTier, DocumentType } from '@/types';

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

  if (status === 'loading' || pageState === 'loading') {
    return <p className="p-4">Loading...</p>;
  }

  if (pageState === 'error') {
    return (
      <div className="p-4 flex flex-col gap-2">
        <p>Failed to load profile.</p>
        <button type="button" onClick={() => void fetchProfile()}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) return <></>;

  const { farmer, onboarded } = profile;
  const { farmerData, trustScore } = farmer;
  const canSubmitVerification =
    farmerData.verificationStatus === VerificationStatus.UNSUBMITTED ||
    farmerData.verificationStatus === VerificationStatus.REJECTED;

  return (
    <div className="flex flex-col gap-8 p-4">
      {/* ── Profile summary ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h1 className="text-base font-semibold">Farmer Profile</h1>
        <table className="border-collapse text-sm">
          <tbody>
            <tr className="border border-gray-300">
              <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50 w-40">Name</th>
              <td className="px-3 py-2 border border-gray-300">
                {farmer.firstName ?? '—'} {farmer.lastName ?? ''}
              </td>
            </tr>
            <tr className="border border-gray-300">
              <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50">County</th>
              <td className="px-3 py-2 border border-gray-300">{farmer.county ?? '—'}</td>
            </tr>
            <tr className="border border-gray-300">
              <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50">Phone</th>
              <td className="px-3 py-2 border border-gray-300">{farmer.phoneNumber ?? '—'}</td>
            </tr>
            <tr className="border border-gray-300">
              <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50">Trust tier</th>
              <td className="px-3 py-2 border border-gray-300">
                {trustScore.tier} — score: {trustScore.compositeScore}
              </td>
            </tr>
            <tr className="border border-gray-300">
              <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50">
                Verification
              </th>
              <td className="px-3 py-2 border border-gray-300">
                {farmerData.verificationStatus}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Farm details / onboarding ────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Farm Details</h2>
        {onboarded ? (
          <table className="border-collapse text-sm">
            <tbody>
              <tr className="border border-gray-300">
                <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50 w-40">
                  Crops grown
                </th>
                <td className="px-3 py-2 border border-gray-300">
                  {farmerData.cropsGrown.join(', ')}
                </td>
              </tr>
              <tr className="border border-gray-300">
                <th className="px-3 py-2 text-left border border-gray-300 bg-gray-50">
                  Farm size
                </th>
                <td className="px-3 py-2 border border-gray-300">
                  {farmerData.farmSizeAcres != null ? `${farmerData.farmSizeAcres} acres` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <form
            className="flex flex-col gap-3 border border-gray-300 p-4"
            onSubmit={(e) => void handleCropSubmit(e)}
          >
            <p className="text-sm">Profile incomplete. Add your crops to activate your account.</p>
            <div className="flex flex-col gap-1">
              <label htmlFor="cropsInput" className="text-sm font-medium">
                Crops grown <span className="text-gray-500">(comma-separated)</span>
              </label>
              <input
                id="cropsInput"
                type="text"
                className="border border-gray-300 px-2 py-1 text-sm"
                value={cropsInput}
                onChange={(e) => setCropsInput(e.target.value)}
                placeholder="Maize, Beans, Tomatoes"
                required
              />
            </div>
            {cropError !== null && (
              <p role="alert" className="text-sm text-red-600">
                {cropError}
              </p>
            )}
            <button
              type="submit"
              disabled={cropState === 'submitting'}
              className="self-start border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
            >
              {cropState === 'submitting' ? 'Saving...' : 'Save crops'}
            </button>
          </form>
        )}
      </section>

      {/* ── Identity verification ────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Identity Verification</h2>

        {farmerData.verificationStatus === VerificationStatus.APPROVED && (
          <p className="text-sm">
            Verified. Document on file: {farmerData.documentType ?? '—'}
          </p>
        )}

        {farmerData.verificationStatus === VerificationStatus.PENDING && (
          <p className="text-sm">Your verification is under review.</p>
        )}

        {canSubmitVerification && (
          <form
            className="flex flex-col gap-3 border border-gray-300 p-4"
            onSubmit={(e) => void handleVerifySubmit(e)}
          >
            {farmerData.verificationStatus === VerificationStatus.REJECTED && (
              <p className="text-sm text-red-600">
                Previous submission was rejected. Please resubmit with a valid document.
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="documentType" className="text-sm font-medium">
                Document type
              </label>
              <select
                id="documentType"
                className="border border-gray-300 px-2 py-1 text-sm"
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
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="documentNumber" className="text-sm font-medium">
                Document number
              </label>
              <input
                id="documentNumber"
                type="text"
                className="border border-gray-300 px-2 py-1 text-sm"
                value={verifyForm.documentNumber}
                onChange={(e) =>
                  setVerifyForm((prev) => ({ ...prev, documentNumber: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="documentImageUrl" className="text-sm font-medium">
                Document image URL
              </label>
              <input
                id="documentImageUrl"
                type="url"
                className="border border-gray-300 px-2 py-1 text-sm"
                value={verifyForm.documentImageUrl}
                onChange={(e) =>
                  setVerifyForm((prev) => ({ ...prev, documentImageUrl: e.target.value }))
                }
                placeholder="https://res.cloudinary.com/..."
                required
              />
            </div>

            {verifyError !== null && (
              <p role="alert" className="text-sm text-red-600">
                {verifyError}
              </p>
            )}

            <button
              type="submit"
              disabled={verifyState === 'submitting'}
              className="self-start border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
            >
              {verifyState === 'submitting' ? 'Submitting...' : 'Submit for verification'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
