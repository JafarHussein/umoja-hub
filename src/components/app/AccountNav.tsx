'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { homeForRole } from '@/lib/auth/dashboards';
import { Role } from '@/types';

/**
 * The account control for public headers (marketplace, website).
 *
 * Those headers used to hardcode "Sign in", so a signed-in buyer browsing the
 * marketplace was told to sign in — the app looked logged out and logged in at
 * the same time. The pages themselves are statically cached, which is why the
 * fix is a client component: it reads the session in the browser and leaves the
 * page's caching untouched.
 *
 * While the session resolves we render a neutral placeholder rather than the
 * signed-out links. Rendering "Sign in" first and correcting it a moment later
 * is the same bug in miniature — a visible flash of the wrong state on every
 * page load.
 */

export interface IAccountNavProps {
  /** Marketplace shows a seller entry point alongside the account link. */
  showSellLink?: boolean;
  className?: string;
}

const linkClass =
  'app-nav whitespace-nowrap text-app-body transition-colors duration-150 hover:text-app-ink';

const primaryClass =
  'app-nav whitespace-nowrap rounded-app-control bg-app-brand px-3.5 py-2 text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover';

export function AccountNav({ showSellLink = false, className }: IAccountNavProps): React.ReactElement {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={cn('flex items-center gap-4', className)} aria-hidden="true">
        <span className="skeleton h-4 w-20 rounded-app-cell" />
        <span className="skeleton h-9 w-24 rounded-app-control" />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user) {
    const role = (session.user.role ?? null) as Role | null;
    const firstName = session.user.firstName ?? 'My account';

    return (
      <div className={cn('flex items-center gap-4', className)}>
        {/* Selling is a farmer's action. A farmer gets their listings; anyone
            else simply isn't offered it, instead of being sent to a login
            screen they have no use for — they are already signed in, and
            signing in again would not make them a farmer. */}
        {showSellLink && role === Role.FARMER && (
          <Link href="/dashboard/farmer/listings" className={linkClass}>
            Sell produce
          </Link>
        )}
        <Link href={homeForRole(role)} className={primaryClass}>
          {firstName}
          <span className="sr-only"> — go to your dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Becoming a seller starts with creating an account, not with the
          returning-user sign-in screen. */}
      {showSellLink && (
        <Link href="/onboarding/welcome" className={linkClass}>
          Sell produce
        </Link>
      )}
      <Link href="/auth/login" className={linkClass}>
        Sign in
      </Link>
      <Link href="/onboarding/welcome" className={primaryClass}>
        Create account
      </Link>
    </div>
  );
}

/**
 * Compact account entry for narrow viewports, where the full nav is hidden.
 * Same rule as above: it points at the signed-in user's own dashboard rather
 * than at a sign-in screen they don't need.
 */
export function MobileAccountLink({ className }: { className?: string }): React.ReactElement {
  const { data: session, status } = useSession();

  const authed = status === 'authenticated' && Boolean(session?.user);
  const role = (session?.user?.role ?? null) as Role | null;
  const href = authed ? homeForRole(role) : '/auth/login';
  const label = authed ? 'Go to your dashboard' : 'Sign in';

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-app-control border text-app-body transition-colors duration-150 hover:border-app-border-strong',
        authed ? 'border-app-brand text-app-brand' : 'border-app-hairline',
        className
      )}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 15a5.5 5.5 0 0111 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
