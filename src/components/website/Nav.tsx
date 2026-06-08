'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

const NAV_LINKS = [
  { label: 'Food Security Hub', href: '/for/farmers' },
  { label: 'Education Hub', href: '/education' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Transparency', href: '/transparency' },
] as const;

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      className="fixed top-0 left-0 right-0 z-50 bg-canvas-base transition-shadow duration-fast ease-standard"
      style={{
        boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        borderBottom: scrolled ? '1px solid var(--ws-border-soft)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-jakarta font-700 text-ws-text-heading text-[1.125rem] tracking-[-0.02em] hover:text-copper transition-colors duration-fast ease-standard"
          >
            UmojaHub
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-jakarta text-[0.9375rem] font-500 text-ws-text-secondary hover:text-ws-text-heading transition-colors duration-fast ease-standard"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="font-jakarta text-[0.9375rem] font-500 text-ws-text-secondary hover:text-ws-text-heading transition-colors duration-fast ease-standard"
            >
              Sign in
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 rounded-sm bg-copper text-white font-jakarta text-[0.9375rem] font-600 hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-ws-text-secondary hover:text-ws-text-heading transition-colors"
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
        <div className="md:hidden bg-canvas-base border-t border-ws-border-soft px-6 py-4 space-y-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="block font-jakarta text-[1rem] font-500 text-ws-text-body hover:text-copper transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ws-border-soft space-y-3">
            <Link
              href="/auth/signin"
              className="block font-jakarta text-[1rem] font-500 text-ws-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 rounded-sm bg-copper text-white font-jakarta text-[0.9375rem] font-600"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
