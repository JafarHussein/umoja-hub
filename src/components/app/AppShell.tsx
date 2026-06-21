'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { NavItem } from './Nav';

// App design-system AppShell — the dashboard chrome (Figma hi-fi role shells):
// a 248px sidebar (brand + nav + footer slot) and a main column with a 64px
// topbar (title + right slot) over scrollable content. Carries the `.theme-app`
// scope for the whole product surface. Props-driven so each role layout supplies
// its own nav, title, trust chip, and footer.
//
// Responsive: on `lg+` the sidebar is a static 248px column. Below `lg` it
// collapses into a slide-in drawer toggled by a topbar hamburger (with a
// backdrop), so the main content takes the full width on phones/tablets instead
// of being squeezed into an unusable strip.
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
}

export interface IAppShellProps {
  nav: IAppNavSpec[];
  /** Current pathname; a nav item is active when the path starts with its href. */
  currentPath: string;
  /** Topbar left — usually the page title. */
  title?: React.ReactNode;
  /** Topbar right — trust chip, avatar, actions. */
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
          'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-app-hairline bg-app-card',
          'transition-transform duration-200 ease-standard',
          'lg:static lg:z-auto lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center gap-1 px-4 py-5">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">{brand.replace(/^Umoja/, '')}</span>
        </div>
        {/* Clicking any nav item navigates and closes the mobile drawer. */}
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2"
          onClick={() => setNavOpen(false)}
        >
          {nav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(currentPath, item.href, item.exact)}
            />
          ))}
        </nav>
        {sidebarFooter && (
          <div className="border-t border-app-hairline px-4 py-3">{sidebarFooter}</div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-app-hairline bg-app-card px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              className="-ml-1 shrink-0 rounded-app-control p-2 text-app-muted hover:bg-app-sunken hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="app-title min-w-0 truncate text-app-ink">{title}</div>
          </div>
          {topbarRight && <div className="flex shrink-0 items-center gap-3">{topbarRight}</div>}
        </header>
        <main className="flex-1 overflow-y-auto bg-app-canvas p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export { isActive as isNavActive };
