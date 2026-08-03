/**
 * Website header (foundation §10 IA: visible primary nav, never hamburger-only).
 * Minimal and honest: wordmark + account. Topic navigation lives in the
 * persistent index, not here. Still a server component — only the account area
 * is client-rendered, so these pages stay statically generated.
 */
import Link from 'next/link';
import { WebsiteAccountNav } from './WebsiteAccountNav';

export function WebsiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-read-h3 text-fg">
          Umoja<span className="text-brand-text">Hub</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4">
          <WebsiteAccountNav />
        </nav>
      </div>
    </header>
  );
}
