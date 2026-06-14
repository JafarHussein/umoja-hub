'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

const NAV_LINKS = [
  { label: 'Food Security Hub ↓', href: '/for/farmers' },
  { label: 'Education Hub ↓', href: '/education' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Transparency', href: '/transparency' },
] as const;

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useGSAP(
    () => {
      gsap.from(navRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.35,
        ease: 'power3.out',
      });
    },
    { scope: navRef }
  );

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-bold text-fg text-lg tracking-tight hover:opacity-80 transition-opacity duration-fast ease-standard"
          >
            UmojaHub
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-fg-muted hover:text-fg transition-colors duration-fast ease-standard"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-5 py-2.5 rounded-sm bg-brand text-brand-fg text-sm font-semibold hover:bg-brand-hover active:scale-95 transition-all duration-fast ease-standard"
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-fg-muted hover:text-fg transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-border px-6 py-4 space-y-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="block text-base font-medium text-fg-muted hover:text-brand transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-5 py-2.5 rounded-sm bg-brand text-brand-fg text-sm font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
