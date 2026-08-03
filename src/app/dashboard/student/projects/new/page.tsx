'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import {
  Button,
  Card,
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
  [ProjectTrack.OPEN_SOURCE]: 'Open Source',
};

const TRACK_HINT: Record<ProjectTrack, string> = {
  [ProjectTrack.AI_BRIEF]: 'Receive an AI-generated client brief tailored to your tier.',
  [ProjectTrack.OPEN_SOURCE]: 'Contribute to a real open-source GitHub repository.',
};

const TIER_LABEL: Record<StudentTier, string> = {
  [StudentTier.BEGINNER]: 'Beginner',
  [StudentTier.INTERMEDIATE]: 'Intermediate',
  [StudentTier.ADVANCED]: 'Advanced',
};

// Segmented control button — shared by the track and tier selectors.
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
  const [tier, setTier] = useState<StudentTier>(StudentTier.BEGINNER);
  const [githubUrl, setGithubUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.STUDENT) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  const githubUrlTouched = githubUrl.length > 0;
  const isGithubUrlValid = GITHUB_REPO_PATTERN.test(githubUrl);
  const isSubmitDisabled =
    formState === 'generating' || (track === ProjectTrack.OPEN_SOURCE && !isGithubUrlValid);

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
          tier,
          ...(track === ProjectTrack.OPEN_SOURCE && { githubRepoUrl: githubUrl }),
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

  if (status === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
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
        description="Two choices decide what you get: the kind of work you want to do, and how hard it should be. We write the brief from those, and a lecturer reviews what you build against it."
      />

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
                {(Object.values(ProjectTrack) as ProjectTrack[]).map((t) => (
                  <SegButton key={t} selected={track === t} onClick={() => setTrack(t)}>
                    {TRACK_LABEL[t]}
                  </SegButton>
                ))}
              </div>
              <p className="app-meta text-app-muted">{TRACK_HINT[track]}</p>
            </div>

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

          <FormSection
            title="How hard should it be?"
            description="Pick the tier that stretches you. A harder tier carries more weight in your portfolio, but it is also more to see through to a verified decision."
          >
            <div className="space-y-2.5">
              <p className="app-label text-app-body">Difficulty tier</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty tier">
                {(Object.values(StudentTier) as StudentTier[]).map((t) => (
                  <SegButton key={t} selected={tier === t} onClick={() => setTier(t)}>
                    {TIER_LABEL[t]}
                  </SegButton>
                ))}
              </div>
            </div>
          </FormSection>

          <FormActions note="Generating the brief takes 10–20 seconds. You can start over if it isn't the project you wanted.">
            <Button type="submit" disabled={isSubmitDisabled}>
              Generate project brief
            </Button>
          </FormActions>
        </Form>
      </Card>
    </Page>
  );
}
