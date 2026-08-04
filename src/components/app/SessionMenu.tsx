'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { homeForRole, ROLE_LABEL } from '@/lib/auth/dashboards';
import { Role } from '@/types';

/**
 * The account control for every authenticated surface.
 *
 * Sign-out used to live only in the role shells — `FarmerShell`, `BuyerShell`
 * and their six siblings — which meant it existed exactly when the user had a
 * role and a dashboard. The middleware holds a user with no role inside the
 * onboarding funnel (`middleware.ts`, onboarding lock), so the one person who
 * most needs to leave was the one person with no way to: no shell, therefore no
 * control, therefore no exit from the session at all.
 *
 * Ending a session is a property of holding one, not a dashboard feature. This
 * component is mounted wherever a session can exist — the funnel, the role
 * shells, and the public headers — so the answer to "how do I get out of this"
 * is always the same and always present.
 *
 * `identityOnly` covers the funnel, where there is no dashboard to link to yet.
 */

export interface ISessionMenuProps {
  /**
   * Hide the "Go to dashboard" item. Used mid-onboarding, where the user has no
   * role and `homeForRole(null)` would point back into the funnel they are
   * already standing in.
   */
  identityOnly?: boolean;
  className?: string;
}

function initialOf(name: string, email: string): string {
  return (name.trim()[0] ?? email.trim()[0] ?? '?').toUpperCase();
}

export function SessionMenu({
  identityOnly = false,
  className,
}: ISessionMenuProps): React.ReactElement | null {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Escape closes the menu. Someone reaching for a way out should not have to
  // find the exact pixel that dismisses it.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (status !== 'authenticated' || !session?.user) return null;

  const { firstName, email, role } = session.user;
  const name = firstName || email;
  const roleLabel = role ? ROLE_LABEL[role as Role] : 'Finishing setup';

  function handleSignOut(): void {
    setSigningOut(true);
    setOpen(false);
    void signOut({ callbackUrl: '/auth/login' });
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="app-nav flex h-11 items-center gap-2 rounded-app-control px-2 text-app-body transition-colors duration-150 hover:bg-app-sunken hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
      >
        <span
          aria-hidden
          className="app-label flex h-7 w-7 shrink-0 items-center justify-center rounded-app-pill bg-app-brand-surface text-app-brand"
        >
          {initialOf(firstName, email)}
        </span>
        <span className="hidden max-w-[12ch] truncate sm:block">{name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn('transition-transform duration-150', open && 'rotate-180')}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-app-card border border-app-hairline bg-app-card shadow-lg"
          >
            {/* Which account this is. The whole point of the control is being
                able to tell, and to change it. */}
            <div className="border-b border-app-hairline px-4 py-3">
              <p className="app-body-strong truncate text-app-ink">{name}</p>
              {/* Rendered only when there is one. An empty line here is worse
                  than no line: this block exists to answer "which account am I
                  in", so a blank where the address belongs reads as a fault. */}
              {email && <p className="app-meta truncate text-app-muted">{email}</p>}
              <p className="app-label mt-1.5 text-app-faint">{roleLabel}</p>
            </div>

            {!identityOnly && (
              <Link
                href={homeForRole((role ?? null) as Role | null)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="app-body flex min-h-[44px] items-center px-4 text-app-body transition-colors duration-150 hover:bg-app-sunken hover:text-app-ink"
              >
                Go to dashboard
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="app-body flex min-h-[44px] w-full items-center gap-2 border-t border-app-hairline px-4 text-left text-app-body transition-colors duration-150 hover:bg-app-sunken hover:text-app-ink disabled:opacity-60"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
