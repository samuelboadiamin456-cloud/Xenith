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
  hs?: number;
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

export type SitrepMode = 'BR' | 'SF' | 'CUSTOM';

export interface SubmissionStats {
  mode?: SitrepMode;
  kills: number;
  assists?: number;
  deaths?: number;
  damage?: number;
  placement?: number; // For BR: 1, 2, 3, 4, 5+
  placementText?: string; // e.g. "1/12 Victory", "#2/12"
  outcome?: 'Victory' | 'Defeat'; // For SF and CUSTOM
  highlightedIgn?: string;
  cash?: number;
  wins?: number;
  matches?: number;
  kd?: number;
  winRate?: number;
  hs?: number;
}

export interface ScoreBreakdown {
  mode?: SitrepMode;
  killsXp: number;
  assistsXp?: number;
  deathsXp?: number;
  damageXp?: number;
  placementBonus?: number;
  outcomeBonus?: number;
  winBonus?: number;
  kdBonus?: number;
  hsBonus?: number;
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
  mode?: SitrepMode;
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

export interface AppNotification {
  id: string;
  recipientXnId: string; // 'ALL' or specific xnId
  title: string;
  message: string;
  type: 'event' | 'sitrep' | 'reward' | 'announcement' | 'rank' | 'telemetry' | 'system';
  priority: 'low' | 'normal' | 'urgent';
  createdAt: string;
  read: boolean;
  linkView?: ActiveView;
  sender: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  eventType: 'TOURNAMENT' | 'SCRIMMAGE' | 'DOUBLE_XP' | 'WAR_ROOM' | 'DRILL' | 'TRIALS';
  description: string;
  rewardXp: number;
  scheduledDate: string;
  targetRank: string;
  targetRole: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
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
  | 'operations'
  | 'search' 
  | 'profile' 
  | 'rank-journey'
  | 'edit-profile';
