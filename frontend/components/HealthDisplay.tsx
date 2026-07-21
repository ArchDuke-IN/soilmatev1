import React from 'react';

type HealthLabel = 'Optimal' | 'Nutrient Deficient' | 'Acidic' | 'Dry Stress' | null;

interface HealthDisplayProps {
  label: HealthLabel;
  confidence?: number | null;
  size?: 'hero' | 'large' | 'compact';
}

const HEALTH_MAP: Record<
  NonNullable<HealthLabel>,
  { cssClass: string; description: string; dot: string }
> = {
  'Optimal': {
    cssClass: 'status-optimal',
    description: 'All nutrient and moisture levels within ideal range.',
    dot: 'bar-optimal',
  },
  'Nutrient Deficient': {
    cssClass: 'status-deficient',
    description: 'Low nitrogen, phosphorus, or potassium detected.',
    dot: 'bar-deficient',
  },
  'Acidic': {
    cssClass: 'status-acidic',
    description: 'Soil pH below optimal threshold. Lime application recommended.',
    dot: 'bar-acidic',
  },
  'Dry Stress': {
    cssClass: 'status-dry',
    description: 'Moisture deficit with elevated temperature. Irrigation advised.',
    dot: 'bar-dry',
  },
};

export function HealthDisplay({ label, confidence, size = 'large' }: HealthDisplayProps) {
  if (!label) {
    return (
      <div>
        <div
          style={{
            fontSize: size === 'hero' ? 'clamp(4rem, 10vw, 9rem)' : size === 'large' ? '3.5rem' : '1.75rem',
            fontFamily: 'var(--font-head)',
            fontWeight: 300,
            color: 'var(--muted)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          No Data
        </div>
        <p
          style={{
            marginTop: '1rem',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--muted)',
          }}
        >
          Simulate a reading or connect your ESP32 rover.
        </p>
      </div>
    );
  }

  const meta = HEALTH_MAP[label];

  return (
    <div>
      {/* Status label */}
      <div
        key={label}
        className={`${meta.cssClass} value-flash`}
        style={{
          fontSize: size === 'hero' ? 'clamp(4rem, 10vw, 9rem)' : size === 'large' ? '3.5rem' : '1.75rem',
          fontFamily: 'var(--font-head)',
          fontWeight: 300,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          transition: 'color 0.5s ease',
        }}
      >
        {label}
      </div>

      {/* Description */}
      <p
        style={{
          marginTop: size === 'hero' ? '1.25rem' : '0.75rem',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--muted)',
          maxWidth: '380px',
          lineHeight: 1.65,
        }}
      >
        {meta.description}
      </p>

      {/* Confidence */}
      {confidence != null && (
        <div
          style={{
            marginTop: size === 'hero' ? '1.5rem' : '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '2px',
              backgroundColor: 'var(--sep)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              className={meta.dot}
              style={{
                height: '100%',
                width: `${confidence * 100}%`,
                borderRadius: '2px',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--muted)',
              letterSpacing: '0.02em',
            }}
          >
            {(confidence * 100).toFixed(1)}% model confidence
          </span>
        </div>
      )}
    </div>
  );
}
