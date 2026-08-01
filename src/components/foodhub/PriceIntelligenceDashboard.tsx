'use client';

import { useState, useEffect, useCallback } from 'react';
import PriceTrendChart from './PriceTrendChart';
import { PriceRecommendationPanel, usePriceRecommendation } from './PriceRecommendationPanel';
import { Button, Input, Select } from '@/components/app';
import { cn } from '@/lib/cn';
import { KENYAN_COUNTIES } from '@/types';

const CROPS = ['maize', 'beans', 'tomatoes', 'potatoes', 'tea', 'coffee', 'rice', 'kale', 'capsicum', 'dairy'];

interface IPriceDataPoint {
  recordedAt: string;
  pricePerUnit: number;
  source: string;
}

interface IPriceStats {
  dataPointCount: number;
  middlemanBenchmark: number | null;
  platformPremium: number | null;
}

interface IPriceData {
  cropName: string;
  county: string;
  unit: string;
  period: string;
  priceHistory: IPriceDataPoint[];
  stats: IPriceStats;
}

interface IAlertFormState {
  cropName: string;
  county: string;
  targetPricePerUnit: string;
  unit: string;
  notificationMethod: string;
}

/**
 * The middleman comparison, stated as a fact *about* the recommended price
 * rather than as a price of its own (D4).
 *
 * It renders attached beneath the recommendation panel, on the sunken surface
 * and at body weight — never in the `app-data-l` numerals the recommendation
 * owns. The visual subordination is the point: a farmer must be able to see at
 * a glance which figure is the platform's answer and which is context for it.
 */
function MiddlemanComparison({
  benchmark,
  premiumPct,
  unit,
}: {
  benchmark: number;
  premiumPct: number | null;
  unit: string;
}) {
  // The unit is printed again, which it could not be while D17 was open:
  // `MarketInsight` carried no `unit`, so this figure was whatever basis the
  // record happened to be written on — for seeded maize, a 90 kg BAG price of
  // 3,400 rendered as "KSh 3,400/kg" against a KG selector. `unit` is now part of
  // the record's identity and `/api/prices` filters the lookup by it, so the
  // benchmark reaching this component is guaranteed to be quoted in the unit the
  // farmer selected.
  const amount = benchmark.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const lowerUnit = unit.toLowerCase();
  return (
    <div className="rounded-b-app-card border border-t-0 border-app-hairline bg-app-sunken px-5 py-3">
      <p className="app-body text-app-body">
        {premiumPct !== null ? (
          <>
            That is{' '}
            <span className={premiumPct >= 0 ? 'text-app-brand' : 'text-app-danger'}>
              {Math.abs(premiumPct)}% {premiumPct >= 0 ? 'above' : 'below'}
            </span>{' '}
            the middleman benchmark of KSh {amount}/{lowerUnit}.
          </>
        ) : (
          <>
            Middlemen are benchmarked at KSh {amount}/{lowerUnit} here. There is not yet enough
            platform activity to compare against it.
          </>
        )}
      </p>
    </div>
  );
}

export default function PriceIntelligenceDashboard() {
  const [selectedCrop, setSelectedCrop] = useState('maize');
  const [selectedCounty, setSelectedCounty] = useState('Kiambu');
  const [selectedUnit, setSelectedUnit] = useState('KG');
  const [period, setPeriod] = useState('30d');
  const [priceData, setPriceData] = useState<IPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertForm, setAlertForm] = useState<IAlertFormState>({
    cropName: 'maize',
    county: 'Kiambu',
    targetPricePerUnit: '',
    unit: 'KG',
    notificationMethod: 'SMS',
  });
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/prices?cropName=${encodeURIComponent(selectedCrop)}&county=${encodeURIComponent(selectedCounty)}&unit=${encodeURIComponent(selectedUnit)}&period=${period}`
      );
      if (res.ok) {
        const body = await res.json() as { data: IPriceData };
        setPriceData(body.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop, selectedCounty, selectedUnit, period]);

  useEffect(() => {
    void fetchPrices();
  }, [fetchPrices]);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setAlertError(null);
    try {
      const res = await fetch('/api/prices/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alertForm,
          targetPricePerUnit: parseFloat(alertForm.targetPricePerUnit),
        }),
      });
      if (res.ok) {
        setAlertSuccess(true);
        setAlertForm((f) => ({ ...f, targetPricePerUnit: '' }));
        setTimeout(() => setAlertSuccess(false), 3000);
      } else {
        const err = await res.json() as { error: string };
        setAlertError(err.error ?? 'Could not create the alert');
      }
    } catch {
      setAlertError('Connection failed. Please try again.');
    }
  }

  // Must follow the same unit as the series below it, or the card and the chart
  // describe different markets on one screen.
  const { data: recommendation, isLoading: isRecLoading } = usePriceRecommendation(
    selectedCrop,
    selectedCounty,
    selectedUnit
  );

  const stats = priceData?.stats;

  return (
    <div className="space-y-6">
      {/* Crop/County/Period selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[160px] flex-1">
          <Select
            label="Crop"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[160px] flex-1">
          <Select
            label="County"
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
          >
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[140px] flex-1">
          {/* Required since D13 — a series may only contain one unit. */}
          <Select
            label="Unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {(['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE'] as const).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <span className="app-label mb-1.5 block text-app-body">Period</span>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                type="button"
                variant={period === p ? 'primary' : 'secondary'}
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* One price system, one headline (D4).
          D13 removed this page's competing average/lowest/highest — an unweighted
          mean and a min/max drawn across mixed units — so the two endpoints no
          longer disagree about the number. What remained was presentational: the
          MarketInsight figures still sat in a stat-card grid at the same visual
          weight as the recommendation, reading as a second price system beside
          it. They are now attached to the recommendation as context for it, and
          the observation count moved to the chart it actually describes. */}
      <div>
        <PriceRecommendationPanel
          recommendation={recommendation}
          isLoading={isRecLoading}
          className={cn(stats?.middlemanBenchmark != null && 'rounded-b-none border-b-0')}
        />
        {stats?.middlemanBenchmark != null && (
          <MiddlemanComparison
            benchmark={stats.middlemanBenchmark}
            premiumPct={stats.platformPremium}
            unit={selectedUnit}
          />
        )}
      </div>

      {/* Price chart */}
      <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
        {/* The observation count deliberately does NOT appear here. It belongs to
            the series, not to the recommendation — it counts plotted points over
            the selected period, a different window and scope from the evidence
            behind the recommended price, and showing the two as peer statistics
            is what made this page read as two systems. `PriceTrendChart` already
            captions itself "KSh per KG · 6 data points" immediately above the
            plot, which is where a count of plotted points belongs; repeating it
            in this header would be the same number twice on one screen. */}
        <h3 className="app-h2 mb-4 capitalize text-app-ink">
          {selectedCrop} prices — {selectedCounty}
        </h3>
        <PriceTrendChart
          data={priceData?.priceHistory ?? []}
          cropName={selectedCrop}
          isLoading={isLoading}
        />
      </div>

      {/* Alert creation form */}
      <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
        <h3 className="app-h2 mb-2 text-app-ink">Create Price Alert</h3>
        <p className="app-body mb-6 text-app-muted">
          Get notified by SMS when the price of your crop reaches your target.
        </p>
        <form onSubmit={(e) => void createAlert(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Crop"
              value={alertForm.cropName}
              onChange={(e) => setAlertForm((f) => ({ ...f, cropName: e.target.value }))}
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              label="County"
              value={alertForm.county}
              onChange={(e) => setAlertForm((f) => ({ ...f, county: e.target.value }))}
            >
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              label="Target Price (KSh)"
              min="1"
              step="0.01"
              value={alertForm.targetPricePerUnit}
              onChange={(e) => setAlertForm((f) => ({ ...f, targetPricePerUnit: e.target.value }))}
              placeholder="e.g. 45"
              required
            />
            <Select
              label="Unit"
              value={alertForm.unit}
              onChange={(e) => setAlertForm((f) => ({ ...f, unit: e.target.value }))}
            >
              {['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>

          {alertError && <p className="app-body text-app-danger">{alertError}</p>}
          {alertSuccess && (
            <p className="app-body text-app-brand">
              Price alert created. You will be notified when the price is reached.
            </p>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            Set Alert
          </Button>
        </form>
      </div>
    </div>
  );
}
