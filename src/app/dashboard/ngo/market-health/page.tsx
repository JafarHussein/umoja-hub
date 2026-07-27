'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, Table, THead, TH, TR, TD, StatusPill } from '@/components/app';
import { Role } from '@/types';

interface ICropAvailability {
  crop: string;
  activeListings: number;
  totalQuantity: number;
  seasonPhase: string;
}
interface IShortageAlert {
  crop: string;
  county: string;
  seasonPhase: string;
  completedSales90d: number;
  activeListings: number;
}
interface IPriceStability {
  crop: string;
  unit: string;
  medianPrice: number | null;
  volatilityPct: number | null;
}
interface INgoMarketHealth {
  generatedAt: string;
  servedCounties: string[];
  summary: {
    servedCounties: number;
    activeListings: number;
    completedSales30d: number;
    crops: number;
  };
  cropAvailability: ICropAvailability[];
  shortageAlerts: IShortageAlert[];
  priceStability: IPriceStability[];
}

type PageState = 'loading' | 'ready' | 'error';

function humanize(token: string): string {
  return token
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <Card>
      <p className="app-label text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-app-ink">{value}</p>
    </Card>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="app-h2 text-app-ink">{title}</h2>
        <p className="app-meta text-app-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }): React.ReactElement {
  return (
    <Card>
      <p className="app-body text-app-muted">{label}</p>
    </Card>
  );
}

export default function NgoMarketHealthPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [data, setData] = useState<INgoMarketHealth | null>(null);

  const fetchHealth = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/ngo/market-health');
      if (!res.ok) throw new Error('Request failed');
      const body = (await res.json()) as { data: INgoMarketHealth };
      setData(body.data);
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
      if (session.user.role !== Role.NGO && session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchHealth();
    }
  }, [status, session, router, fetchHealth]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-44 rounded" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-app-card" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-app-card" />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load market health</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchHealth()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return <Empty label="No market-health data available." />;

  if (data.servedCounties.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="app-h1 text-app-ink">Market Health</h1>
        <p className="app-body text-app-muted">
          No served counties on record yet. Once your organisation lists the counties it serves or
          sponsors a cooperative, market-health indicators for those areas appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-h1 text-app-ink">Market Health</h1>
        <p className="app-meta mt-1 text-app-faint">
          Aggregate indicators across {data.summary.servedCounties} served{' '}
          {data.summary.servedCounties === 1 ? 'county' : 'counties'}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Served counties" value={data.summary.servedCounties} />
        <Stat label="Active listings" value={data.summary.activeListings} />
        <Stat label="Crops on market" value={data.summary.crops} />
        <Stat label="Completed sales (30d)" value={data.summary.completedSales30d} />
      </div>

      <Section
        title="Food availability"
        description="Active supply per crop across the counties you serve."
      >
        {data.cropAvailability.length === 0 ? (
          <Empty label="No active listings in your counties yet." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH className="text-right">Active listings</TH>
              <TH className="text-right">Total quantity</TH>
              <TH>Season</TH>
            </THead>
            <tbody>
              {data.cropAvailability.map((r) => (
                <TR key={r.crop}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD className="app-data-m text-right">{r.activeListings}</TD>
                  <TD className="app-data-m text-right">{r.totalQuantity.toLocaleString()}</TD>
                  <TD className="text-app-muted">{humanize(r.seasonPhase)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section
        title="Shortage alerts"
        description="Crops with demand but thin supply during a low or off-season window."
      >
        {data.shortageAlerts.length === 0 ? (
          <Empty label="No supply shortages detected in your counties." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH>County</TH>
              <TH>Season</TH>
              <TH className="text-right">Sales (90d)</TH>
              <TH className="text-right">Active listings</TH>
            </THead>
            <tbody>
              {data.shortageAlerts.map((r, i) => (
                <TR key={`${r.crop}-${r.county}-${i}`}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD>{r.county}</TD>
                  <TD>
                    <StatusPill state="pending" label={humanize(r.seasonPhase)} />
                  </TD>
                  <TD className="app-data-m text-right">{r.completedSales90d}</TD>
                  <TD className="app-data-m text-right text-app-danger">{r.activeListings}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section
        title="Price stability"
        description="Median price and volatility per crop — high volatility signals an unstable market."
      >
        {data.priceStability.length === 0 ? (
          <Empty label="Not enough price data in your counties yet." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH className="text-right">Median price</TH>
              <TH className="text-right">Volatility</TH>
            </THead>
            <tbody>
              {data.priceStability.map((r) => (
                <TR key={r.crop}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD className="app-data-m text-right">
                    {r.medianPrice !== null ? `KSh ${r.medianPrice.toLocaleString()}/${r.unit.toLowerCase()}` : '—'}
                  </TD>
                  <TD className="app-data-m text-right">
                    {r.volatilityPct !== null ? `${r.volatilityPct}%` : '—'}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}
