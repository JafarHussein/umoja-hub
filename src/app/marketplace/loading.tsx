import React from 'react';

export default function MarketplaceLoading(): React.ReactElement {
  return (
    <div className="theme-app min-h-screen bg-app-canvas">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 border-b border-app-hairline bg-app-canvas">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <div className="skeleton h-6 w-28 rounded-app-cell" aria-hidden="true" />
          <div className="skeleton h-11 min-w-0 flex-1 rounded-app-control sm:max-w-2xl" aria-hidden="true" />
          <div className="skeleton hidden h-8 w-40 rounded-app-control sm:block" aria-hidden="true" />
        </div>
        <div className="border-t border-app-hairline">
          <div className="mx-auto flex max-w-7xl gap-2 px-4 py-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-24 rounded-app-pill" />
            ))}
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="lg:flex lg:gap-8">
          {/* Filter rail skeleton */}
          <div className="mb-6 space-y-5 lg:mb-0 lg:w-56 lg:flex-shrink-0" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-16 rounded-app-cell" />
                <div className="skeleton h-11 w-full rounded-app-control" />
              </div>
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="min-w-0 flex-1 space-y-4" role="status" aria-label="Loading marketplace">
            <div className="skeleton h-3 w-28 rounded-app-cell" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card"
                  aria-hidden="true"
                >
                  <div className="skeleton aspect-[4/3] w-full" />
                  <div className="space-y-2 p-3">
                    <div className="skeleton h-5 w-24 rounded-app-cell" />
                    <div className="skeleton h-4 w-full rounded-app-cell" />
                    <div className="skeleton h-3 w-20 rounded-app-cell" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
