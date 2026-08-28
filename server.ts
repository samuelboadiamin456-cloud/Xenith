import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Interfaces matching frontend types
export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S-MAX';

export interface LifetimeStats {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number;
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
  actorType: 'admin' | 'system';
  details: string;
}

// In-Memory Database Store (Initialized Clean with No Demo Data)
let dbPlayers: Player[] = [];
let dbSubmissions: Submission[] = [];
let dbAuditLogs: AuditLog[] = [];
let dbAdmins: AdminUser[] = [];
let dbAdminRequests: AdminRequest[] = [];

// Rank Calculation Logic
function calculateRank(xp: number): RankTier {
  if (xp >= 2000) return 'S-MAX';
  if (xp >= 1500) return 'S';
  if (xp >= 1000) return 'A';
  if (xp >= 700) return 'B';
  if (xp >= 500) return 'C';
  if (xp >= 300) return 'D';
  return 'E';
}

function calculateSubmissionScore(stats: SubmissionStats): ScoreBreakdown {
  const killsXp = (stats.kills || 0) * 5;
  const winBonus = (stats.wins || 0) * 25;
  const kdBonus = Math.round(Math.min(stats.kd || 0, 15) * 15);
  const hsBonus = Math.round((stats.hs || 0) * 0.5);
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

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      version: '1.0.0',
      totalPlayers: dbPlayers.length,
      totalSubmissions: dbSubmissions.length
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
      list.sort((a, b) => b.lifetimeStats.kd - a.lifetimeStats.kd);
    } else if (sort === 'wins') {
      list.sort((a, b) => b.lifetimeStats.wins - a.lifetimeStats.wins);
    } else if (sort === 'winRate') {
      list.sort((a, b) => b.lifetimeStats.winRate - a.lifetimeStats.winRate);
    } else {
      list.sort((a, b) => b.totalXp - a.totalXp);
    }

    res.json({ players: list, count: list.length });
  });

  // GET single player by ID, XN-ID, or username
  app.get('/api/players/:identifier', (req: Request, res: Response) => {
    const clean = req.params.identifier.toLowerCase();
    const player = dbPlayers.find(
      p =>
        p.xnId.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.username.toLowerCase() === clean ||
        p.ign.toLowerCase() === clean
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
        winRate: 0.0,
        hs: 0.0
      }
    };

    dbPlayers.unshift(newPlayer);

    // Create system audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'OPERATIVE_REGISTERED',
      timestamp: new Date().toISOString(),
      actorType: 'system',
      details: `New account assigned official permanent identifier: ${formattedId} (${displayName})`
    };
    dbAuditLogs.unshift(log);

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

  // PUT update player profile
  app.put('/api/players/:xnId', (req: Request, res: Response) => {
    const { xnId } = req.params;
    const playerIndex = dbPlayers.findIndex(
      p => p.xnId.toLowerCase() === xnId.toLowerCase()
    );

    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const current = dbPlayers[playerIndex];
    const { displayName, ign, role, country, bio, avatarUrl } = req.body;

    const updated: Player = {
      ...current,
      displayName: displayName ? displayName.trim() : current.displayName,
      ign: ign ? ign.trim().toUpperCase() : current.ign,
      role: role || current.role,
      country: country !== undefined ? country.trim() : current.country,
      bio: bio !== undefined ? bio.trim() : current.bio,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : current.avatarUrl
    };

    dbPlayers[playerIndex] = updated;

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

    const score = calculateSubmissionScore(stats || { kills: 0, wins: 0, matches: 1, kd: 0, winRate: 0, hs: 0 });

    // Anti-cheat fraud heuristic checks
    const fraudFlags: string[] = [];
    if (stats.kd > 12.0) fraudFlags.push('Extreme K/D Anomaly (>12.0)');
    if (stats.hs > 85.0) fraudFlags.push('Abnormal Headshot Ratio (>85%)');
    if (stats.winRate > 95 && stats.matches > 5) fraudFlags.push('Unusually High Win Rate (>95%)');

    const newSub: Submission = {
      id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
      xnId: xnId || (player ? player.xnId : 'XN-UNKNOWN'),
      playerName,
      playerIgn,
      createdAt: new Date().toISOString(),
      status: fraudFlags.length > 0 ? 'flagged' : 'pending',
      stats,
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

    res.status(201).json({ submission: newSub, auditLog: log });
  });

  // POST approve submission
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
      reviewedBy: 'Admin_Lead',
      reviewedAt: new Date().toISOString()
    };
    dbSubmissions[subIndex] = updatedSub;

    let updatedPlayer: Player | null = null;

    if (targetPlayerIndex !== -1) {
      const targetPlayer = dbPlayers[targetPlayerIndex];
      const newTotalXp = targetPlayer.totalXp + awardedXp;
      const newRank = calculateRank(newTotalXp);

      const oldStats = targetPlayer.lifetimeStats;
      const totalMatches = oldStats.matches + sub.stats.matches;
      const totalWins = oldStats.wins + sub.stats.wins;
      const totalKills = oldStats.kills + sub.stats.kills;
      const updatedKd = totalMatches > 0 ? parseFloat((totalKills / Math.max(1, totalMatches * 0.8)).toFixed(2)) : sub.stats.kd;
      const updatedWinRate = totalMatches > 0 ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) : sub.stats.winRate;
      const updatedHs = parseFloat(((oldStats.hs + sub.stats.hs) / 2).toFixed(1));

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
      details: `${sub.id} (${sub.playerName}) approved. +${awardedXp} XP awarded.`
    };
    dbAuditLogs.unshift(log);

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

    res.json({ submission: updatedSub, auditLog: log });
  });

  // POST reject submission
  app.post('/api/submissions/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const subIndex = dbSubmissions.findIndex(s => s.id === id);

    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updatedSub: Submission = {
      ...dbSubmissions[subIndex],
      status: 'rejected',
      rejectionReason: reason || 'Screenshot telemetry or resolution verification failed',
      reviewedBy: 'Admin_Lead',
      reviewedAt: new Date().toISOString()
    };
    dbSubmissions[subIndex] = updatedSub;

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SUBMISSION_REJECTED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Submission ${id} rejected. Reason: ${updatedSub.rejectionReason}`
    };
    dbAuditLogs.unshift(log);

    res.json({ submission: updatedSub, auditLog: log });
  });

  // GET audit logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ auditLogs: dbAuditLogs });
  });

  // GET admin stats
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const totalPlayers = dbPlayers.length;
    const activePlayers = dbPlayers.filter(p => p.lifetimeStats.matches > 0).length;
    const pendingSubmissions = dbSubmissions.filter(s => s.status === 'pending').length;
    const flaggedSubmissions = dbSubmissions.filter(s => s.status === 'flagged').length;
    const approvedSubmissions = dbSubmissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = dbSubmissions.filter(s => s.status === 'rejected').length;
    const totalXpAwarded = dbSubmissions
      .filter(s => s.status === 'approved')
      .reduce((acc, s) => acc + s.scoreBreakdown.total, 0);

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

  // GET Admin System Status (whether first admin bootstrap is open or closed)
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

    const { username, email, password, displayName } = req.body;
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
      createdAt: new Date().toISOString()
    };

    dbAdmins.push(firstAdmin);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'HEAD_OF_COMMAND_PROVISIONED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Head of Command clearance assigned to ${displayName} (${username}). Admin direct registration is now permanently locked.`
    };
    dbAuditLogs.unshift(log);

    const { password: _, ...safeAdmin } = firstAdmin;
    res.status(201).json({
      message: 'Head of Command profile initialized successfully.',
      admin: safeAdmin,
      auditLog: log
    });
  });

  // POST Request Admin Access (used by applicants once initial admin exists)
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
      // Check if user has a pending request to provide clear feedback
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
      message: 'Staff clearance validated. Welcome to Command Console.'
    });
  });

  // GET all admin clearance requests
  app.get('/api/admin/requests', (req: Request, res: Response) => {
    const safeRequests = dbAdminRequests.map(({ password: _, ...reqWithoutPass }) => reqWithoutPass);
    res.json({ requests: safeRequests });
  });

  // POST approve admin clearance request
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
    targetReq.reviewedBy = 'Head of Command';

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
      actorType: 'admin',
      details: `Staff clearance approved for ${targetReq.displayName} (@${targetReq.username}). Officer role granted.`
    };
    dbAuditLogs.unshift(log);

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
    targetReq.reviewedBy = 'Head of Command';

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ADMIN_CLEARANCE_REJECTED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Staff clearance rejected for ${targetReq.displayName} (@${targetReq.username}).`
    };
    dbAuditLogs.unshift(log);

    res.json({ message: 'Request rejected', request: targetReq });
  });

  // GET list of all admins
  app.get('/api/admin/list', (req: Request, res: Response) => {
    const safeAdmins = dbAdmins.map(({ password: _, ...a }) => a);
    res.json({ admins: safeAdmins });
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
