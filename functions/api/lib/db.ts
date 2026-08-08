export interface Env {
  DB: D1Database;

  // Deriv OAuth app — see README.md "Setting up real credentials".
  DERIV_APP_ID: string;
  DERIV_OAUTH_REDIRECT_URI: string;

  // AES-GCM key (base64) used to encrypt deriv_oauth_token_encrypted at
  // rest. Generate with: openssl rand -base64 32
  TOKEN_ENCRYPTION_KEY: string;

  // Safaricom Daraja — production credentials, set once you're past sandbox.
  DARAJA_CONSUMER_KEY?: string;
  DARAJA_CONSUMER_SECRET?: string;
  DARAJA_SHORTCODE?: string;
  DARAJA_PASSKEY?: string;

  // Deriv Payment Agent — the app's own account, not a per-user token.
  DERIV_PA_API_TOKEN?: string;
}

export interface UserRow {
  id: string;
  deriv_loginid: string;
  client_nickname: string;
  deriv_oauth_token_encrypted: string | null;
  name: string | null;
  country: string | null;
  deriv_email: string | null;
  phone: string | null;
  provider: "mpesa" | "airtel" | null;
  password_hash: string | null;
  onboarding_step: "profile" | "mpesa" | "password" | "complete";
  created_at: string;
}

export async function getUserBySession(db: D1Database, token: string): Promise<UserRow | null> {
  const row = await db
    .prepare(
      `SELECT u.* FROM users u
       JOIN sessions s ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first<UserRow>();
  return row ?? null;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  const row = await db.prepare(`SELECT * FROM users WHERE deriv_email = ?`).bind(email).first<UserRow>();
  return row ?? null;
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  const row = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<UserRow>();
  return row ?? null;
}
