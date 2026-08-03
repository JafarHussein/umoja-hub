'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  EmptyState,
  Input,
  Page,
  PageHeader,
  Select,
  Button,
} from '@/components/app';

// Employer talent search — a client surface over GET /api/employer/portfolios.
// Filters verified public portfolios by skill and tier.

interface TalentItem {
  publicSlug?: string;
  currentTier: string;
  portfolioStrength: string;
  verifiedProjectCount: number;
  techStacksUsed: string[];
  student: {
    firstName?: string;
    lastName?: string;
    profilePhotoUrl?: string;
    county?: string;
    universityAffiliation?: string;
  } | null;
}

export default function TalentSearchPage(): React.ReactElement {
  const [skill, setSkill] = useState('');
  const [tier, setTier] = useState('');
  const [items, setItems] = useState<TalentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skill.trim()) params.set('skill', skill.trim());
      if (tier) params.set('tier', tier);
      const res = await fetch(`/api/employer/portfolios?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as { data: { items: TalentItem[] } };
        setItems(json.data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [skill, tier]);

  useEffect(() => {
    void search();
    // Initial load only; subsequent searches are triggered by the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <PageHeader
        title="Search talent"
        description="Every portfolio here contains work a lecturer has reviewed and verified. Filter by the technology you actually need and the depth you are hiring for."
        meta={
          items.length > 0 ? (
            <span>
              {items.length} portfolio{items.length !== 1 ? 's' : ''} matching
            </span>
          ) : undefined
        }
      />

      <Card pad="generous">
        <form
          className="flex flex-wrap items-end gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="min-w-[220px] flex-1">
            <Input
              id="skill"
              label="Skill / tech stack"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Python"
            />
          </div>
          <div className="min-w-[180px]">
            <Select
              id="tier"
              label="Tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="">Any tier</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>
      </Card>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Card key={it.publicSlug ?? i} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <p className="app-title text-app-ink">
                  {it.student
                    ? `${it.student.firstName ?? ''} ${it.student.lastName ?? ''}`.trim()
                    : 'Student'}
                </p>
                <p className="app-meta text-app-muted">
                  {it.currentTier} · {it.verifiedProjectCount} verified project
                  {it.verifiedProjectCount === 1 ? '' : 's'}
                </p>
              </div>
              {it.techStacksUsed.length > 0 && (
                <p className="app-body text-app-muted">
                  {it.techStacksUsed.slice(0, 5).join(' · ')}
                </p>
              )}
              {it.publicSlug && (
                <Link
                  href={`/portfolio/${it.publicSlug}`}
                  className="app-body-strong mt-auto pt-2 text-app-brand hover:text-app-brand-hover"
                >
                  View portfolio
                </Link>
              )}
            </Card>
          ))}
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-app-card" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No portfolio matches that search"
          description="Only students who have both verified work and an open portfolio appear in results, so the pool is narrower than a general job board. Try a broader skill term, or drop the tier filter to see everyone."
          action={{ label: 'Clear the tier filter', onClick: () => setTier('') }}
        />
      )}
    </Page>
  );
}
