'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, Page, PageHeader } from '@/components/app';
import { Role, ProjectStatus } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

type PageState = 'loading' | 'ready';

interface IEngagementRef {
  _id: string;
}

interface IPastProject {
  _id: string;
  status: ProjectStatus;
  brief?: { title?: string };
  createdAt: string;
}

const STATUS_LABEL: Partial<Record<ProjectStatus, string>> = {
  [ProjectStatus.VERIFIED]: 'Complete',
  [ProjectStatus.DENIED]: 'Closed',
};

export default function StudentDashboardPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [past, setPast] = useState<IPastProject[]>([]);

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/engagements/me');
      if (!res.ok) {
        setPageState('ready');
        return;
      }
      const body = (await res.json()) as { data: IEngagementRef | null };
      if (body.data !== null) {
        router.push(`/dashboard/student/projects/${body.data._id}`);
        return;
      }

      // No *active* project does not mean no project. A student whose work has
      // been approved still has it, and until this screen listed it their
      // finished project was unreachable — the dashboard offered to start a new
      // one as though nothing had ever been built.
      try {
        const all = await fetch('/api/education/engagements');
        if (all.ok) {
          const list = (await all.json()) as { data: IPastProject[] };
          setPast(list.data ?? []);
        }
      } catch {
        // The empty state is still correct without it.
      }
      setPageState('ready');
    } catch {
      setPageState('ready');
    }
  }, [router]);

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
      void fetchEngagement();
    }
  }, [status, session, router, fetchEngagement]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-44 rounded" />
        <div className="skeleton h-56 rounded-app-card" />
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="My Projects"
        description="A project is one piece of real software, built against the theory you are being taught and reviewed by a lecturer as an engineer would review it."
      />

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="app-label text-app-muted">What you have built</p>
          {past.map((project) => (
            <Link
              key={project._id}
              href={`/dashboard/student/projects/${project._id}`}
              className="block rounded-app-card border border-app-hairline bg-app-card p-5 transition-colors duration-150 hover:border-app-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="app-body-strong text-app-ink">
                  {project.brief?.title ?? 'Untitled project'}
                </p>
                <span className="app-meta text-app-muted">
                  {STATUS_LABEL[project.status] ?? project.status.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <EmptyState
        title={
          past.length > 0
            ? 'Start the next one'
            : 'Turn what you are studying into something that runs'
        }
        description="Start a project, build the thing, and submit it for review. A lecturer reads your work and gives you written engineering feedback — on the architecture and the code, not just the report."
        action={{ label: 'Start a new project', href: '/dashboard/student/projects/new' }}
        hints={[
          {
            label: 'Find a mentor',
            href: '/dashboard/student/mentor',
            description: 'ask a lecturer before you are stuck',
          },
          {
            label: 'Review a peer',
            href: '/dashboard/student/peer-review',
            description: 'reading other people’s work sharpens your own',
          },
        ]}
      />
    </Page>
  );
}
