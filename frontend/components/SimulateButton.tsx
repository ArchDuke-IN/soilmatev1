'use client';

import { useState, useCallback } from 'react';
import { postSimulate } from '@/lib/api';
import { ArrowClockwise } from '@phosphor-icons/react';

interface SimulateButtonProps {
  deviceId?: string;
  onSuccess?: () => void;
  variant?: 'primary' | 'ghost';
}

export function SimulateButton({
  deviceId = 'rover_01',
  onSuccess,
  variant = 'primary',
}: SimulateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await postSimulate(deviceId);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      onSuccess?.();
    } catch {
      // silent — error shown on dashboard
    } finally {
      setLoading(false);
    }
  }, [deviceId, onSuccess]);

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Simulate an ESP32 sensor reading"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: isPrimary ? '10px 20px' : '8px 16px',
        fontSize: '12px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '1px solid var(--ink)',
        backgroundColor: isPrimary ? 'var(--ink)' : 'transparent',
        color: isPrimary ? 'var(--bg)' : 'var(--ink)',
        borderRadius: '4px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: loading ? 0.5 : 1,
        transform: flash ? 'scale(0.97)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = isPrimary ? '#2d5039' : 'var(--surface)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isPrimary ? 'var(--ink)' : 'transparent';
      }}
    >
      <ArrowClockwise
        size={13}
        weight="bold"
        style={{
          animation: loading ? 'spin 0.8s linear infinite' : 'none',
        }}
      />
      {loading ? 'Sending…' : 'Simulate Reading'}

      {/* Inline spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
