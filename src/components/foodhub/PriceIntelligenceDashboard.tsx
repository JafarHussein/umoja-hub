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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
      <p className="app-label mb-1 text-app-muted">{label}</p>
      <p className="app-data-l text-app-ink">{value}</p>
      {sub && <p className="app-meta mt-1 text-app-faint">{sub}</p>}
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
  const premiumColor =
    stats?.platformPremium !== null && stats?.platformPremium !== undefined
      ? stats.platformPremium >= 0
        ? 'text-app-brand'
        : 'text-app-danger'
      : 'text-app-muted';

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

      {/* Recommendation panel — the headline guidance */}
      <PriceRecommendationPanel recommendation={recommendation} isLoading={isRecLoading} />

      {/* Context row. The average/lowest/highest cards were removed with D13 —
          they were an unweighted mean and a min/max taken across mixed units, so
          the low and the high were routinely drawn from different units. The
          headline figure now comes from the recommendation panel above, which is
          the single place that decides what a crop is worth. */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard
            label="Observations"
            value={String(stats.dataPointCount)}
            sub={`${selectedUnit} prices in ${period}`}
          />
          <StatCard
            label="Middleman Benchmark"
            value={
              stats.middlemanBenchmark !== null ? `KSh ${stats.middlemanBenchmark.toFixed(0)}` : '—'
            }
            sub={`per ${selectedUnit}`}
          />
          <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
            <p className="app-label mb-1 text-app-muted">Platform Premium</p>
            <p className={cn('app-data-l', premiumColor)}>
              {stats.platformPremium !== null
                ? `${stats.platformPremium > 0 ? '+' : ''}${stats.platformPremium}%`
                : '—'}
            </p>
            <p className="app-meta mt-1 text-app-faint">vs middleman benchmark</p>
          </div>
        </div>
      )}

      {/* Price chart */}
      <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
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
