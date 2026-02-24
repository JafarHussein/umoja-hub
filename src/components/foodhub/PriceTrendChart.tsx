'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface IPriceDataPoint {
  recordedAt: string;
  pricePerUnit: number;
  source: string;
}

interface IPriceTrendChartProps {
  data: IPriceDataPoint[];
  cropName: string;
  unit?: string;
  isLoading?: boolean;
}

function ChartSkeleton() {
  return (
    <div className="w-full h-64 bg-surface-secondary border border-white/5 rounded animate-shimmer"
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

interface ITooltipPayload {
  value: number;
  payload: { source: string };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ITooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-white/10 rounded px-3 py-2">
      <p className="font-body text-t6 text-text-secondary mb-1">{label}</p>
      <p className="font-mono text-t5 text-accent-green">
        KES {payload[0]?.value?.toFixed(2)}
      </p>
      <p className="font-body text-t6 text-text-disabled capitalize">
        {payload[0]?.payload?.source?.replace('_', ' ').toLowerCase()}
      </p>
    </div>
  );
}

export default function PriceTrendChart({
  data,
  cropName,
  unit = 'KG',
  isLoading = false,
}: IPriceTrendChartProps) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data.length) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-surface-secondary border border-white/5 rounded">
        <p className="font-body text-t5 text-text-secondary">No price data available</p>
        <p className="font-body text-t6 text-text-disabled mt-1">
          Price history for {cropName} will appear here once trading begins
        </p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: formatDate(point.recordedAt),
    price: point.pricePerUnit,
    source: point.source,
  }));

  return (
    <div className="w-full">
      <p className="font-body text-t6 text-text-secondary mb-3">
        KES per {unit} · {data.length} data point{data.length !== 1 ? 's' : ''}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8B949E', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8B949E', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#007F4E"
            strokeWidth={2}
            dot={{ fill: '#007F4E', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: '#007F4E', r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
