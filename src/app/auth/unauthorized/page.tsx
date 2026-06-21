'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/app';
import { Role } from '@/types';

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student/projects/new',
  LECTURER: '/dashboard/lecturer/reviews/pending',
  ADMIN: '/dashboard/admin/verification-queue',
  NGO: '/dashboard/ngo',
  EMPLOYER: '/dashboard/employer',
  INSTITUTION: '/dashboard/institution',
};

const ROLE_LABELS: Record<Role, string> = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  ADMIN: 'Admin',
  NGO: 'NGO',
  EMPLOYER: 'Employer',
  INSTITUTION: 'Institution',
};

export default function UnauthorizedPage(): React.ReactElement {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const dashboardUrl = user?.role
    ? (DASHBOARD_BY_ROLE[user.role] ?? '/dashboard')
    : '/auth/login';

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : null;

  function handleGoToDashboard(): void {
    router.push(dashboardUrl);
  }

  async function handleSignOut(): Promise<void> {
    await signOut({ callbackUrl: '/auth/login' });
  }

  return (
    <div className="theme-app flex min-h-screen items-center justify-center bg-app-canvas px-4">
      <div className="w-full max-w-sm text-center">
        {/* Error icon */}
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-card">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-app-muted"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="app-h1 mb-2 text-app-ink">Access denied</h1>

        {isLoading ? (
          <p className="app-body mb-6 text-app-muted">Checking your session&hellip;</p>
        ) : roleLabel ? (
          <p className="app-body mb-6 text-app-muted">
            You are signed in as a{' '}
            <span className="app-body-strong text-app-ink">{roleLabel}</span> and do not have
            permission to access this section.
          </p>
        ) : (
          <p className="app-body mb-6 text-app-muted">
            You do not have permission to access this page.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {user ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoToDashboard}
              className="w-full"
            >
              Go to my dashboard
            </Button>
          ) : (
            <Link href="/auth/login" className="block w-full">
              <Button variant="primary" size="lg" className="w-full">
                Sign in
              </Button>
            </Link>
          )}

          {user && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
