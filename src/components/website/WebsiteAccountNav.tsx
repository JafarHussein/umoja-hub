'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { homeForRole } from '@/lib/auth/dashboards';
import type { Role } from '@/types';

/**
 * The account area of the website header.
 *
 * The header is a server component and the pages it sits on are statically
 * generated, so it had no way to know who was reading it: every visitor was
 * offered "Sign in" and "Get started", including people who were already
 * signed in. Only this small piece is a client component, so the pages stay
 * static and keep their SEO behaviour.
 *
 * It deliberately does not reuse the app's `AccountNav`. That component is
 * written against the `.theme-app` tokens, which do not exist on the website's
 * light surface, and it belongs to a component library that is being rebuilt.
 * The website is shipped and must keep working, so the two surfaces share the
 * role→home map and nothing else.
 */

const mutedClass = 'font-body text-read-meta text-fg-muted';

const primaryClass =
  'inline-flex min-h-[40px] items-center rounded bg-brand px-3 font-body text-read-meta font-medium text-brand-fg transition-colors duration-150 hover:bg-brand-hover';

export function WebsiteAccountNav(): React.ReactElement {
  const { data: session, status } = useSession();

  // Showing the signed-out links first and correcting them a moment later is
  // the same defect in miniature, so hold a same-sized neutral space instead.
  //
  // These pages are statically generated and CDN-cached, so the server cannot
  // know who is reading — this branch is what every visitor receives as HTML.
  // The `noscript` copy keeps the sign-up path reachable without JavaScript,
  // where there is no session to get wrong anyway; browsers running JS ignore
  // it and get the resolved state below a moment later.
  if (status === 'loading') {
    return (
      <>
        <span aria-hidden="true" className="inline-flex min-h-[40px] w-28 items-center" />
        <noscript>
          <Link href="/auth/login" className={`${mutedClass} hover:text-fg`}>
            Sign in
          </Link>
          <Link href="/onboarding/welcome" className={`ml-4 ${primaryClass}`}>
            Get started
          </Link>
        </noscript>
      </>
    );
  }

  if (status === 'authenticated' && session?.user) {
    const role = (session.user.role ?? null) as Role | null;
    const firstName = session.user.firstName;

    return (
      <>
        {firstName && (
          <span className={`hidden sm:inline ${mutedClass}`}>Signed in as {firstName}</span>
        )}
        <Link href={homeForRole(role)} className={primaryClass}>
          Go to dashboard
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/auth/login" className={`${mutedClass} hover:text-fg`}>
        Sign in
      </Link>
      {/* "Get started" is the sign-UP path. It used to point at /auth/login,
          which sent every new visitor to the returning-user screen and left
          them to find the create-account link at the bottom of it. */}
      <Link href="/onboarding/welcome" className={primaryClass}>
        Get started
      </Link>
    </>
  );
}
