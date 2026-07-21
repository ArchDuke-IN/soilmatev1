'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ChartLine } from '@phosphor-icons/react';
import { fetchCurrent, isNoData, type SensorReading } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { HealthDisplay } from '@/components/HealthDisplay';
import { CropRecommendation } from '@/components/CropRecommendation';
import { SensorTable } from '@/components/SensorTable';
import { SimulateButton } from '@/components/SimulateButton';

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0);

  const fetchFn = useCallback(() => fetchCurrent('rover_01'), []);
  const { data, prev, loading, error, lastUpdated, refetch } = usePolling(fetchFn, 5000);

  const reading: SensorReading | null =
    data && !isNoData(data) ? (data as SensorReading) : null;
  const prevReading: SensorReading | null =
    prev && !isNoData(prev) ? (prev as SensorReading) : null;

  const handleSimulate = () => {
    setTick((t) => t + 1);
    refetch();
  };

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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '3rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--sep)',
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
              Soil Analysis & Crop Matching
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                rover_01
              </span>
              <span style={{ color: 'var(--sep)', fontSize: '10px' }}>|</span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--muted)',
                }}
              >
                Auto-refresh every 5s
              </span>
              {lastUpdated && (
                <>
                  <span style={{ color: 'var(--sep)', fontSize: '10px' }}>|</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--muted)',
                    }}
                  >
                    {formatTimestamp(lastUpdated.toISOString())}
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SimulateButton onSuccess={handleSimulate} variant="primary" />
            <Link
              href="/history"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                color: 'var(--muted)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'color 0.2s ease',
              }}
            >
              <ChartLine size={14} />
              History
            </Link>
          </div>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────── */}
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
            {error} — make sure the FastAPI backend is running on port 8000.
          </div>
        )}

        {/* ── Health Classification ────────────────────────────────── */}
        <div
          style={{
            marginBottom: '3rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid var(--sep)',
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
              marginBottom: '1.25rem',
            }}
          >
            Health Classification
          </p>

          {loading && !reading ? (
            <div>
              <div className="skeleton" style={{ height: '52px', width: '280px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '14px', width: '220px' }} />
            </div>
          ) : (
            <HealthDisplay
              label={reading?.health_label as any ?? null}
              confidence={reading?.confidence_score}
              size="large"
            />
          )}

          {/* ── Crop Recommendation ──────────────────────────────── */}
          {reading?.recommended_crop && (
            <CropRecommendation
              recommendedCrop={reading.recommended_crop}
              confidence={reading.crop_confidence}
              topCrops={reading.top_crops}
            />
          )}
        </div>

        {/* ── Sensor Readings ──────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--muted)',
              marginBottom: '1rem',
            }}
          >
            Sensor Readings
          </p>

          <SensorTable
            reading={reading}
            prevReading={prevReading}
            loading={loading}
          />
        </div>

        {/* ── Footer note ─────────────────────────────────────────── */}
        {reading && (
          <p
            style={{
              marginTop: '2rem',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--muted)',
              letterSpacing: '0.02em',
            }}
          >
            Reading #{reading.id} · {formatTimestamp(reading.timestamp)} UTC ·{' '}
            <Link
              href="/history"
              style={{
                color: 'var(--ink)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              View full history
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
