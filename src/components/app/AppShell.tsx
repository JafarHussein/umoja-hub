import * as React from 'react';
import { NavItem } from './Nav';

// App design-system AppShell — the dashboard chrome (Figma hi-fi role shells):
// fixed 248px sidebar (brand + nav + footer slot) and a main column with a
// 64px topbar (title + right slot) over scrollable content. Carries the
// `.theme-app` scope for the whole product surface. Props-driven so each role
// layout supplies its own nav, title, trust chip, and footer.
export interface IAppNavSpec {
  href: string;
  label: string;
  icon?: React.ReactNode;
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

function isActive(currentPath: string, href: string): boolean {
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
  return (
    <div className="theme-app flex h-screen overflow-hidden bg-app-canvas">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-app-hairline bg-app-card">
        <div className="flex items-center gap-1 px-4 py-5">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">{brand.replace(/^Umoja/, '')}</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          {nav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(currentPath, item.href)}
            />
          ))}
        </nav>
        {sidebarFooter && (
          <div className="border-t border-app-hairline px-4 py-3">{sidebarFooter}</div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-app-hairline bg-app-card px-6">
          <div className="app-title min-w-0 truncate text-app-ink">{title}</div>
          {topbarRight && <div className="flex shrink-0 items-center gap-3">{topbarRight}</div>}
        </header>
        <main className="flex-1 overflow-y-auto bg-app-canvas p-6">{children}</main>
      </div>
    </div>
  );
}

export { isActive as isNavActive };
