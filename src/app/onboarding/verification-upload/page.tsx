'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input, Select, Button } from '@/components/app';
import { Role, DocumentType } from '@/types';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student',
  LECTURER: '/dashboard/lecturer/queue',
};

// Unsigned Cloudinary upload — returns the secure res.cloudinary.com URL the
// onboarding verification schemas require.
async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Uploads are not configured. Contact support.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = (await res.json()) as { secure_url?: string };
  if (!res.ok || !data.secure_url) throw new Error('Upload failed. Please try again.');
  return data.secure_url;
}

export default function VerificationUploadPage(): React.ReactElement {
  const { data: session } = useSession();
  const role = session?.user?.role ?? null;

  if (role === Role.STUDENT) return <StudentVerification />;
  if (role === Role.FARMER || role === Role.BUYER || role === Role.LECTURER) {
    return <DocumentVerification role={role} />;
  }

  return (
    <OnboardingShell step={3} title="Verify your account">
      <p className="app-body text-app-muted">Loading your details…</p>
    </OnboardingShell>
  );
}

// ---------------------------------------------------------------------------
// SCR-ONB-004 — student institutional-email pin card with expiry countdown.
// ---------------------------------------------------------------------------
function StudentVerification(): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();
  const [phase, setPhase] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (expiresAt === null) return;
    const tick = (): void => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  async function issuePin(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/institutional-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionalEmail: email }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not send a code.');
        return;
      }
      const exp = (data as { data?: { expiresAt?: string } }).data?.expiresAt;
      setExpiresAt(exp ? new Date(exp).getTime() : Date.now() + 15 * 60 * 1000);
      setPhase('pin');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyPin(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/institutional-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Incorrect code.');
        return;
      }
      await update();
      router.push(DASHBOARD_BY_ROLE.STUDENT ?? '/dashboard/student');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const expired = phase === 'pin' && secondsLeft === 0;

  return (
    <OnboardingShell
      step={3}
      title="Verify you're a student"
      subtitle="We'll email a 6-digit code to your university address."
      illustration="/illustrations/concepts/concept-verification.svg"
    >
      {error && <OnboardingError message={error} />}

      {phase === 'email' ? (
        <form onSubmit={issuePin} noValidate className="flex flex-col gap-4">
          <Input
            type="email"
            label="University email"
            placeholder="you@students.uonbi.ac.ke"
            hint="Must be a recognised university domain"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Button type="submit" size="lg" isLoading={isLoading} disabled={!email.trim()} className="mt-2 w-full">
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyPin} noValidate className="flex flex-col gap-4">
          <Input
            type="text"
            inputMode="numeric"
            label="6-digit code"
            placeholder="000000"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
          <p className="app-meta text-app-faint">
            {expired
              ? 'Your code has expired. Request a new one.'
              : `Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
          </p>
          <Button type="submit" size="lg" isLoading={isLoading} disabled={pin.length !== 6 || expired} className="w-full">
            Verify and finish
          </Button>
          <button
            type="button"
            onClick={() => {
              setPhase('email');
              setPin('');
              setExpiresAt(null);
              setError('');
            }}
            className="app-meta text-app-brand hover:opacity-80"
          >
            Use a different email / resend code
          </button>
        </form>
      )}
    </OnboardingShell>
  );
}

// ---------------------------------------------------------------------------
// SCR-ONB-005 — document/certificate upload (farmer / buyer / lecturer).
// ---------------------------------------------------------------------------
function DocumentVerification({ role }: { role: Role }): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const copy = VERIFICATION_COPY[role] ?? DEFAULT_COPY;

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState('uploading');
    setError('');
    setFileUrl('');
    try {
      const url = await uploadToCloudinary(file);
      setFileUrl(url);
      setUploadState('done');
    } catch (err) {
      setUploadState('error');
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let body: Record<string, string>;
      if (role === Role.FARMER) {
        body = { documentType, documentNumber, documentImageUrl: fileUrl };
      } else if (role === Role.BUYER) {
        body = { taxComplianceCertificate: fileUrl };
      } else {
        body = { facultyCredentialLetterUrl: fileUrl };
      }

      const res = await fetch('/api/onboarding/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Could not submit your documents.');
        return;
      }
      await update();
      router.push(DASHBOARD_BY_ROLE[role] ?? '/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const farmerReady = role !== Role.FARMER || (documentType !== '' && documentNumber.trim() !== '');
  const canSubmit = uploadState === 'done' && fileUrl !== '' && farmerReady && !isLoading;

  return (
    <OnboardingShell
      step={3}
      title={copy.title}
      subtitle={copy.subtitle}
      illustration="/illustrations/concepts/concept-data-security.svg"
    >
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {role === Role.FARMER && (
          <>
            <Select
              id="documentType"
              label="Document type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              required
            >
              <option value="">Select a document</option>
              <option value={DocumentType.NATIONAL_ID}>National ID</option>
              <option value={DocumentType.COOPERATIVE_CARD}>Cooperative card</option>
              <option value={DocumentType.PASSPORT}>Passport</option>
            </Select>
            <Input
              label="Document number"
              placeholder="e.g. 12345678"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
            />
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="document" className="app-label text-app-body">
            {copy.fileLabel}
          </label>
          <input
            id="document"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => void handleFile(e)}
            disabled={uploadState === 'uploading'}
            className="app-meta text-app-muted file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-1.5 file:text-app-ink"
          />
          {uploadState === 'uploading' && (
            <p className="app-meta text-app-faint">Uploading…</p>
          )}
          {uploadState === 'done' && (
            <p className="app-meta text-app-brand">Upload complete.</p>
          )}
        </div>

        <Button type="submit" size="lg" isLoading={isLoading} disabled={!canSubmit} className="mt-2 w-full">
          Submit and finish
        </Button>
        <p className="app-meta text-app-faint">
          You can start using UmojaHub right away, and an administrator reviews your documents separately.
        </p>
      </form>
    </OnboardingShell>
  );
}

interface IVerificationCopy {
  title: string;
  subtitle: string;
  fileLabel: string;
}

const DEFAULT_COPY: IVerificationCopy = {
  title: 'Verify your account',
  subtitle: 'Upload the requested document.',
  fileLabel: 'Document',
};

const VERIFICATION_COPY: Record<string, IVerificationCopy> = {
  FARMER: {
    title: 'Verify your identity',
    subtitle: 'Upload an identity document so we can verify your farm.',
    fileLabel: 'Document photo',
  },
  BUYER: {
    title: 'Verify your business',
    subtitle: 'Upload your KRA tax compliance certificate.',
    fileLabel: 'Tax compliance certificate',
  },
  LECTURER: {
    title: 'Verify your faculty role',
    subtitle: 'Upload a faculty credential letter from your institution.',
    fileLabel: 'Faculty credential letter',
  },
};
