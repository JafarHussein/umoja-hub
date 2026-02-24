'use client';

import { useState, useEffect, useCallback } from 'react';
import PriceTrendChart from './PriceTrendChart';
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
    <div className="bg-surface-secondary border border-white/5 rounded p-4">
      <p className="font-body text-t6 text-text-secondary mb-1">{label}</p>
      <p className="font-mono text-t3 text-text-primary">{value}</p>
      {sub && <p className="font-body text-t6 text-text-disabled mt-1">{sub}</p>}
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
        setAlertError(err.error ?? 'Failed to create alert');
      }
    } catch {
      setAlertError('Connection failed. Please try again.');
    }
  }

  const stats = priceData?.stats;
  const premiumColor =
    stats?.platformPremium !== null && stats?.platformPremium !== undefined
      ? stats.platformPremium >= 0
        ? 'text-accent-green'
        : 'text-red-400'
      : 'text-text-secondary';

  return (
    <div className="space-y-6">
      {/* Crop/County/Period selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block font-body text-t6 text-text-secondary mb-1">Crop</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
          >
            {CROPS.map((c) => (
              <option key={c} value={c} className="bg-surface-elevated capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block font-body text-t6 text-text-secondary mb-1">County</label>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
          >
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c} className="bg-surface-elevated">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-body text-t6 text-text-secondary mb-1">Period</label>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-sm font-body text-t5 border transition-all duration-150 min-h-[44px] ${
                  period === p
                    ? 'bg-accent-green text-white border-accent-green'
                    : 'bg-surface-secondary text-text-secondary border-white/5 hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Avg Price"
            value={stats.averagePrice !== null ? `KES ${stats.averagePrice.toFixed(0)}` : '—'}
            sub="UmojaHub average"
          />
          <StatCard
            label="Lowest"
            value={stats.lowestPrice !== null ? `KES ${stats.lowestPrice.toFixed(0)}` : '—'}
          />
          <StatCard
            label="Highest"
            value={stats.highestPrice !== null ? `KES ${stats.highestPrice.toFixed(0)}` : '—'}
          />
          <div className="bg-surface-secondary border border-white/5 rounded p-4">
            <p className="font-body text-t6 text-text-secondary mb-1">Platform Premium</p>
            <p className={`font-mono text-t3 ${premiumColor}`}>
              {stats.platformPremium !== null
                ? `${stats.platformPremium > 0 ? '+' : ''}${stats.platformPremium}%`
                : '—'}
            </p>
            <p className="font-body text-t6 text-text-disabled mt-1">vs middleman benchmark</p>
          </div>
        </div>
      )}

      {/* Price chart */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <h3 className="font-heading text-t3 text-text-primary mb-4 capitalize">
          {selectedCrop} prices — {selectedCounty}
        </h3>
        <PriceTrendChart
          data={priceData?.priceHistory ?? []}
          cropName={selectedCrop}
          isLoading={isLoading}
        />
      </div>

      {/* Alert creation form */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <h3 className="font-heading text-t3 text-text-primary mb-4">Create Price Alert</h3>
        <p className="font-body text-t5 text-text-secondary mb-6">
          Get notified by SMS when the price of your crop reaches your target.
        </p>
        <form onSubmit={(e) => void createAlert(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-body text-t5 text-text-secondary mb-1">Crop</label>
              <select
                value={alertForm.cropName}
                onChange={(e) => setAlertForm((f) => ({ ...f, cropName: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c} className="bg-surface-elevated capitalize">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-t5 text-text-secondary mb-1">County</label>
              <select
                value={alertForm.county}
                onChange={(e) => setAlertForm((f) => ({ ...f, county: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
              >
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c} className="bg-surface-elevated">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-t5 text-text-secondary mb-1">
                Target Price (KES)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={alertForm.targetPricePerUnit}
                onChange={(e) => setAlertForm((f) => ({ ...f, targetPricePerUnit: e.target.value }))}
                placeholder="e.g. 45"
                required
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-body text-t5 text-text-secondary mb-1">Unit</label>
              <select
                value={alertForm.unit}
                onChange={(e) => setAlertForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-3 py-2 font-body text-t5 text-text-primary focus:outline-none focus:border-accent-green/50 min-h-[44px]"
              >
                {['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE'].map((u) => (
                  <option key={u} value={u} className="bg-surface-elevated">
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {alertError && (
            <p className="font-body text-t5 text-red-400">{alertError}</p>
          )}
          {alertSuccess && (
            <p className="font-body text-t5 text-accent-green">
              Price alert created. You will be notified when the price is reached.
            </p>
          )}

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-accent-green text-white rounded-sm font-body text-t4 hover:opacity-90 transition-all duration-150 min-h-[44px]"
          >
            Set Alert
          </button>
        </form>
      </div>
    </div>
  );
}
