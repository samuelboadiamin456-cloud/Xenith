import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Interfaces matching frontend types
export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S-MAX';

export interface LifetimeStats {
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  winRate: number; // Cumulative win rate %
  hs?: number;
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
  linkView?: string;
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
let dbNotifications: AppNotification[] = [];
let dbEvents: AcademyEvent[] = [];

// Load Database from disk on startup
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.players)) {
        // Filter out any lingering seed records if present
        dbPlayers = data.players.filter((p: Player) => !p.id?.startsWith('p-seed-') && p.xnId !== 'XN-001' && p.xnId !== 'XN-002' && p.xnId !== 'XN-003' && p.xnId !== 'XN-004' && p.xnId !== 'XN-005' && p.xnId !== 'XN-006');
      } else {
        dbPlayers = [];
      }

      if (Array.isArray(data.submissions)) {
        dbSubmissions = data.submissions.filter((s: Submission) => !s.id?.startsWith('sub-9021') && !s.id?.startsWith('sub-8842') && !s.id?.startsWith('sub-7612'));
      } else {
        dbSubmissions = [];
      }

      if (Array.isArray(data.auditLogs)) {
        dbAuditLogs = data.auditLogs.filter((l: AuditLog) => !l.id?.startsWith('log-seed-'));
      } else {
        dbAuditLogs = [];
      }

      if (Array.isArray(data.admins)) dbAdmins = data.admins;
      if (Array.isArray(data.adminRequests)) dbAdminRequests = data.adminRequests;

      if (Array.isArray(data.notifications)) {
        dbNotifications = data.notifications.filter((n: AppNotification) => !n.id?.startsWith('notif-seed-'));
      } else {
        dbNotifications = [];
      }

      if (Array.isArray(data.events)) {
        dbEvents = data.events.filter((e: AcademyEvent) => !e.id?.startsWith('event-seed-'));
      } else {
        dbEvents = [];
      }

      console.log(`[Storage] Database loaded from disk: ${dbPlayers.length} live players, ${dbAdmins.length} admins, ${dbNotifications.length} notifications.`);
    } else {
      dbPlayers = [];
      dbSubmissions = [];
      dbAuditLogs = [];
      dbNotifications = [];
      dbEvents = [];
      saveDatabase();
      console.log(`[Storage] Clean empty database created and saved to ${DB_FILE}`);
    }
  } catch (err) {
    console.error('[Storage] Error loading database from disk:', err);
    dbPlayers = [];
    dbSubmissions = [];
    dbAuditLogs = [];
    dbNotifications = [];
    dbEvents = [];
    saveDatabase();
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
      notifications: dbNotifications,
      events: dbEvents,
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving database to disk:', err);
  }
}

// Initialize persistence on module load
loadDatabase();

// Lazy initialized GenAI client
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAiClient;
}

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
    const placement = stats.placement !== undefined ? Number(stats.placement) : (stats.outcome === 'Victory' || (stats.wins && stats.wins > 0) ? 1 : 4);
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
      mode: 'BR',
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
    const isVictory = stats.outcome === 'Victory' || (stats.wins !== undefined && stats.wins > 0);
    const outcomeBonus = isVictory ? 50 : -20;

    const total = killsXp + assistsXp + deathsXp + damageXp + outcomeBonus;

    return {
      mode: 'SF',
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
    const isVictory = stats.outcome === 'Victory' || (stats.wins !== undefined && stats.wins > 0);
    const outcomeBonus = isVictory ? 30 : -20;

    const total = killsXp + damageXp + outcomeBonus;

    return {
      mode: 'CUSTOM',
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

  // Fallback
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

  // Full Database State Synchronization (ensures PC and mobile are 100% in sync)
  app.get('/api/sync/full-state', (req: Request, res: Response) => {
    const safePlayers = dbPlayers.map(({ password: _, ...p }) => p);
    const safeAdmins = dbAdmins.map(({ password: _, ...a }) => a);
    const safeRequests = dbAdminRequests.map(({ password: _, ...r }) => r);

    res.json({
      players: safePlayers,
      submissions: dbSubmissions,
      auditLogs: dbAuditLogs,
      adminStatus: {
        hasInitialAdmin: dbAdmins.length > 0,
        totalAdmins: dbAdmins.length,
        pendingRequestsCount: dbAdminRequests.filter(r => r.status === 'pending').length
      },
      admins: safeAdmins,
      adminRequests: safeRequests,
      notifications: dbNotifications,
      events: dbEvents.filter(e => e.isActive !== false),
      serverTimestamp: new Date().toISOString()
    });
  });

  // Client data reconciliation merge (syncs any offline or local changes between devices)
  app.post('/api/sync/client-merge', (req: Request, res: Response) => {
    const { players: clientPlayers, submissions: clientSubs } = req.body;
    let modified = false;

    if (Array.isArray(clientPlayers)) {
      clientPlayers.forEach((cp: Player) => {
        if (!cp || !cp.xnId) return;
        // Ignore any lingering demo seeds
        if (cp.id?.startsWith('p-seed-') || ['XN-001', 'XN-002', 'XN-003', 'XN-004', 'XN-005', 'XN-006'].includes(cp.xnId)) {
          return;
        }
        const existsIndex = dbPlayers.findIndex(
          p => p.xnId.toLowerCase() === cp.xnId.toLowerCase() || (cp.username && p.username.toLowerCase() === cp.username.toLowerCase())
        );
        if (existsIndex === -1) {
          dbPlayers.push(cp);
          modified = true;
        }
      });
    }

    if (Array.isArray(clientSubs)) {
      clientSubs.forEach((cs: Submission) => {
        if (!cs || !cs.id) return;
        if (cs.id.startsWith('sub-9021') || cs.id.startsWith('sub-8842') || cs.id.startsWith('sub-7612')) {
          return;
        }
        const exists = dbSubmissions.some(s => s.id === cs.id);
        if (!exists) {
          dbSubmissions.push(cs);
          modified = true;
        }
      });
    }

    if (modified) {
      saveDatabase();
    }

    const safePlayers = dbPlayers.map(({ password: _, ...p }) => p);
    res.json({
      players: safePlayers,
      submissions: dbSubmissions,
      auditLogs: dbAuditLogs,
      notifications: dbNotifications,
      events: dbEvents.filter(e => e.isActive !== false),
      serverTimestamp: new Date().toISOString()
    });
  });

  // Emergency / Administrative Data Purge
  app.post('/api/admin/clear-all-data', (req: Request, res: Response) => {
    const { preserveAdmins = true } = req.body || {};
    dbPlayers = [];
    dbSubmissions = [];
    dbAuditLogs = [];
    dbNotifications = [];
    dbEvents = [];
    if (!preserveAdmins) {
      dbAdmins = [];
      dbAdminRequests = [];
    }
    saveDatabase();
    console.log('[Storage] Database purged. All players, submissions, logs, and events wiped.');
    res.json({
      success: true,
      message: 'All application data has been successfully cleared.',
      totalPlayers: 0,
      totalSubmissions: 0
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

  // --- ADVANCED 3-MODE SITREP OCR SCANNING (BR, SF, CUSTOM) ---
  app.post('/api/ocr/scan-sitrep', async (req: Request, res: Response) => {
    try {
      const { image, mode = 'BR' } = req.body;
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ success: false, valid: false, message: 'Image payload is required' });
      }

      // Prepare mimeType and base64Data
      let mimeType = 'image/jpeg';
      let base64Data = image;
      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9/+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const ai = getGenAiClient();
      if (!ai) {
        // Deterministic fallback if GEMINI_API_KEY is not set
        const extracted = {
          highlightedIgn: 'OPERATIVE',
          kills: 5,
          assists: mode === 'BR' || mode === 'SF' ? 2 : 0,
          deaths: mode === 'SF' ? 1 : 0,
          damage: 2450,
          placement: mode === 'BR' ? 1 : undefined,
          placementText: mode === 'BR' ? '1/12 Victory' : undefined,
          outcome: 'Victory' as const,
          cash: mode === 'BR' ? 12000 : undefined
        };
        return res.status(200).json({
          success: true,
          valid: true,
          mode,
          extracted,
          scoreBreakdown: calculateSubmissionScore({
            mode,
            kills: extracted.kills,
            assists: extracted.assists,
            deaths: extracted.deaths,
            damage: extracted.damage,
            placement: extracted.placement,
            outcome: extracted.outcome
          }),
          message: 'OCR processed via fallback engine'
        });
      }

      let systemInstruction = '';
      if (mode === 'BR') {
        systemInstruction = `You are a high-precision OCR and game scoreboard analyzer for Blood Strike Battle Royale (BR) post-match screens.
CRITICAL VALIDATION RULES FOR BR:
1. The screenshot MUST be a Battle Royale post-match scoreboard. Look for:
   - "Battle Royale" mode title/header or top placement indicator (e.g., "1/12 Victory", "2/12", "#1", "#2", etc.)
   - Summary statistics bar (Match Duration, Total Kills, Cash Obtained)
   - Player roster table with columns: [Players, KILLS, Assist, Damage, Cash].
2. If this image is NOT a Battle Royale post-match scoreboard (for example if it is a Squad Fight screen, 1v1/2v2 Custom match, lobby menu, profile screen, or non-game image), you MUST return "valid": false and a descriptive "rejectionReason" (e.g., "Image rejected: Screenshot is not a valid Battle Royale post-match scoreboard. Please upload a BR result screen matching the BR format.").
3. IMPORTANT - PLAYER HIGHLIGHT RULE: In Blood Strike, the submitting player's row is HIGHLIGHTED IN YELLOW or framed with a distinct yellow/gold border. You MUST ONLY record the stats of the player whose row is highlighted in yellow. Ignore all other player rows!
4. EXTRACT:
   - highlightedIgn: In-game name of the yellow-highlighted player
   - kills: integer from KILLS column for the yellow row
   - assists: integer from Assist column for the yellow row
   - damage: integer from Damage column for the yellow row
   - cash: integer from Cash column for the yellow row
   - placement: integer (1 for Victory/1st, 2 for 2nd, 3 for 3rd, 4 for 4th, 5+ for 5th or lower)
   - placementText: exact placement text shown (e.g. "1/12 Victory" or "#2/12")
   - outcome: "Victory" if placement is 1, otherwise "Defeat"
`;
      } else if (mode === 'SF') {
        systemInstruction = `You are a high-precision OCR and game scoreboard analyzer for Blood Strike Squad Fight (SF) post-match screens.
CRITICAL VALIDATION RULES FOR SF:
1. The screenshot MUST be a Squad Fight post-match scoreboard. Look for:
   - "Squad Fight" mode header or Top-left match outcome banner ("Victory" or "Defeat" with team scores e.g., 4 vs 3 or similar)
   - Two team rosters (Blue Team and Red Team) with columns: [Players, KILLS, Assists, Death, Damage].
2. If this image is NOT a Squad Fight post-match scoreboard (for example if it is a Battle Royale screen, Custom 1v1/2v2 screen, main menu, or unrelated image), you MUST return "valid": false and a descriptive "rejectionReason" (e.g., "Image rejected: Screenshot is not a valid Squad Fight scoreboard. Please upload an SF result screen matching the SF format.").
3. IMPORTANT - PLAYER HIGHLIGHT RULE: In Blood Strike, the submitting player's row is HIGHLIGHTED IN YELLOW or framed with a distinct yellow border. You MUST ONLY record the stats of the player whose row is highlighted in yellow.
4. EXTRACT:
   - highlightedIgn: In-game name of the yellow-highlighted player
   - kills: integer from KILLS column for the yellow row
   - assists: integer from Assists column for the yellow row
   - deaths: integer from Death column for the yellow row
   - damage: integer from Damage column for the yellow row
   - outcome: "Victory" or "Defeat" from the top-left banner
`;
      } else if (mode === 'CUSTOM') {
        systemInstruction = `You are a high-precision OCR and game scoreboard analyzer for Blood Strike Custom Match / Team Deathmatch screens (including 1v1 and 2v2).
CRITICAL VALIDATION RULES FOR CUSTOM:
1. The screenshot MUST be a Custom Match or Team Deathmatch post-match summary (supports 1v1.jpg, 2v2.jpg, or custom deathmatch formats). Look for:
   - Top-left "Victory" or "Defeat" banner with big team round score numbers (e.g. 19 vs 10, 35 vs 27)
   - Two team tables with columns: [Players, KILLS, Damage].
2. If this image is NOT a Custom / 1v1 / 2v2 match result screen (for example if it is a standard Battle Royale screen, standard Squad Fight screen, or unrelated picture), you MUST return "valid": false and a descriptive "rejectionReason" (e.g., "Image rejected: Screenshot is not a valid Custom 1v1 / 2v2 match scoreboard. Please upload a Custom result screen.").
3. IMPORTANT - PLAYER HIGHLIGHT RULE: The submitting player's row is HIGHLIGHTED IN YELLOW. You MUST ONLY record the stats of the player highlighted in yellow.
4. EXTRACT:
   - highlightedIgn: In-game name of the yellow-highlighted player
   - kills: integer from KILLS column for the yellow row
   - damage: integer from Damage column for the yellow row
   - outcome: "Victory" or "Defeat" from the top-left banner
   - teamFormat: format detected (e.g., "1v1", "2v2", "3v3", "TDM")
`;
      }

      const promptText = `Analyze this Blood Strike screenshot for mode "${mode}". Return pure JSON matching this schema:
{
  "valid": true,
  "rejectionReason": "string (only if valid is false)",
  "highlightedIgn": "string",
  "kills": 0,
  "assists": 0,
  "deaths": 0,
  "damage": 0,
  "placement": 1,
  "placementText": "string",
  "outcome": "Victory",
  "cash": 0,
  "teamFormat": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction + '\n\n' + promptText },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const responseText = response.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (err) {
        console.error('Failed to parse Gemini OCR JSON response:', responseText);
        parsed = { valid: false, rejectionReason: 'Failed to parse image analysis results.' };
      }

      if (!parsed.valid) {
        return res.json({
          success: true,
          valid: false,
          rejectionReason: parsed.rejectionReason || `The uploaded image does not match the required ${mode} screenshot structure.`,
          mode
        });
      }

      const extracted = {
        highlightedIgn: parsed.highlightedIgn || 'OPERATIVE',
        kills: Math.max(0, Math.round(Number(parsed.kills) || 0)),
        assists: Math.max(0, Math.round(Number(parsed.assists) || 0)),
        deaths: Math.max(0, Math.round(Number(parsed.deaths) || 0)),
        damage: Math.max(0, Math.round(Number(parsed.damage) || 0)),
        placement: parsed.placement !== undefined ? Number(parsed.placement) : (mode === 'BR' ? 1 : undefined),
        placementText: parsed.placementText || (mode === 'BR' ? (parsed.placement === 1 ? '1/12 Victory' : `#${parsed.placement}`) : undefined),
        outcome: (parsed.outcome === 'Victory' || parsed.outcome === 'Defeat') ? parsed.outcome : (parsed.placement === 1 ? 'Victory' : 'Defeat'),
        cash: parsed.cash !== undefined ? Number(parsed.cash) : undefined,
        teamFormat: parsed.teamFormat
      };

      const scoreBreakdown = calculateSubmissionScore({
        mode,
        kills: extracted.kills,
        assists: extracted.assists,
        deaths: extracted.deaths,
        damage: extracted.damage,
        placement: extracted.placement,
        outcome: extracted.outcome as 'Victory' | 'Defeat'
      });

      res.json({
        success: true,
        valid: true,
        mode,
        extracted,
        scoreBreakdown
      });
    } catch (err: any) {
      console.error('[OCR Error]', err);
      res.status(500).json({
        success: false,
        valid: false,
        message: err.message || 'OCR processing failed'
      });
    }
  });

  // GET all submissions
  app.get('/api/submissions', (req: Request, res: Response) => {
    const { status, xnId, mode } = req.query;
    let list = [...dbSubmissions];

    if (status && status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    if (xnId) {
      list = list.filter(s => s.xnId.toLowerCase() === String(xnId).toLowerCase());
    }
    if (mode && mode !== 'ALL') {
      list = list.filter(s => s.mode === mode || s.stats.mode === mode);
    }

    res.json({ submissions: list, count: list.length });
  });

  // POST create new submission
  app.post('/api/submissions', (req: Request, res: Response) => {
    const { xnId, stats, mode = 'BR', evidenceUrl } = req.body;

    const player = dbPlayers.find(p => p.xnId.toLowerCase() === (xnId || '').toLowerCase());
    const playerName = player ? player.displayName : req.body.playerName || 'Recruit Operative';
    const playerIgn = player ? player.ign : req.body.playerIgn || 'OPERATIVE';

    const subMode: SitrepMode = stats?.mode || mode || 'BR';
    const safeStats: SubmissionStats = {
      mode: subMode,
      kills: Math.max(0, Math.round(Number(stats?.kills) || 0)),
      assists: stats?.assists !== undefined ? Math.max(0, Math.round(Number(stats.assists) || 0)) : undefined,
      deaths: stats?.deaths !== undefined ? Math.max(0, Math.round(Number(stats.deaths) || 0)) : undefined,
      damage: stats?.damage !== undefined ? Math.max(0, Math.round(Number(stats.damage) || 0)) : undefined,
      placement: stats?.placement !== undefined ? Number(stats.placement) : undefined,
      placementText: stats?.placementText || undefined,
      outcome: stats?.outcome || (stats?.wins && stats.wins > 0 ? 'Victory' : 'Defeat'),
      highlightedIgn: stats?.highlightedIgn || playerIgn,
      cash: stats?.cash !== undefined ? Number(stats.cash) : undefined,
      wins: stats?.wins !== undefined ? Number(stats.wins) : (stats?.outcome === 'Victory' || stats?.placement === 1 ? 1 : 0),
      matches: Math.max(1, Math.round(Number(stats?.matches) || 1)),
      kd: Number(stats?.kd) || (stats?.deaths && stats.deaths > 0 ? parseFloat(((stats.kills || 0) / stats.deaths).toFixed(2)) : (stats?.kills || 0)),
      winRate: Number(stats?.winRate) || (stats?.outcome === 'Victory' || stats?.placement === 1 ? 100 : 0)
    };

    const score = calculateSubmissionScore(safeStats);

    // Anti-cheat fraud heuristic checks
    const fraudFlags: string[] = [];
    if (safeStats.kd && safeStats.kd > 15.0) fraudFlags.push('Extreme K/D Anomaly (>15.0)');
    if (safeStats.kills > 35) fraudFlags.push('Unusually High Kill Count (>35 kills in single match)');

    const newSub: Submission = {
      id: `sub-${Math.floor(1000 + Math.random() * 9000)}`,
      xnId: xnId || (player ? player.xnId : 'XN-UNKNOWN'),
      playerName,
      playerIgn,
      createdAt: new Date().toISOString(),
      status: fraudFlags.length > 0 ? 'flagged' : 'pending',
      stats: safeStats,
      mode: subMode,
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
      details: `${newSub.id} [${subMode}] from ${playerName} (${newSub.xnId}) queued for review (Score: ${score.total} XP).${fraudFlags.length ? ` Flags: ${fraudFlags.join(', ')}` : ''}`
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

      const oldStats = targetPlayer.lifetimeStats || { kills: 0, wins: 0, matches: 0, kd: 0, winRate: 0 };
      const totalMatches = (oldStats.matches || 0) + (sub.stats.matches || 1);
      const totalWins = (oldStats.wins || 0) + (sub.stats.wins || 0);
      const totalKills = (oldStats.kills || 0) + (sub.stats.kills || 0);
      const updatedKd = totalMatches > 0 ? parseFloat((totalKills / Math.max(1, totalMatches * 0.8)).toFixed(2)) : sub.stats.kd;
      
      // Cumulative win rate calculation: totalWins / totalMatches * 100
      const updatedWinRate = totalMatches > 0 
        ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) 
        : 0;

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
          winRate: updatedWinRate
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

  // --- ACADEMY OPERATIONS: ADD PLAYER TO SYSTEM ---
  app.post('/api/admin/players/add', (req: Request, res: Response) => {
    const {
      displayName,
      ign,
      role,
      email,
      username,
      country,
      bio,
      avatarUrl,
      initialXp = 0,
      academyStatus = 'CADET',
      verificationStatus = 'VERIFIED',
      lifetimeStats,
      adminUsername
    } = req.body;

    if (!displayName || !ign || !role) {
      return res.status(400).json({ error: 'Display Name, In-Game Name (IGN), and Combat Role are required.' });
    }

    // Auto-generate unique sequential XN-ID (e.g. XN-014)
    let nextNum = dbPlayers.length + 1;
    let newXnId = `XN-${String(nextNum).padStart(3, '0')}`;
    while (dbPlayers.some(p => p.xnId.toUpperCase() === newXnId.toUpperCase())) {
      nextNum++;
      newXnId = `XN-${String(nextNum).padStart(3, '0')}`;
    }

    const cleanUsername = username 
      ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      : `${ign.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

    const cleanEmail = email 
      ? email.trim().toLowerCase() 
      : `${cleanUsername}@academy.xn.gg`;

    const totalXp = Math.max(0, Math.floor(Number(initialXp) || 0));
    const calculatedRank = calculateRank(totalXp);

    const safeStats = {
      kills: Math.max(0, Math.floor(Number(lifetimeStats?.kills) || 0)),
      wins: Math.max(0, Math.floor(Number(lifetimeStats?.wins) || 0)),
      matches: Math.max(0, Math.floor(Number(lifetimeStats?.matches) || 0)),
      kd: Number(lifetimeStats?.kd) || 1.0,
      winRate: Number(lifetimeStats?.winRate) || (lifetimeStats?.matches ? Math.round(((lifetimeStats.wins || 0) / lifetimeStats.matches) * 100) : 0)
    };

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      xnId: newXnId,
      username: cleanUsername,
      email: cleanEmail,
      displayName: displayName.trim(),
      ign: ign.trim().toUpperCase(),
      role,
      country: country ? country.trim() : 'GLOBAL',
      bio: bio ? bio.trim() : 'Enrolled Operative in XN Academy Tactical Roster.',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newXnId)}`,
      currentRank: calculatedRank,
      peakRank: calculatedRank,
      totalXp,
      academyStatus: academyStatus || 'CADET',
      verificationStatus: verificationStatus || 'VERIFIED',
      joinedAt: new Date().toISOString(),
      lifetimeStats: safeStats
    };

    dbPlayers.unshift(newPlayer);

    // Create welcome notification
    const welcomeNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      recipientXnId: newXnId,
      title: 'WELCOME TO XN ACADEMY ROSTER',
      message: `You have been officially enrolled by ${adminUsername || 'Academy Command'}. Your permanent callsign is ${newXnId}.`,
      type: 'system',
      priority: 'urgent',
      createdAt: new Date().toISOString(),
      read: false,
      linkView: 'profile',
      sender: adminUsername || 'Academy Command'
    };
    dbNotifications.unshift(welcomeNotif);

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'OPERATIVE_ENROLLED_BY_ADMIN',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `New operative ${newPlayer.displayName} (${newPlayer.xnId} | ${newPlayer.ign}) enrolled by ${adminUsername || 'Command'}. Initial XP: ${totalXp} (${calculatedRank}).`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.status(201).json({
      message: `Operative ${newPlayer.displayName} (${newPlayer.xnId}) successfully added to Academy Roster.`,
      player: newPlayer,
      auditLog: log
    });
  });

  // --- ACADEMY OPERATIONS: REMOVE PLAYER FROM SYSTEM ---
  app.delete('/api/admin/players/:xnId', (req: Request, res: Response) => {
    const { xnId } = req.params;
    const { reason, adminUsername } = req.body;

    const playerIndex = dbPlayers.findIndex(p => p.xnId.toLowerCase() === xnId.toLowerCase());
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Operative not found in Academy Roster.' });
    }

    const removedPlayer = dbPlayers[playerIndex];
    dbPlayers.splice(playerIndex, 1);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'OPERATIVE_EXPELLED_BY_ADMIN',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Operative ${removedPlayer.displayName} (${removedPlayer.xnId} | IGN: ${removedPlayer.ign}) expelled from Academy by ${adminUsername || 'Command'}. Reason: ${reason || 'Administrative roster prune / conduct violation'}`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({
      message: `Operative ${removedPlayer.displayName} (${removedPlayer.xnId}) removed from Academy System.`,
      removedXnId: xnId,
      auditLog: log
    });
  });

  // --- LOCK & CALIBRATE TELEMETRY METRIC (BASED ON PLAYER REPORT) ---
  app.post('/api/admin/players/:xnId/calibrate-telemetry', (req: Request, res: Response) => {
    const { xnId } = req.params;
    const {
      kills,
      wins,
      matches,
      kd,
      winRate,
      reportTicket,
      reason,
      adminUsername,
      recalculateXp = false
    } = req.body;

    const playerIndex = dbPlayers.findIndex(p => p.xnId.toLowerCase() === xnId.toLowerCase());
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Operative not found in database.' });
    }

    const player = dbPlayers[playerIndex];
    const oldStats = player.lifetimeStats || { kills: 0, wins: 0, matches: 0, kd: 1.0, winRate: 0 };

    const newMatches = matches !== undefined ? Math.max(0, Math.floor(Number(matches))) : oldStats.matches;
    const newWins = wins !== undefined ? Math.max(0, Math.floor(Number(wins))) : oldStats.wins;
    const newKills = kills !== undefined ? Math.max(0, Math.floor(Number(kills))) : oldStats.kills;
    const newKd = kd !== undefined ? parseFloat(Number(kd).toFixed(2)) : oldStats.kd;
    
    // Calculate cumulative win rate (wins / matches * 100) or explicit override
    const calculatedWinRate = newMatches > 0 
      ? parseFloat(((newWins / newMatches) * 100).toFixed(1)) 
      : 0;
    const newWinRate = winRate !== undefined ? parseFloat(Number(winRate).toFixed(1)) : calculatedWinRate;

    const updatedLifetimeStats = {
      kills: newKills,
      wins: newWins,
      matches: newMatches,
      kd: newKd,
      winRate: Math.min(100, Math.max(0, newWinRate))
    };

    let updatedXp = player.totalXp ?? 0;
    let updatedRank = player.currentRank;

    if (recalculateXp) {
      // Calibrate total XP using clean metrics
      updatedXp = Math.max(0, (newKills * 5) + (newWins * 25) + Math.round(newKd * 15));
      updatedRank = calculateRank(updatedXp);
    }

    const updatedPlayer: Player = {
      ...player,
      lifetimeStats: updatedLifetimeStats,
      totalXp: updatedXp,
      currentRank: updatedRank,
      peakRank: updatedRank > player.peakRank ? updatedRank : player.peakRank
    };

    dbPlayers[playerIndex] = updatedPlayer;

    // Send notification to player device
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      recipientXnId: player.xnId,
      title: 'TELEMETRY CALIBRATION VERIFIED',
      message: `Your combat telemetry metrics have been calibrated by ${adminUsername || 'Academy Staff'}${reportTicket ? ` based on report #${reportTicket}` : ''}. [Matches: ${newMatches} | Wins: ${newWins} | Kills: ${newKills} | Win Rate: ${newWinRate}%]`,
      type: 'telemetry',
      priority: 'urgent',
      createdAt: new Date().toISOString(),
      read: false,
      linkView: 'profile',
      sender: adminUsername || 'Staff Officer'
    };
    dbNotifications.unshift(notif);

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'TELEMETRY_CALIBRATED_BY_ADMIN',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Telemetry calibrated for ${player.displayName} (${player.xnId}) by ${adminUsername || 'Command'}. Report: ${reportTicket || 'Direct Player Verification'}. Reason: ${reason || 'Stats adjustment request'}. Old: [M:${oldStats.matches}, W:${oldStats.wins}, K:${oldStats.kills}] -> New: [M:${newMatches}, W:${newWins}, K:${newKills}, WR:${newWinRate}%]`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    const { password: _, ...safePlayer } = updatedPlayer;
    res.json({
      message: `Telemetry metrics successfully calibrated for ${player.displayName}.`,
      player: safePlayer,
      notification: notif,
      auditLog: log
    });
  });

  // --- NOTIFICATIONS API ---
  // GET notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    const { recipientXnId } = req.query;
    let list = [...dbNotifications];

    if (recipientXnId && String(recipientXnId).toUpperCase() !== 'ALL') {
      const target = String(recipientXnId).toLowerCase();
      list = list.filter(n => 
        n.recipientXnId.toUpperCase() === 'ALL' || 
        n.recipientXnId.toLowerCase() === target
      );
    }

    res.json({ notifications: list, count: list.length });
  });

  // POST send notification (HoC / Admin broadcast or direct)
  app.post('/api/notifications/send', (req: Request, res: Response) => {
    const {
      recipientXnId = 'ALL',
      title,
      message,
      type = 'announcement',
      priority = 'normal',
      linkView = 'home',
      sender = 'Academy Command'
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required for notification broadcast.' });
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientXnId: recipientXnId.trim().toUpperCase(),
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      createdAt: new Date().toISOString(),
      read: false,
      linkView,
      sender
    };

    dbNotifications.unshift(newNotif);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'NOTIFICATION_BROADCAST_SENT',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `[${priority.toUpperCase()}] Notification "${title}" dispatched to ${recipientXnId} by ${sender}.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.status(201).json({
      message: 'Notification successfully dispatched to operative devices.',
      notification: newNotif,
      auditLog: log
    });
  });

  // POST mark notification as read
  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notifIndex = dbNotifications.findIndex(n => n.id === id);

    if (notifIndex !== -1) {
      dbNotifications[notifIndex].read = true;
      saveDatabase();
      return res.json({ success: true, notification: dbNotifications[notifIndex] });
    }

    res.status(404).json({ error: 'Notification not found' });
  });

  // POST mark all as read
  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const { recipientXnId } = req.body;
    dbNotifications = dbNotifications.map(n => {
      if (!recipientXnId || n.recipientXnId === 'ALL' || n.recipientXnId.toLowerCase() === String(recipientXnId).toLowerCase()) {
        return { ...n, read: true };
      }
      return n;
    });
    saveDatabase();
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  // DELETE notification
  app.delete('/api/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = dbNotifications.length;
    dbNotifications = dbNotifications.filter(n => n.id !== id);
    if (dbNotifications.length !== initialLen) {
      saveDatabase();
      return res.json({ success: true, message: 'Notification cleared' });
    }
    res.status(404).json({ error: 'Notification not found' });
  });

  // --- ACADEMY EVENTS API ---
  // GET events
  app.get('/api/events', (req: Request, res: Response) => {
    const list = dbEvents.filter(e => e.isActive !== false);
    res.json({ events: list, count: list.length });
  });

  // POST create event (HoC / Admin)
  app.post('/api/events', (req: Request, res: Response) => {
    const {
      title,
      eventType = 'TOURNAMENT',
      description,
      rewardXp = 250,
      scheduledDate,
      targetRank = 'ALL',
      targetRole = 'ALL',
      createdBy = 'Academy Command',
      broadcastPush = true
    } = req.body;

    if (!title || !description || !scheduledDate) {
      return res.status(400).json({ error: 'Event title, description, and scheduled date are required.' });
    }

    const newEvent: AcademyEvent = {
      id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      eventType,
      description: description.trim(),
      rewardXp: Math.max(0, Math.floor(Number(rewardXp) || 0)),
      scheduledDate: scheduledDate.trim(),
      targetRank,
      targetRole,
      createdBy,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    dbEvents.unshift(newEvent);

    // Optionally broadcast notification to all devices
    if (broadcastPush) {
      const eventNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        recipientXnId: 'ALL',
        title: `EVENT: ${newEvent.title}`,
        message: `${newEvent.eventType} scheduled for ${newEvent.scheduledDate}. Reward: +${newEvent.rewardXp} XP. ${newEvent.description}`,
        type: 'event',
        priority: 'urgent',
        createdAt: new Date().toISOString(),
        read: false,
        linkView: 'operations',
        sender: createdBy
      };
      dbNotifications.unshift(eventNotif);
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ACADEMY_EVENT_PUBLISHED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `New event "${newEvent.title}" (${newEvent.eventType}, +${newEvent.rewardXp} XP) published by ${createdBy}. Scheduled for ${newEvent.scheduledDate}.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.status(201).json({
      message: `Event "${newEvent.title}" published to Academy Network.`,
      event: newEvent,
      auditLog: log
    });
  });

  // DELETE event
  app.delete('/api/events/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminUsername } = req.body;
    const eventIndex = dbEvents.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const deletedEvent = dbEvents[eventIndex];
    dbEvents.splice(eventIndex, 1);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ACADEMY_EVENT_CANCELLED',
      timestamp: new Date().toISOString(),
      actorType: 'admin',
      details: `Event "${deletedEvent.title}" cancelled by ${adminUsername || 'Command'}.`
    };
    dbAuditLogs.unshift(log);
    saveDatabase();

    res.json({
      message: `Event "${deletedEvent.title}" removed from schedule.`,
      event: deletedEvent,
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
