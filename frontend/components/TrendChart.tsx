'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { SensorReading } from '@/lib/api';

interface TrendChartProps {
  data: SensorReading[];
  sensorKey: keyof SensorReading;
  label: string;
  unit: string;
  color?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--sep)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '12px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <p style={{ color: 'var(--muted)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 400 }}>
        {Number(payload[0].value).toFixed(2)}{' '}
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{payload[0].name}</span>
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  sensorKey,
  label,
  unit,
  color = 'var(--ink)',
}: TrendChartProps) {
  if (!data.length) {
    return (
      <div
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          borderBottom: '1px solid var(--sep)',
        }}
      >
        No historical data for this window.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    value: d[sensorKey] as number,
  }));

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = (maxVal - minVal) * 0.15 || 1;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Chart header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--sep)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--muted)',
            letterSpacing: '0.04em',
          }}
        >
          {unit} · {data.length} readings
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--sep)"
            strokeDasharray="0"
            strokeWidth={1}
          />
          <XAxis
            dataKey="time"
            tick={{
              fontSize: 10,
              fontFamily: 'var(--font-sans)',
              fill: 'var(--muted)',
            }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal - pad, maxVal + pad]}
            tick={{
              fontSize: 10,
              fontFamily: 'var(--font-sans)',
              fill: 'var(--muted)',
            }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name={unit}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
