import React from 'react';

interface PlanoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const PlanoraLogo: React.FC<PlanoraLogoProps> = ({
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 26,
    md: 34,
    lg: 44,
  };

  const fontSizes = {
    sm: '1.15rem',
    md: '1.4rem',
    lg: '1.75rem',
  };

  const iconDim = iconSizes[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none' }}>
      <svg
        width={iconDim}
        height={iconDim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="planoraGradLogo" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="sparkGradLogo" x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#planoraGradLogo)" />
        <circle cx="32" cy="32" r="18" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="3 3" />
        <path
          d="M32 16 C32 24.8366 24.8366 32 16 32 C24.8366 32 32 39.1634 32 48 C32 39.1634 39.1634 32 48 32 C39.1634 32 32 24.8366 32 16 Z"
          fill="#ffffff"
        />
        <circle cx="32" cy="32" r="3.5" fill="url(#sparkGradLogo)" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: fontSizes[size],
              letterSpacing: '-0.025em',
              color: 'var(--primary-900)',
            }}
          >
            Planora
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: `calc(${fontSizes[size]} * 0.7)`,
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
            }}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              marginTop: '-2px',
            }}
          >
            Plan celebrations with clarity
          </span>
        )}
      </div>
    </div>
  );
};
