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

// App design-system palette mirrors (Recharts takes SVG colours as values, not
// CSS classes) — kept in lockstep with the .theme-app tokens in globals.css.
const APP_BRAND = '#1E5C45'; // brand / proceed
const APP_HAIRLINE = '#E4E2DA'; // grid + axis lines
const APP_MUTED = '#6E6B61'; // axis tick labels

function ChartSkeleton() {
  return <div className="skeleton h-64 w-full rounded-app-card border border-app-hairline" />;
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
    <div className="rounded-app-control border border-app-hairline bg-app-card px-3 py-2 shadow-app-float">
      <p className="app-meta mb-1 text-app-muted">{label}</p>
      <p className="app-data-m text-app-brand">KSh {payload[0]?.value?.toFixed(2)}</p>
      <p className="app-meta capitalize text-app-faint">
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
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-app-card border border-app-hairline bg-app-sunken">
        <p className="app-body text-app-muted">No price data available</p>
        <p className="app-meta mt-1 text-app-faint">
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
      <p className="app-meta mb-3 text-app-muted">
        KSh per {unit} · {data.length} data point{data.length !== 1 ? 's' : ''}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={APP_HAIRLINE} />
          <XAxis
            dataKey="date"
            tick={{ fill: APP_MUTED, fontSize: 11, fontFamily: 'var(--font-spline-mono)' }}
            axisLine={{ stroke: APP_HAIRLINE }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: APP_MUTED, fontSize: 11, fontFamily: 'var(--font-spline-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={APP_BRAND}
            strokeWidth={2}
            dot={{ fill: APP_BRAND, r: 3, strokeWidth: 0 }}
            activeDot={{ fill: APP_BRAND, r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
