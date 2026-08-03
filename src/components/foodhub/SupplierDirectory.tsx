'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, Page, PageHeader, Select } from '@/components/app';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import SupplierCard from '@/components/foodhub/SupplierCard';
import { KENYAN_COUNTIES, SupplierInputCategory } from '@/types';

// ---------------------------------------------------------------------------
// UI-11 — Supplier directory Read-Only Telemetry View (Q12).
//
// Shared between the farmer and buyer hubs. Reads the public verified-supplier
// directory (`GET /api/suppliers`) with county + category filters and cursor
// pagination. The directory is administrator-curated — suppliers are added by
// admins after credential verification and cannot self-register, so this view
// is strictly read-only: it carries NO create/register/edit affordances.
// ---------------------------------------------------------------------------

interface ISupplierRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface ISupplier {
  _id: string;
  businessName: string;
  county: string;
  inputCategories: string[];
  registrations?: ISupplierRegistrations;
  contactPhone?: string;
  physicalAddress?: string;
  verifiedAt?: string;
}

interface ISuppliersResponse {
  data: ISupplier[];
  nextCursor: string | null;
  hasMore: boolean;
}

type PageState = 'loading' | 'ready' | 'error';

const CATEGORY_LABELS: Record<SupplierInputCategory, string> = {
  [SupplierInputCategory.FERTILIZER]: 'Fertilizer',
  [SupplierInputCategory.SEED]: 'Seed',
  [SupplierInputCategory.PESTICIDE]: 'Pesticide',
  [SupplierInputCategory.VETERINARY]: 'Veterinary',
  [SupplierInputCategory.EQUIPMENT]: 'Equipment',
};

export default function SupplierDirectory(): React.ReactElement {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [county, setCounty] = useState('');
  const [category, setCategory] = useState('');

  const buildQuery = useCallback(
    (cursor?: string): string => {
      const params = new URLSearchParams();
      if (county) params.set('county', county);
      if (category) params.set('category', category);
      if (cursor) params.set('cursor', cursor);
      const qs = params.toString();
      return qs ? `?${qs}` : '';
    },
    [county, category]
  );

  const fetchFirstPage = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch(`/api/suppliers${buildQuery()}`);
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as ISuppliersResponse;
      setSuppliers(json.data);
      setNextCursor(json.hasMore ? json.nextCursor : null);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [buildQuery]);

  useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  async function loadMore(): Promise<void> {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/suppliers${buildQuery(nextCursor)}`);
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as ISuppliersResponse;
      setSuppliers((prev) => [...prev, ...json.data]);
      setNextCursor(json.hasMore ? json.nextCursor : null);
    } catch {
      // Keep the already-loaded page; the retry affordance is the same button.
    } finally {
      setIsLoadingMore(false);
    }
  }

  const hasActiveFilters = !!(county || category);

  function clearFilters(): void {
    setCounty('');
    setCategory('');
  }

  return (
    <Page>
      {/* Page header — read-only; curation policy is stated in the description. */}
      <PageHeader
        title="Verified Suppliers"
        description="Agricultural input suppliers reviewed by UmojaHub. Every one on this list had its credentials checked by an administrator before it appeared here — suppliers cannot add themselves. Contact a supplier directly to discuss group orders."
        meta={
          pageState === 'ready' && suppliers.length > 0 ? (
            <span>
              {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' matching your filters' : ' in the directory'}
            </span>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[12rem]">
          <Select
            id="supplier-county"
            label="County"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">All counties</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[12rem]">
          <Select
            id="supplier-category"
            label="Input category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {Object.values(SupplierInputCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Body */}
      {pageState === 'loading' ? (
        <ListSkeleton rows={4} />
      ) : pageState === 'error' ? (
        <EmptyState
          title="We could not load the supplier directory"
          description="The directory is served from UmojaHub rather than stored on your device, so this is almost always a passing connection problem."
          action={{ label: 'Try again', onClick: () => void fetchFirstPage() }}
        />
      ) : suppliers.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No verified supplier matches these filters"
            description="The directory only holds suppliers an administrator has already verified, so it is deliberately narrow. Widening the county or category will usually surface someone who can serve you."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        ) : (
          <EmptyState
            title="No suppliers have been verified yet"
            description="Verified input suppliers will be listed here as UmojaHub checks their KEBS, PCPB and KEPHIS registrations. Until then there is nothing to show — an empty directory means nobody has passed that check, not that the page failed."
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier._id}
                businessName={supplier.businessName}
                county={supplier.county}
                inputCategories={supplier.inputCategories}
                registrations={supplier.registrations ?? {}}
                {...(supplier.contactPhone ? { contactPhone: supplier.contactPhone } : {})}
                {...(supplier.physicalAddress
                  ? { physicalAddress: supplier.physicalAddress }
                  : {})}
                {...(supplier.verifiedAt ? { verifiedAt: supplier.verifiedAt } : {})}
              />
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                isLoading={isLoadingMore}
                onClick={() => void loadMore()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
