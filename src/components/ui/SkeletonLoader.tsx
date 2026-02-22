import React from 'react';

// Base skeleton block — all skeletons compose from this
function Skeleton({ className = '' }: { className?: string }): React.ReactElement {
  return <div className={['skeleton rounded', className].join(' ')} aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Card skeleton — matches FarmerListingCard shape
// ---------------------------------------------------------------------------
export function CardSkeleton(): React.ReactElement {
  return (
    <div
      className="rounded border border-white/5 bg-surface-elevated p-4 space-y-3"
      role="status"
      aria-label="Loading card"
    >
      <Skeleton className="h-40 w-full rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20 rounded-sm" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List skeleton — matches knowledge article list or order list
// ---------------------------------------------------------------------------
export function ListSkeleton({ rows = 4 }: { rows?: number }): React.ReactElement {
  return (
    <div className="space-y-2" role="status" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded border border-white/5 bg-surface-elevated p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-[2px]" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat skeleton — matches FarmAssistantChat and AIMentorChat
// ---------------------------------------------------------------------------
export function ChatSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 p-4" role="status" aria-label="Loading chat">
      {/* Incoming message */}
      <div className="flex gap-3 items-start">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-16 w-64 rounded" />
      </div>
      {/* Outgoing message */}
      <div className="flex gap-3 items-start justify-end">
        <Skeleton className="h-10 w-48 rounded" />
      </div>
      {/* Incoming message */}
      <div className="flex gap-3 items-start">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-24 w-72 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table skeleton — matches order or portfolio tables
// ---------------------------------------------------------------------------
export function TableSkeleton({ rows = 5 }: { rows?: number }): React.ReactElement {
  return (
    <div className="space-y-1" role="status" aria-label="Loading table">
      <div className="flex gap-4 px-4 py-2">
        {[40, 25, 20, 15].map((w, i) => (
          <Skeleton key={i} className={`h-3 w-[${w}%]`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-t border-white/5 items-center"
        >
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="h-4 w-[25%]" />
          <Skeleton className="h-4 w-[20%]" />
          <Skeleton className="h-5 w-[15%] rounded-[2px]" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile skeleton — matches farmer/student profile headers
// ---------------------------------------------------------------------------
export function ProfileSkeleton(): React.ReactElement {
  return (
    <div className="flex items-start gap-4" role="status" aria-label="Loading profile">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-[2px]" />
          <Skeleton className="h-5 w-16 rounded-[2px]" />
        </div>
      </div>
    </div>
  );
}
