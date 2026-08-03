/**
 * Website header (foundation §10 IA: visible primary nav, never hamburger-only).
 * Minimal and honest: wordmark + sign-in. Topic navigation lives in the
 * persistent index, not here. Server component.
 */
import Link from 'next/link';

export function WebsiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-read-h3 text-fg">
          Umoja<span className="text-brand-text">Hub</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4">
          <Link href="/auth/login" className="font-body text-read-meta text-fg-muted hover:text-fg">
            Sign in
          </Link>
          {/* "Get started" is the sign-UP path. It used to point at /auth/login,
              which sent every new visitor to the returning-user screen and left
              them to find the create-account link at the bottom of it. */}
          <Link
            href="/onboarding/welcome"
            className="inline-flex min-h-[40px] items-center rounded bg-brand px-3 font-body text-read-meta font-medium text-brand-fg transition-colors duration-150 hover:bg-brand-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
