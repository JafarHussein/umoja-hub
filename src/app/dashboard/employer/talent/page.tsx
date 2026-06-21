'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Input, Select, Button } from '@/components/app';

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
    <div className="space-y-6">
      <div>
        <h1 className="app-h1 text-app-ink">Search talent</h1>
        <p className="app-body text-app-muted">
          Verified student portfolios, filterable by skill and tier.
        </p>
      </div>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="flex-1 min-w-[200px]">
            <label className="app-label text-app-muted" htmlFor="skill">
              Skill / tech stack
            </label>
            <Input
              id="skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Python"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="app-label text-app-muted" htmlFor="tier">
              Tier
            </label>
            <Select id="tier" value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="">Any tier</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </form>
      </Card>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Card key={it.publicSlug ?? i} className="flex flex-col gap-3">
              <div>
                <p className="app-body-strong text-app-ink">
                  {it.student
                    ? `${it.student.firstName ?? ''} ${it.student.lastName ?? ''}`.trim()
                    : 'Student'}
                </p>
                <p className="app-label text-app-muted">
                  {it.currentTier} · {it.verifiedProjectCount} verified project
                  {it.verifiedProjectCount === 1 ? '' : 's'}
                </p>
              </div>
              {it.techStacksUsed.length > 0 && (
                <p className="app-body text-app-muted">{it.techStacksUsed.slice(0, 5).join(' · ')}</p>
              )}
              {it.publicSlug && (
                <Link
                  href={`/portfolio/${it.publicSlug}`}
                  className="app-link text-app-accent mt-auto"
                >
                  View portfolio →
                </Link>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="app-body text-app-muted">
            {loading ? 'Searching…' : 'No matching portfolios. Try a different skill or tier.'}
          </p>
        </Card>
      )}
    </div>
  );
}
