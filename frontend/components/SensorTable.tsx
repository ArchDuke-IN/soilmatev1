import type { SensorReading } from '@/lib/api';

interface SensorRowProps {
  label: string;
  key_?: string;
  value: number | null;
  prevValue?: number | null;
  unit: string;
  min: number;
  max: number;
  flash?: boolean;
}

const RANGES: Record<string, { min: number; max: number; unit: string; label: string }> = {
  nitrogen:    { min: 0,  max: 100, unit: 'mg/kg', label: 'Nitrogen (N)' },
  phosphorus:  { min: 0,  max: 60,  unit: 'mg/kg', label: 'Phosphorus (P)' },
  potassium:   { min: 0,  max: 250, unit: 'mg/kg', label: 'Potassium (K)' },
  ph:          { min: 0,  max: 14,  unit: 'pH',    label: 'pH Level' },
  moisture:    { min: 0,  max: 100, unit: '%',      label: 'Moisture' },
  temperature: { min: 10, max: 50,  unit: '°C',    label: 'Temperature' },
  humidity:    { min: 0,  max: 100, unit: '%',      label: 'Humidity' },
};

type SensorKey = keyof typeof RANGES;

function getTrend(curr: number, prev: number | null | undefined): 'up' | 'down' | 'stable' {
  if (prev == null) return 'stable';
  const delta = ((curr - prev) / Math.abs(prev + 0.001)) * 100;
  if (delta > 2) return 'up';
  if (delta < -2) return 'down';
  return 'stable';
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const style: React.CSSProperties = {
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    color:
      trend === 'up'   ? 'var(--optimal)'   :
      trend === 'down' ? 'var(--acidic)'     :
                         'var(--muted)',
    userSelect: 'none',
  };
  return <span style={style}>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>;
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.25rem 0',
        borderBottom: '1px solid var(--sep)',
      }}
    >
      <div className="skeleton" style={{ height: '14px', width: '120px' }} />
      <div className="skeleton" style={{ height: '14px', width: '80px' }} />
      <div className="skeleton" style={{ height: '14px', width: '20px' }} />
    </div>
  );
}

interface SensorTableProps {
  reading: SensorReading | null;
  prevReading: SensorReading | null;
  loading?: boolean;
}

export function SensorTable({ reading, prevReading, loading }: SensorTableProps) {
  const keys = Object.keys(RANGES) as SensorKey[];

  if (loading && !reading) {
    return (
      <div>
        {keys.map((k) => (
          <SkeletonRow key={k} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {keys.map((key, i) => {
        const { label, unit, min, max } = RANGES[key];
        const value = reading ? reading[key as keyof SensorReading] as number : null;
        const prev  = prevReading ? prevReading[key as keyof SensorReading] as number : null;
        const trend = value != null ? getTrend(value, prev) : 'stable';
        const pct   = value != null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

        return (
          <div
            key={key}
            className="row-in"
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr auto 24px',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '1.15rem 0',
              borderBottom: '1px solid var(--sep)',
              transition: 'background 0.2s ease',
            }}
          >
            {/* Label */}
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

            {/* Bar track */}
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
                  backgroundColor: 'var(--ink)',
                  borderRadius: '2px',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: value != null ? 1 : 0,
                }}
              />
            </div>

            {/* Value */}
            <span
              key={`${key}-${value}`}
              className={value != null ? 'value-flash' : ''}
              style={{
                fontSize: '15px',
                fontFamily: 'var(--font-head)',
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
                minWidth: '90px',
                textAlign: 'right',
              }}
            >
              {value != null ? `${value.toFixed(1)} ${unit}` : '— '}
            </span>

            {/* Trend */}
            <TrendArrow trend={trend} />
          </div>
        );
      })}
    </div>
  );
}
