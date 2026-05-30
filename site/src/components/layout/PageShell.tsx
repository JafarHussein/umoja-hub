import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';

interface PageShellProps {
  readonly children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
