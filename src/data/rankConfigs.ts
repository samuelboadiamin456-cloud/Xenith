import { RankConfig, RankTier, RankProgress } from '../types';

export const RANK_CONFIGS: Record<RankTier, RankConfig> = {
  'E': {
    tier: 'E',
    title: 'E-RANK RECRUIT',
    minXp: 0,
    maxXp: 200,
    clearanceLevel: 'LEVEL 1',
    multiplier: '1.0x',
    perkDescription: 'STANDARD DRILLS UNLOCKED',
    badgeColor: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    themeColor: '#94a3b8'
  },
  'D': {
    tier: 'D',
    title: 'D-RANK CADET',
    minXp: 200,
    maxXp: 450,
    clearanceLevel: 'LEVEL 2',
    multiplier: '1.1x',
    perkDescription: 'TACTICAL SQUADS AUTHORIZED',
    badgeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    themeColor: '#38bdf8'
  },
  'C': {
    tier: 'C',
    title: 'C-RANK OPERATIVE',
    minXp: 450,
    maxXp: 700,
    clearanceLevel: 'LEVEL 3',
    multiplier: '1.25x',
    perkDescription: 'CLASSIFIED MISSIONS PERMITTED',
    badgeColor: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    themeColor: '#0284c7'
  },
  'B': {
    tier: 'B',
    title: 'B-RANK VETERAN',
    minXp: 700,
    maxXp: 1000,
    clearanceLevel: 'LEVEL 4',
    multiplier: '1.5x',
    perkDescription: 'ELITE CONTRACTS AVAILABLE',
    badgeColor: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.6)',
    themeColor: '#38bdf8'
  },
  'A': {
    tier: 'A',
    title: 'A-RANK SPECIALIST',
    minXp: 1000,
    maxXp: 1500,
    clearanceLevel: 'LEVEL 5',
    multiplier: '1.8x',
    perkDescription: 'HIGH-PRIORITY SITREP CLEARANCE',
    badgeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    themeColor: '#fbbf24'
  },
  'S': {
    tier: 'S',
    title: 'S-RANK ASCENDANT',
    minXp: 1500,
    maxXp: 2200,
    clearanceLevel: 'LEVEL 6',
    multiplier: '2.2x',
    perkDescription: 'VANGUARD INVITATIONAL ACCESS',
    badgeColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    themeColor: '#f87171'
  },
  'S-MAX': {
    tier: 'S-MAX',
    title: 'S-MAX SUPREME VANGUARD',
    minXp: 2200,
    maxXp: 3000,
    clearanceLevel: 'APEX LEVEL',
    multiplier: '3.0x',
    perkDescription: 'HALL OF FAME PERMANENT SEAT',
    badgeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.7)',
    themeColor: '#f472b6'
  }
};

export const RANK_TIERS_ORDER: RankTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'S-MAX'];

export function calculateRank(xp: number): RankTier {
  if (xp >= 2200) return 'S-MAX';
  if (xp >= 1500) return 'S';
  if (xp >= 1000) return 'A';
  if (xp >= 700) return 'B';
  if (xp >= 450) return 'C';
  if (xp >= 200) return 'D';
  return 'E';
}

export function getRankProgress(xp: number): RankProgress {
  const currentTier = calculateRank(xp);
  const currentIndex = RANK_TIERS_ORDER.indexOf(currentTier);
  const currentConfig = RANK_CONFIGS[currentTier];

  if (currentIndex === RANK_TIERS_ORDER.length - 1) {
    // S-MAX is highest
    return {
      currentTier,
      nextTier: null,
      currentXp: xp,
      targetXp: currentConfig.maxXp,
      percent: 100,
      remainingXp: 0
    };
  }

  const nextTier = RANK_TIERS_ORDER[currentIndex + 1];
  const nextConfig = RANK_CONFIGS[nextTier];
  const tierMin = currentConfig.minXp;
  const tierTarget = nextConfig.minXp;
  const progressInTier = Math.max(0, xp - tierMin);
  const totalTierDistance = tierTarget - tierMin;
  const percent = Math.min(100, Math.round((progressInTier / totalTierDistance) * 100));
  const remainingXp = Math.max(0, tierTarget - xp);

  return {
    currentTier,
    nextTier,
    currentXp: xp,
    targetXp: tierTarget,
    percent,
    remainingXp
  };
}

export function calculateSubmissionScore(stats: {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number;
  hs: number;
}) {
  const killsXp = stats.kills * 5;
  const winBonus = stats.wins * 25;
  const kdBonus = Math.round(stats.kd * 15);
  const hsBonus = Math.round(stats.hs * 0.5);
  const total = killsXp + winBonus + kdBonus + hsBonus;

  return {
    killsXp,
    winBonus,
    kdBonus,
    hsBonus,
    total
  };
}
