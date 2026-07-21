'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history',   label: 'History' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--sep)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="var(--accent)" />
            <path
              d="M10 2 C10 2 4 6 4 10 C4 14 7 17 10 18 C13 17 16 14 16 10 C16 6 10 2 10 2Z"
              stroke="var(--accent)"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
            }}
          >
            SoilMate
          </span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 400,
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                  transition: 'color 0.2s ease',
                  borderBottom: active ? '1px solid var(--ink)' : '1px solid transparent',
                  paddingBottom: '2px',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Device Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="live-dot"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--muted)',
              letterSpacing: '0.04em',
            }}
          >
            rover_01
          </span>
        </div>
      </div>
    </header>
  );
}
