import Link from 'next/link';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { Footer } from '@/components/website/Footer';

/**
 * Global 404 (foundation §13 — the public website is the root surface). Renders
 * in the root layout, which defaults to the dark product theme, so it opts into
 * `theme-website` (light) itself and reuses the website chrome to stay part of
 * the documentation surface. Catches both unmatched URLs and `notFound()` calls
 * that bubble up (e.g. an unknown `/for/<slug>` doorway). Server component.
 * Copy is plain and non-marketing (WEBSITE_PURPOSE_V1 Principle 1).
 */
export default function NotFound() {
  return (
    <div className="theme-website flex min-h-screen flex-col bg-background text-fg">
      <WebsiteNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-20">
        <div className="max-w-reading">
          <p className="font-mono text-read-meta uppercase tracking-wide text-fg-subtle">
            404 · Page not found
          </p>
          <h1 className="mt-2 font-heading text-display-sm text-fg">This page does not exist</h1>
          <p className="mt-4 font-body text-read-lead text-fg-muted">
            The address you followed isn’t part of the documentation. Nothing was removed — the link
            was most likely mistyped or out of date.
          </p>
          <p className="mt-6 font-body text-read-body text-fg">
            <Link href="/" className="text-brand-text underline underline-offset-4">
              Go to the documentation
            </Link>{' '}
            to read the whole platform top to bottom — no account required.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
