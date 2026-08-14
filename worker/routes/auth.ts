import type { Env } from "../lib/db";
import { getUserById } from "../lib/db";
import { requireUser, toSessionUser, errorJson, json } from "../lib/http";
import {
  buildAuthorizeUrl,
  generateCodeVerifier,
  deriveCodeChallenge,
  exchangeCodeForToken,
  getAccounts,
} from "../lib/deriv";
import { encryptToken } from "../lib/crypto";
import {
  hashPassword,
  verifyPassword,
  newSessionToken,
  sessionCookieHeader,
  clearSessionCookieHeader,
  readSessionToken,
} from "../lib/session";
import { getUserByEmail } from "../lib/db";

function redirect(location: string, extraHeaders: Record<string, string> = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...extraHeaders } });
}

const STEP_PATH: Record<string, string> = {
  profile: "/complete-profile",
  mpesa: "/setup-mpesa",
  password: "/create-password",
  complete: "/dashboard",
};

// Short-lived, httpOnly — these only need to survive the round trip to
// Deriv and back, never read by client JS.
function pkceCookie(name: string, value: string) {
  return `${name}=${value}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`;
}

export async function derivStart(_request: Request, env: Env): Promise<Response> {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallenge(codeVerifier);
  const url = buildAuthorizeUrl(env, state, codeChallenge);

  const headers = new Headers({ Location: url });
  headers.append("Set-Cookie", pkceCookie("xpay_oauth_state", state));
  headers.append("Set-Cookie", pkceCookie("xpay_pkce_verifier", codeVerifier));

  return new Response(null, { status: 302, headers });
}

export async function derivCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.searchParams.get("error")) {
    return redirect("/login?error=oauth_failed");
  }

  const cookie = request.headers.get("Cookie") ?? "";
  const stateCookie = cookie.match(/xpay_oauth_state=([^;]+)/)?.[1];
  const verifierCookie = cookie.match(/xpay_pkce_verifier=([^;]+)/)?.[1];
  const stateParam = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (!stateCookie || stateCookie !== stateParam || !verifierCookie || !code) {
    return redirect("/login?error=oauth_failed");
  }

  let profile;
  let encryptedToken;
  try {
    const token = await exchangeCodeForToken(env, code, verifierCookie);
    const account = await getAccounts(env, token.access_token);
    profile = account;
    encryptedToken = await encryptToken(env, token.access_token);
  } catch (err) {
    // Surfaces as a distinct error code on purpose — if Deriv's accounts
    // response shape doesn't match what getAccounts() expects, this is
    // where it'll show up. Check the Worker's logs for the thrown message.
    return redirect("/login?error=oauth_exchange_failed");
  }

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

  const sessionToken = newSessionToken();
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
    .bind(sessionToken, user.id)
    .run();

  return redirect(STEP_PATH[user.onboarding_step] ?? "/complete-profile", {
    "Set-Cookie": sessionCookieHeader(sessionToken),
  });
}

export async function me(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    return json(toSessionUser(user));
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
}

export async function logout(request: Request, env: Env): Promise<Response> {
  const token = readSessionToken(request);
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookieHeader() } });
}

export async function saveProfile(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    const { name, country, derivEmail } = await request.json<{ name: string; country: string; derivEmail: string }>();
    if (!name?.trim() || !country?.trim() || !derivEmail?.includes("@")) {
      return errorJson("Fill in your name, country, and a valid Deriv email.");
    }
    await env.DB.prepare(
      `UPDATE users SET name = ?, country = ?, deriv_email = ?, onboarding_step = 'mpesa' WHERE id = ?`
    )
      .bind(name.trim(), country, derivEmail.trim(), user.id)
      .run();
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
}

export async function saveMpesaProfile(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    const { phone, provider } = await request.json<{ phone: string; provider: "mpesa" | "airtel" }>();
    if (!/^\+254\d{9}$/.test(phone) || !["mpesa", "airtel"].includes(provider)) {
      return errorJson("Enter a valid Kenyan number and pick a provider.");
    }
    await env.DB.prepare(`UPDATE users SET phone = ?, provider = ?, onboarding_step = 'password' WHERE id = ?`)
      .bind(phone, provider, user.id)
      .run();
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
}

export async function createPassword(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    const { password } = await request.json<{ password: string }>();
    if (!password || password.length < 8) return errorJson("Password must be at least 8 characters.");

    const passwordHash = await hashPassword(password);
    await env.DB.prepare(`UPDATE users SET password_hash = ?, onboarding_step = 'complete' WHERE id = ?`)
      .bind(passwordHash, user.id)
      .run();

    const token = newSessionToken();
    await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
      .bind(token, user.id)
      .run();

    return json({ name: user.name, email: user.deriv_email }, 200, { "Set-Cookie": sessionCookieHeader(token) });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
}

export async function login(request: Request, env: Env): Promise<Response> {
  const { email, password } = await request.json<{ email: string; password: string }>();
  if (!email || !password) return errorJson("Email and password are required.");

  const user = await getUserByEmail(env.DB, email);
  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return errorJson("Incorrect email or password.", 401);
  }

  const token = newSessionToken();
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
    .bind(token, user.id)
    .run();

  return json({ name: user.name }, 200, { "Set-Cookie": sessionCookieHeader(token) });
}
