import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL env var. Set it to your Neon connection string before starting the server.');
  process.exit(1);
}

// Neon requires SSL; rejectUnauthorized:false is standard for Neon's
// pooled connection string (it presents a cert Node's default CA
// bundle sometimes doesn't chain cleanly, this is Neon's documented
// recommendation for serverless/node-postgres clients).
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function initSchema() {
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
  `);
}
