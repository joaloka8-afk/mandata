// Authentication: registration, login, logout, current-user, session middleware.
// Uses server-side opaque sessions stored in the `sessions` table.
//
// Cookie: `mandata_sid`, HttpOnly + SameSite=Lax + Secure (in production).
//
// All endpoints return JSON. `requireAuth` middleware exposes `req.user`.

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { query, queryOne, dbAvailable } from './db.mjs';

const SESSION_COOKIE = 'mandata_sid';
const SESSION_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;

const isProd = process.env.NODE_ENV === 'production';

function newSessionId() {
  return randomBytes(32).toString('hex');
}

function setSessionCookie(res, sid, expiresAt) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    orgName: u.org_name,
    role: u.role,
    createdAt: u.created_at,
  };
}

async function logEvent(userId, action, meta, req) {
  if (!dbAvailable()) return;
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, meta, ip, user_agent)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [
        userId,
        action,
        JSON.stringify(meta || {}),
        req?.ip || null,
        req?.get('user-agent')?.slice(0, 400) || null,
      ],
    );
  } catch (e) {
    console.warn('[audit_log] insert failed', e.message);
  }
}

// --- Middleware: attach req.user if a valid session cookie is present.
export async function attachUser(req, _res, next) {
  if (!dbAvailable()) return next();
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid) return next();
  try {
    const row = await queryOne(
      `SELECT s.id AS sid, s.expires_at, u.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.id = $1
          AND s.expires_at > NOW()`,
      [sid],
    );
    if (row) {
      req.user = row;
      req.sessionId = row.sid;
    }
  } catch (e) {
    console.warn('[auth] session lookup failed', e.message);
  }
  next();
}

// Guard endpoints that require login.
export function requireAuth(req, res, next) {
  if (!dbAvailable()) return res.status(503).json({ error: 'Database not configured' });
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  next();
}

// Mount on `app.use('/api/auth', router)` from index.mjs.
export function mount(app) {
  // ----- POST /api/auth/register -----
  app.post('/api/auth/register', async (req, res) => {
    if (!dbAvailable()) return res.status(503).json({ error: 'Database not configured' });
    try {
      const { email, password, displayName, orgName } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });

      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
      if (existing) return res.status(409).json({ error: 'an account with this email already exists' });

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await queryOne(
        `INSERT INTO users (email, password_hash, display_name, org_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [email, passwordHash, displayName || null, orgName || null],
      );

      const sid = newSessionId();
      const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
      await query(
        `INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [sid, user.id, expires, req.get('user-agent')?.slice(0, 400) || null, req.ip],
      );
      setSessionCookie(res, sid, expires);
      await logEvent(user.id, 'auth.register', { email }, req);
      res.status(201).json({ user: publicUser(user) });
    } catch (e) {
      console.error('[auth] register', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ----- POST /api/auth/login -----
  app.post('/api/auth/login', async (req, res) => {
    if (!dbAvailable()) return res.status(503).json({ error: 'Database not configured' });
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });

      const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
      if (!user) {
        await logEvent(null, 'auth.login.failed', { email, reason: 'no-user' }, req);
        return res.status(401).json({ error: 'invalid email or password' });
      }
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        await logEvent(user.id, 'auth.login.failed', { reason: 'bad-password' }, req);
        return res.status(401).json({ error: 'invalid email or password' });
      }

      const sid = newSessionId();
      const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
      await query(
        `INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [sid, user.id, expires, req.get('user-agent')?.slice(0, 400) || null, req.ip],
      );
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
      setSessionCookie(res, sid, expires);
      await logEvent(user.id, 'auth.login', {}, req);
      res.json({ user: publicUser(user) });
    } catch (e) {
      console.error('[auth] login', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ----- POST /api/auth/logout -----
  app.post('/api/auth/logout', async (req, res) => {
    if (req.sessionId && dbAvailable()) {
      try {
        await query('DELETE FROM sessions WHERE id = $1', [req.sessionId]);
        await logEvent(req.user?.id, 'auth.logout', {}, req);
      } catch (e) {
        console.warn('[auth] logout cleanup', e.message);
      }
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // ----- GET /api/auth/me -----
  app.get('/api/auth/me', (req, res) => {
    res.json({ user: publicUser(req.user) || null });
  });
}

export { logEvent };
