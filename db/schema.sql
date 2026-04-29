-- Mandata canonical schema (Postgres ≥ 13).
--
-- Apply with:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Idempotent — every CREATE uses IF NOT EXISTS so it's safe to re-run.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email column

-- =====================================================================
-- USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT       UNIQUE NOT NULL,
    password_hash   TEXT         NOT NULL,
    display_name    TEXT,
    org_name        TEXT,
    role            TEXT         NOT NULL DEFAULT 'member'
                                 CHECK (role IN ('admin', 'member')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

COMMENT ON TABLE users IS 'Mandata user accounts.';
COMMENT ON COLUMN users.password_hash IS 'bcryptjs hash, 12 rounds.';
COMMENT ON COLUMN users.role IS 'admin grants workspace-management actions; everyone is member by default.';

-- =====================================================================
-- SESSIONS
-- Server-side opaque-id sessions. The cookie carries `id`, the server
-- looks up the row to identify the user. Cookie is HttpOnly + Secure +
-- SameSite=Lax. Logout deletes the row.
-- =====================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT         PRIMARY KEY,        -- 32-byte hex
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ  NOT NULL,
    user_agent      TEXT,
    ip              INET
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

COMMENT ON TABLE sessions IS 'Active login sessions. Sweep expired rows with DELETE FROM sessions WHERE expires_at < NOW().';

-- =====================================================================
-- API KEYS
-- One row per key. The full key is shown to the user once on creation
-- and then never persisted — only its bcrypt hash + a short prefix
-- shown in the UI for identification.
-- =====================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL,
    prefix          TEXT         NOT NULL,           -- e.g. "mdt_live_AbCd"
    key_hash        TEXT         NOT NULL,           -- bcryptjs hash of full key
    rate_limit      TEXT         NOT NULL DEFAULT '100 RPS',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix  ON api_keys (prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active  ON api_keys (user_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE api_keys IS 'Per-user API keys. Hash-only at rest; prefix for UI identification.';

-- =====================================================================
-- AUDIT LOG
-- Append-only log of meaningful actions. Used by the Console to surface
-- "who did what" and is the source for the Chat page's "audit ledger"
-- footer.
-- =====================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT         NOT NULL,
    -- e.g. 'auth.register', 'auth.login', 'auth.logout',
    --      'key.create', 'key.revoke',
    --      'chat.query', 'corpus.search'
    meta            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    ip              INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id    ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);

COMMENT ON TABLE audit_log IS 'Append-only event log. Never UPDATE or DELETE except via retention sweeps.';

-- =====================================================================
-- CONVERSATIONS  (chat persistence — optional, used when the user is
-- logged in; anonymous users stay in localStorage on the client).
-- =====================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT         NOT NULL DEFAULT 'New conversation',
    model           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id_updated
    ON conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL    PRIMARY KEY,
    conversation_id UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT         NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT         NOT NULL,
    model           TEXT,
    family          TEXT,
    citations       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    usage           JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at);

COMMENT ON TABLE conversations IS 'Per-user chat sessions. Citations and usage are denormalised onto each message.';
