'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';

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
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.STUDENT) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  const githubUrlTouched = githubUrl.length > 0;
  const isGithubUrlValid = GITHUB_REPO_PATTERN.test(githubUrl);
  const isSubmitDisabled =
    formState === 'generating' ||
    (track === ProjectTrack.OPEN_SOURCE && !isGithubUrlValid);

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
        setErrorMessage(body.error ?? 'Failed to generate brief. Please try again.');
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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-1.5">
          <div className="h-3 w-24 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-48 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }

  if (formState === 'generating') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-t4 font-body font-medium text-text-primary">
                Generating your brief...
              </p>
              <p className="text-t5 font-body text-text-secondary mt-0.5">
                This usually takes 10–20 seconds.
              </p>
            </div>
          </div>
          <div className="space-y-2" aria-hidden="true">
            <div className="h-4 w-44 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-4 w-32 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-4 w-40 bg-surface-secondary rounded-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
            Student · New Project
          </p>
          <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
            Create project brief
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Error bar */}
          {formState === 'error' && (
            <div
              className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-[4px]"
              role="alert"
            >
              <p className="text-t5 font-body text-red-400">
                {errorMessage ?? 'Something went wrong.'}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="text-t5 font-body text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors duration-150 ml-4 flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Track selector */}
          <div className="space-y-1.5">
            <p className="text-t5 font-body text-text-secondary">Project track</p>
            <div className="flex gap-2" role="group" aria-label="Project track">
              {(Object.values(ProjectTrack) as ProjectTrack[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrack(t)}
                  aria-pressed={track === t}
                  className={[
                    'flex-1 h-9 rounded-[4px] text-t5 font-body border transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green',
                    track === t
                      ? 'bg-accent-green text-surface-primary border-accent-green'
                      : 'bg-surface-secondary text-text-secondary border-zinc-800/50 hover:border-white/20',
                  ].join(' ')}
                >
                  {TRACK_LABEL[t]}
                </button>
              ))}
            </div>
            <p className="text-t6 font-body text-text-disabled">{TRACK_HINT[track]}</p>
          </div>

          {/* Tier selector */}
          <div className="space-y-1.5">
            <p className="text-t5 font-body text-text-secondary">Difficulty tier</p>
            <div className="flex gap-2" role="group" aria-label="Difficulty tier">
              {(Object.values(StudentTier) as StudentTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  aria-pressed={tier === t}
                  className={[
                    'flex-1 h-9 rounded-[4px] text-t5 font-body border transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green',
                    tier === t
                      ? 'bg-accent-green text-surface-primary border-accent-green'
                      : 'bg-surface-secondary text-text-secondary border-zinc-800/50 hover:border-white/20',
                  ].join(' ')}
                >
                  {TIER_LABEL[t]}
                </button>
              ))}
            </div>
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitDisabled}
            className="w-full"
          >
            Generate project brief
          </Button>
        </form>
      </div>
    </div>
  );
}
