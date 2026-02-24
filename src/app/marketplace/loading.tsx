import React from 'react';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';

export default function MarketplaceLoading(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header skeleton */}
      <div className="border-b border-white/5 bg-surface-primary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="skeleton h-4 w-12 rounded" aria-hidden="true" />
          <div className="skeleton h-5 w-28 rounded" aria-hidden="true" />
          <div className="skeleton h-4 w-20 rounded" aria-hidden="true" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Filter sidebar skeleton */}
          <div className="w-52 flex-shrink-0 space-y-5" aria-hidden="true">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-10 rounded" />
              <div className="skeleton h-11 w-full rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-14 rounded" />
              <div className="skeleton h-11 w-full rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-11 flex-1 rounded-sm" />
                <div className="skeleton h-11 flex-1 rounded-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-5 w-9 rounded-full" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          </div>

          {/* Listings skeleton */}
          <div className="flex-1 min-w-0 space-y-4" role="status" aria-label="Loading marketplace">
            <div className="skeleton h-3 w-24 rounded" aria-hidden="true" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
