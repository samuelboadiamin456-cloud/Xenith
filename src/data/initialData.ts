import { Player, Submission, AuditLog } from '../types';

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-seed-1',
    xnId: 'XN-001',
    username: 'vanguard_prime',
    email: 'vanguard@xn-academy.gg',
    displayName: 'Vanguard Prime',
    ign: 'VANGUARD_X',
    role: 'IGL',
    country: 'United Kingdom',
    bio: 'Founding member of the XN Academy Vanguard cadre. Tactical in-game leader specializing in high-pressure team rotations and site control.',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&auto=format&fit=crop',
    currentRank: 'S-MAX',
    peakRank: 'S-MAX',
    totalXp: 18500,
    academyStatus: 'Vanguard Legend',
    verificationStatus: 'Official Vanguard',
    joinedAt: '2026-01-10T10:00:00.000Z',
    lifetimeStats: {
      kills: 4820,
      wins: 412,
      matches: 460,
      kd: 4.85,
      winRate: 89.6
    }
  },
  {
    id: 'p-seed-2',
    xnId: 'XN-002',
    username: 'cypher_99',
    email: 'cypher@xn-academy.gg',
    displayName: 'Cipher Mark',
    ign: 'CYPHER_99',
    role: 'Sniper',
    country: 'United States',
    bio: 'Precision long-range recon specialist. Master of long-distance angle defense and target neutralizations.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
    currentRank: 'S',
    peakRank: 'S',
    totalXp: 12400,
    academyStatus: 'Elite Operative',
    verificationStatus: 'Official Vanguard',
    joinedAt: '2026-01-18T14:30:00.000Z',
    lifetimeStats: {
      kills: 3420,
      wins: 285,
      matches: 340,
      kd: 4.10,
      winRate: 83.8
    }
  },
  {
    id: 'p-seed-3',
    xnId: 'XN-003',
    username: 'apex_nova',
    email: 'nova@xn-academy.gg',
    displayName: 'Apex Nova',
    ign: 'APEX_NOVA',
    role: 'Rusher',
    country: 'Canada',
    bio: 'High-tempo aggressive entry fragger. Focused on initial bomb-site breach, space creation, and close-quarters engagements.',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop',
    currentRank: 'A',
    peakRank: 'A',
    totalXp: 8150,
    academyStatus: 'Senior Specialist',
    verificationStatus: 'Verified',
    joinedAt: '2026-02-01T08:15:00.000Z',
    lifetimeStats: {
      kills: 2650,
      wins: 194,
      matches: 250,
      kd: 3.65,
      winRate: 77.6
    }
  },
  {
    id: 'p-seed-4',
    xnId: 'XN-004',
    username: 'ghost_pulse',
    email: 'ghost@xn-academy.gg',
    displayName: 'Ghost Recon',
    ign: 'GHOST_PULSE',
    role: 'Fragger',
    country: 'Germany',
    bio: 'Secondary assault operative providing crossfire coverage, aggressive trade frags, and post-plant defense.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    currentRank: 'B',
    peakRank: 'B',
    totalXp: 4450,
    academyStatus: 'Member',
    verificationStatus: 'Verified',
    joinedAt: '2026-02-12T16:45:00.000Z',
    lifetimeStats: {
      kills: 1820,
      wins: 120,
      matches: 165,
      kd: 3.15,
      winRate: 72.7
    }
  },
  {
    id: 'p-seed-5',
    xnId: 'XN-005',
    username: 'aegis_core',
    email: 'aegis@xn-academy.gg',
    displayName: 'Aegis Shield',
    ign: 'AEGIS_CORE',
    role: 'Support',
    country: 'Sweden',
    bio: 'Utility coordinator and smoke execution anchor. Secures defensive cross angles and guarantees round resets.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop',
    currentRank: 'C',
    peakRank: 'C',
    totalXp: 2600,
    academyStatus: 'Member',
    verificationStatus: 'Verified',
    joinedAt: '2026-02-20T11:20:00.000Z',
    lifetimeStats: {
      kills: 1140,
      wins: 88,
      matches: 125,
      kd: 2.45,
      winRate: 70.4
    }
  },
  {
    id: 'p-seed-6',
    xnId: 'XN-006',
    username: 'strike_echo',
    email: 'strike@xn-academy.gg',
    displayName: 'Strike Echo',
    ign: 'STRIKE_7',
    role: 'Flex',
    country: 'Australia',
    bio: 'Adaptable multi-role operative capable of shifting between anchor and second entry based on tactical calls.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    currentRank: 'D',
    peakRank: 'D',
    totalXp: 1450,
    academyStatus: 'Cadet',
    verificationStatus: 'Verified',
    joinedAt: '2026-03-01T09:00:00.000Z',
    lifetimeStats: {
      kills: 720,
      wins: 42,
      matches: 70,
      kd: 2.10,
      winRate: 60.0
    }
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-9021',
    xnId: 'XN-001',
    playerName: 'Vanguard Prime',
    playerIgn: 'VANGUARD_X',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'approved',
    stats: {
      kills: 24,
      wins: 1,
      matches: 1,
      kd: 4.80,
      winRate: 100
    },
    evidenceUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    fraudFlags: [],
    scoreBreakdown: {
      killsXp: 120,
      winBonus: 25,
      kdBonus: 72,
      total: 217
    },
    reviewedBy: 'Head of Command',
    reviewedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'sub-8842',
    xnId: 'XN-002',
    playerName: 'Cipher Mark',
    playerIgn: 'CYPHER_99',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'approved',
    stats: {
      kills: 18,
      wins: 1,
      matches: 1,
      kd: 4.50,
      winRate: 100
    },
    evidenceUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
    fraudFlags: [],
    scoreBreakdown: {
      killsXp: 90,
      winBonus: 25,
      kdBonus: 68,
      total: 183
    },
    reviewedBy: 'Staff Officer',
    reviewedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'sub-7612',
    xnId: 'XN-003',
    playerName: 'Apex Nova',
    playerIgn: 'APEX_NOVA',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'approved',
    stats: {
      kills: 22,
      wins: 1,
      matches: 1,
      kd: 3.67,
      winRate: 100
    },
    evidenceUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    fraudFlags: [],
    scoreBreakdown: {
      killsXp: 110,
      winBonus: 25,
      kdBonus: 55,
      total: 190
    },
    reviewedBy: 'Staff Officer',
    reviewedAt: new Date(Date.now() - 3600000 * 17).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-seed-1',
    action: 'ACADEMY_SYSTEM_ONLINE',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    actorType: 'system',
    details: 'Official XN Academy competitive telemetry network booted with synchronized database.'
  },
  {
    id: 'log-seed-2',
    action: 'SITREP_APPROVED',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    actorType: 'admin',
    details: 'SITREP sub-9021 (Vanguard Prime - XN-001) verified and approved (+217 XP awarded).'
  }
];


