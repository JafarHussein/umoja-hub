'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Page,
  PageHeader,
  Table,
  THead,
  TH,
  TR,
  TD,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { CreateListingForm } from '@/components/foodhub/CreateListingForm';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import {
  VerificationLockout,
  type IVerificationLockoutProps,
} from '@/components/shared/VerificationLockout';
import { Role, ListingStatus, ListingUnit, VerificationStatus } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

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
        title: 'Your verification is being reviewed',
        message:
          'An administrator is checking your document. Most are decided within two working days and you will be emailed either way — you can publish produce as soon as it is approved.',
      };
    case VerificationStatus.REJECTED:
      return {
        tone: 'rejected',
        title: 'Your verification was not accepted',
        message:
          'Check that the document is in date, that the whole page is in frame, and that the name matches your account. You can submit a new one at any time.',
        cta: { label: 'Submit a new document', href: '/dashboard/verify' },
      };
    default:
      return {
        tone: 'action',
        title: 'Verify your identity to publish produce',
        message:
          'Buyers order from people they can see have been checked, so publishing is the one thing that waits on verification. Everything else — browsing, prices, your cooperative — is open to you now.',
        cta: { label: 'Verify my identity', href: '/dashboard/verify' },
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
      router.push(loginUrlWithIntent());
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
      <Page>
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-40 rounded" />
          <div className="skeleton h-11 w-36 rounded-app-control" />
        </div>
        <ListSkeleton rows={5} />
      </Page>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="My Produce" />
        <EmptyState
          title="We could not load your produce"
          description="Your listings are safe — this screen just could not reach them. This is usually a brief connection problem, so trying again normally works."
          action={{ label: 'Try again', onClick: () => void fetchData() }}
        />
      </Page>
    );
  }

  // ── Verification lockout (System Lockout Layer) ─────────────────────────────
  // A farmer who is not APPROVED cannot create listings, so the body is
  // replaced with the lockout layer rather than an unusable create surface.
  if (verification !== VerificationStatus.APPROVED) {
    return (
      <Page>
        <PageHeader
          title="My Produce"
          description="Everything you have listed for sale, and how each item is performing."
        />
        <VerificationLockout {...lockoutForStatus(verification)} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="My Produce"
        description="Everything you have listed for sale. Pause an item to hide it from buyers without deleting it; reactivate it when you have stock again."
        meta={
          listings.length > 0 ? (
            <span>
              {listings.length} item{listings.length !== 1 ? 's' : ''} ·{' '}
              {listings.filter((l) => l.listingStatus === ListingStatus.AVAILABLE).length} visible to
              buyers
            </span>
          ) : undefined
        }
        actions={
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
        }
      />

      {/* Empty state */}
      {listings.length === 0 ? (
        <EmptyState
          title="Your produce will appear here once you publish it"
          description="Each item you add becomes visible to buyers searching your county, with your verified badge attached. You can set the price, the quantity available and where buyers collect from — and change any of it later."
          action={{ label: 'Add your first produce', onClick: () => setIsCreateOpen(true) }}
          hints={[
            {
              label: 'Check market prices first',
              href: '/dashboard/farmer/prices',
              description: 'see what your crop is fetching this week',
            },
            {
              label: 'Review your profile',
              href: '/dashboard/farmer/profile',
              description: 'buyers see your trust score before they order',
            },
          ]}
        />
      ) : (
        /* Listings table */
        <Table layout="fixed">
          <THead>
            <TH className="w-[38%]">Produce</TH>
            <TH className="w-[17%] text-right">Price</TH>
            <TH className="w-[15%] text-right">Available</TH>
            <TH className="w-[16%]">Status</TH>
            <TH className="w-[14%] text-right">
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
    </Page>
  );
}
