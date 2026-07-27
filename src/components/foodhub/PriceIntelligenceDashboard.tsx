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
  averagePrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  middlemanBenchmark: number | null;
  platformPremium: number | null;
}

interface IPriceData {
  cropName: string;
  county: string;
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
        `/api/prices?cropName=${encodeURIComponent(selectedCrop)}&county=${encodeURIComponent(selectedCounty)}&period=${period}`
      );
      if (res.ok) {
        const body = await res.json() as { data: IPriceData };
        setPriceData(body.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop, selectedCounty, period]);

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

  const { data: recommendation, isLoading: isRecLoading } = usePriceRecommendation(
    selectedCrop,
    selectedCounty,
    'KG'
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

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Avg Price"
            value={stats.averagePrice !== null ? `KSh ${stats.averagePrice.toFixed(0)}` : '—'}
            sub="UmojaHub average"
          />
          <StatCard
            label="Lowest"
            value={stats.lowestPrice !== null ? `KSh ${stats.lowestPrice.toFixed(0)}` : '—'}
          />
          <StatCard
            label="Highest"
            value={stats.highestPrice !== null ? `KSh ${stats.highestPrice.toFixed(0)}` : '—'}
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
