// Postgres pool + tiny query helper. Graceful "no DATABASE_URL" mode so
// the app still runs (in demo state) without a database attached.

import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Railway's managed Postgres uses TLS; allow self-signed.
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on('error', (err) => console.error('[db] pool error', err));
  console.log('[db] pool ready');
} else {
  console.warn('[db] DATABASE_URL not set — auth and persistent API keys disabled.');
}

export const dbAvailable = () => !!pool;

export async function query(sql, params = []) {
  if (!pool) throw new Error('Database not configured');
  const r = await pool.query(sql, params);
  return r.rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Best-effort liveness check used by /api/health.
export async function ping() {
  if (!pool) return { ok: false, reason: 'no DATABASE_URL' };
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export { pool };
