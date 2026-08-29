import express, { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { pool, initSchema } from './db.js';

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
  currentRank: RankTier;
  peakRank: RankTier;
  totalXp: number;
  academyStatus: 'Cadet' | 'Member' | 'Senior Specialist' | 'Elite Operative' | 'Vanguard Legend';
  verificationStatus: 'Unverified' | 'Verified' | 'Official Vanguard';
  joinedAt: string;
  lifetimeStats: LifetimeStats;
}

function rowToPlayer(r: any): Player {
  return {
    id: r.id,
    xnId: r.xn_id,
    username: r.username,
    email: r.email,
    displayName: r.display_name,
    ign: r.ign,
    role: r.role,
    country: r.country ?? undefined,
    bio: r.bio ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    currentRank: r.current_rank,
    peakRank: r.peak_rank,
    totalXp: r.total_xp,
    academyStatus: r.academy_status,
    verificationStatus: r.verification_status,
    joinedAt: r.joined_at instanceof Date ? r.joined_at.toISOString() : r.joined_at,
    lifetimeStats: r.lifetime_stats,
  };
}
function rowToSubmission(r: any) {
  return {
    id: r.id,
    xnId: r.xn_id,
    playerName: r.player_name,
    playerIgn: r.player_ign,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    status: r.status,
    stats: r.stats,
    evidenceUrl: r.evidence_url ?? undefined,
    fraudFlags: r.fraud_flags,
    scoreBreakdown: r.score_breakdown,
    rejectionReason: r.rejection_reason ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
    reviewedAt: r.reviewed_at ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : r.reviewed_at) : undefined,
  };
}
function rowToLog(r: any) {
  return {
    id: r.id,
    action: r.action,
    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
    actorType: r.actor_type,
    details: r.details,
  };
}
function rowToSafeAdmin(r: any) {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    displayName: r.display_name,
    role: r.role,
    isHeadOfCommand: r.is_head_of_command,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}
function rowToSafeRequest(r: any) {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    displayName: r.display_name,
    reason: r.reason,
    status: r.status,
    requestedAt: r.requested_at instanceof Date ? r.requested_at.toISOString() : r.requested_at,
    reviewedAt: r.reviewed_at ? (r.reviewed_at instanceof Date ? r.reviewed_at.toISOString() : r.reviewed_at) : undefined,
    reviewedBy: r.reviewed_by ?? undefined,
  };
}

function calculateRank(xp: number): RankTier {
  if (xp >= 2000) return 'S-MAX';
  if (xp >= 1500) return 'S';
  if (xp >= 1000) return 'A';
  if (xp >= 700) return 'B';
  if (xp >= 500) return 'C';
  if (xp >= 300) return 'D';
  return 'E';
}
const RANK_ORDER: RankTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'S-MAX'];
function higherRank(a: RankTier, b: RankTier): RankTier {
  return RANK_ORDER.indexOf(a) >= RANK_ORDER.indexOf(b) ? a : b;
}

function calculateSubmissionScore(stats: any) {
  const killsXp = (stats.kills || 0) * 5;
  const winBonus = (stats.wins || 0) * 25;
  const kdBonus = Math.round(Math.min(stats.kd || 0, 15) * 15);
  const hsBonus = Math.round((stats.hs || 0) * 0.5);
  const total = killsXp + winBonus + kdBonus + hsBonus;
  return { killsXp, winBonus, kdBonus, hsBonus, total };
}

async function nextXnId(): Promise<string> {
  const { rows } = await pool.query('SELECT xn_id FROM players');
  const nums = rows.map((r: any) => {
    const m = String(r.xn_id).match(/XN-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(0, ...nums) : 0;
  return `XN-${(max + 1).toString().padStart(3, '0')}`;
}

async function logEvent(action: string, actorType: 'admin' | 'system', details: string) {
  const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await pool.query(
    'INSERT INTO audit_logs (id, action, actor_type, details) VALUES ($1,$2,$3,$4)',
    [id, action, actorType, details]
  );
  const { rows } = await pool.query('SELECT * FROM audit_logs WHERE id=$1', [id]);
  return rowToLog(rows[0]);
}

// ---- admin session tokens ----
// The app has no server-verifiable admin identity otherwise (the
// frontend previously just trusted a value in localStorage), so every
// mutating admin action below is gated behind one of these.
import crypto from 'crypto';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

async function createAdminSession(adminId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query('INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES ($1,$2,$3)', [token, adminId, expiresAt]);
  return token;
}

async function requireAdmin(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing admin session token' });
  const { rows } = await pool.query('SELECT * FROM admin_sessions WHERE token=$1', [token]);
  const session = rows[0];
  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: 'Admin session is invalid or has expired. Please log in again.' });
  }
  (req as any).adminId = session.admin_id;
  next();
}

async function startServer() {
  await initSchema();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const p = await pool.query('SELECT COUNT(*)::int AS c FROM players');
      const s = await pool.query('SELECT COUNT(*)::int AS c FROM submissions');
      res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0-db', totalPlayers: p.rows[0].c, totalSubmissions: s.rows[0].c });
    } catch (e) {
      res.status(500).json({ status: 'error', error: 'Database unreachable' });
    }
  });

  app.get('/api/players', async (req: Request, res: Response) => {
    const { role, rank, sort } = req.query;
    const clauses: string[] = [];
    const params: any[] = [];
    if (role && role !== 'ALL') { params.push(role); clauses.push(`role = $${params.length}`); }
    if (rank && rank !== 'ALL') { params.push(rank); clauses.push(`current_rank = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    let orderBy = 'total_xp DESC';
    if (sort === 'kd') orderBy = "(lifetime_stats->>'kd')::float DESC";
    else if (sort === 'wins') orderBy = "(lifetime_stats->>'wins')::float DESC";
    else if (sort === 'winRate') orderBy = "(lifetime_stats->>'winRate')::float DESC";
    const { rows } = await pool.query(`SELECT * FROM players ${where} ORDER BY ${orderBy}`, params);
    const list = rows.map(rowToPlayer);
    res.json({ players: list, count: list.length });
  });

  app.get('/api/players/:identifier', async (req: Request, res: Response) => {
    const clean = req.params.identifier.toLowerCase();
    const { rows } = await pool.query(
      `SELECT * FROM players WHERE lower(xn_id)=$1 OR lower(id)=$1 OR lower(username)=$1 OR lower(ign)=$1`,
      [clean]
    );
    if (!rows.length) return res.status(404).json({ error: 'Player not found' });
    res.json({ player: rowToPlayer(rows[0]) });
  });

  app.post('/api/players/register', async (req: Request, res: Response) => {
    const { username, email, password, displayName, ign, role, country, bio, avatarUrl } = req.body;
    if (!username || !displayName || !ign || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await pool.query('SELECT 1 FROM players WHERE lower(username)=$1', [String(username).trim().toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Username already registered' });

    const xnId = await nextXnId();
    const id = `p-${Date.now()}`;
    const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;
    const lifetimeStats: LifetimeStats = { kills: 0, wins: 0, matches: 0, kd: 0, winRate: 0, hs: 0 };

    await pool.query(
      `INSERT INTO players (id, xn_id, username, email, display_name, ign, role, country, bio, avatar_url, password_hash, current_rank, peak_rank, total_xp, academy_status, verification_status, lifetime_stats)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'E','E',50,'Cadet','Verified',$12)`,
      [
        id, xnId, String(username).trim(),
        email ? String(email).trim() : `${String(username).trim()}@xn-academy.gg`,
        String(displayName).trim(), String(ign).trim().toUpperCase(), role,
        country ? String(country).trim() : 'Global',
        bio ? String(bio).trim() : 'Verified recruit of the XN Academy competitive network.',
        avatarUrl || null, passwordHash, JSON.stringify(lifetimeStats),
      ]
    );

    const { rows } = await pool.query('SELECT * FROM players WHERE id=$1', [id]);
    const player = rowToPlayer(rows[0]);
    const log = await logEvent('OPERATIVE_REGISTERED', 'system', `New account assigned official permanent identifier: ${xnId} (${player.displayName})`);
    res.status(201).json({ player, auditLog: log });
  });

  app.post('/api/players/login', async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier is required' });
    const clean = String(identifier).trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT * FROM players WHERE lower(xn_id)=$1 OR lower(username)=$1 OR lower(email)=$1 OR lower(ign)=$1`,
      [clean]
    );
    if (!rows.length) return res.status(404).json({ error: 'Operative not found with provided identifier' });
    const row = rows[0];
    if (row.password_hash && password !== undefined) {
      const ok = await bcrypt.compare(String(password), row.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid operative clearance password' });
    }
    res.json({ player: rowToPlayer(row), message: 'Authentication successful' });
  });

  app.put('/api/players/:xnId', async (req: Request, res: Response) => {
    const { xnId } = req.params;
    const { rows } = await pool.query('SELECT * FROM players WHERE lower(xn_id)=$1', [xnId.toLowerCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Player not found' });
    const current = rows[0];
    const { displayName, ign, role, country, bio, avatarUrl } = req.body;

    await pool.query(
      `UPDATE players SET display_name=$1, ign=$2, role=$3, country=$4, bio=$5, avatar_url=$6 WHERE id=$7`,
      [
        displayName ? String(displayName).trim() : current.display_name,
        ign ? String(ign).trim().toUpperCase() : current.ign,
        role || current.role,
        country !== undefined ? String(country).trim() : current.country,
        bio !== undefined ? String(bio).trim() : current.bio,
        avatarUrl !== undefined ? avatarUrl : current.avatar_url,
        current.id,
      ]
    );
    const { rows: updated } = await pool.query('SELECT * FROM players WHERE id=$1', [current.id]);
    res.json({ player: rowToPlayer(updated[0]) });
  });

  app.get('/api/submissions', async (req: Request, res: Response) => {
    const { status, xnId } = req.query;
    const clauses: string[] = [];
    const params: any[] = [];
    if (status && status !== 'ALL') { params.push(status); clauses.push(`status = $${params.length}`); }
    if (xnId) { params.push(String(xnId).toLowerCase()); clauses.push(`lower(xn_id) = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM submissions ${where} ORDER BY created_at DESC`, params);
    const list = rows.map(rowToSubmission);
    res.json({ submissions: list, count: list.length });
  });

  app.post('/api/submissions', async (req: Request, res: Response) => {
    const { xnId, stats, evidenceUrl } = req.body;
    const safeStats = stats || { kills: 0, wins: 0, matches: 1, kd: 0, winRate: 0, hs: 0 };

    const { rows: playerRows } = await pool.query('SELECT * FROM players WHERE lower(xn_id)=$1', [(xnId || '').toLowerCase()]);
    const player = playerRows[0] ? rowToPlayer(playerRows[0]) : null;
    const playerName = player ? player.displayName : (req.body.playerName || 'Recruit Operative');
    const playerIgn = player ? player.ign : (req.body.playerIgn || 'OPERATIVE');

    const score = calculateSubmissionScore(safeStats);
    const fraudFlags: string[] = [];
    if (safeStats.kd > 12.0) fraudFlags.push('Extreme K/D Anomaly (>12.0)');
    if (safeStats.hs > 85.0) fraudFlags.push('Abnormal Headshot Ratio (>85%)');
    if (safeStats.winRate > 95 && safeStats.matches > 5) fraudFlags.push('Unusually High Win Rate (>95%)');

    const id = `sub-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = fraudFlags.length > 0 ? 'flagged' : 'pending';
    const finalXnId = xnId || (player ? player.xnId : 'XN-UNKNOWN');

    await pool.query(
      `INSERT INTO submissions (id, xn_id, player_name, player_ign, status, stats, evidence_url, fraud_flags, score_breakdown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, finalXnId, playerName, playerIgn, status, JSON.stringify(safeStats), evidenceUrl || null, JSON.stringify(fraudFlags), JSON.stringify(score)]
    );
    const { rows } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    const submission = rowToSubmission(rows[0]);

    const log = await logEvent(
      fraudFlags.length > 0 ? 'SITREP_FLAGGED' : 'SITREP_SUBMITTED',
      'system',
      `${id} from ${playerName} (${finalXnId}) queued for review.${fraudFlags.length ? ` Flags: ${fraudFlags.join(', ')}` : ''}`
    );
    res.status(201).json({ submission, auditLog: log });
  });

  app.post('/api/submissions/:id/approve', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Submission not found' });
    const sub = rowToSubmission(rows[0]);
    if (sub.status === 'approved') return res.status(400).json({ error: 'Submission is already approved' });

    const awardedXp = sub.scoreBreakdown.total;
    await pool.query(`UPDATE submissions SET status='approved', reviewed_by='Admin_Lead', reviewed_at=now() WHERE id=$1`, [id]);
    const { rows: updatedSubRows } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    const updatedSub = rowToSubmission(updatedSubRows[0]);

    let updatedPlayer = null;
    const { rows: playerRows } = await pool.query('SELECT * FROM players WHERE xn_id=$1', [sub.xnId]);
    if (playerRows.length) {
      const target = rowToPlayer(playerRows[0]);
      const newTotalXp = target.totalXp + awardedXp;
      const newRank = calculateRank(newTotalXp);
      const peak = higherRank(newRank, target.peakRank);

      const totalMatches = target.lifetimeStats.matches + sub.stats.matches;
      const totalWins = target.lifetimeStats.wins + sub.stats.wins;
      const totalKills = target.lifetimeStats.kills + sub.stats.kills;
      const updatedKd = totalMatches > 0 ? parseFloat((totalKills / Math.max(1, totalMatches * 0.8)).toFixed(2)) : sub.stats.kd;
      const updatedWinRate = totalMatches > 0 ? parseFloat(((totalWins / totalMatches) * 100).toFixed(1)) : sub.stats.winRate;
      const updatedHs = parseFloat(((target.lifetimeStats.hs + sub.stats.hs) / 2).toFixed(1));
      const newStats: LifetimeStats = { kills: totalKills, wins: totalWins, matches: totalMatches, kd: updatedKd, winRate: updatedWinRate, hs: updatedHs };

      await pool.query(
        `UPDATE players SET total_xp=$1, current_rank=$2, peak_rank=$3, lifetime_stats=$4 WHERE xn_id=$5`,
        [newTotalXp, newRank, peak, JSON.stringify(newStats), sub.xnId]
      );
      const { rows: freshPlayer } = await pool.query('SELECT * FROM players WHERE xn_id=$1', [sub.xnId]);
      updatedPlayer = rowToPlayer(freshPlayer[0]);
    }

    const log = await logEvent('SUBMISSION_APPROVED', 'admin', `${sub.id} (${sub.playerName}) approved. +${awardedXp} XP awarded.`);
    res.json({ submission: updatedSub, player: updatedPlayer, auditLog: log });
  });

  app.post('/api/submissions/:id/flag', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Submission not found' });
    await pool.query(`UPDATE submissions SET status='flagged' WHERE id=$1`, [id]);
    const { rows: updated } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    const log = await logEvent('SUBMISSION_FLAGGED', 'admin', `Submission ${id} placed on hold for anti-cheat verification.`);
    res.json({ submission: rowToSubmission(updated[0]), auditLog: log });
  });

  app.post('/api/submissions/:id/reject', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const { rows } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Submission not found' });
    const rejectionReason = reason || 'Screenshot telemetry or resolution verification failed';
    await pool.query(
      `UPDATE submissions SET status='rejected', rejection_reason=$1, reviewed_by='Admin_Lead', reviewed_at=now() WHERE id=$2`,
      [rejectionReason, id]
    );
    const { rows: updated } = await pool.query('SELECT * FROM submissions WHERE id=$1', [id]);
    const log = await logEvent('SUBMISSION_REJECTED', 'admin', `Submission ${id} rejected. Reason: ${rejectionReason}`);
    res.json({ submission: rowToSubmission(updated[0]), auditLog: log });
  });

  app.get('/api/audit-logs', async (req: Request, res: Response) => {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');
    res.json({ auditLogs: rows.map(rowToLog) });
  });

  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    const totalPlayers = (await pool.query('SELECT COUNT(*)::int c FROM players')).rows[0].c;
    const activePlayers = (await pool.query(`SELECT COUNT(*)::int c FROM players WHERE (lifetime_stats->>'matches')::int > 0`)).rows[0].c;
    const pendingSubmissions = (await pool.query(`SELECT COUNT(*)::int c FROM submissions WHERE status='pending'`)).rows[0].c;
    const flaggedSubmissions = (await pool.query(`SELECT COUNT(*)::int c FROM submissions WHERE status='flagged'`)).rows[0].c;
    const approvedSubmissions = (await pool.query(`SELECT COUNT(*)::int c FROM submissions WHERE status='approved'`)).rows[0].c;
    const rejectedSubmissions = (await pool.query(`SELECT COUNT(*)::int c FROM submissions WHERE status='rejected'`)).rows[0].c;
    const totalXpAwarded = (await pool.query(`SELECT COALESCE(SUM((score_breakdown->>'total')::int),0)::int s FROM submissions WHERE status='approved'`)).rows[0].s;
    res.json({ totalPlayers, activePlayers, pendingSubmissions, flaggedSubmissions, approvedSubmissions, rejectedSubmissions, totalXpAwarded });
  });

  app.get('/api/admin/status', async (req: Request, res: Response) => {
    const totalAdmins = (await pool.query('SELECT COUNT(*)::int c FROM admins')).rows[0].c;
    const pendingRequestsCount = (await pool.query(`SELECT COUNT(*)::int c FROM admin_requests WHERE status='pending'`)).rows[0].c;
    res.json({ hasInitialAdmin: totalAdmins > 0, totalAdmins, pendingRequestsCount });
  });

  app.post('/api/admin/bootstrap', async (req: Request, res: Response) => {
    const count = (await pool.query('SELECT COUNT(*)::int c FROM admins')).rows[0].c;
    if (count > 0) {
      return res.status(403).json({ error: 'Initial Head of Command has already been provisioned. New admin applicants must submit a clearance request for review.' });
    }
    const { username, email, password, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, display name, and password are required' });
    }
    const id = `admin-${Date.now()}`;
    const passwordHash = await bcrypt.hash(String(password), 10);
    await pool.query(
      `INSERT INTO admins (id, username, email, display_name, password_hash, role, is_head_of_command) VALUES ($1,$2,$3,$4,$5,'HEAD_OF_COMMAND',true)`,
      [id, String(username).trim(), email ? String(email).trim() : `${String(username).trim()}@xn-academy.gg`, String(displayName).trim(), passwordHash]
    );
    const { rows } = await pool.query('SELECT * FROM admins WHERE id=$1', [id]);
    const admin = rowToSafeAdmin(rows[0]);
    const token = await createAdminSession(admin.id);
    const log = await logEvent('HEAD_OF_COMMAND_PROVISIONED', 'admin', `Head of Command clearance assigned to ${admin.displayName} (${admin.username}). Admin direct registration is now permanently locked.`);
    res.status(201).json({ message: 'Head of Command profile initialized successfully.', admin, token, auditLog: log });
  });

  app.post('/api/admin/request-access', async (req: Request, res: Response) => {
    const { username, email, password, displayName, reason } = req.body;
    if (!username || !password || !displayName) return res.status(400).json({ error: 'Missing required credentials' });

    const clean = String(username).trim().toLowerCase();
    const existingAdmin = await pool.query('SELECT 1 FROM admins WHERE lower(username)=$1', [clean]);
    if (existingAdmin.rows.length) return res.status(409).json({ error: 'An admin account with this username already exists' });
    const existingReq = await pool.query(`SELECT 1 FROM admin_requests WHERE lower(username)=$1 AND status='pending'`, [clean]);
    if (existingReq.rows.length) return res.status(409).json({ error: 'A clearance request for this username is already pending review' });

    const id = `req-${Date.now()}`;
    const passwordHash = await bcrypt.hash(String(password), 10);
    await pool.query(
      `INSERT INTO admin_requests (id, username, email, display_name, password_hash, reason, status) VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [
        id, String(username).trim(),
        email ? String(email).trim() : `${String(username).trim()}@xn-academy.gg`,
        String(displayName).trim(), passwordHash,
        reason ? String(reason).trim() : 'Competitive staff supervisor & telemetry audit officer application.',
      ]
    );
    const { rows } = await pool.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    const safeReq = rowToSafeRequest(rows[0]);
    await logEvent('ADMIN_CLEARANCE_REQUESTED', 'system', `Staff clearance application submitted by ${safeReq.displayName} (@${safeReq.username}). Pending Head of Command review.`);
    res.status(201).json({ message: 'Clearance application submitted. Awaiting Head of Command approval.', request: safeReq });
  });

  app.post('/api/admin/login', async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Username/Email and password are required' });
    const clean = String(identifier).trim().toLowerCase();

    const { rows } = await pool.query('SELECT * FROM admins WHERE lower(username)=$1 OR lower(email)=$1', [clean]);
    if (!rows.length) {
      const { rows: pendingRows } = await pool.query(
        `SELECT * FROM admin_requests WHERE (lower(username)=$1 OR lower(email)=$1) ORDER BY requested_at DESC LIMIT 1`,
        [clean]
      );
      const pending = pendingRows[0];
      if (pending && pending.status === 'pending') {
        return res.status(403).json({ error: 'Your staff clearance request is currently PENDING approval by the Head of Command.' });
      }
      if (pending && pending.status === 'rejected') {
        return res.status(403).json({ error: 'Your staff clearance request was rejected by administration.' });
      }
      return res.status(404).json({ error: 'No authorized staff account found with provided credentials' });
    }
    const admin = rows[0];
    const ok = await bcrypt.compare(String(password), admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid security clearance passkey' });
    const token = await createAdminSession(admin.id);
    res.json({ admin: rowToSafeAdmin(admin), token, message: 'Staff clearance validated. Welcome to Command Console.' });
  });

  app.get('/api/admin/requests', requireAdmin, async (req: Request, res: Response) => {
    const { rows } = await pool.query('SELECT * FROM admin_requests ORDER BY requested_at DESC');
    res.json({ requests: rows.map(rowToSafeRequest) });
  });

  app.post('/api/admin/requests/:id/approve', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Clearance request not found' });
    const targetReq = rows[0];
    if (targetReq.status === 'approved') return res.status(400).json({ error: 'Request is already approved' });

    await pool.query(`UPDATE admin_requests SET status='approved', reviewed_at=now(), reviewed_by='Head of Command' WHERE id=$1`, [id]);
    const adminId = `admin-${Date.now()}`;
    await pool.query(
      `INSERT INTO admins (id, username, email, display_name, password_hash, role, is_head_of_command) VALUES ($1,$2,$3,$4,$5,'STAFF_OFFICER',false)`,
      [adminId, targetReq.username, targetReq.email, targetReq.display_name, targetReq.password_hash]
    );
    const { rows: updatedReq } = await pool.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    const { rows: newAdminRows } = await pool.query('SELECT * FROM admins WHERE id=$1', [adminId]);
    const log = await logEvent('ADMIN_CLEARANCE_APPROVED', 'admin', `Staff clearance approved for ${targetReq.display_name} (@${targetReq.username}). Officer role granted.`);
    res.json({
      message: `Staff clearance approved for ${targetReq.display_name}`,
      request: rowToSafeRequest(updatedReq[0]),
      newAdmin: rowToSafeAdmin(newAdminRows[0]),
      auditLog: log,
    });
  });

  app.post('/api/admin/requests/:id/reject', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Clearance request not found' });
    await pool.query(`UPDATE admin_requests SET status='rejected', reviewed_at=now(), reviewed_by='Head of Command' WHERE id=$1`, [id]);
    const { rows: updated } = await pool.query('SELECT * FROM admin_requests WHERE id=$1', [id]);
    res.json({ message: 'Request rejected', request: rowToSafeRequest(updated[0]) });
  });

  app.get('/api/admin/list', requireAdmin, async (req: Request, res: Response) => {
    const { rows } = await pool.query('SELECT * FROM admins ORDER BY created_at ASC');
    res.json({ admins: rows.map(rowToSafeAdmin) });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XN Academy Backend] Server listening on http://0.0.0.0:${PORT} (Postgres-backed)`);
  });
}

startServer();
