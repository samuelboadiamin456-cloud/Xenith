import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// Optional PostgreSQL pool for Neon/Cloud environments
export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  : null;

export async function initSchema() {
  if (!pool) {
    console.log('[Storage] DATABASE_URL not set; running on persistent file/memory database storage.');
    return;
  }

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
      reviewed_at TIMESTAMPTZ
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
  `);
}
