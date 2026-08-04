'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Button,
  Card,
  Input,
  Page,
  PageHeader,
  PageSection,
  Select,
  VerificationBadge,
} from '@/components/app';
import { homeForRole } from '@/lib/auth/dashboards';
import { describeUploadProblem, formatBytes, MAX_UPLOAD_BYTES, UPLOAD_ACCEPT_ATTRIBUTE, uploadFile } from '@/lib/uploads';
import { BuyerType, DocumentType, Role, VerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// /dashboard/verify — the one screen where an account proves who it is.
//
// This used to be the last step of a mandatory funnel, and it held the entire
// product hostage: a farmer who did not have their ID to hand at signup could
// not reach the marketplace, the prices, or their own dashboard. Verification is
// a prerequisite for *publishing produce and being trusted with money*, not for
// looking around, so it now lives here — a destination reached from the lockout
// on a restricted action, or volunteered from the profile. Arriving is a
// choice, and "Not now" is a real answer.
// ---------------------------------------------------------------------------

interface IVerificationState {
  role: Role;
  status: VerificationStatus;
  buyerType: BuyerType | null;
  isVerified: boolean;
}

type Load = 'loading' | 'ready' | 'error';

export default function VerifyPage(): React.ReactElement {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<IVerificationState | null>(null);
  const [load, setLoad] = useState<Load>('loading');

  const fetchState = useCallback(async (): Promise<void> => {
    setLoad('loading');
    try {
      const res = await fetch('/api/verification');
      const body = (await res.json()) as { data?: IVerificationState };
      if (!res.ok || !body.data) throw new Error('unavailable');
      setState(body.data);
      setLoad('ready');
    } catch {
      setLoad('error');
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role !== Role.STUDENT) {
      void fetchState();
    }
  }, [sessionStatus, session?.user?.role, fetchState]);

  const home = homeForRole(session?.user?.role ?? null);

  // Students prove enrolment with a university email rather than a document, so
  // they get their own flow — the endpoint above does not apply to them.
  if (sessionStatus === 'authenticated' && session?.user?.role === Role.STUDENT) {
    return <StudentVerification home={home} />;
  }

  if (sessionStatus === 'loading' || load === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (load === 'error' || !state) {
    return (
      <Page width="focus">
        <PageHeader title="Verify your account" />
        <Alert tone="danger">
          We could not load your verification status. Nothing has been lost — trying again usually
          clears it.
        </Alert>
        <div className="mt-4">
          <Button onClick={() => void fetchState()}>Try again</Button>
        </div>
      </Page>
    );
  }

  return <DocumentVerification state={state} home={home} onSubmitted={() => void fetchState()} />;
}

// ---------------------------------------------------------------------------
// Document submission — farmer, buyer (either archetype) and lecturer.
// ---------------------------------------------------------------------------

function DocumentVerification({
  state,
  home,
  onSubmitted,
}: {
  state: IVerificationState;
  home: string;
  onSubmitted: () => void;
}): React.ReactElement {
  const copy = COPY_FOR(state);
  const wantsIdentityDocument =
    state.role === Role.FARMER ||
    (state.role === Role.BUYER && state.buyerType !== BuyerType.BUSINESS);

  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileUrl('');
    setFileName(file.name);

    // Checked here, before a byte leaves the device. The server checks again.
    const problem = describeUploadProblem(file);
    if (problem) {
      setUploadState('error');
      setError(problem);
      return;
    }

    setUploadState('uploading');
    try {
      setFileUrl(await uploadFile(file, 'umojahub/verification'));
      setUploadState('done');
    } catch (err) {
      setUploadState('error');
      setError(err instanceof Error ? err.message : 'The upload did not complete.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const body =
        state.role === Role.LECTURER
          ? { facultyCredentialLetterUrl: fileUrl }
          : state.role === Role.BUYER
            ? state.buyerType === BuyerType.BUSINESS
              ? { buyerType: BuyerType.BUSINESS, taxComplianceCertificate: fileUrl }
              : {
                  buyerType: BuyerType.INDIVIDUAL,
                  documentType,
                  documentNumber,
                  documentImageUrl: fileUrl,
                }
            : { documentType, documentNumber, documentImageUrl: fileUrl };

      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      if (!res.ok) {
        if (data.details?.fieldErrors) setFieldErrors(data.details.fieldErrors);
        else setError(data.error ?? 'We could not submit your documents.');
        return;
      }
      onSubmitted();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const documentReady =
    !wantsIdentityDocument || (documentType !== '' && documentNumber.trim() !== '');
  const canSubmit = uploadState === 'done' && fileUrl !== '' && documentReady && !isSubmitting;
  const canSubmitVerification =
    state.status === VerificationStatus.UNSUBMITTED ||
    state.status === VerificationStatus.REJECTED;

  return (
    <Page width="focus">
      <PageHeader title={copy.title} description={copy.description} />

      <PageSection title="Status">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <StatusValue status={state.status} />
            <Link href={home} className="app-meta text-app-muted hover:text-app-ink">
              {canSubmitVerification ? 'Not now — take me back' : 'Back to my dashboard'}
            </Link>
          </div>
        </Card>
      </PageSection>

      {state.status === VerificationStatus.APPROVED && (
        <Alert tone="success">
          Your account is verified. There is nothing further to do here.
        </Alert>
      )}

      {state.status === VerificationStatus.PENDING && (
        <Alert tone="info">
          Your documents are with our review team. Most submissions are decided within two working
          days and you will be emailed either way. You can keep using UmojaHub in the meantime.
        </Alert>
      )}

      {canSubmitVerification && (
        <PageSection title={copy.formTitle} description={copy.formDescription}>
          <Card>
            <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-5">
              {state.status === VerificationStatus.REJECTED && (
                <Alert tone="danger">
                  Your previous submission was not accepted. Check that the document is in date, that
                  the whole page is in frame, and that the name matches your account, then submit
                  again.
                </Alert>
              )}
              {error && <Alert tone="danger">{error}</Alert>}

              {wantsIdentityDocument && (
                <>
                  <Select
                    id="documentType"
                    label="Document type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    error={fieldErrors['documentType']?.[0]}
                    required
                  >
                    <option value="">Select a document</option>
                    <option value={DocumentType.NATIONAL_ID}>National ID</option>
                    {/* A cooperative card proves farm membership; it says nothing
                        about an individual buyer, so it is offered only to farmers. */}
                    {state.role === Role.FARMER && (
                      <option value={DocumentType.COOPERATIVE_CARD}>Cooperative card</option>
                    )}
                    <option value={DocumentType.PASSPORT}>Passport</option>
                  </Select>
                  <Input
                    label="Document number"
                    placeholder="e.g. 12345678"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    error={fieldErrors['documentNumber']?.[0]}
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
                  accept={UPLOAD_ACCEPT_ATTRIBUTE}
                  onChange={(e) => void handleFile(e)}
                  disabled={uploadState === 'uploading'}
                  className="app-meta text-app-muted file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-1.5 file:text-app-ink hover:file:bg-app-sunken"
                />
                <p className="app-meta text-app-faint">
                  JPG, PNG, WebP or PDF · up to {formatBytes(MAX_UPLOAD_BYTES)}
                </p>
                {uploadState === 'uploading' && (
                  <p className="app-meta text-app-muted" role="status">
                    Uploading {fileName}…
                  </p>
                )}
                {uploadState === 'done' && (
                  <p className="app-meta text-app-success">Uploaded {fileName}.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
                  Submit for review
                </Button>
                <Link href={home} className="app-meta text-app-muted hover:text-app-ink">
                  Not now
                </Link>
              </div>
              <p className="app-meta text-app-faint">
                An administrator reviews every submission by hand and you will be emailed with the
                decision. Your document is stored privately and is never shown to other members —
                they see only that you passed the check.
              </p>
            </form>
          </Card>
        </PageSection>
      )}
    </Page>
  );
}

function StatusValue({ status }: { status: VerificationStatus }): React.ReactElement {
  switch (status) {
    case VerificationStatus.APPROVED:
      return <VerificationBadge state="verified" />;
    case VerificationStatus.PENDING:
      return <VerificationBadge state="pending" label="Under review" />;
    case VerificationStatus.REJECTED:
      return <VerificationBadge state="denied" label="Not accepted" />;
    default:
      // No badge for "not yet submitted" — a badge would imply a decision has
      // been made about this account, and none has.
      return <span className="app-body text-app-muted">Not yet submitted</span>;
  }
}

interface ICopy {
  title: string;
  description: string;
  formTitle: string;
  formDescription: string;
  fileLabel: string;
}

// Copy follows the archetype, never the role alone. An individual buyer is never
// shown the word "certificate" — asking them for one is what produced a live
// account holding a PNG in a field named `taxComplianceCertificate`.
function COPY_FOR(state: IVerificationState): ICopy {
  if (state.role === Role.FARMER) {
    return {
      title: 'Verify your identity',
      description:
        'Verified farmers can publish produce and carry a badge buyers can see. Buyers rank verified listings first, so this is the single biggest thing you can do for your sales.',
      formTitle: 'Your identity document',
      formDescription:
        'We check the name on the document against the name on your account. Nothing else is read from it.',
      fileLabel: 'Photo of your document',
    };
  }
  if (state.role === Role.LECTURER) {
    return {
      title: 'Verify your faculty role',
      description:
        'Verification confirms you teach at the institution on your account, which is what lets you review student work.',
      formTitle: 'Your faculty credential letter',
      formDescription:
        'A letter from your institution confirming your position. A departmental letterhead is enough.',
      fileLabel: 'Faculty credential letter',
    };
  }
  if (state.buyerType === BuyerType.BUSINESS) {
    return {
      title: 'Verify your business',
      description:
        'Verified buyers can place larger orders and farmers can see who they are selling to.',
      formTitle: 'Your KRA tax compliance certificate',
      formDescription:
        'The certificate confirms the business on your account is registered and in good standing.',
      fileLabel: 'Tax compliance certificate',
    };
  }
  return {
    title: 'Verify your identity',
    description:
      'Verification tells farmers who they are selling to, which is what makes them comfortable accepting larger orders.',
    formTitle: 'Your identity document',
    formDescription:
      'We check the name on the document against the name on your account. Nothing else is read from it.',
    fileLabel: 'Photo of your document',
  };
}

// ---------------------------------------------------------------------------
// Student — institutional email pin. Unchanged behaviour, relocated here so
// every role has one address for "prove who you are".
// ---------------------------------------------------------------------------

function StudentVerification({ home }: { home: string }): React.ReactElement {
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
    const tick = (): void =>
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
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
      const data = (await res.json()) as { error?: string; data?: { expiresAt?: string } };
      if (!res.ok) {
        setError(data.error ?? 'We could not send a code to that address.');
        return;
      }
      setExpiresAt(data.data?.expiresAt ? new Date(data.data.expiresAt).getTime() : Date.now() + 15 * 60 * 1000);
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
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'That code was not correct.');
        return;
      }
      await update();
      router.push(home);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const expired = phase === 'pin' && secondsLeft === 0;

  return (
    <Page width="focus">
      <PageHeader
        title="Verify you're a student"
        description="Your university email proves you are enrolled without asking you to upload a document. We use it only to confirm enrolment — lecturers see your work, never your inbox."
      />

      <Card>
        {error && (
          <div className="mb-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {phase === 'email' ? (
          <form onSubmit={(e) => void issuePin(e)} noValidate className="flex flex-col gap-4">
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
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" isLoading={isLoading} disabled={!email.trim()}>
                Send code
              </Button>
              <Link href={home} className="app-meta text-app-muted hover:text-app-ink">
                Not now
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void verifyPin(e)} noValidate className="flex flex-col gap-4">
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
                ? 'That code has expired. Request a new one.'
                : `Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" isLoading={isLoading} disabled={pin.length !== 6 || expired}>
                Verify
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
            </div>
          </form>
        )}
      </Card>
    </Page>
  );
}
