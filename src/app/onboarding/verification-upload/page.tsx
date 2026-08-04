'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input, Select, Button } from '@/components/app';
import { Role, DocumentType, BuyerType } from '@/types';
import { OnboardingShell, OnboardingError } from '../_components/OnboardingShell';

// This screen is the one funnel stage that is not universal, so it extends the
// shared rail rather than living inside it.
const VERIFY_STEPS = ['Password', 'Role', 'Details', 'Verification'];

const DASHBOARD_BY_ROLE: Record<string, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student',
  LECTURER: '/dashboard/lecturer/queue',
};

// Server-side upload via /api/upload — returns the secure res.cloudinary.com URL
// the onboarding verification schemas require. The server uses the validated
// CLOUDINARY_* credentials, so this works in every environment (no reliance on
// build-time NEXT_PUBLIC_* vars that were silently undefined in production).
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'umojahub/verification');

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = (await res.json()) as { data?: { url?: string }; error?: string };
  if (!res.ok || !data.data?.url) {
    throw new Error(data.error ?? 'Upload failed. Please try again.');
  }
  return data.data.url;
}

export default function VerificationUploadPage(): React.ReactElement {
  const { data: session } = useSession();
  const role = session?.user?.role ?? null;
  // A buyer's verification follows the kind of buyer they said they were. An
  // individual is asked for an identity document; only a business is asked for
  // a KRA certificate. The value is read from the record written at the identity
  // step, so this screen cannot ask for something the account never claimed.
  const [buyerType, setBuyerType] = useState<BuyerType | null>(null);
  const [buyerTypeLoaded, setBuyerTypeLoaded] = useState(false);

  useEffect(() => {
    if (role !== Role.BUYER) {
      setBuyerTypeLoaded(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/buyers/me');
        const data = (await res.json()) as { data?: { buyerType?: BuyerType | null } };
        if (!cancelled) setBuyerType(data.data?.buyerType ?? null);
      } catch {
        if (!cancelled) setBuyerType(null);
      } finally {
        if (!cancelled) setBuyerTypeLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (role === Role.STUDENT) return <StudentVerification />;
  if (role === Role.FARMER || role === Role.LECTURER) {
    return <DocumentVerification role={role} />;
  }
  if (role === Role.BUYER && buyerTypeLoaded) {
    return <DocumentVerification role={role} buyerType={buyerType ?? BuyerType.INDIVIDUAL} />;
  }

  return (
    <OnboardingShell step={4} steps={VERIFY_STEPS} title="Verify your account">
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
      step={4}
      steps={VERIFY_STEPS}
      title="Verify you're a student"
      subtitle="We'll email a 6-digit code to your university address."
      note={{
        title: 'Why a university address?',
        body: 'It is the one thing that proves you are enrolled without asking you to upload a document. We only use it to confirm enrolment — lecturers see your work, never your inbox.',
      }}
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
function DocumentVerification({
  role,
  buyerType,
}: {
  role: Role;
  buyerType?: BuyerType;
}): React.ReactElement {
  const router = useRouter();
  const { update } = useSession();
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // An individual buyer is verified the same way a farmer is — by an identity
  // document — so the two share this branch. Only a registered business is asked
  // for a KRA certificate.
  const wantsIdentityDocument =
    role === Role.FARMER || (role === Role.BUYER && buyerType !== BuyerType.BUSINESS);

  const copy =
    (role === Role.BUYER && buyerType === BuyerType.INDIVIDUAL
      ? VERIFICATION_COPY.BUYER_INDIVIDUAL
      : VERIFICATION_COPY[role]) ?? DEFAULT_COPY;

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
        body =
          buyerType === BuyerType.BUSINESS
            ? { buyerType: BuyerType.BUSINESS, taxComplianceCertificate: fileUrl }
            : {
                buyerType: BuyerType.INDIVIDUAL,
                documentType,
                documentNumber,
                documentImageUrl: fileUrl,
              };
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

  const documentReady = !wantsIdentityDocument || (documentType !== '' && documentNumber.trim() !== '');
  const canSubmit = uploadState === 'done' && fileUrl !== '' && documentReady && !isLoading;

  return (
    <OnboardingShell
      step={4}
      steps={VERIFY_STEPS}
      title={copy.title}
      subtitle={copy.subtitle}
      note={{
        title: 'What happens to your document',
        body: 'It is stored privately and seen only by the administrator reviewing it. Buyers and other members never see the document itself — only that you passed the check.',
      }}
    >
      {error && <OnboardingError message={error} />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {wantsIdentityDocument && (
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
              {/* A cooperative card proves farm membership; it says nothing
                  about an individual buyer, so it is offered only to farmers. */}
              {role === Role.FARMER && (
                <option value={DocumentType.COOPERATIVE_CARD}>Cooperative card</option>
              )}
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
  // Buyer copy is keyed on the kind of buyer. `BUYER` is the business case; an
  // individual gets `BUYER_INDIVIDUAL` and is never shown the word "certificate".
  BUYER: {
    title: 'Verify your business',
    subtitle: 'Upload your KRA tax compliance certificate.',
    fileLabel: 'Tax compliance certificate',
  },
  BUYER_INDIVIDUAL: {
    title: 'Verify your identity',
    subtitle: 'Upload an identity document so farmers know who they are selling to.',
    fileLabel: 'Document photo',
  },
  LECTURER: {
    title: 'Verify your faculty role',
    subtitle: 'Upload a faculty credential letter from your institution.',
    fileLabel: 'Faculty credential letter',
  },
};
