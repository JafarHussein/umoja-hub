'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const foodSecurityLinks = [
  { label: 'Farmers', href: '/for/farmers', desc: 'List produce, get paid via M-Pesa' },
  { label: 'Buyers', href: '/for/buyers', desc: 'Browse verified produce listings' },
  { label: 'Suppliers', href: '/for/suppliers', desc: 'Reach verified farmer cooperatives' },
  { label: 'Cooperatives', href: '/for/cooperatives', desc: 'Group orders and bulk purchasing' },
];

const educationLinks = [
  { label: 'Students', href: '/for/students', desc: 'Build real projects, earn credentials' },
  { label: 'Lecturers', href: '/for/lecturers', desc: 'Review and verify student work' },
  { label: 'Employers', href: '/for/employers', desc: 'Find verified student talent' },
  { label: 'Institutions', href: '/for/institutions', desc: 'Partner with the Education Hub' },
  { label: 'NGOs', href: '/for/ngos', desc: 'Access verified impact data' },
];

const bottomLinks = [
  { label: 'Trust & Verification', href: '/trust' },
  { label: 'About', href: '/about' },
  { label: 'Transparency', href: '/transparency' },
];

const mobileLinks = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Knowledge Hub', href: '/knowledge' },
  ...foodSecurityLinks.map((l) => ({ label: l.label, href: l.href })),
  ...educationLinks.map((l) => ({ label: l.label, href: l.href })),
  ...bottomLinks,
];

export function WebsiteNav(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-all duration-150',
        scrolled ? 'bg-surface-primary border-b border-zinc-800/50' : 'bg-transparent'
      )}
    >
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-5 w-5 rounded-sm bg-accent-green" />
          <span className="font-heading text-t4 font-semibold">
            <span className="text-text-primary">Umoja</span>
            <span className="text-accent-green">Hub</span>
          </span>
        </Link>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/how-it-works"
            className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150 px-3 py-2"
          >
            How It Works
          </Link>

          {/* For You dropdown */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-body text-t5 text-text-secondary hover:text-text-primary bg-transparent hover:bg-transparent data-popup-open:bg-transparent data-open:bg-transparent data-popup-open:text-text-primary data-open:text-text-primary h-auto px-3 py-2 rounded-none">
                  For You
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4 w-[480px]">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Food Security Hub */}
                      <div>
                        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3 px-2">
                          Food Security Hub
                        </p>
                        <ul className="flex flex-col gap-1">
                          {foodSecurityLinks.map((link) => (
                            <li key={link.href}>
                              <NavigationMenuLink
                                href={link.href}
                                className="flex flex-col gap-0.5 px-2 py-2 rounded-sm hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors duration-150"
                              >
                                <span className="font-body text-t5 text-text-primary">
                                  {link.label}
                                </span>
                                <span className="font-body text-t6 text-text-disabled">
                                  {link.desc}
                                </span>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Education Hub */}
                      <div>
                        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3 px-2">
                          Education Hub
                        </p>
                        <ul className="flex flex-col gap-1">
                          {educationLinks.map((link) => (
                            <li key={link.href}>
                              <NavigationMenuLink
                                href={link.href}
                                className="flex flex-col gap-0.5 px-2 py-2 rounded-sm hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors duration-150"
                              >
                                <span className="font-body text-t5 text-text-primary">
                                  {link.label}
                                </span>
                                <span className="font-body text-t6 text-text-disabled">
                                  {link.desc}
                                </span>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="border-t border-zinc-800/50 pt-3 flex items-center gap-2">
                      {bottomLinks.map((link) => (
                        <NavigationMenuLink
                          key={link.href}
                          href={link.href}
                          className="font-body text-t6 text-text-disabled hover:text-text-secondary px-2 py-1 rounded-sm transition-colors duration-150"
                        >
                          {link.label}
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link
            href="/marketplace"
            className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150 px-3 py-2"
          >
            Marketplace
          </Link>
          <Link
            href="/knowledge"
            className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150 px-3 py-2"
          >
            Knowledge
          </Link>
        </div>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[36px] px-4 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              className="inline-flex items-center justify-center w-10 h-10 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors duration-150"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton
              className="w-full sm:max-w-sm bg-surface-primary border-l border-zinc-800/50 p-0"
            >
              <div className="flex flex-col h-full">
                {/* Mobile nav header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-sm bg-accent-green" />
                    <span className="font-heading text-t5 font-semibold text-text-primary">
                      UmojaHub
                    </span>
                  </div>
                </div>

                {/* Mobile nav links */}
                <nav className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="flex flex-col gap-1">
                    {mobileLinks.map((link) => (
                      <li key={link.href}>
                        <SheetClose
                          render={
                            <Link
                              href={link.href}
                              className="block font-body text-t4 text-text-secondary hover:text-text-primary transition-colors duration-150 py-2 border-b border-zinc-800/30 last:border-0"
                            />
                          }
                        >
                          {link.label}
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Mobile nav footer */}
                <div className="px-6 py-4 border-t border-zinc-800/50 flex flex-col gap-3">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center min-h-[44px] w-full rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center min-h-[44px] w-full rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
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
