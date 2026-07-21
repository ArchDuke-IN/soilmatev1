'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Plant } from '@phosphor-icons/react';
import { fetchCurrent, isNoData, type SensorReading } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { HealthDisplay } from '@/components/HealthDisplay';
import { SimulateButton } from '@/components/SimulateButton';

const SENSOR_KEYS: { key: keyof SensorReading; label: string; unit: string }[] = [
  { key: 'nitrogen',    label: 'N',    unit: 'mg/kg' },
  { key: 'phosphorus',  label: 'P',    unit: 'mg/kg' },
  { key: 'potassium',   label: 'K',    unit: 'mg/kg' },
  { key: 'ph',          label: 'pH',   unit: '' },
  { key: 'moisture',    label: 'Moist',unit: '%' },
  { key: 'temperature', label: 'Temp', unit: '°C' },
  { key: 'humidity',    label: 'Hum',  unit: '%' },
];

function RelativeTime({ timestamp }: { timestamp: string }) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  const str =
    diff < 5  ? 'just now'    :
    diff < 60 ? `${diff}s ago` :
    diff < 3600 ? `${Math.floor(diff / 60)}m ago` :
    `${Math.floor(diff / 3600)}h ago`;
  return <span>{str}</span>;
}

export default function HomePage() {
  const fetchFn = useCallback(() => fetchCurrent('rover_01'), []);
  const { data, loading, error, refetch } = usePolling(fetchFn, 5000);

  const reading: SensorReading | null =
    data && !isNoData(data) ? (data as SensorReading) : null;

  return (
    <div
      style={{
        minHeight: '100dvh',
        paddingTop: '56px', /* nav height */
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1px 380px',
          gap: '0',
          minHeight: 'calc(100dvh - 56px)',
        }}
      >
        {/* ─── Left: Hero Status ───────────────────────────────────── */}
        <section
          style={{
            paddingTop: '5rem',
            paddingBottom: '4rem',
            paddingRight: '4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Overline */}
          <p
            className="hero-in"
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className="live-dot"
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
              }}
            />
            Live Field Status
          </p>

          {/* Health Label */}
          <div className="hero-in-delay">
            <HealthDisplay
              label={reading?.health_label as any ?? null}
              confidence={reading?.confidence_score}
              size="hero"
            />
          </div>

          {/* Recommended Crop Badge */}
          {reading?.recommended_crop && (
            <div
              className="hero-in-delay2"
              style={{
                marginTop: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--sep)',
                borderRadius: '4px',
                maxWidth: 'fit-content',
              }}
            >
              <Plant size={16} weight="bold" style={{ color: 'var(--accent)' }} />
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                }}
              >
                Recommended Crop: <strong style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{reading.recommended_crop}</strong> ({Math.round((reading.crop_confidence ?? 0.9) * 100)}% Match)
              </span>
            </div>
          )}

          {/* Meta info */}
          <div
            className="hero-in-delay2"
            style={{ marginTop: '2rem' }}
          >
            {reading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--muted)',
                    letterSpacing: '0.03em',
                  }}
                >
                  {reading.device_id} · Reading #{reading.id}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--muted)',
                  }}
                >
                  <RelativeTime timestamp={reading.timestamp} />
                </span>
              </div>
            ) : !loading && (
              <p
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--muted)',
                  maxWidth: '340px',
                  lineHeight: 1.65,
                }}
              >
                No readings yet. Click Simulate Reading to generate field data, or connect your ESP32 rover via{' '}
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: 'var(--surface)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                  }}
                >
                  POST /api/sensors/ingest
                </code>
                .
              </p>
            )}

            {error && (
              <p
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--acidic)',
                  marginTop: '0.5rem',
                }}
              >
                {error} — is the backend running?
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            className="hero-in-delay2"
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <SimulateButton onSuccess={refetch} />
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                paddingBottom: '1px',
                borderBottom: '1px solid var(--sep)',
              }}
            >
              Full Dashboard <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </section>

        {/* ─── Vertical Divider ─────────────────────────────────────── */}
        <div style={{ backgroundColor: 'var(--sep)' }} />

        {/* ─── Right: Live Sensor Feed ──────────────────────────────── */}
        <section
          className="float-up"
          style={{
            paddingTop: '5rem',
            paddingBottom: '4rem',
            paddingLeft: '3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '2rem',
            }}
          >
            Current Readings
          </p>

          <div>
            {SENSOR_KEYS.map(({ key, label, unit }) => {
              const val = reading?.[key] as number | undefined;
              return (
                <div
                  key={key}
                  className="row-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '0.85rem 0',
                    borderBottom: '1px solid var(--sep)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    key={`${key}-${val}`}
                    className={val != null ? 'value-flash' : ''}
                    style={{
                      fontSize: '15px',
                      fontFamily: 'var(--font-head)',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {val != null
                      ? `${val.toFixed(1)}${unit ? ' ' + unit : ''}`
                      : loading
                      ? <span className="skeleton" style={{ display: 'inline-block', width: '60px', height: '14px' }} />
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Mobile fallback — single column */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1px 380px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="backgroundColor: var(--sep)"][style*="gridColumn"] {
            display: none !important;
          }
          section[style*="paddingRight: 4rem"] {
            padding-right: 0 !important;
          }
          section[style*="paddingLeft: 3rem"] {
            padding-left: 0 !important;
            border-top: 1px solid var(--sep);
          }
        }
      `}</style>
    </div>
  );
}
