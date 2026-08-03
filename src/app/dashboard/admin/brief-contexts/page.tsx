'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Button, Alert, Page, PageHeader } from '@/components/app';

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
    <div className="mx-auto w-full max-w-app-page space-y-10">
      <div className="skeleton h-7 w-48 rounded" />
      <div className="skeleton h-64 rounded-app-card" />
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
        setPublishError(
          body.error ?? 'Could not publish. Check the JSON matches the required schema.'
        );
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load the brief context library</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setPageState('loading');
            void fetchLibrary();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Brief Contexts"
        description="The source material the AI draws on when it writes a student's project brief. Publishing a new version changes what every brief generated from now on is grounded in."
        meta={
          library ? (
            <>
              <span>Version {library.version}</span>
              <span>
                published{' '}
                {new Date(library.createdAt).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </>
          ) : undefined
        }
        actions={
          <Button
            variant={showPublishForm ? 'secondary' : 'primary'}
            onClick={() => {
              setShowPublishForm((v) => !v);
              setPublishError(null);
            }}
          >
            {showPublishForm ? 'Cancel' : 'Publish new version'}
          </Button>
        }
      />

      {/* Publish form */}
      {showPublishForm && (
        <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-6">
          <p className="app-label text-app-muted">New library version</p>
          <p className="app-body text-app-muted">
            Paste a JSON array of context objects. Each object must include{' '}
            <span className="app-data-m text-app-ink">id</span>,{' '}
            <span className="app-data-m text-app-ink">industryName</span>,{' '}
            <span className="app-data-m text-app-ink">description</span>,{' '}
            <span className="app-data-m text-app-ink">targetTiers</span>, and{' '}
            <span className="app-data-m text-app-ink">clientPersonaTemplate</span>.
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={PLACEHOLDER_JSON}
            rows={16}
            className="w-full resize-y rounded-app-control border border-app-border-strong bg-app-sunken px-3 py-2.5 font-app-mono text-[13px] leading-relaxed text-app-ink placeholder:text-app-faint transition-colors duration-150 focus:border-app-brand focus:outline-none focus:ring-2 focus:ring-app-brand/30"
          />
          {publishError && <Alert tone="danger">{publishError}</Alert>}
          <Button
            variant="primary"
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
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No library published yet</p>
          <p className="app-meta mt-1 text-app-faint">
            Publish a version to enable AI brief generation with Kenyan industry context.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          <div className="border-b border-app-hairline px-4 py-3">
            <p className="app-label text-app-muted">Contexts · {library.contexts.length}</p>
          </div>
          {library.contexts.map((ctx, i) => (
            <div key={ctx.id ?? i} className="space-y-1.5 border-b border-app-hairline px-4 py-3 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="app-body-strong text-app-ink">{ctx.industryName}</p>
                  <p className="app-meta line-clamp-2 text-app-muted">{ctx.description}</p>
                </div>
                <div className="flex flex-shrink-0 gap-1.5">
                  {ctx.targetTiers.map((tier) => (
                    <span
                      key={tier}
                      className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 text-app-muted"
                    >
                      {tier}
                    </span>
                  ))}
                </div>
              </div>
              {ctx.problemDomains.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {ctx.problemDomains.slice(0, 4).map((domain) => (
                    <span
                      key={domain}
                      className="app-meta rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-0.5 font-app-mono text-app-faint"
                    >
                      {domain}
                    </span>
                  ))}
                  {ctx.problemDomains.length > 4 && (
                    <span className="app-meta px-1 font-app-mono text-app-faint">
                      +{ctx.problemDomains.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
