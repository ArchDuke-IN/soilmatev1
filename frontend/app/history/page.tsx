'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchHistory, type SensorReading } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';

// Dynamically import chart to avoid SSR issues with Recharts
const TrendChart = dynamic(
  () => import('@/components/TrendChart').then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton" style={{ height: '180px', borderRadius: '4px', marginBottom: '2.5rem' }} />
    ),
  },
);

const TIME_WINDOWS = [
  { label: '1 H',  hours: 1 },
  { label: '6 H',  hours: 6 },
  { label: '24 H', hours: 24 },
  { label: '7 D',  hours: 168 },
];

const SENSORS: {
  key: keyof SensorReading;
  label: string;
  unit: string;
  color: string;
}[] = [
  { key: 'nitrogen',    label: 'Nitrogen (N)',    unit: 'mg/kg', color: '#3D6B4F' },
  { key: 'phosphorus',  label: 'Phosphorus (P)',  unit: 'mg/kg', color: '#B87333' },
  { key: 'potassium',   label: 'Potassium (K)',   unit: 'mg/kg', color: '#5A7FA6' },
  { key: 'ph',          label: 'pH Level',        unit: 'pH',    color: '#8B3A3A' },
  { key: 'moisture',    label: 'Moisture',        unit: '%',     color: '#4A7FA0' },
  { key: 'temperature', label: 'Temperature',     unit: '°C',    color: '#9B7541' },
  { key: 'humidity',    label: 'Humidity',        unit: '%',     color: '#7A6B9B' },
];

export default function HistoryPage() {
  const [hours, setHours] = useState(24);
  const [activeSensors, setActiveSensors] = useState<Set<string>>(
    new Set(['nitrogen', 'ph', 'moisture']),
  );

  const fetchFn = useCallback(
    () => fetchHistory('rover_01', hours),
    [hours],
  );
  const { data, loading, error } = usePolling(fetchFn, 30000);

  const readings = data?.data ?? [];

  function toggleSensor(key: string) {
    setActiveSensors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // always keep at least 1
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div style={{ minHeight: '100dvh', paddingTop: '56px' }}>
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '4rem 2rem 6rem',
        }}
      >
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div
          style={{
            marginBottom: '3rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--sep)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '2rem',
                fontWeight: 300,
                color: 'var(--ink)',
                letterSpacing: '-0.04em',
                marginBottom: '0.35rem',
              }}
            >
              Historical Trends
            </h1>
            <p
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              rover_01 · {readings.length} readings in window
            </p>
          </div>

          {/* Time Window Selector */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              backgroundColor: 'var(--surface)',
              padding: '3px',
              borderRadius: '5px',
            }}
          >
            {TIME_WINDOWS.map(({ label, hours: h }) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: hours === h ? 'var(--bg)' : 'transparent',
                  color: hours === h ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: hours === h ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sensor Toggles ───────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          {SENSORS.map(({ key, label, color }) => {
            const active = activeSensors.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleSensor(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  border: `1px solid ${active ? color : 'var(--sep)'}`,
                  borderRadius: '3px',
                  backgroundColor: active ? `${color}12` : 'transparent',
                  color: active ? color : 'var(--muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: active ? color : 'var(--sep)',
                    transition: 'background-color 0.2s',
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Error ────────────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              marginBottom: '2rem',
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderLeft: '2px solid var(--acidic)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--acidic)',
            }}
          >
            {error} — is the backend running?
          </div>
        )}

        {/* ── Charts ───────────────────────────────────────────────── */}
        {loading && !readings.length ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '180px', borderRadius: '4px', marginBottom: '2.5rem' }}
              />
            ))}
          </div>
        ) : readings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 0',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--muted)',
                marginBottom: '0.5rem',
              }}
            >
              No data for the selected time window.
            </p>
            <p
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--muted)',
              }}
            >
              Try a wider window or simulate some readings from the{' '}
              <a
                href="/dashboard"
                style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Dashboard
              </a>
              .
            </p>
          </div>
        ) : (
          <div>
            {SENSORS.filter((s) => activeSensors.has(s.key)).map((s) => (
              <TrendChart
                key={`${s.key}-${hours}`}
                data={readings}
                sensorKey={s.key}
                label={s.label}
                unit={s.unit}
                color={s.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
