import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Interfaces matching frontend types
export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S-MAX';

export interface LifetimeStats {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number; // Cumulative win rate %
  hs: number;
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
  password?: string;
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

// Data Directory and Persistent Storage File
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-Memory Database Store
let dbPlayers: Player[] = [];
let dbSubmissions: Submission[] = [];
let dbAuditLogs: AuditLog[] = [];
let dbAdmins: AdminUser[] = [];
let dbAdminRequests: AdminRequest[] = [];

// Load Database from disk on startup
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.players)) dbPlayers = data.players;
      if (Array.isArray(data.submissions)) dbSubmissions = data.submissions;
      if (Array.isArray(data.auditLogs)) dbAuditLogs = data.auditLogs;
      if (Array.isArray(data.admins)) dbAdmins = data.admins;
      if (Array.isArray(data.adminRequests)) dbAdminRequests = data.adminRequests;
      console.log(`[Storage] Database loaded from disk: ${dbPlayers.length} players, ${dbAdmins.length} admins.`);
    }
  } catch (err) {
    console.error('[Storage] Error loading database from disk:', err);
  }
}

// Save Database to disk safely
function saveDatabase() {
  try {
    const data = {
      players: dbPlayers,
      submissions: dbSubmissions,
      auditLogs: dbAuditLogs,
      admins: dbAdmins,
      adminRequests: dbAdminRequests,
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving database to disk:', err);
  }
}

// Initialize persistence on module load
loadDatabase();

// Rank Tier XP System as defined by user specification:
// 1000xp = D rank
// 2000xp = C rank
// 3100xp = B rank
// 5000xp = A rank
// 10000xp = S rank
// 16000xp + = S max
function calculateRank(xp: number): RankTier {
  const cleanXp = Math.max(0, Math.floor(Number(xp) || 0));
  if (cleanXp >= 16000) return 'S-MAX';
  if (cleanXp >= 10000) return 'S';
  if (cleanXp >= 5000) return 'A';
  if (cleanXp >= 3100) return 'B';
  if (cleanXp >= 2000) return 'C';
  if (cleanXp >= 1000) return 'D';
  return 'E';
}

function calculateSubmissionScore(stats: SubmissionStats): ScoreBreakdown {
  const killsXp = Math.max(0, Math.round(Number(stats.kills) || 0)) * 5;
  const winBonus = Math.max(0, Math.round(Number(stats.wins) || 0)) * 25;
  const kdBonus = Math.round((Number(stats.kd) || 0) * 15);
  const hsBonus = Math.round((Number(stats.hs) || 0) * 0.5);
  const total = killsXp + winBonus + kdBonus + hsBonus;

  return {
    killsXp,
    winBonus,
    kdBonus,
    hsBonus,
    total
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger for API debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      totalPlayers: dbPlayers.length,
      totalSubmissions: dbSubmissions.length,
      totalAdmins: dbAdmins.length
    });
  });

  // GET all players
  app.get('/api/players', (req: Request, res: Response) => {
    const { role, rank, sort } = req.query;
    let list = [...dbPlayers];

    if (role && role !== 'ALL') {
      list = list.filter(p => p.role === role);
    }
    if (rank && rank !== 'ALL') {
      list = list.filter(p => p.currentRank === rank);
    }

    if (sort === 'kd') {
      list.sort((a, b) => (Number(b.lifetimeStats?.kd) || 0) - (Number(a.lifetimeStats?.kd) || 0));
    } else if (sort === 'wins') {
      list.sort((a, b) => (Number(b.lifetimeStats?.wins) || 0) - (Number(a.lifetimeStats?.wins) || 0));
    } else if (sort === 'winRate') {
      list.sort((a, b) => (Number(b.lifetimeStats?.winRate) || 0) - (Number(a.lifetimeStats?.winRate) || 0));
    } else {
      list.sort((a, b) => (b.totalXp ?? 0) - (a.totalXp ?? 0));
    }

    res.json({ players: list, count: list.length });
  });

  // GET single player by ID, XN-ID, or username
  app.get('/api/players/:identifier', (req: Request, res: Response) => {
    const clean = req.params.identifier.toLowerCase().trim();
    const player = dbPlayers.find(
      p =>
        (p.xnId && p.xnId.toLowerCase() === clean) ||
        (p.id && p.id.toLowerCase() === clean) ||
        (p.username && p.username.toLowerCase() === clean) ||
        (p.ign && p.ign.toLowerCase() === clean)
    );

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json({ player });
  });

  // POST Register new player
  app.post('/api/players/register', (req: Request, res: Response) => {
    const { username, email, password, displayName, ign, role, country, bio, avatarUrl } = req.body;

    if (!username || !displayName || !ign || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for username collision
    const existing = dbPlayers.find(
      p => p.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ error: 'Username already registered' });
    }

    // Generate next unique sequential XN-ID
    const existingNumbers = dbPlayers.map(p => {
      const match = p.xnId.match(/XN-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = Math.max(0, ...existingNumbers);
    const nextNumber = maxNumber + 1;
    const formattedId = `XN-${nextNumber.toString().padStart(3, '0')}`;

    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      xnId: formattedId,
      username: username.trim(),
      email: email ? email.trim() : `${username.trim()}@xn-academy.gg`,
      password: password ? String(password) : undefined,
      displayName: displayName.trim(),
      ign: ign.trim().toUpperCase(),
      role,
      country: country ? country.trim() : 'Global',
      bio: bio ? bio.trim() : 'Verified recruit of the XN Academy competitive network.',
      avatarUrl: avatarUrl || undefined,
      currentRank: 'E',
      peakRank: 'E',
      totalXp: 50, // Welcome signup bonus
      academyStatus: 'Cadet',
      verificationStatus: 'Verified',
      joinedAt: new Date().toISOString(),
      lifetimeStats: {
        kills: 0,
        wins: 0,
        matches: 0,
        kd: 0.0,
        winRate: 0.0, // Cumulative win rate
        hs: 0.0
      }
    };

    dbPlayers.unshift(newPlayer);
    saveDatabase();

    // Create system audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'OPERATIVE_REGISTERED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `New account assigned official permanent identifier: ${formattedId} (${displayName})`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    // Return player without leaking password
    const { password: _, ...safePlayer } = newPlayer;
    res.status(201).json({ player: safePlayer, auditLog: log });
  });

  // POST Login player
  app.post('/api/players/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    const clean = identifier.trim().toLowerCase();
    const player = dbPlayers.find(
      p =>
        p.xnId.toLowerCase() === clean ||
        p.username.toLowerCase() === clean ||
        p.email.toLowerCase() === clean ||
        p.ign.toLowerCase() === clean
    );

    if (!player) {
      return res.status(404).json({ error: 'Operative not found with provided identifier' });
    }

    // If player registered with a password, enforce password match
    if (player.password && password !== undefined) {
      if (player.password !== String(password)) {
        return res.status(401).json({ error: 'Invalid operative clearance password' });
      }
    }

    const { password: _, ...safePlayer } = player;
    res.json({ player: safePlayer, message: 'Authentication successful' });
  });

  // PUT update player profile (Partial Merge to prevent overwriting existing data)
  app.put('/api/players/:xnId', (req: Request, res: Response) => {
    const { xnId } = req.params;
    const playerIndex = dbPlayers.findIndex(
      p => p.xnId.toLowerCase() === xnId.toLowerCase()
    );

    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const current = dbPlayers[playerIndex];
    const { displayName, ign, role, country, bio, avatarUrl, academyStatus, verificationStatus, lifetimeStats } = req.body;

    // Perform partial non-destructive merge
    const mergedLifetimeStats: LifetimeStats = {
      ...current.lifetimeStats,
      ...(lifetimeStats || {})
    };

    const updated: Player = {
      ...current,
      displayName: displayName !== undefined ? displayName.trim() : current.displayName,
      ign: ign !== undefined ? ign.trim().toUpperCase() : current.ign,
      role: role !== undefined ? role : current.role,
      country: country !== undefined ? country.trim() : current.country,
      bio: bio !== undefined ? bio.trim() : current.bio,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : current.avatarUrl,
      academyStatus: academyStatus !== undefined ? academyStatus : current.academyStatus,
      verificationStatus: verificationStatus !== undefined ? verificationStatus : current.verificationStatus,
      lifetimeStats: mergedLifetimeStats
    };

    dbPlayers[playerIndex] = updated;
    saveDatabase();

    const { password: _, ...safePlayer } = updated;
    res.json({ player: safePlayer });
  });

  // GET all submissions
  app.get('/api/submissions', (req: Request, res: Response) => {
    const { status, xnId } = req.query;
    let list = [...dbSubmissions];

    if (status && status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    if (xnId) {
      list = list.filter(s => s.xnId.toLowerCase() === String(xnId).toLowerCase());
    }

    res.json({ submissions: list, count: list.length });
  });

  // POST create new submission
  app.post('/api/submissions', (req: Request, res: Response) => {
    const { xnId, stats, evidenceUrl } = req.body;

    const player = dbPlayers.find(p => p.xnId.toLowerCase() === (xnId || '').toLowerCase());
    const playerName = player ? player.displayName : req.body.playerName || 'Recruit Operative';
    const playerIgn = player ? player.ign : req.body.playerIgn || 'OPERATIVE';

    const safeStats: SubmissionStats = {
      kills: Math.max(0, Math.round(Number(stats?.kills) || 0)),
      wins: Math.max(0, Math.round(Number(stats?.wins) || 0)),
      matches: Math.max(1, Math.round(Number(stats?.matches) || 1)),
      kd: Number(stats?.kd) || 0,
      winRate: Number(stats?.winRate) || 0,
      hs: Number(stats?.hs) || 0
    };

    const score = calculateSubmissionScore(safeStats);

    // Anti-cheat fraud heuristic checks
    const fraudFlags: string[] = [];
    if (safeStats.kd > 12.0) fraudFlags.push('Extreme K/D Anomaly (>12.0)');
    if (safeStats.hs > 85.0) fraudFlags.push('Abnormal Headshot Ratio (>85%)');
    if (safeStats.winRate > 95 && safeStats.matches > 5) fraudFlags.push('Unusually High Win Rate (>95%)');

    const newSub: Submission = {
      id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
      xnId: xnId || (player ? player.xnId : 'XN-UNKNOWN'),
      playerName,
      playerIgn,
      createdAt: new Date().toISOString(),
      status: fraudFlags.length > 0 ? 'flagged' : 'pending',
      stats: safeStats,
      evidenceUrl: evidenceUrl || undefined,
      fraudFlags,
      scoreBreakdown: score
    };

    dbSubmissions.unshift(newSub);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: fraudFlags.length > 0 ? 'SITREP_FLAGGED' : 'SITREP_SUBMITTED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `${newSub.id} from ${playerName} (${newSub.xnId}) queued for review.${fraudFlags.length ? ` Flags: ${fraudFlags.join(', ')}` : ''}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.status(201).json({ submission: newSub, auditLog: log });
  });

  // POST approve submission (Updates cumulative win rate & rank thresholds)
  app.post('/api/submissions/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const subIndex = dbSubmissions.findIndex(s => s.id === id);

    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const sub = dbSubmissions[subIndex];
    if (sub.status === 'approved') {
      return res.status(400).json({ error: 'Submission is already approved' });
    }

    const awardedXp = sub.scoreBreakdown.total;
    const targetPlayerIndex = dbPlayers.findIndex(p => p.xnId === sub.xnId);

    const updatedSub: Submission = {
      ...sub,
      status: 'approved',
      reviewedBy: req.body.reviewedBy || 'Admin_Lead',
      reviewedAt: new Date().toISOString()
    };
    dbSubmissions[subIndex] = updatedSub;

    let updatedPlayer: Player | null = null;

    if (targetPlayerIndex !== -1) {
      const targetPlayer = dbPlayers[targetPlayerIndex];
      const newTotalXp = (targetPlayer.totalXp ?? 0) + awardedXp;
      const newRank = calculateRank(newTotalXp);

      const oldStats = targetPlayer.lifetimeStats || { kills: 0, wins: 0, matches: 0, kd: 0, winRate: 0, hs: 0 };
      const totalMatches = (oldStats.matches || 0) + (sub.stats.matches || 1);
      const totalWins = (oldStats.wins || 0) + (sub.stats.wins || 0);
      const totalKills = (oldStats.kills || 0) + (sub.stats.kills || 0);
      const updatedKd = totalMatches > 0 ? parseFloat((totalKills / Math.max(1, totalMatches * 0.8)).toFixed(2)) : sub.stats.kd;
      
      // Cumulative win rate calculation: totalWins / totalMatches * 100
      const updatedWinRate = totalMatches > 0 
        ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) 
        : 0;
      
      const updatedHs = parseFloat((((oldStats.hs || 0) + (sub.stats.hs || 0)) / 2).toFixed(1));

      updatedPlayer = {
        ...targetPlayer,
        totalXp: newTotalXp,
        currentRank: newRank,
        peakRank: newRank > targetPlayer.peakRank ? newRank : targetPlayer.peakRank,
        lifetimeStats: {
          kills: totalKills,
          wins: totalWins,
          matches: totalMatches,
          kd: updatedKd,
          winRate: updatedWinRate,
          hs: updatedHs
        }
      };

      dbPlayers[targetPlayerIndex] = updatedPlayer;
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_APPROVED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `${sub.id} (${sub.playerName}) approved by ${updatedSub.reviewedBy}. +${awardedXp} XP awarded.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({ submission: updatedSub, player: updatedPlayer, auditLog: log });
  });

  // POST flag submission
  app.post('/api/submissions/:id/flag', (req: Request, res: Response) => {
    const { id } = req.params;
    const subIndex = dbSubmissions.findIndex(s => s.id === id);

    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updatedSub: Submission = {
      ...dbSubmissions[subIndex],
      status: 'flagged'
    };
    dbSubmissions[subIndex] = updatedSub;

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_FLAGGED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${id} placed on hold for anti-cheat verification.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({ submission: updatedSub, auditLog: log });
  });

  // POST reject submission
  app.post('/api/submissions/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, reviewedBy } = req.body;
    const subIndex = dbSubmissions.findIndex(s => s.id === id);

    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updatedSub: Submission = {
      ...dbSubmissions[subIndex],
      status: 'rejected',
      rejectionReason: reason || 'Screenshot telemetry or resolution verification failed',
      reviewedBy: reviewedBy || 'Admin_Lead',
      reviewedAt: new Date().toISOString()
    };
    dbSubmissions[subIndex] = updatedSub;

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_REJECTED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${id} rejected by ${updatedSub.reviewedBy}. Reason: ${updatedSub.rejectionReason}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({ submission: updatedSub, auditLog: log });
  });

  // GET audit logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ auditLogs: dbAuditLogs });
  });

  // GET admin stats
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const totalPlayers = dbPlayers.length;
    const activePlayers = dbPlayers.filter(p => (p.lifetimeStats?.matches ?? 0) > 0).length;
    const pendingSubmissions = dbSubmissions.filter(s => s.status === 'pending').length;
    const flaggedSubmissions = dbSubmissions.filter(s => s.status === 'flagged').length;
    const approvedSubmissions = dbSubmissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = dbSubmissions.filter(s => s.status === 'rejected').length;
    const totalXpAwarded = dbSubmissions
      .filter(s => s.status === 'approved')
      .reduce((acc, s) => acc + (s.scoreBreakdown?.total ?? 0), 0);

    res.json({
      totalPlayers,
      activePlayers,
      pendingSubmissions,
      flaggedSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      totalXpAwarded
    });
  });

  // --- ADMIN AUTH & CLEARANCE MANAGEMENT ROUTES ---

  // GET Admin System Status
  app.get('/api/admin/status', (req: Request, res: Response) => {
    res.json({
      hasInitialAdmin: dbAdmins.length > 0,
      totalAdmins: dbAdmins.length,
      pendingRequestsCount: dbAdminRequests.filter(r => r.status === 'pending').length
    });
  });

  // POST Bootstrap first Head of Command (only open when 0 admins exist)
  app.post('/api/admin/bootstrap', (req: Request, res: Response) => {
    if (dbAdmins.length > 0) {
      return res.status(403).json({
        error: 'Initial Head of Command has already been provisioned. New admin applicants must submit a clearance request for review.'
      });
    }

    const { username, email, password, displayName, linkedXnId } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, display name, and password are required' });
    }

    const firstAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username: username.trim(),
      email: email ? email.trim() : `${username.trim()}@xn-academy.gg`,
      displayName: displayName.trim(),
      password: String(password),
      role: 'HEAD_OF_COMMAND',
      isHeadOfCommand: true,
      linkedXnId: linkedXnId || undefined,
      createdAt: new Date().toISOString()
    };

    dbAdmins.push(firstAdmin);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'HEAD_OF_COMMAND_PROVISIONED',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `Supreme Head of Command authority assigned to ${displayName} (@${username}). Direct admin registration locked.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    const { password: _, ...safeAdmin } = firstAdmin;
    res.status(201).json({
      message: 'Head of Command profile initialized successfully.',
      admin: safeAdmin,
      auditLog: log
    });
  });

  // POST Request Admin Access
  app.post('/api/admin/request-access', (req: Request, res: Response) => {
    const { username, email, password, displayName, reason } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    // Check if already an admin
    if (dbAdmins.some(a => a.username.toLowerCase() === username.trim().toLowerCase())) {
      return res.status(409).json({ error: 'An admin account with this username already exists' });
    }

    // Check if already has a pending request
    if (dbAdminRequests.some(r => r.username.toLowerCase() === username.trim().toLowerCase() && r.status === 'pending')) {
      return res.status(409).json({ error: 'A clearance request for this username is already pending review' });
    }

    const newRequest: AdminRequest = {
      id: `req-${Date.now()}`,
      username: username.trim(),
      email: email ? email.trim() : `${username.trim()}@xn-academy.gg`,
      displayName: displayName.trim(),
      password: String(password),
      reason: reason ? reason.trim() : 'Competitive staff supervisor & telemetry audit officer application.',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    dbAdminRequests.unshift(newRequest);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ADMIN_CLEARANCE_REQUESTED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `Staff clearance application submitted by ${displayName} (@${username}). Pending Head of Command review.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.status(201).json({
      message: 'Clearance application submitted. Awaiting Head of Command approval.',
      request: {
        id: newRequest.id,
        username: newRequest.username,
        displayName: newRequest.displayName,
        status: newRequest.status,
        requestedAt: newRequest.requestedAt
      }
    });
  });

  // POST Admin Login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const clean = identifier.trim().toLowerCase();
    const admin = dbAdmins.find(
      a => a.username.toLowerCase() === clean || a.email.toLowerCase() === clean
    );

    if (!admin) {
      const pending = dbAdminRequests.find(
        r => r.username.toLowerCase() === clean || r.email.toLowerCase() === clean
      );
      if (pending && pending.status === 'pending') {
        return res.status(403).json({
          error: 'Your staff clearance request is currently PENDING approval by the Head of Command.'
        });
      }
      if (pending && pending.status === 'rejected') {
        return res.status(403).json({
          error: 'Your staff clearance request was rejected by administration.'
        });
      }
      return res.status(404).json({ error: 'No authorized staff account found with provided credentials' });
    }

    if (admin.password && admin.password !== String(password)) {
      return res.status(401).json({ error: 'Invalid security clearance passkey' });
    }

    const { password: _, ...safeAdmin } = admin;
    res.json({
      admin: safeAdmin,
      message: `${admin.isHeadOfCommand ? 'Head of Command' : 'Staff Officer'} clearance validated.`
    });
  });

  // GET all admin clearance requests
  app.get('/api/admin/requests', (req: Request, res: Response) => {
    const safeRequests = dbAdminRequests.map(({ password: _, ...reqWithoutPass }) => reqWithoutPass);
    res.json({ requests: safeRequests });
  });

  // POST approve admin clearance request (HoC or staff)
  app.post('/api/admin/requests/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const reqIndex = dbAdminRequests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Clearance request not found' });
    }

    const targetReq = dbAdminRequests[reqIndex];
    if (targetReq.status === 'approved') {
      return res.status(400).json({ error: 'Request is already approved' });
    }

    targetReq.status = 'approved';
    targetReq.reviewedAt = new Date().toISOString();
    targetReq.reviewedBy = req.body.reviewedBy || 'Head of Command';

    // Add to active admins
    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username: targetReq.username,
      email: targetReq.email,
      displayName: targetReq.displayName,
      password: targetReq.password,
      role: 'STAFF_OFFICER',
      isHeadOfCommand: false,
      createdAt: new Date().toISOString()
    };

    dbAdmins.push(newAdmin);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ADMIN_CLEARANCE_APPROVED',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `Staff clearance approved for ${targetReq.displayName} (@${targetReq.username}) by ${targetReq.reviewedBy}.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({
      message: `Staff clearance approved for ${targetReq.displayName}`,
      request: targetReq,
      newAdmin: {
        id: newAdmin.id,
        username: newAdmin.username,
        displayName: newAdmin.displayName,
        role: newAdmin.role
      }
    });
  });

  // POST reject admin clearance request
  app.post('/api/admin/requests/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const reqIndex = dbAdminRequests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: 'Clearance request not found' });
    }

    const targetReq = dbAdminRequests[reqIndex];
    targetReq.status = 'rejected';
    targetReq.reviewedAt = new Date().toISOString();
    targetReq.reviewedBy = req.body.reviewedBy || 'Head of Command';

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ADMIN_CLEARANCE_REJECTED',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `Staff clearance rejected for ${targetReq.displayName} (@${targetReq.username}) by ${targetReq.reviewedBy}.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({ message: 'Request rejected', request: targetReq });
  });

  // GET list of all admins
  app.get('/api/admin/list', (req: Request, res: Response) => {
    const safeAdmins = dbAdmins.map(({ password: _, ...a }) => a);
    res.json({ admins: safeAdmins });
  });

  // =========================================================================
  // HEAD OF COMMAND (HoC) EXCLUSIVE COMMAND CONTROLS
  // Note: Head of Command is not an admin, but rather above him even though he can perform the work of an admin.
  // =========================================================================

  // POST HoC: Reset ALL ranks across the network
  app.post('/api/admin/hoc/reset-all-ranks', (req: Request, res: Response) => {
    const { hocUsername, reason } = req.body;

    // Verify caller has Head of Command authority
    const hocAdmin = dbAdmins.find(a => a.isHeadOfCommand && (!hocUsername || a.username.toLowerCase() === hocUsername.toLowerCase()));
    if (dbAdmins.length > 0 && !hocAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Only the Head of Command can perform a network-wide rank reset.' });
    }

    const resetCount = dbPlayers.length;
    dbPlayers = dbPlayers.map(p => ({
      ...p,
      totalXp: 0,
      currentRank: 'E'
    }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ALL_RANKS_RESET_BY_HOC',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `SUPREME COMMAND OVERRIDE: Network-wide rank reset executed by Head of Command (${hocUsername || 'Supreme Commander'}). Total operatives reset: ${resetCount}. Reason: ${reason || 'Seasonal calibration'}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({
      message: `Successfully reset all ${resetCount} operative ranks to Rank E (0 XP).`,
      resetCount,
      auditLog: log
    });
  });

  // POST HoC: Reset an individual player's rank
  app.post('/api/admin/hoc/reset-player-rank', (req: Request, res: Response) => {
    const { xnId, hocUsername, reason } = req.body;

    if (!xnId) {
      return res.status(400).json({ error: 'Target player XN-ID is required' });
    }

    const playerIndex = dbPlayers.findIndex(p => p.xnId.toLowerCase() === xnId.toLowerCase());
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const previousRank = dbPlayers[playerIndex].currentRank;
    const previousXp = dbPlayers[playerIndex].totalXp;

    dbPlayers[playerIndex] = {
      ...dbPlayers[playerIndex],
      totalXp: 0,
      currentRank: 'E'
    };

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'PLAYER_RANK_RESET_BY_HOC',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `Head of Command reset rank for ${dbPlayers[playerIndex].displayName} (${xnId}) from ${previousRank} (${previousXp} XP) to Rank E (0 XP). Reason: ${reason || 'Administrative penalty / Rank reset'}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    const { password: _, ...safePlayer } = dbPlayers[playerIndex];
    res.json({
      message: `Reset rank for ${safePlayer.displayName} (${safePlayer.xnId}) to Rank E (0 XP).`,
      player: safePlayer,
      auditLog: log
    });
  });

  // POST HoC: Deduct XP from an operative
  app.post('/api/admin/hoc/deduct-xp', (req: Request, res: Response) => {
    const { xnId, amount, hocUsername, reason } = req.body;

    if (!xnId) {
      return res.status(400).json({ error: 'Target player XN-ID is required' });
    }

    const deductAmount = Math.max(1, Math.floor(Number(amount) || 50));
    const playerIndex = dbPlayers.findIndex(p => p.xnId.toLowerCase() === xnId.toLowerCase());

    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = dbPlayers[playerIndex];
    const previousXp = player.totalXp ?? 0;
    const newXp = Math.max(0, previousXp - deductAmount);
    const newRank = calculateRank(newXp);

    dbPlayers[playerIndex] = {
      ...player,
      totalXp: newXp,
      currentRank: newRank
    };

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'XP_DEDUCTED_BY_HOC',
      timestamp: new Date().toISOString(),
      actorType: 'hoc',
      details: `Head of Command deducted ${deductAmount} XP from ${player.displayName} (${xnId}). XP adjusted from ${previousXp} to ${newXp} (Rank: ${newRank}). Reason: ${reason || 'Conduct penalty / XP deduction'}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    const { password: _, ...safePlayer } = dbPlayers[playerIndex];
    res.json({
      message: `Deducted ${deductAmount} XP from ${player.displayName}. New balance: ${newXp} XP (${newRank} Rank).`,
      player: safePlayer,
      auditLog: log
    });
  });

  // =========================================================================
  // ADMIN REWARD FEATURE (50 XP Reward)
  // Admin can give out 50xp to any player as a reward ONLY when he crosses A rank (XP >= 5000 / Rank >= A).
  // Head of Command can reward at any time.
  // =========================================================================
  app.post('/api/admin/reward-player', (req: Request, res: Response) => {
    const { xnId, adminUsername, amount, reason } = req.body;

    if (!xnId) {
      return res.status(400).json({ error: 'Target player XN-ID is required' });
    }

    // Find the rewarding admin
    const admin = dbAdmins.find(a => 
      adminUsername && (a.username.toLowerCase() === adminUsername.toLowerCase() || a.displayName.toLowerCase() === adminUsername.toLowerCase())
    ) || dbAdmins[0];

    const isHoC = admin ? admin.isHeadOfCommand : true;

    if (!isHoC) {
      // For standard staff officer, check if admin has crossed A-Rank
      // Check linked player profile or check if admin's operative persona has reached Rank A, S, or S-MAX
      let adminPlayer = dbPlayers.find(p => 
        (admin.linkedXnId && p.xnId.toLowerCase() === admin.linkedXnId.toLowerCase()) ||
        p.username.toLowerCase() === admin.username.toLowerCase() ||
        p.email.toLowerCase() === admin.email.toLowerCase()
      );

      const adminXp = adminPlayer ? (adminPlayer.totalXp ?? 0) : 0;
      const adminRank = adminPlayer ? adminPlayer.currentRank : calculateRank(adminXp);

      // Rank order requirement: Must cross A rank (A: 5000+, S: 10000+, S-MAX: 16000+)
      const hasCrossedARank = adminXp >= 5000 || ['A', 'S', 'S-MAX'].includes(adminRank);

      if (!hasCrossedARank) {
        return res.status(403).json({
          error: `Staff Clearance Locked: Admins can only distribute rewards after crossing A-Rank (5,000+ XP). Your current standing: ${adminRank} Rank (${adminXp} XP).`
        });
      }
    }

    // Target player lookup
    const playerIndex = dbPlayers.findIndex(p => p.xnId.toLowerCase() === xnId.toLowerCase());
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const rewardAmount = Math.max(1, Math.floor(Number(amount) || 50));
    const player = dbPlayers[playerIndex];
    const previousXp = player.totalXp ?? 0;
    const newXp = previousXp + rewardAmount;
    const newRank = calculateRank(newXp);

    dbPlayers[playerIndex] = {
      ...player,
      totalXp: newXp,
      currentRank: newRank,
      peakRank: newRank > player.peakRank ? newRank : player.peakRank
    };

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'OPERATIVE_REWARDED_XP',
      timestamp: new Date().toISOString(),
      actorType: isHoC ? 'hoc' : 'admin',
      details: `${isHoC ? 'Head of Command' : 'A-Rank Staff Officer'} (${admin?.displayName || adminUsername || 'Command'}) awarded +${rewardAmount} XP to ${player.displayName} (${xnId}). New XP: ${newXp} (${newRank} Rank). Reason: ${reason || 'Tactical excellence commendation'}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    const { password: _, ...safePlayer } = dbPlayers[playerIndex];
    res.json({
      message: `Successfully granted +${rewardAmount} XP reward to ${player.displayName}.`,
      player: safePlayer,
      auditLog: log
    });
  });

  // --- VITE MIDDLEWARE & STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XN Academy Backend] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
