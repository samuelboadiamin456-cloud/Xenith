import { RankConfig, RankTier, RankProgress } from '../types';

export const RANK_CONFIGS: Record<RankTier, RankConfig> = {
  'E': {
    tier: 'E',
    title: 'E-RANK RECRUIT',
    minXp: 0,
    maxXp: 999,
    clearanceLevel: 'LEVEL 1 RECRUIT',
    multiplier: '1.0x',
    perkDescription: 'STANDARD DRILLS & TELEMETRY LOGGING',
    badgeColor: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    themeColor: '#94a3b8'
  },
  'D': {
    tier: 'D',
    title: 'D-RANK CADET',
    minXp: 1000,
    maxXp: 1999,
    clearanceLevel: 'LEVEL 2 CADET',
    multiplier: '1.1x',
    perkDescription: 'TACTICAL SQUADS & VERIFIED BADGE',
    badgeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    themeColor: '#38bdf8'
  },
  'C': {
    tier: 'C',
    title: 'C-RANK OPERATIVE',
    minXp: 2000,
    maxXp: 3099,
    clearanceLevel: 'LEVEL 3 OPERATIVE',
    multiplier: '1.25x',
    perkDescription: 'CLASSIFIED MISSIONS & SQUAD RECRUITMENT',
    badgeColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    themeColor: '#16a34a'
  },
  'B': {
    tier: 'B',
    title: 'B-RANK VETERAN',
    minXp: 3100,
    maxXp: 4999,
    clearanceLevel: 'LEVEL 4 VETERAN',
    multiplier: '1.4x',
    perkDescription: 'ELITE CONTRACTS & BRACKET ELIGIBILITY',
    badgeColor: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    themeColor: '#0284c7'
  },
  'A': {
    tier: 'A',
    title: 'A-RANK SPECIALIST',
    minXp: 5000,
    maxXp: 9999,
    clearanceLevel: 'LEVEL 5 SPECIALIST',
    multiplier: '1.6x',
    perkDescription: 'ADMIN REWARD POWER (+50 XP) & HIGH-PRIORITY CLEARANCE',
    badgeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    themeColor: '#fbbf24'
  },
  'S': {
    tier: 'S',
    title: 'S-RANK ASCENDANT',
    minXp: 10000,
    maxXp: 15999,
    clearanceLevel: 'LEVEL 6 ASCENDANT',
    multiplier: '1.85x',
    perkDescription: 'VANGUARD INVITATIONAL & HALL OF FAME NOMINEE',
    badgeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    themeColor: '#ea580c'
  },
  'S-MAX': {
    tier: 'S-MAX',
    title: 'S-MAX SUPREME VANGUARD',
    minXp: 16000,
    maxXp: 25000,
    clearanceLevel: 'APEX VANGUARD',
    multiplier: '2.5x',
    perkDescription: 'HALL OF FAME PERMANENT SEAT & SUPREME EMBLEM',
    badgeColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    themeColor: '#dc2626'
  }
};

export const RANK_TIERS_ORDER: RankTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'S-MAX'];

export function calculateRank(xp: number): RankTier {
  const cleanXp = Math.max(0, Math.floor(Number(xp) || 0));
  if (cleanXp >= 16000) return 'S-MAX';
  if (cleanXp >= 10000) return 'S';
  if (cleanXp >= 5000) return 'A';
  if (cleanXp >= 3100) return 'B';
  if (cleanXp >= 2000) return 'C';
  if (cleanXp >= 1000) return 'D';
  return 'E';
}

export function getRankProgress(xp: number): RankProgress {
  const cleanXp = Math.max(0, Math.floor(Number(xp) || 0));
  const currentTier = calculateRank(cleanXp);
  const currentIndex = RANK_TIERS_ORDER.indexOf(currentTier);
  const currentConfig = RANK_CONFIGS[currentTier];

  if (currentIndex === RANK_TIERS_ORDER.length - 1) {
    // S-MAX is highest
    return {
      currentTier,
      nextTier: null,
      currentXp: cleanXp,
      targetXp: currentConfig.minXp,
      percent: 100,
      remainingXp: 0
    };
  }

  const nextTier = RANK_TIERS_ORDER[currentIndex + 1];
  const nextConfig = RANK_CONFIGS[nextTier];
  const tierMin = currentConfig.minXp;
  const tierTarget = nextConfig.minXp;
  const progressInTier = Math.max(0, cleanXp - tierMin);
  const totalTierDistance = tierTarget - tierMin;
  const percent = Math.min(100, Math.max(0, Math.round((progressInTier / totalTierDistance) * 100)));
  const remainingXp = Math.max(0, tierTarget - cleanXp);

  return {
    currentTier,
    nextTier,
    currentXp: cleanXp,
    targetXp: tierTarget,
    percent,
    remainingXp
  };
}

export function calculateSubmissionScore(stats: {
  mode?: 'BR' | 'SF' | 'CUSTOM';
  kills?: number;
  assists?: number;
  deaths?: number;
  damage?: number;
  placement?: number;
  outcome?: 'Victory' | 'Defeat';
  wins?: number;
  matches?: number;
  kd?: number;
  winRate?: number;
  hs?: number;
}) {
  const mode = stats.mode || 'BR';
  const kills = Math.max(0, Math.round(Number(stats.kills) || 0));
  const assists = Math.max(0, Math.round(Number(stats.assists) || 0));
  const deaths = Math.max(0, Math.round(Number(stats.deaths) || 0));
  const damage = Math.max(0, Math.round(Number(stats.damage) || 0));
  const damageXp = Math.floor(damage / 1000) * 1;

  if (mode === 'BR') {
    // 1 kill = +5xp, 1 assist = +3xp, 1000 damage = +1xp
    const killsXp = kills * 5;
    const assistsXp = assists * 3;
    
    // Position at top: victory/#1 = +50xp, #2 = +30xp, #3 = +10xp, #4 = +0xp, below #4 = -30xp
    const placement = stats.placement !== undefined ? Number(stats.placement) : (stats.outcome === 'Victory' || stats.wins ? 1 : 4);
    let placementBonus = 0;
    if (placement === 1) {
      placementBonus = 50;
    } else if (placement === 2) {
      placementBonus = 30;
    } else if (placement === 3) {
      placementBonus = 10;
    } else if (placement === 4) {
      placementBonus = 0;
    } else {
      placementBonus = -30;
    }

    const total = killsXp + assistsXp + damageXp + placementBonus;

    return {
      mode: 'BR' as const,
      killsXp,
      assistsXp,
      deathsXp: 0,
      damageXp,
      placementBonus,
      outcomeBonus: 0,
      winBonus: placement === 1 ? 50 : 0,
      kdBonus: 0,
      hsBonus: 0,
      total
    };
  }

  if (mode === 'SF') {
    // 1 kill = +10xp, 1 assist = +3xp, 1 death = -5xp, 1000 damage = +1xp
    const killsXp = kills * 10;
    const assistsXp = assists * 3;
    const deathsXp = deaths * -5;
    
    // Top-left position/outcome: Victory = +50xp, Defeat = -20xp
    const isVictory = stats.outcome === 'Victory' || (stats.wins && stats.wins > 0);
    const outcomeBonus = isVictory ? 50 : -20;

    const total = killsXp + assistsXp + deathsXp + damageXp + outcomeBonus;

    return {
      mode: 'SF' as const,
      killsXp,
      assistsXp,
      deathsXp,
      damageXp,
      placementBonus: 0,
      outcomeBonus,
      winBonus: isVictory ? 50 : 0,
      kdBonus: 0,
      hsBonus: 0,
      total
    };
  }

  if (mode === 'CUSTOM') {
    // 1 kill = +10xp, 1000 damage = +1xp
    const killsXp = kills * 10;
    
    // Top-left position/outcome: Victory = +30xp, Defeat = -20xp
    const isVictory = stats.outcome === 'Victory' || (stats.wins && stats.wins > 0);
    const outcomeBonus = isVictory ? 30 : -20;

    const total = killsXp + damageXp + outcomeBonus;

    return {
      mode: 'CUSTOM' as const,
      killsXp,
      assistsXp: 0,
      deathsXp: 0,
      damageXp,
      placementBonus: 0,
      outcomeBonus,
      winBonus: isVictory ? 30 : 0,
      kdBonus: 0,
      hsBonus: 0,
      total
    };
  }

  // Legacy fallback
  const killsXp = kills * 5;
  const winBonus = Math.max(0, Math.round(Number(stats.wins) || 0)) * 25;
  const kdBonus = Math.round((Number(stats.kd) || 0) * 15);
  const total = killsXp + winBonus + kdBonus;

  return {
    killsXp,
    winBonus,
    kdBonus,
    hsBonus: 0,
    total
  };
}
