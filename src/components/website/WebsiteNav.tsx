'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

type DropdownId = 'food' | 'education' | 'governance';

interface NavLink {
  label: string;
  href: string;
}

interface DropdownSection {
  heading?: string;
  links: NavLink[];
}

const DROPDOWNS: Array<{
  id: DropdownId;
  label: string;
  heading: string;
  sections: DropdownSection[];
}> = [
  {
    id: 'food',
    label: 'Food Security Hub',
    heading: 'FOOD SECURITY HUB',
    sections: [
      {
        links: [
          { label: 'For Farmers', href: '/for/farmers' },
          { label: 'For Buyers', href: '/for/buyers' },
          { label: 'For Suppliers', href: '/for/suppliers' },
          { label: 'For Cooperatives', href: '/for/cooperatives' },
        ],
      },
      {
        heading: 'Resources',
        links: [
          { label: 'Price Intelligence', href: '/prices' },
          { label: 'Knowledge Hub', href: '/knowledge' },
          { label: 'Marketplace', href: '/marketplace' },
        ],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education Hub',
    heading: 'EDUCATION HUB',
    sections: [
      {
        links: [
          { label: 'For Students', href: '/for/students' },
          { label: 'For Lecturers', href: '/for/lecturers' },
          { label: 'For Employers', href: '/for/employers' },
          { label: 'For Institutions', href: '/for/institutions' },
        ],
      },
      {
        heading: 'Resources',
        links: [
          { label: 'Education Hub Overview', href: '/education' },
          { label: 'Verification Methodology', href: '/trust' },
        ],
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    heading: 'GOVERNANCE',
    sections: [
      {
        links: [
          { label: 'Trust & Verification', href: '/trust' },
          { label: 'Transparency', href: '/transparency' },
          { label: 'Verification Team', href: '/team' },
          { label: 'Appeals & Disputes', href: '/team#appeals-process' },
        ],
      },
      {
        heading: 'Impact',
        links: [
          { label: 'For NGOs & Government', href: '/for/ngos' },
          { label: 'About UmojaHub', href: '/about' },
        ],
      },
    ],
  },
];

const MOBILE_GROUPS = [
  {
    heading: 'Food Security Hub',
    links: [
      { label: 'Farmers', href: '/for/farmers' },
      { label: 'Buyers', href: '/for/buyers' },
      { label: 'Suppliers', href: '/for/suppliers' },
      { label: 'Cooperatives', href: '/for/cooperatives' },
    ],
  },
  {
    heading: 'Education Hub',
    links: [
      { label: 'Students', href: '/for/students' },
      { label: 'Lecturers', href: '/for/lecturers' },
      { label: 'Employers', href: '/for/employers' },
      { label: 'Institutions', href: '/for/institutions' },
    ],
  },
  {
    heading: 'Governance & Impact',
    links: [
      { label: 'For NGOs & Government', href: '/for/ngos' },
      { label: 'Trust & Verification', href: '/trust' },
      { label: 'Transparency', href: '/transparency' },
    ],
  },
];

const MOBILE_BOTTOM_LINKS: NavLink[] = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
];

export function WebsiteNav(): React.ReactElement {
  const [activeDropdown, setActiveDropdown] = useState<DropdownId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const openDropdown = (id: DropdownId) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(id);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <header
      ref={navRef}
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-all duration-150',
        scrolled ? 'bg-ws-surface-dark border-b border-ws-border-dark' : 'bg-transparent'
      )}
    >
      <nav
        aria-label="Primary navigation"
        className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ws-hub-green"
        >
          <div className="h-4 w-4 rounded-sm bg-ws-hub-green shrink-0" aria-hidden />
          <span className="font-display text-ws-label font-semibold">
            <span className="text-ws-text-bright">Umoja</span>
            <span className="text-ws-hub-green">Hub</span>
          </span>
        </Link>

        {/* Desktop nav — logo + 3 dropdowns + 2 auth links fit cleanly from lg (1024px) */}
        <div className="hidden lg:flex items-center gap-0.5">
          <Link
            href="/marketplace"
            className="font-geist text-ws-body-sm text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150 px-3 py-2 rounded-sm"
          >
            Marketplace
          </Link>
          <Link
            href="/how-it-works"
            className="font-geist text-ws-body-sm text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150 px-3 py-2 rounded-sm"
          >
            How It Works
          </Link>

          {DROPDOWNS.map((dd) => (
            <div
              key={dd.id}
              className="relative"
              onMouseEnter={() => openDropdown(dd.id)}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeDropdown === dd.id}
                aria-controls={`nav-menu-${dd.id}`}
                onClick={() =>
                  setActiveDropdown(activeDropdown === dd.id ? null : dd.id)
                }
                className={cn(
                  'inline-flex items-center gap-1 font-geist text-ws-body-sm transition-colors duration-150 px-3 py-2 rounded-sm',
                  activeDropdown === dd.id
                    ? 'text-ws-text-bright'
                    : 'text-ws-text-dim hover:text-ws-text-bright'
                )}
              >
                {dd.label}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-150',
                    activeDropdown === dd.id && 'rotate-180'
                  )}
                  aria-hidden
                />
              </button>

              {activeDropdown === dd.id && (
                <div
                  id={`nav-menu-${dd.id}`}
                  role="menu"
                  className="absolute top-full left-0 mt-1 w-60 bg-ws-surface-dark-2 border border-ws-border-dark rounded-sm shadow-lg py-2"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <p className="px-3 pb-2 font-geist-mono text-[11px] leading-4 tracking-[0.06em] text-ws-text-faint uppercase">
                    {dd.heading}
                  </p>

                  {dd.sections.map((section, si) => (
                    <div key={si}>
                      {si > 0 && <div className="border-t border-ws-border-dark mx-3 my-1.5" />}
                      {section.heading && (
                        <p className="px-3 py-1 font-geist-mono text-[10px] leading-4 tracking-[0.06em] text-ws-text-faint uppercase">
                          {section.heading}
                        </p>
                      )}
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center px-3 py-1.5 font-geist text-ws-body-sm text-ws-text-dim hover:text-ws-text-bright hover:bg-ws-surface-dark-3 transition-colors duration-150"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/auth/login"
            className="font-geist text-ws-body-sm text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center h-9 px-4 rounded-sm bg-ws-hub-green text-ws-text-bright font-geist text-ws-label font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Register
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger
              className="inline-flex items-center justify-center w-10 h-10 rounded-sm text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton
              className="w-full sm:max-w-sm bg-ws-surface-dark-2 border-l border-ws-border-dark p-0 gap-0"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-6 py-5 border-b border-ws-border-dark">
                  <div className="h-4 w-4 rounded-sm bg-ws-hub-green shrink-0" aria-hidden />
                  <span className="font-display text-ws-label font-semibold text-ws-text-bright">
                    UmojaHub
                  </span>
                </div>

                <nav
                  aria-label="Mobile navigation"
                  className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6"
                >
                  {MOBILE_GROUPS.map((group) => (
                    <div key={group.heading}>
                      <p className="font-geist-mono text-[11px] leading-4 tracking-[0.06em] text-ws-text-faint uppercase mb-3">
                        {group.heading}
                      </p>
                      <ul className="flex flex-col">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <SheetClose
                              render={
                                <Link
                                  href={link.href}
                                  className="flex items-center min-h-[44px] font-geist text-ws-body text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150 py-2"
                                />
                              }
                            >
                              {link.label}
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="border-t border-ws-border-dark pt-5 flex flex-col">
                    {MOBILE_BOTTOM_LINKS.map((link) => (
                      <SheetClose
                        key={link.href}
                        render={
                          <Link
                            href={link.href}
                            className="flex items-center min-h-[44px] font-geist text-ws-body text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150 py-2"
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    ))}
                  </div>
                </nav>

                <div className="px-6 py-5 border-t border-ws-border-dark flex flex-col gap-3">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center min-h-[44px] w-full rounded-sm bg-ws-hub-green text-ws-text-bright font-geist text-ws-label font-medium hover:opacity-90 transition-opacity duration-150"
                  >
                    Register
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center min-h-[44px] w-full rounded-sm border border-ws-border-dark text-ws-text-dim font-geist text-ws-label hover:border-ws-border-medium hover:text-ws-text-bright transition-colors duration-150"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
