'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Table, THead, TH, TR, TD } from '@/components/app';
import { cn } from '@/lib/cn';
import { CreateListingForm } from '@/components/foodhub/CreateListingForm';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import {
  VerificationLockout,
  type IVerificationLockoutProps,
} from '@/components/shared/VerificationLockout';
import { Role, ListingStatus, ListingUnit, VerificationStatus } from '@/types';

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

// Response shape of GET /api/marketplace?own=true — lean listing documents
// under the standard `data` key.
interface IListingsResponse {
  data: IMyListing[];
  nextCursor: string | null;
  total: number;
}

interface IFarmerResponse {
  farmer: { farmerData: { verificationStatus: VerificationStatus } };
}

type PageState = 'loading' | 'ready' | 'error';

// Maps a farmer's verification status to the lockout copy. A verified farmer
// (APPROVED) never sees this — the rule is "cannot list until verified".
function lockoutForStatus(status: VerificationStatus | null): IVerificationLockoutProps {
  switch (status) {
    case VerificationStatus.PENDING:
      return {
        tone: 'pending',
        title: 'Verification under review',
        message:
          'An administrator is reviewing your verification documents. You can add produce once your account is approved.',
      };
    case VerificationStatus.REJECTED:
      return {
        tone: 'rejected',
        title: 'Verification not approved',
        message:
          'Your verification was not approved. Review the feedback and resubmit your documents from your profile.',
        cta: { label: 'Go to profile', href: '/dashboard/farmer/profile' },
      };
    default:
      return {
        tone: 'action',
        title: 'Verification required',
        message:
          'You must be a verified farmer before you can add produce. Submit your verification documents to get started.',
        cta: { label: 'Submit verification', href: '/dashboard/farmer/profile' },
      };
  }
}

export default function FarmerListingsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<IMyListing[]>([]);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const [listingsRes, farmerRes] = await Promise.all([
        fetch('/api/marketplace?own=true'),
        fetch('/api/farmers'),
      ]);
      if (!listingsRes.ok || !farmerRes.ok) throw new Error('Failed to fetch');
      const listingsData = (await listingsRes.json()) as IListingsResponse;
      const farmerData = (await farmerRes.json()) as IFarmerResponse;
      setListings(listingsData.data ?? []);
      setVerification(farmerData.farmer.farmerData.verificationStatus);
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
      void fetchData();
    }
  }, [status, session, router, fetchData]);

  async function toggleStatus(listing: IMyListing): Promise<void> {
    const newStatus =
      listing.listingStatus === ListingStatus.AVAILABLE
        ? ListingStatus.INACTIVE
        : ListingStatus.AVAILABLE;
    setUpdatingId(listing._id);
    try {
      const res = await fetch(`/api/marketplace/${listing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingStatus: newStatus }),
      });
      // Only reflect the new status once the server has accepted it — e.g.
      // reactivating a zero-stock listing is rejected with LISTING_NO_STOCK.
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l._id === listing._id ? { ...l, listingStatus: newStatus } : l)),
        );
      }
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
        <p className="app-title mb-2 text-app-ink">Could not load your produce</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchData()}>
          Retry
        </Button>
      </div>
    );
  }

  // ── Verification lockout (System Lockout Layer) ─────────────────────────────
  // A farmer who is not APPROVED cannot create listings, so the body is
  // replaced with the lockout layer rather than an unusable create surface.
  if (verification !== VerificationStatus.APPROVED) {
    return (
      <div className="space-y-6">
        <h1 className="app-h1 text-app-ink">My Produce</h1>
        <VerificationLockout {...lockoutForStatus(verification)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-h1 text-app-ink">My Produce</h1>
          <p className="app-meta mt-0.5 text-app-muted">
            {listings.length} item{listings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
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
          Add produce
        </Button>
      </div>

      {/* Empty state */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-app-card border border-app-hairline bg-app-card py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-sunken">
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
                className="text-app-faint"
              />
            </svg>
          </div>
          <p className="app-title mb-1 text-app-ink">No produce yet</p>
          <p className="app-body mb-4 text-app-muted">
            Add your first produce to start receiving orders from buyers across Kenya.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>Add produce</Button>
        </div>
      ) : (
        /* Listings table */
        <Table>
          <THead>
            <TH>Produce</TH>
            <TH className="text-right">Price</TH>
            <TH className="text-right">Available</TH>
            <TH>Status</TH>
            <TH className="text-right">
              <span className="sr-only">Actions</span>
            </TH>
          </THead>
          <tbody>
            {listings.map((listing) => {
              const available = listing.listingStatus === ListingStatus.AVAILABLE;
              return (
                <TR key={listing._id}>
                  <TD>
                    <p className="app-body-strong truncate text-app-ink">{listing.title}</p>
                    <p className="app-meta text-app-muted">
                      {listing.cropName} · {listing.pickupCounty} · {formatDate(listing.createdAt)}
                    </p>
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-data-m text-app-ink">
                      KSh {listing.currentPricePerUnit.toLocaleString()}
                    </span>
                    <span className="app-meta ml-1 text-app-faint">
                      /{listing.unit.toLowerCase()}
                    </span>
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-data-m text-app-muted">
                      {listing.quantityAvailable.toLocaleString()}
                    </span>
                    <span className="app-meta ml-1 text-app-faint">
                      {listing.unit.toLowerCase()}
                    </span>
                  </TD>
                  <TD>
                    <span
                      className={cn(
                        'app-label inline-flex items-center gap-1 rounded-app-pill px-2 py-0.5',
                        available
                          ? 'bg-app-success-surface text-app-success'
                          : 'bg-app-sunken text-app-muted'
                      )}
                    >
                      <span aria-hidden>{available ? '✓' : '◌'}</span>
                      {available ? 'Available' : 'Paused'}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={updatingId === listing._id}
                      onClick={() => void toggleStatus(listing)}
                      aria-label={available ? `Pause ${listing.title}` : `Reactivate ${listing.title}`}
                    >
                      {available ? 'Pause' : 'Reactivate'}
                    </Button>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Create listing modal */}
      <CreateListingForm
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          void fetchData();
        }}
      />
    </div>
  );
}
