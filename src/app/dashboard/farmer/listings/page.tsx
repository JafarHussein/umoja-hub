'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreateListingForm } from '@/components/foodhub/CreateListingForm';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role, ListingStatus, ListingUnit } from '@/types';

interface IMyListing {
  _id: string;
  title: string;
  cropName: string;
  currentPricePerUnit: number;
  unit: ListingUnit;
  quantityAvailable: number;
  pickupCounty: string;
  listingStatus: ListingStatus;
  isVerifiedListing: boolean;
  createdAt: string;
}

interface IListingsResponse {
  listings: IMyListing[];
  nextCursor: string | null;
  total: number;
}

type PageState = 'loading' | 'ready' | 'error';

export default function FarmerListingsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<IMyListing[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchListings = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/marketplace?own=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as IListingsResponse;
      setListings(data.listings ?? []);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.FARMER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchListings();
    }
  }, [status, session, router, fetchListings]);

  async function toggleStatus(listing: IMyListing): Promise<void> {
    const newStatus =
      listing.listingStatus === ListingStatus.AVAILABLE
        ? ListingStatus.INACTIVE
        : ListingStatus.AVAILABLE;
    setUpdatingId(listing._id);
    try {
      await fetch(`/api/marketplace/${listing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingStatus: newStatus }),
      });
      setListings((prev) =>
        prev.map((l) => (l._id === listing._id ? { ...l, listingStatus: newStatus } : l)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-11 w-36 rounded-sm" />
        </div>
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load listings
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => void fetchListings()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-t2 font-heading font-semibold text-text-primary">My Listings</h1>
          <p className="text-t5 font-body text-text-secondary mt-0.5">
            {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect y="6" width="14" height="2" rx="1" />
            <rect x="6" width="2" height="14" rx="1" />
          </svg>
          New listing
        </Button>
      </div>

      {/* Verification notice */}
      {session?.user && (
        <div className="bg-surface-elevated border border-white/5 rounded p-4 flex items-start gap-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-text-secondary mt-0.5 flex-shrink-0"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-t5 font-body text-text-secondary">
            You must be a verified farmer to create listings. If you have not submitted your
            verification documents, visit your profile to do so.
          </p>
        </div>
      )}

      {/* Empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 17V7L10 3L17 7V17H3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="text-text-disabled"
              />
            </svg>
          </div>
          <p className="text-t4 font-body font-medium text-text-primary mb-1">
            No listings yet
          </p>
          <p className="text-t5 font-body text-text-secondary mb-4">
            Create your first listing to start receiving orders from buyers across Kenya.
          </p>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Create first listing
          </Button>
        </div>
      ) : (
        /* Listings table */
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Listing
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
              Price
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
              Stock
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Status
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Actions
            </span>
          </div>

          {listings.map((listing) => (
            <div
              key={listing._id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              {/* Title + meta */}
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary truncate">
                  {listing.title}
                </p>
                <p className="text-t6 font-body text-text-disabled">
                  {listing.cropName} · {listing.pickupCounty} · {formatDate(listing.createdAt)}
                </p>
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="text-t5 font-mono text-text-primary">
                  KES {listing.currentPricePerUnit.toLocaleString()}
                </span>
                <span className="text-t6 text-text-disabled ml-1">
                  /{listing.unit.toLowerCase()}
                </span>
              </div>

              {/* Stock */}
              <div className="text-right">
                <span className="text-t5 font-mono text-text-secondary">
                  {listing.quantityAvailable.toLocaleString()}
                </span>
                <span className="text-t6 text-text-disabled ml-1">
                  {listing.unit.toLowerCase()}
                </span>
              </div>

              {/* Status badge */}
              <Badge label={listing.listingStatus} />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={updatingId === listing._id}
                  onClick={() => void toggleStatus(listing)}
                  aria-label={
                    listing.listingStatus === ListingStatus.AVAILABLE
                      ? `Pause ${listing.title}`
                      : `Reactivate ${listing.title}`
                  }
                >
                  {listing.listingStatus === ListingStatus.AVAILABLE ? 'Pause' : 'Reactivate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create listing modal */}
      <CreateListingForm
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          void fetchListings();
        }}
      />
    </div>
  );
}
