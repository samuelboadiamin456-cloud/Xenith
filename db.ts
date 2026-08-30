import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// PostgreSQL pool for Neon environments
export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('[Neon DB] Unexpected pool error on idle client:', err);
  });
}

export async function initSchema(): Promise<boolean> {
  if (!pool) {
    console.log('[Storage] DATABASE_URL not set; running on local file database storage.');
    return false;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        xn_id TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        ign TEXT NOT NULL,
        role TEXT NOT NULL,
        country TEXT,
        bio TEXT,
        avatar_url TEXT,
        password_hash TEXT,
        current_rank TEXT NOT NULL,
        peak_rank TEXT NOT NULL,
        total_xp INTEGER NOT NULL DEFAULT 0,
        academy_status TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        lifetime_stats JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        xn_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        player_ign TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        status TEXT NOT NULL,
        stats JSONB NOT NULL,
        evidence_url TEXT,
        fraud_flags JSONB NOT NULL DEFAULT '[]',
        score_breakdown JSONB NOT NULL,
        rejection_reason TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        discrepancy_report TEXT,
        admin_edited BOOLEAN DEFAULT false,
        admin_edited_note TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
        actor_type TEXT NOT NULL,
        details TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        is_head_of_command BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS admin_requests (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by TEXT
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_xn_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        read BOOLEAN NOT NULL DEFAULT false,
        link_view TEXT,
        sender TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS academy_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        reward_xp INTEGER NOT NULL DEFAULT 100,
        scheduled_date TEXT NOT NULL,
        target_rank TEXT NOT NULL DEFAULT 'ALL',
        target_role TEXT NOT NULL DEFAULT 'ALL',
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY DEFAULT 'main',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    console.log('[Neon DB] Schema verified and ready.');
    return true;
  } catch (err) {
    console.error('[Neon DB] Schema initialization error:', err);
    return false;
  }
}

export async function loadAppStateFromNeon(): Promise<any | null> {
  if (!pool) return null;
  try {
    const res = await pool.query(`SELECT data FROM app_state WHERE id = 'main' LIMIT 1;`);
    if (res.rows.length > 0 && res.rows[0].data) {
      console.log('[Neon DB] Successfully loaded persistent state from Neon PostgreSQL.');
      return res.rows[0].data;
    }
    return null;
  } catch (err) {
    console.error('[Neon DB] Error loading app_state from Neon:', err);
    return null;
  }
}

let saveDebounceTimer: NodeJS.Timeout | null = null;
let pendingSaveData: any = null;

export async function saveAppStateToNeon(data: any): Promise<void> {
  if (!pool) return;

  pendingSaveData = data;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(async () => {
    const currentData = pendingSaveData;
    if (!currentData) return;

    try {
      await pool.query(
        `INSERT INTO app_state (id, data, updated_at) 
         VALUES ('main', $1, now()) 
         ON CONFLICT (id) 
         DO UPDATE SET data = $1, updated_at = now();`,
        [JSON.stringify(currentData)]
      );
      console.log(`[Neon DB] Saved latest state to Neon at ${new Date().toISOString()}`);
    } catch (err) {
      console.error('[Neon DB] Error saving app_state to Neon:', err);
    }
  }, 300); // 300ms debounce to batch rapid writes
}

export async function checkNeonHealth(): Promise<{
  connected: boolean;
  provider: string;
  error?: string;
  serverTime?: string;
}> {
  if (!pool) {
    return { connected: false, provider: 'local_file' };
  }
  try {
    const res = await pool.query('SELECT NOW() as now;');
    return {
      connected: true,
      provider: 'neon_postgresql',
      serverTime: res.rows[0]?.now
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'neon_postgresql',
      error: err.message
    };
  }
}
