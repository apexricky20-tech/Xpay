import type { Env } from "../../lib/db";
import { getUserById } from "../../lib/db";
import { parseOAuthRedirectAccounts, authorizeOAuthRedirect } from "../../lib/deriv";
import { encryptToken } from "../../lib/crypto";
import { newSessionToken, sessionCookieHeader } from "../../lib/session";

function redirect(location: string, extraHeaders: Record<string, string> = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...extraHeaders } });
}

const STEP_PATH: Record<string, string> = {
  profile: "/complete-profile",
  mpesa: "/setup-mpesa",
  password: "/create-password",
  complete: "/dashboard",
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);

  // CSRF check: state param must match the cookie start.ts set.
  const cookie = request.headers.get("Cookie") ?? "";
  const stateCookie = cookie.match(/xpay_oauth_state=([^;]+)/)?.[1];
  const stateParam = url.searchParams.get("state");
  if (!stateCookie || stateCookie !== stateParam) {
    return redirect("/login?error=oauth_failed");
  }

  const accounts = parseOAuthRedirectAccounts(url);
  if (accounts.length === 0) {
    return redirect("/login?error=oauth_failed");
  }

  // TODO: prefer the real-money account over a virtual/demo one once
  // authorizeOAuthRedirect returns account type — Deriv includes both in
  // the redirect for accounts that have each.
  const account = accounts[0];
  const profile = await authorizeOAuthRedirect(account);
  const encryptedToken = await encryptToken(env, account.token);

  let user = await env.DB.prepare(`SELECT * FROM users WHERE deriv_loginid = ?`).bind(profile.loginid).first<any>();

  if (!user) {
    const id = crypto.randomUUID();
    const nickname = `client_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    await env.DB.prepare(
      `INSERT INTO users (id, deriv_loginid, client_nickname, deriv_oauth_token_encrypted, onboarding_step)
       VALUES (?, ?, ?, ?, 'profile')`
    )
      .bind(id, profile.loginid, nickname, encryptedToken)
      .run();
    user = await getUserById(env.DB, id);
  } else {
    await env.DB.prepare(`UPDATE users SET deriv_oauth_token_encrypted = ? WHERE id = ?`)
      .bind(encryptedToken, user.id)
      .run();
  }

  const token = newSessionToken();
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
    .bind(token, user.id)
    .run();

  return redirect(STEP_PATH[user.onboarding_step] ?? "/complete-profile", {
    "Set-Cookie": sessionCookieHeader(token),
  });
};
