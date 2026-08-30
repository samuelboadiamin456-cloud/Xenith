import React from 'react';
import { RankTier } from '../types';
import { RANK_CONFIGS } from '../data/rankConfigs';

interface RankHexBadgeProps {
  rank: RankTier;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showDottedRing?: boolean;
  className?: string;
  animateRing?: boolean;
}

export const RankHexBadge: React.FC<RankHexBadgeProps> = ({
  rank,
  size = 'md',
  showDottedRing = true,
  className = '',
  animateRing = true
}) => {
  const config = RANK_CONFIGS[rank] || RANK_CONFIGS['E'];

  const sizeMap = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-36 h-36 text-4xl',
    hero: 'w-48 h-48 sm:w-56 sm:h-56 text-6xl'
  };

  const getGradientColors = () => {
    switch (rank) {
      case 'S-MAX':
        return { start: '#f472b6', end: '#be185d', text: '#ffffff', glow: 'rgba(244, 114, 182, 0.7)' };
      case 'S':
        return { start: '#f87171', end: '#b91c1c', text: '#ffffff', glow: 'rgba(239, 68, 68, 0.7)' };
      case 'A':
        return { start: '#fbbf24', end: '#b45309', text: '#111827', glow: 'rgba(245, 158, 11, 0.6)' };
      case 'B':
        // Exact blue from the image.png
        return { start: '#38bdf8', end: '#0284c7', text: '#0a1017', glow: 'rgba(56, 189, 248, 0.65)' };
      case 'C':
        return { start: '#0284c7', end: '#0369a1', text: '#f0f9ff', glow: 'rgba(2, 132, 199, 0.5)' };
      case 'D':
        return { start: '#38bdf8', end: '#0284c7', text: '#0a1017', glow: 'rgba(56, 189, 248, 0.4)' };
      case 'E':
      default:
        return { start: '#64748b', end: '#334155', text: '#f8fafc', glow: 'rgba(100, 116, 139, 0.4)' };
    }
  };

  const colors = getGradientColors();
  const gradId = `rank-grad-${rank}-${size}`;
  const filterId = `rank-glow-${rank}-${size}`;

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>

          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle
          cx="60"
          cy="60"
          r="44"
          fill={colors.glow}
          className="opacity-30 blur-md pointer-events-none"
        />

        {/* Dotted Radar Perimeter Ring (from image.png) */}
        {showDottedRing && (
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={colors.start}
            strokeWidth="1.6"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
            className={animateRing ? 'animate-radar' : ''}
            style={{ transformOrigin: 'center' }}
          />
        )}

        {/* Outer Hexagon Outline Frame */}
        <polygon
          points="60,10 102,34 102,86 60,110 18,86 18,34"
          fill="none"
          stroke={colors.start}
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />

        {/* Main Solid Colored Hexagon */}
        <polygon
          points="60,14 98,36 98,84 60,106 22,84 22,36"
          fill={`url(#${gradId})`}
          filter={`url(#${filterId})`}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1"
        />

        {/* Tactical side-vertical highlight bars (exact detail from image.png) */}
        <line
          x1="22"
          y1="38"
          x2="22"
          y2="82"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="98"
          y1="38"
          x2="98"
          y2="82"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Subtle Top & Bottom Apex Nodes */}
        <circle cx="60" cy="14" r="1.5" fill="#ffffff" />
        <circle cx="60" cy="106" r="1.5" fill="#ffffff" />

        {/* Central Rank Tier Letter */}
        <text
          x="60"
          y={rank === 'S-MAX' ? '68' : '72'}
          textAnchor="middle"
          fill={colors.text}
          fontSize={rank === 'S-MAX' ? '30' : '46'}
          fontFamily="'Outfit', 'Sora', sans-serif"
          fontWeight="900"
          letterSpacing="-1px"
          style={{
            textShadow: rank === 'B' || rank === 'A' 
              ? 'none' 
              : '0 2px 8px rgba(0,0,0,0.5)'
          }}
        >
          {rank}
        </text>
      </svg>
    </div>
  );
};
