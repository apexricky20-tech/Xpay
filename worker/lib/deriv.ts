/**
 * Deriv integration layer.
 *
 * ---------------------------------------------------------------------
 * WHAT'S REAL vs MOCKED RIGHT NOW
 * ---------------------------------------------------------------------
 * - The OAuth login flow (buildAuthorizeUrl, PKCE helpers,
 *   exchangeCodeForToken, getAccounts) is REAL, built against Deriv's
 *   current documented flow at developers.deriv.com/docs/intro/oauth/ —
 *   response_type=code + PKCE, not the older token-in-redirect style.
 * - getBalance, paymentAgentTransfer, paymentAgentWithdraw,
 *   transferBetweenAccounts are still MOCKED. Deriv's docs now list a
 *   dedicated, REST-style "Payment Agent" section (List/Get payment
 *   agents, Transfer, Withdraw, Withdrawal status, etc. under
 *   api.derivws.com) that looks meaningfully different from the older
 *   WebSocket paymentagent_transfer/paymentagent_withdraw calls these
 *   mocks were originally written against — re-verify that section
 *   against the live docs before wiring these for real, the same way
 *   the OAuth flow just was.
 *
 * ---------------------------------------------------------------------
 * GOING LIVE — in order
 * ---------------------------------------------------------------------
 * 1. Register an app at developers.deriv.com/dashboard to get
 *    DERIV_APP_ID (used as OAuth client_id) and set the Redirect URL to
 *    your deployed /api/auth/deriv/callback URL.
 * 2. Request scope "trade payment" — payment for the Payment Agent
 *    calls, trade because Deriv's own /trading/v1/options/accounts
 *    endpoint (used to discover the logged-in user's loginid) currently
 *    documents that scope as required, even though Xpay never places a
 *    trade itself.
 * 3. Apply for Payment Agent status on the account that will hold
 *    DERIV_PA_API_TOKEN. Approval requires a verified account with a
 *    minimum balance that varies by country — confirm the current
 *    figure with Deriv.
 * 4. Once approved, re-verify and implement the real Payment Agent
 *    transfer/withdraw calls per the note above, replacing the mocks.
 */

import type { Env } from "./db";

const AUTHORIZE_URL = "https://auth.deriv.com/oauth2/auth";
const TOKEN_URL = "https://auth.deriv.com/oauth2/token";
const ACCOUNTS_URL = "https://api.derivws.com/trading/v1/options/accounts";

// ---- PKCE ----

const PKCE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export function generateCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return Array.from(bytes, (b) => PKCE_CHARSET[b % PKCE_CHARSET.length]).join("");
}

function base64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(hash);
}

// ---- Step 2: authorization redirect ----

export function buildAuthorizeUrl(env: Env, state: string, codeChallenge: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.DERIV_APP_ID);
  url.searchParams.set("redirect_uri", env.DERIV_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", "trade payment");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ---- Step 4: code -> token exchange (server-side only) ----

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCodeForToken(env: Env, code: string, codeVerifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.DERIV_APP_ID,
    code,
    code_verifier: codeVerifier,
    redirect_uri: env.DERIV_OAUTH_REDIRECT_URI,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Deriv token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// ---- Account discovery ----
// NOTE: Deriv's token response doesn't include a loginid, so this is a
// separate lookup. The exact response shape wasn't fully documented at
// the point this was written — this parses defensively and throws
// (rather than silently guessing wrong) if it can't find a usable
// account, so a bad guess here is loud and fixable, not a silent bug.

export interface DerivAccount {
  loginid: string;
  email: string | null;
  fullName: string | null;
}

export async function getAccounts(env: Env, accessToken: string): Promise<DerivAccount> {
  const res = await fetch(ACCOUNTS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Deriv-App-ID": env.DERIV_APP_ID,
    },
  });

  if (!res.ok) {
    throw new Error(`Deriv accounts lookup failed: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const list: any[] = Array.isArray(data) ? data : data.accounts ?? data.data ?? [];
  const account = list[0];

  const loginid = account?.loginid ?? account?.account_id ?? account?.login_id ?? account?.id;
  if (!account || !loginid) {
    throw new Error(`Unrecognized Deriv accounts response shape: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return {
    loginid: String(loginid),
    email: account.email ?? null,
    fullName: account.full_name ?? account.fullname ?? account.name ?? null,
  };
}

/** MOCK. Real version: `{ balance: 1, subscribe: 0 }` over the authorized WS connection. */
export async function getBalance(_encryptedToken: string): Promise<{ amount: number; currency: string }> {
  return { amount: 0, currency: "USD" };
}

/**
 * MOCK. Only works once DERIV_PA_API_TOKEN's account is an approved
 * Payment Agent — see the note atop this file about re-verifying the
 * real call shape against Deriv's current Payment Agent docs first.
 */
export async function paymentAgentTransfer(_args: {
  clientLoginId: string;
  amount: number;
  currency: string;
}): Promise<{ transferId: string }> {
  return { transferId: `mock_pa_transfer_${crypto.randomUUID()}` };
}

/** MOCK. Same caveat as paymentAgentTransfer. */
export async function paymentAgentWithdraw(_args: {
  clientEncryptedToken: string;
  amount: number;
  currency: string;
}): Promise<{ transferId: string }> {
  return { transferId: `mock_pa_withdraw_${crypto.randomUUID()}` };
}

/** MOCK. Real version: `{ transfer_between_accounts: 1, ... }` on the client's token. */
export async function transferBetweenAccounts(_args: {
  clientEncryptedToken: string;
  amount: number;
}): Promise<{ transferId: string }> {
  return { transferId: `mock_transfer_${crypto.randomUUID()}` };
}

