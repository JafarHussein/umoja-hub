'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Table, THead, TH, TR, TD } from '@/components/app';
import { Role } from '@/types';

interface ICommodityRow {
  crop: string;
  unit: string;
  medianPrice: number | null;
  trendDirection: 'RISING' | 'STABLE' | 'FALLING';
  changePct30d: number | null;
  volatilityPct: number | null;
  dataPointCount: number;
}
interface IHotspotRow {
  crop: string;
  county: string;
  completedSales30d: number;
  activeListings: number;
  intensity: number;
}
interface IRegionalCropRow {
  crop: string;
  unit: string;
  regions: Array<{ region: string; medianPrice: number; dataPointCount: number }>;
}
interface IConcentrationRow {
  crop: string;
  activeListings: number;
  sellerCount: number;
  topSellerSharePct: number | null;
}
interface IAnomalyRow {
  crop: string;
  county: string;
  unit: string;
  pricePerUnit: number;
  medianPrice: number;
  deviationPct: number;
  recordedAt: string;
}
interface IPriceAnalytics {
  generatedAt: string;
  commodityOverview: ICommodityRow[];
  demandHotspots: IHotspotRow[];
  regionalComparison: IRegionalCropRow[];
  supplyConcentration: IConcentrationRow[];
  anomalies: IAnomalyRow[];
}

type PageState = 'loading' | 'ready' | 'error';

function Trend({ direction, pct }: { direction: string; pct: number | null }): React.ReactElement {
  const label = pct !== null ? `${pct > 0 ? '+' : ''}${pct}%` : '—';
  if (direction === 'RISING') return <span className="text-app-brand">▲ {label}</span>;
  if (direction === 'FALLING') return <span className="text-app-danger">▼ {label}</span>;
  return <span className="text-app-muted">→ {label}</span>;
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
    <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
      <p className="app-body text-app-muted">{label}</p>
    </div>
  );
}

export default function AdminPriceAnalyticsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [data, setData] = useState<IPriceAnalytics | null>(null);

  const fetchAnalytics = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/price-analytics');
      if (!res.ok) throw new Error('Request failed');
      const body = (await res.json()) as { data: IPriceAnalytics };
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchAnalytics();
    }
  }, [status, session, router, fetchAnalytics]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-48 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-app-card" />
        ))}
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load price analytics</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchAnalytics()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return <Empty label="No analytics available." />;

  const generatedAt = new Date(data.generatedAt).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="app-h1 text-app-ink">Price Analytics</h1>
        <p className="app-meta mt-1 text-app-faint">
          Platform-wide market intelligence · generated {generatedAt}
        </p>
      </div>

      <Section
        title="Commodity overview"
        description="Median price, 30-day trend and price volatility per crop (dominant unit)."
      >
        {data.commodityOverview.length === 0 ? (
          <Empty label="No recent price activity to summarise." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH className="text-right">Median</TH>
              <TH className="text-right">Trend (30d)</TH>
              <TH className="text-right">Volatility</TH>
              <TH className="text-right">Data points</TH>
            </THead>
            <tbody>
              {data.commodityOverview.map((r) => (
                <TR key={r.crop}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD className="app-data-m text-right">
                    {r.medianPrice !== null ? `KSh ${r.medianPrice.toLocaleString()}/${r.unit.toLowerCase()}` : '—'}
                  </TD>
                  <TD className="app-data-m text-right">
                    <Trend direction={r.trendDirection} pct={r.changePct30d} />
                  </TD>
                  <TD className="app-data-m text-right">
                    {r.volatilityPct !== null ? `${r.volatilityPct}%` : '—'}
                  </TD>
                  <TD className="app-data-m text-right text-app-muted">{r.dataPointCount}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section
        title="Demand hotspots"
        description="Crop + county cells with the highest completed-sale velocity against active supply."
      >
        {data.demandHotspots.length === 0 ? (
          <Empty label="No demand hotspots in the last 30 days." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH>County</TH>
              <TH className="text-right">Sales (30d)</TH>
              <TH className="text-right">Active listings</TH>
              <TH className="text-right">Intensity</TH>
            </THead>
            <tbody>
              {data.demandHotspots.map((r) => (
                <TR key={`${r.crop}-${r.county}`}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD>{r.county}</TD>
                  <TD className="app-data-m text-right">{r.completedSales30d}</TD>
                  <TD className="app-data-m text-right">{r.activeListings}</TD>
                  <TD className="app-data-m text-right text-app-brand">{r.intensity}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section
        title="Regional price comparison"
        description="Median price by region for the most-traded crops — spot inter-regional gaps."
      >
        {data.regionalComparison.length === 0 ? (
          <Empty label="Not enough multi-region data yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.regionalComparison.map((r) => (
              <div
                key={r.crop}
                className="rounded-app-card border border-app-hairline bg-app-card p-4"
              >
                <p className="app-label mb-2 capitalize text-app-ink">{r.crop}</p>
                <ul className="space-y-1">
                  {r.regions.map((reg) => (
                    <li key={reg.region} className="flex items-center justify-between">
                      <span className="app-body text-app-muted">{reg.region}</span>
                      <span className="app-data-m text-app-ink">
                        KSh {reg.medianPrice.toLocaleString()}/{r.unit.toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Supply concentration"
        description="How concentrated each crop's active supply is — a high top-seller share signals thin competition."
      >
        {data.supplyConcentration.length === 0 ? (
          <Empty label="No active listings to analyse." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH className="text-right">Active listings</TH>
              <TH className="text-right">Sellers</TH>
              <TH className="text-right">Top-seller share</TH>
            </THead>
            <tbody>
              {data.supplyConcentration.map((r) => (
                <TR key={r.crop}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD className="app-data-m text-right">{r.activeListings}</TD>
                  <TD className="app-data-m text-right">{r.sellerCount}</TD>
                  <TD className="app-data-m text-right">
                    {r.topSellerSharePct !== null ? `${r.topSellerSharePct}%` : '—'}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section
        title="Market anomalies"
        description="Price points far from a crop's median (possible typos, manipulation, or genuine shocks)."
      >
        {data.anomalies.length === 0 ? (
          <Empty label="No anomalies detected." />
        ) : (
          <Table>
            <THead>
              <TH>Crop</TH>
              <TH>County</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-right">Crop median</TH>
              <TH className="text-right">Deviation</TH>
            </THead>
            <tbody>
              {data.anomalies.map((r, i) => (
                <TR key={`${r.crop}-${r.county}-${i}`}>
                  <TD className="capitalize text-app-ink">{r.crop}</TD>
                  <TD>{r.county}</TD>
                  <TD className="app-data-m text-right">
                    KSh {r.pricePerUnit.toLocaleString()}/{r.unit.toLowerCase()}
                  </TD>
                  <TD className="app-data-m text-right text-app-muted">
                    KSh {r.medianPrice.toLocaleString()}
                  </TD>
                  <TD className="app-data-m text-right text-app-danger">
                    {r.deviationPct > 0 ? '+' : ''}
                    {r.deviationPct}%
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
