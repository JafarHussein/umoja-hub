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
      className="fixed top-0 left-0 right-0 z-50 bg-canvas-elevated border-b border-ws-border-soft"
    >
      <div className="mx-auto max-w-7xl px-[48px]">
        <div className="flex h-[72px] items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-jakarta font-700 text-ws-text-heading text-[1.125rem] tracking-[-0.01em] hover:opacity-80 transition-opacity duration-fast ease-standard"
          >
            UmojaHub
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-jakarta text-[0.875rem] font-500 text-ws-text-body hover:text-ws-text-heading transition-colors duration-fast ease-standard"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-[20px] py-[10px] rounded-[4px] bg-copper text-[#F5F4F0] font-jakarta text-[0.875rem] font-600 hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Get started
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
        <div className="md:hidden bg-canvas-elevated border-t border-ws-border-soft px-6 py-4 space-y-4">
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
          <div className="pt-2 border-t border-ws-border-soft">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-[20px] py-[10px] rounded-[4px] bg-copper text-[#F5F4F0] font-jakarta text-[0.875rem] font-600"
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
