-- Xpay — D1 schema.
-- Apply with: wrangler d1 execute xpay-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  deriv_loginid      TEXT UNIQUE NOT NULL,   -- e.g. "CR12345678" from Deriv OAuth
  client_nickname    TEXT NOT NULL,          -- display-safe id shown in the UI, e.g. "client_96c2a0a62"

  -- SECURITY: this token can move real money via paymentagent_withdraw once
  -- an account is an approved Payment Agent. It must be encrypted at rest
  -- (e.g. AES-GCM with a key kept in a Workers secret / Secrets Store, not
  -- this column in the clear) and requested with the minimum viable OAuth
  -- scope (read + payments — never trade or admin). See README.md.
  deriv_oauth_token_encrypted TEXT,

  name               TEXT,
  country            TEXT,
  deriv_email        TEXT,
  phone              TEXT,
  provider           TEXT CHECK (provider IN ('mpesa', 'airtel')),
  password_hash      TEXT,                   -- PBKDF2, see functions/api/lib/session.ts

  onboarding_step    TEXT NOT NULL DEFAULT 'profile'
                        CHECK (onboarding_step IN ('profile', 'mpesa', 'password', 'complete')),

  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount              REAL NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'failed')),

  -- Reconciliation keys — every real transfer must be traceable on both legs.
  mpesa_receipt       TEXT,   -- Safaricom's transaction receipt / checkout request ID
  deriv_transfer_id   TEXT,   -- paymentagent_transfer / paymentagent_withdraw reference

  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
