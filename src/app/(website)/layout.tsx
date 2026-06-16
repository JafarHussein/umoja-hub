import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { Footer } from '@/components/website/Footer';
import { StreamIndex } from '@/components/website/StreamIndex';

/**
 * Public website layout — the light "website" mode of the one token system
 * (foundation §8). `theme-website` flips the semantic tokens to light within
 * this subtree; the product (dashboard) stays dark. Persistent index +
 * canonical spine per foundation §13.
 */
export const metadata: Metadata = {
  title: 'UmojaHub — Verification infrastructure for Kenya',
  description:
    'How UmojaHub verifies farmers and student projects, how the Farmer Trust Score works, and what the platform does and does not guarantee. No account required.',
};

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-website min-h-screen bg-background text-fg">
      <a
        href="#stream"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-fg"
      >
        Skip to content
      </a>
      <WebsiteNav />
      <div className="mx-auto max-w-6xl px-4 py-10 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <details className="mb-6 rounded border border-border lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-mono text-read-meta uppercase tracking-wide text-fg-subtle">
            Contents
          </summary>
          <div className="px-4 pb-4">
            <StreamIndex showHeading={false} />
          </div>
        </details>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <StreamIndex />
          </div>
        </aside>
        <main id="stream">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
