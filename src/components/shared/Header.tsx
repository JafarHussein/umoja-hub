'use client';

import React, { useState } from 'react';
import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';

export interface IHeaderProps {
  role: Role;
  firstName: string;
  onSignOut: () => void;
}

const roleLabels: Record<Role, string> = {
  [Role.FARMER]: 'Farmer',
  [Role.BUYER]: 'Buyer',
  [Role.STUDENT]: 'Student',
  [Role.LECTURER]: 'Lecturer',
  [Role.ADMIN]: 'Admin',
};

export function Header({ role, firstName, onSignOut }: IHeaderProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-surface-elevated border-b border-white/5 shrink-0">
      {/* Page context — populated by each page via slot or prop in future phases */}
      <div />

      {/* Right side — role badge + user menu */}
      <div className="flex items-center gap-3">
        <Badge label={roleLabels[role]} variant="neutral" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open user menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 rounded-sm px-3 text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all duration-150 font-body text-t5"
          >
            {/* Avatar initial */}
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-accent-green/20 text-accent-green font-mono text-t6 font-medium uppercase">
              {firstName.charAt(0)}
            </span>
            <span className="hidden sm:block">{firstName}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className={['transition-transform duration-150', menuOpen ? 'rotate-180' : ''].join(' ')}
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Dropdown */}
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-20 w-44 rounded bg-surface-elevated border border-white/10 shadow-xl py-1"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-4 min-h-[44px] font-body text-t5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all duration-150 text-left"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
