/**
 * Deriv integration layer.
 *
 * ---------------------------------------------------------------------
 * WHAT'S REAL vs MOCKED RIGHT NOW
 * ---------------------------------------------------------------------
 * - buildOAuthAuthorizeUrl(): real shape, needs your DERIV_APP_ID.
 * - Everything else (authorizeOAuthRedirect, getBalance,
 *   paymentAgentTransfer, paymentAgentWithdraw, transferBetweenAccounts)
 *   is MOCKED so the whole app is clickable end to end without live
 *   credentials. Each mock is written to match the real Deriv WebSocket
 *   API's request/response shape — swap the body for an actual
 *   `new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=...')` call
 *   and the rest of the app shouldn't need to change.
 *
 * ---------------------------------------------------------------------
 * GOING LIVE — in order
 * ---------------------------------------------------------------------
 * 1. Register an app at api.deriv.com/dashboard to get DERIV_APP_ID and
 *    set the OAuth redirect URI to your deployed
 *    /api/auth/deriv/callback URL.
 * 2. Apply for Payment Agent status on the account that will hold
 *    DERIV_PA_API_TOKEN (Deriv > Cashier > Payment Agent, or email
 *    businesspartners@deriv.com). Approval requires a verified account
 *    with a minimum balance that varies by country — confirm the current
 *    figure with Deriv, don't assume the historical ~$2,000 figure still
 *    holds.
 * 3. paymentAgentTransfer/paymentAgentWithdraw only work once that
 *    account is approved — Deriv rejects the calls otherwise.
 * 4. Request the minimum OAuth scope for linked client accounts: `read`
 *    (balance) + `payments` (authorize withdrawals). Do not request
 *    `trade` or `admin` — Xpay never needs them, and a narrower token is
 *    less damage if it ever leaks.
 * 5. Verify oauth.deriv.com is still the current OAuth host and
 *    wss://ws.derivws.com/websockets/v3 the current API host against
 *    developers.deriv.com — these are stable but not contractually
 *    fixed.
 */

import type { Env } from "./db";

export function buildOAuthAuthorizeUrl(env: Env, state: string): string {
  const url = new URL("https://oauth.deriv.com/oauth2/authorize");
  url.searchParams.set("app_id", env.DERIV_APP_ID);
  url.searchParams.set("redirect_uri", env.DERIV_OAUTH_REDIRECT_URI);
  url.searchParams.set("state", state);
  return url.toString();
}

export interface DerivOAuthAccount {
  loginid: string;
  token: string;
  currency: string;
}

/** Deriv appends acct1/token1/cur1, acct2/token2/cur2, ... per linked account. */
export function parseOAuthRedirectAccounts(url: URL): DerivOAuthAccount[] {
  const accounts: DerivOAuthAccount[] = [];
  for (let i = 1; url.searchParams.has(`acct${i}`); i++) {
    accounts.push({
      loginid: url.searchParams.get(`acct${i}`)!,
      token: url.searchParams.get(`token${i}`)!,
      currency: url.searchParams.get(`cur${i}`) ?? "USD",
    });
  }
  return accounts;
}

export interface DerivProfile {
  loginid: string;
  email: string;
  fullName: string | null;
}

/**
 * MOCK. Real version: open the WS API, send `{ authorize: token }`, read
 * back the account's email/fullname/loginid from the response.
 */
export async function authorizeOAuthRedirect(account: DerivOAuthAccount): Promise<DerivProfile> {
  return { loginid: account.loginid, email: "", fullName: null };
}

/** MOCK. Real version: `{ balance: 1, subscribe: 0 }` over the authorized WS connection. */
export async function getBalance(_encryptedToken: string): Promise<{ amount: number; currency: string }> {
  return { amount: 0, currency: "USD" };
}

/**
 * MOCK. Real version: called with the Payment Agent's own token (not the
 * client's) — `{ paymentagent_transfer: 1, transfer_to: clientLoginId,
 * amount, currency, description }`. Only works once DERIV_PA_API_TOKEN's
 * account is an approved Payment Agent.
 */
export async function paymentAgentTransfer(_args: {
  clientLoginId: string;
  amount: number;
  currency: string;
}): Promise<{ transferId: string }> {
  return { transferId: `mock_pa_transfer_${crypto.randomUUID()}` };
}

/**
 * MOCK. Real version: called with the *client's* authorized token —
 * `{ paymentagent_withdraw: 1, paymentagent_loginid: PA_LOGINID, amount,
 * currency }`. This is what actually needs the client's `payments`-scoped
 * OAuth token from onboarding.
 */
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
