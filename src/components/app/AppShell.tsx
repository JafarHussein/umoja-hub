'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { NavItem } from './Nav';

// App design-system AppShell — the dashboard chrome (Figma hi-fi role shells):
// a 268px sidebar (brand + nav + footer slot) and a main column with a quiet
// context bar over scrollable content. Carries the `.theme-app` scope for the
// whole product surface. Props-driven so each role layout supplies its own nav,
// location, trust chip, and footer.
//
// Two rules the shell enforces for every screen:
//
//   Gutters. The main column pads to the same rhythm at every breakpoint, and
//   the context bar pads to match, so the location label sits on the same left
//   edge as the page title beneath it.
//
//   Measure. Content is clamped so no screen stretches across a wide monitor.
//   The shell sets the outer bound; `Page` narrows it further per screen.
//
// The context bar is deliberately quiet. It says where you are; the page's own
// H1 says what this screen is. Two loud titles would compete, so only one is.
//
// Responsive: on `lg+` the sidebar is a static column. Below `lg` it collapses
// into a slide-in drawer toggled by a hamburger (with a backdrop), so the main
// content takes the full width on phones/tablets.
export interface IAppNavSpec {
  href: string;
  label: string;
  icon?: React.ReactNode;
  /**
   * Active only on an exact path match (default is prefix match). Use for a nav
   * item that lives at the dashboard root, so it doesn't stay active on every
   * nested route.
   */
  exact?: boolean;
  /**
   * Groups the item under a labelled heading in the sidebar. Items sharing a
   * section must be adjacent; the heading renders once, above the first of
   * them. Leave unset on short navs that read fine as a single list.
   */
  section?: string;
}

export interface IAppShellProps {
  nav: IAppNavSpec[];
  /** Current pathname; a nav item is active when the path starts with its href. */
  currentPath: string;
  /** Context bar left — where the user currently is. */
  title?: React.ReactNode;
  /** Context bar right — trust chip, avatar, actions. */
  topbarRight?: React.ReactNode;
  /** Sidebar footer — e.g. verification status. */
  sidebarFooter?: React.ReactNode;
  brand?: string;
  children: React.ReactNode;
}

function isActive(currentPath: string, href: string, exact = false): boolean {
  if (exact) return currentPath === href;
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({
  nav,
  currentPath,
  title,
  topbarRight,
  sidebarFooter,
  brand = 'UmojaHub',
  children,
}: IAppShellProps): React.ReactElement {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="theme-app flex h-screen overflow-hidden bg-app-canvas">
      {/* Mobile drawer backdrop */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[268px] shrink-0 flex-col border-r border-app-hairline bg-app-card',
          'transition-transform duration-200 ease-standard',
          'lg:static lg:z-auto lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-[76px] shrink-0 items-center gap-1 px-6">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">{brand.replace(/^Umoja/, '')}</span>
        </div>
        {/* Clicking any nav item navigates and closes the mobile drawer. */}
        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6"
          onClick={() => setNavOpen(false)}
        >
          {nav.map((item, index) => {
            const previousSection = index > 0 ? nav[index - 1]?.section : undefined;
            const startsSection = Boolean(item.section) && item.section !== previousSection;
            return (
              <React.Fragment key={item.href}>
                {startsSection && (
                  <p
                    className={cn(
                      'app-label px-3 pb-1.5 text-app-faint',
                      index === 0 ? 'pt-1' : 'pt-6'
                    )}
                  >
                    {item.section}
                  </p>
                )}
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(currentPath, item.href, item.exact)}
                />
              </React.Fragment>
            );
          })}
        </nav>
        {sidebarFooter && (
          <div className="shrink-0 border-t border-app-hairline px-6 py-5">{sidebarFooter}</div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-app-hairline bg-app-card px-5 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              className="-ml-2 shrink-0 rounded-app-control p-2 text-app-muted hover:bg-app-sunken hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="app-nav min-w-0 truncate text-app-muted">{title}</div>
          </div>
          {topbarRight && <div className="flex shrink-0 items-center gap-3">{topbarRight}</div>}
        </header>
        <main className="flex-1 overflow-y-auto bg-app-canvas px-5 py-8 sm:px-8 lg:px-10 lg:py-12 xl:px-12">
          <div className="mx-auto w-full max-w-app-wide">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { isActive as isNavActive };
