'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface IErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: IErrorProps): React.ReactElement {
  useEffect(() => {
    // Error boundary — error.digest is forwarded to server logs automatically by Next.js
    void error;
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Code */}
        <p className="font-mono text-t1 font-semibold text-text-disabled">500</p>

        {/* Heading */}
        <h1 className="font-heading text-t2 font-semibold text-text-primary">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="font-body text-t4 text-text-secondary">
          An unexpected error occurred. The issue has been logged. Try again — if the
          problem persists, contact support.
        </p>

        {/* Error digest for support reference */}
        {error.digest && (
          <div className="bg-surface-elevated border border-white/5 rounded p-3">
            <p className="font-mono text-t6 text-text-disabled">
              Reference: <span className="text-text-secondary">{error.digest}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Go home
          </Link>
        </div>

        {/* Divider */}
        <div className="pt-6 border-t border-white/5">
          <p className="font-mono text-t6 text-text-disabled">UmojaHub · Kenya</p>
        </div>
      </div>
    </main>
  );
}
