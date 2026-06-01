'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';

interface IContextEntry {
  id: string;
  industryName: string;
  description: string;
  targetTiers: string[];
  problemDomains: string[];
}

interface ILibrary {
  version: number;
  createdAt: string;
  contexts: IContextEntry[];
}

type PageState = 'loading' | 'ready' | 'empty' | 'error';
type PublishState = 'idle' | 'submitting';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-48 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-1.5">
              <div className="h-4 w-40 bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-3 w-64 bg-surface-secondary rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_JSON = JSON.stringify(
  [
    {
      id: 'agri-tech-01',
      industryName: 'Agricultural Technology',
      description: 'Digital solutions for Kenyan smallholder farmers.',
      clientPersonaTemplate: {
        businessTypes: ['Cooperative', 'NGO', 'County Government'],
        counties: ['Nakuru', 'Meru', 'Kisumu'],
        contexts: ['Mobile-first', 'Intermittent connectivity', 'M-Pesa integration'],
      },
      problemDomains: ['Market access', 'Crop monitoring', 'Input verification'],
      kenyanConstraints: ['Low bandwidth', 'Feature phone users', 'Swahili localisation'],
      exampleProjects: ['Produce price tracker', 'Fertiliser authenticity scanner'],
      targetTiers: ['BEGINNER', 'INTERMEDIATE'],
    },
  ],
  null,
  2
);

export default function BriefContextsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [library, setLibrary] = useState<ILibrary | null>(null);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);

  const fetchLibrary = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/brief-contexts');
      if (res.status === 404) {
        setPageState('empty');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: ILibrary };
      setLibrary(body.data);
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchLibrary();
    }
  }, [status, session, router, fetchLibrary]);

  async function handlePublish(): Promise<void> {
    setPublishError(null);

    let contexts: unknown;
    try {
      contexts = JSON.parse(jsonInput);
    } catch {
      setPublishError('Invalid JSON. Please check the format and try again.');
      return;
    }

    if (!Array.isArray(contexts) || contexts.length === 0) {
      setPublishError('JSON must be a non-empty array of context objects.');
      return;
    }

    setPublishState('submitting');

    try {
      const res = await fetch('/api/admin/brief-contexts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexts }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setPublishError(body.error ?? 'Failed to publish. Check the JSON matches the required schema.');
        setPublishState('idle');
        return;
      }

      setPublishState('idle');
      setShowPublishForm(false);
      setJsonInput('');
      setPageState('loading');
      void fetchLibrary();
    } catch {
      setPublishError('Network error. Try again.');
      setPublishState('idle');
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load brief context library.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchLibrary(); }}
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
              Admin · Brief Context Library
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              Brief Contexts
            </h1>
            {library && (
              <p className="text-t5 font-mono text-text-secondary mt-1 tabular-nums">
                Version {library.version} · Published{' '}
                {new Date(library.createdAt).toLocaleDateString('en-KE', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => { setShowPublishForm((v) => !v); setPublishError(null); }}
          >
            {showPublishForm ? 'Cancel' : 'Publish new version'}
          </Button>
        </div>

        {/* Publish form */}
        {showPublishForm && (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              New library version
            </p>
            <p className="text-t5 font-body text-text-secondary">
              Paste a JSON array of context objects. Each object must include{' '}
              <span className="font-mono text-t6 text-text-primary">id</span>,{' '}
              <span className="font-mono text-t6 text-text-primary">industryName</span>,{' '}
              <span className="font-mono text-t6 text-text-primary">description</span>,{' '}
              <span className="font-mono text-t6 text-text-primary">targetTiers</span>, and{' '}
              <span className="font-mono text-t6 text-text-primary">clientPersonaTemplate</span>.
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={PLACEHOLDER_JSON}
              rows={16}
              className="w-full bg-surface-secondary border border-zinc-800/50 rounded-sm px-3 py-2.5 font-mono text-t6 text-text-primary placeholder-text-disabled resize-y focus:outline-none focus:border-accent-green/50 transition-colors duration-150"
            />
            {publishError && (
              <p className="text-t5 font-body text-red-400 bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2">
                {publishError}
              </p>
            )}
            <Button
              variant="primary"
              size="md"
              disabled={!jsonInput.trim() || publishState === 'submitting'}
              isLoading={publishState === 'submitting'}
              onClick={() => void handlePublish()}
            >
              Publish
            </Button>
          </div>
        )}

        {/* Current library */}
        {pageState === 'empty' || !library ? (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">No library published yet</p>
            <p className="text-t5 font-body text-text-disabled mt-1">
              Publish a version to enable AI brief generation with Kenyan industry context.
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Contexts · {library.contexts.length}
              </p>
            </div>
            {library.contexts.map((ctx, i) => (
              <div key={ctx.id ?? i} className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-t5 font-body text-text-primary">{ctx.industryName}</p>
                    <p className="text-t6 font-body text-text-secondary line-clamp-2">{ctx.description}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {ctx.targetTiers.map((tier) => (
                      <Badge key={tier} variant="neutral" label={tier} />
                    ))}
                  </div>
                </div>
                {ctx.problemDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {ctx.problemDomains.slice(0, 4).map((domain) => (
                      <span
                        key={domain}
                        className="text-t6 font-mono text-text-disabled bg-surface-secondary border border-zinc-800/50 rounded-[2px] px-2 py-0.5"
                      >
                        {domain}
                      </span>
                    ))}
                    {ctx.problemDomains.length > 4 && (
                      <span className="text-t6 font-mono text-text-disabled px-1">
                        +{ctx.problemDomains.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
