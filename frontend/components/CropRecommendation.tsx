import React from 'react';
import type { CropScore } from '@/lib/api';
import { Plant } from '@phosphor-icons/react';

interface CropRecommendationProps {
  recommendedCrop?: string | null;
  confidence?: number | null;
  topCrops?: CropScore[] | null;
}

export function CropRecommendation({
  recommendedCrop,
  confidence,
  topCrops,
}: CropRecommendationProps) {
  if (!recommendedCrop) return null;

  const validTopCrops = topCrops ?? [
    { crop: recommendedCrop, score: confidence ?? 0.95 },
  ];

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Label header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem',
        }}
      >
        <Plant size={15} weight="bold" style={{ color: 'var(--accent)' }} />
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--muted)',
          }}
        >
          Soil Crop Recommendation
        </span>
      </div>

      {/* Primary Recommended Crop */}
      <div
        className="value-flash"
        style={{
          fontSize: '2.5rem',
          fontFamily: 'var(--font-head)',
          fontWeight: 300,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
        }}
      >
        {recommendedCrop}
      </div>

      {/* Subtext */}
      <p
        style={{
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--muted)',
          marginBottom: '1.5rem',
          maxWidth: '420px',
          lineHeight: 1.6,
        }}
      >
        Based on NPK nutrient levels, soil pH, moisture, and micro-climate telemetry trained on Kaggle agricultural datasets.
      </p>

      {/* Top 3 Suitability Breakdown */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          maxWidth: '440px',
        }}
      >
        {validTopCrops.map(({ crop, score }, idx) => {
          const pct = Math.round(score * 100);
          const isPrimary = idx === 0;

          return (
            <div key={crop} className="row-in">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: isPrimary ? 500 : 400,
                    color: isPrimary ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {crop} {isPrimary && <span style={{ fontSize: '10px', color: 'var(--accent)', marginLeft: '4px' }}>★ Primary</span>}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-head)',
                    color: isPrimary ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {pct}% Match
                </span>
              </div>

              {/* Progress bar track */}
              <div
                style={{
                  height: '2px',
                  backgroundColor: 'var(--sep)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: isPrimary ? 'var(--accent)' : 'var(--muted)',
                    borderRadius: '2px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
