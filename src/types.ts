export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S-MAX';

export interface RankConfig {
  tier: RankTier;
  title: string;
  minXp: number;
  maxXp: number;
  clearanceLevel: string;
  multiplier: string;
  perkDescription: string;
  badgeColor: string;
  glowColor: string;
  themeColor: string;
}

export interface LifetimeStats {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number;
  hs: number;
}

export interface RankProgress {
  currentTier: RankTier;
  nextTier: RankTier | null;
  currentXp: number;
  targetXp: number;
  percent: number;
  remainingXp: number;
}

export interface Player {
  id: string;
  xnId: string;
  username: string;
  email: string;
  displayName: string;
  ign: string;
  role: 'Rusher' | 'Sniper' | 'IGL' | 'Support' | 'Fragger' | 'Flex';
  country?: string;
  bio?: string;
  avatarUrl?: string;
  password?: string;
  currentRank: RankTier;
  peakRank: RankTier;
  totalXp: number;
  academyStatus: 'Cadet' | 'Member' | 'Senior Specialist' | 'Elite Operative' | 'Vanguard Legend';
  verificationStatus: 'Unverified' | 'Verified' | 'Official Vanguard';
  joinedAt: string;
  lifetimeStats: LifetimeStats;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'HEAD_OF_COMMAND' | 'STAFF_OFFICER';
  isHeadOfCommand: boolean;
  linkedXnId?: string;
  createdAt: string;
}

export interface AdminRequest {
  id: string;
  username: string;
  email: string;
  displayName: string;
  password?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SubmissionStats {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number;
  hs: number;
}

export interface ScoreBreakdown {
  killsXp: number;
  winBonus: number;
  kdBonus: number;
  hsBonus: number;
  total: number;
}

export interface Submission {
  id: string;
  xnId: string;
  playerName: string;
  playerIgn: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  stats: SubmissionStats;
  evidenceUrl?: string;
  fraudFlags: string[];
  scoreBreakdown: ScoreBreakdown;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  actorType: 'admin' | 'system' | 'hoc';
  details: string;
}

export interface AdminStats {
  totalPlayers: number;
  activePlayers: number;
  pendingSubmissions: number;
  flaggedSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  totalXpAwarded: number;
}

export type ActiveView = 
  | 'home' 
  | 'leaderboard' 
  | 'dashboard' 
  | 'submit' 
  | 'admin' 
  | 'search' 
  | 'profile' 
  | 'rank-journey'
  | 'edit-profile';
