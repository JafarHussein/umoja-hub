import React from 'react';
import Link from 'next/link';

export default function NotFound(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Code */}
        <p className="font-mono text-t1 font-semibold text-text-disabled">404</p>

        {/* Heading */}
        <h1 className="font-heading text-t2 font-semibold text-text-primary">
          Page not found
        </h1>

        {/* Description */}
        <p className="font-body text-t4 text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Browse marketplace
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
