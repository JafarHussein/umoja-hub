'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack } from '@/types';
import {
  Button,
  Card,
  EmptyState,
  Form,
  FormActions,
  FormSection,
  Input,
  Page,
  PageHeader,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { loginUrlWithIntent } from '@/lib/auth/intent';

type FormState = 'form' | 'generating' | 'error';

const GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/;

interface IEngagementResult {
  _id: string;
}

const TRACK_LABEL: Record<ProjectTrack, string> = {
  [ProjectTrack.AI_BRIEF]: 'AI Brief',
  [ProjectTrack.LECTURER_ASSIGNED]: 'Set by a lecturer',
  [ProjectTrack.OPEN_SOURCE]: 'Open Source',
};

const TRACK_HINT: Record<ProjectTrack, string> = {
  [ProjectTrack.AI_BRIEF]:
    'A brief written for a real Kenyan client, against the units you are taking now.',
  [ProjectTrack.OPEN_SOURCE]:
    'A contribution plan for a real open-source repository, aimed at the part of it your units cover.',
  [ProjectTrack.LECTURER_ASSIGNED]:
    'A project one of your lecturers wrote for their own students. They know your cohort; the platform does not.',
};

interface IAssignmentOffer {
  _id: string;
  title: string;
  problemStatement: string;
  exercises: string[];
  matchesYourUnits: string[];
  setBy: string;
  full: boolean;
}

interface IAcademicContextView {
  programmeName: string;
  currentYear: number;
  currentSemester: number;
  currentUnits: Array<{ code?: string; title: string; areaLabels: string[] }>;
  provenanceLabel: string;
}

// Segmented control button for the track selector.
function SegButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // Sized to its label with a floor, not stretched: a two-option row and
        // a three-option row then read as the same kind of control.
        'app-body h-11 min-w-[9rem] rounded-app-control border px-5 transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
        selected
          ? 'border-app-brand bg-app-brand text-app-on-brand'
          : 'border-app-border-strong bg-app-card text-app-muted hover:border-app-brand'
      )}
    >
      {children}
    </button>
  );
}

export default function NewProjectPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>('form');
  const [track, setTrack] = useState<ProjectTrack>(ProjectTrack.AI_BRIEF);
  const [interest, setInterest] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [academic, setAcademic] = useState<IAcademicContextView | null>(null);
  const [academicLoaded, setAcademicLoaded] = useState(false);
  const [offers, setOffers] = useState<IAssignmentOffer[]>([]);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.STUDENT) {
        router.push('/auth/unauthorized');
        return;
      }
      // The brief is written from the coursework, so the coursework is fetched
      // before the form is offered — a student with none is sent to record it
      // rather than allowed to fill this in and be refused at the end.
      void (async () => {
        try {
          const [enrolmentRes, offersRes] = await Promise.all([
            fetch('/api/education/enrolment'),
            fetch('/api/education/assignments'),
          ]);
          if (enrolmentRes.ok) {
            const body = (await enrolmentRes.json()) as {
              data: { context: IAcademicContextView | null } | null;
            };
            setAcademic(body.data?.context ?? null);
          }
          if (offersRes.ok) {
            const body = (await offersRes.json()) as { data: IAssignmentOffer[] };
            setOffers(body.data);
            // A project a lecturer set for you leads. They teach you and the
            // generator does not, so if one is waiting it is the default.
            if (body.data.length > 0) {
              setTrack(ProjectTrack.LECTURER_ASSIGNED);
              const first = body.data.find((o) => !o.full);
              if (first) setAssignmentId(first._id);
            }
          }
        } catch {
          setAcademic(null);
        } finally {
          setAcademicLoaded(true);
        }
      })();
    }
  }, [status, session, router]);

  const githubUrlTouched = githubUrl.length > 0;
  const isGithubUrlValid = GITHUB_REPO_PATTERN.test(githubUrl);
  const isSubmitDisabled =
    formState === 'generating' ||
    (track === ProjectTrack.OPEN_SOURCE && !isGithubUrlValid) ||
    (track === ProjectTrack.LECTURER_ASSIGNED && assignmentId === null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFormState('generating');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/education/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track,
          ...(interest.trim() && { interest: interest.trim() }),
          ...(track === ProjectTrack.OPEN_SOURCE && { githubRepoUrl: githubUrl }),
          ...(track === ProjectTrack.LECTURER_ASSIGNED && assignmentId && { assignmentId }),
        }),
      });

      const body = (await res.json()) as { data?: IEngagementResult; error?: string };

      if (!res.ok) {
        setErrorMessage(body.error ?? 'Could not generate the brief. Please try again.');
        setFormState('error');
        return;
      }

      if (!body.data) {
        setErrorMessage('Unexpected server response. Please try again.');
        setFormState('error');
        return;
      }

      router.push(`/dashboard/student/projects/${body.data._id}`);
    } catch {
      setErrorMessage('Network error. Check your connection and try again.');
      setFormState('error');
    }
  }

  function handleRetry(): void {
    setErrorMessage(null);
    setFormState('form');
  }

  if (status === 'loading' || !academicLoaded) {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (!academic) {
    return (
      <Page width="focus">
        <PageHeader
          title="Create project brief"
          description="A project is written from what you are studying — the units you are taking decide what the work has to make you practise."
        />
        <EmptyState
          title="Tell us what you are studying first"
          description="We write the brief from the units you are carrying this semester. Record them once and it takes a minute; you can change them whenever your semester does."
          action={{ label: 'Record my coursework', href: '/dashboard/student/academic' }}
        />
      </Page>
    );
  }

  if (formState === 'generating') {
    return (
      <Page width="focus">
        <div className="flex items-center gap-2.5">
          <div
            className="h-2 w-2 flex-shrink-0 animate-pulse rounded-app-pill bg-app-brand"
            aria-hidden="true"
          />
          <div>
            <p className="app-body-strong text-app-ink">Generating your brief...</p>
            <p className="app-body mt-0.5 text-app-muted">This usually takes 10–20 seconds.</p>
          </div>
        </div>
        <div className="space-y-2" aria-hidden="true">
          <div className="skeleton h-4 w-44 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Create project brief"
        description="Your units decide what the project has to make you practise. You choose where the work comes from, and we write the brief against your coursework — then a lecturer reviews what you build against it."
      />

      {/* Stated before the form, not after it: the student should be able to see
          what their project is about to be written from, and correct it if the
          semester has moved on. */}
      <Card>
        <p className="app-label text-app-body">Your brief will be written from</p>
        <p className="app-body mt-1 text-app-ink">
          {academic.programmeName} · year {academic.currentYear}, semester{' '}
          {academic.currentSemester}
        </p>
        <ul className="mt-3 space-y-1">
          {academic.currentUnits.map((unit) => (
            <li key={`${unit.code ?? ''}${unit.title}`} className="app-body text-app-ink">
              {unit.code ? `${unit.code} · ` : ''}
              {unit.title}
              <span className="app-meta text-app-muted"> — {unit.areaLabels.join(', ')}</span>
            </li>
          ))}
        </ul>
        <p className="app-meta mt-3 text-app-muted">
          {academic.provenanceLabel}.{' '}
          <a
            href="/dashboard/student/academic"
            className="text-app-brand underline underline-offset-2"
          >
            Change what you are studying
          </a>
        </p>
      </Card>

      <Card pad="generous">
        <Form onSubmit={handleSubmit} noValidate>
          {/* Error bar */}
          {formState === 'error' && (
            <div
              className="flex items-center justify-between gap-4 rounded-app-control border border-app-danger/30 bg-app-danger-surface p-4"
              role="alert"
            >
              <p className="app-body text-app-danger">{errorMessage ?? 'Something went wrong.'}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="app-body shrink-0 text-app-danger underline underline-offset-2 transition-opacity duration-150 hover:opacity-80"
              >
                Retry
              </button>
            </div>
          )}

          <FormSection
            title="What kind of project?"
            description="The track decides where the work comes from — a brief we write for you, or a real open-source repository."
            divided={false}
          >
            {/* Track selector */}
            <div className="space-y-2.5">
              <p className="app-label text-app-body">Project track</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Project track">
                {/* The lecturer track is offered only when a lecturer has
                    actually set something. An option that is always empty and
                    always refuses teaches students to ignore it. */}
                {(Object.values(ProjectTrack) as ProjectTrack[])
                  .filter((t) => t !== ProjectTrack.LECTURER_ASSIGNED || offers.length > 0)
                  .map((t) => (
                    <SegButton key={t} selected={track === t} onClick={() => setTrack(t)}>
                      {TRACK_LABEL[t]}
                    </SegButton>
                  ))}
              </div>
              <p className="app-meta text-app-muted">{TRACK_HINT[track]}</p>
            </div>

            {/* The projects this student's own lecturers have set */}
            {track === ProjectTrack.LECTURER_ASSIGNED && (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <button
                    key={offer._id}
                    type="button"
                    disabled={offer.full}
                    aria-pressed={assignmentId === offer._id}
                    onClick={() => setAssignmentId(offer._id)}
                    className={cn(
                      'w-full rounded-app-control border p-4 text-left transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                      'disabled:cursor-not-allowed disabled:opacity-60',
                      assignmentId === offer._id
                        ? 'border-app-brand bg-app-brand-surface'
                        : 'border-app-hairline bg-app-card hover:border-app-border-strong'
                    )}
                  >
                    <p className="app-body-strong text-app-ink">{offer.title}</p>
                    <p className="app-meta mt-0.5 text-app-muted">Set by {offer.setBy}</p>
                    <p className="app-body mt-2 text-app-body">{offer.problemStatement}</p>
                    <p className="app-meta mt-2 text-app-muted">
                      Exercises {offer.exercises.join(', ')}.{' '}
                      {offer.matchesYourUnits.length > 0
                        ? `${offer.matchesYourUnits.join(', ')} ${offer.matchesYourUnits.length === 1 ? 'is' : 'are'} on your units this semester.`
                        : 'None of that is on your units this semester — your lecturer set it deliberately.'}
                      {offer.full ? ' This one is full.' : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* GitHub URL — OPEN_SOURCE only */}
            {track === ProjectTrack.OPEN_SOURCE && (
              <Input
                type="url"
                label="GitHub repository URL"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                hint="Must be a public repository (https://github.com/owner/repo)"
                error={
                  githubUrlTouched && !isGithubUrlValid
                    ? 'Enter a valid GitHub repository URL'
                    : undefined
                }
              />
            )}
          </FormSection>

          {track !== ProjectTrack.LECTURER_ASSIGNED && (
            <FormSection
              title="What kind of engineering interests you?"
            description="This decides which of several valid projects you get — never how demanding it is. Your units set the bar; this shapes the parts that are free."
          >
            <Input
              label="Engineering interest"
              optional
              placeholder="e.g. Backend systems, security, data engineering"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              hint="Leave this blank and we use the interest on your profile."
              />
            </FormSection>
          )}

          <FormActions
            note={
              track === ProjectTrack.LECTURER_ASSIGNED
                ? 'Your lecturer wrote this brief. Starting it opens your workspace straight away.'
                : "Generating the brief takes 10–20 seconds. You can start over if it isn't the project you wanted."
            }
          >
            <Button type="submit" disabled={isSubmitDisabled}>
              {track === ProjectTrack.LECTURER_ASSIGNED
                ? 'Start this project'
                : 'Generate project brief'}
            </Button>
          </FormActions>
        </Form>
      </Card>
    </Page>
  );
}
