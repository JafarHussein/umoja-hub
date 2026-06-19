'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Select } from '@/components/app';
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
    <div className="space-y-6">
      {/* Page header — read-only, administrator-curated */}
      <div>
        <h1 className="app-h1 text-app-ink">Verified Suppliers</h1>
        <p className="app-meta mt-0.5 max-w-2xl text-app-muted">
          Agricultural input suppliers reviewed by UmojaHub. This directory is administrator-curated
          — suppliers are added after credential verification and cannot self-register. Contact a
          supplier directly to discuss group orders.
        </p>
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="app-title mb-2 text-app-ink">Could not load the supplier directory</p>
          <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
          <Button variant="secondary" onClick={() => void fetchFirstPage()}>
            Retry
          </Button>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-12 text-center">
          <p className="app-body text-app-muted">
            {hasActiveFilters
              ? 'No verified suppliers match these filters.'
              : 'No verified suppliers in the directory yet.'}
          </p>
        </div>
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
    </div>
  );
}
