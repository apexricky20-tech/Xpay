import type { Env } from "./lib/db";
import { getUserByEmail } from "./lib/db";
import { errorJson, json } from "./lib/http";
import { verifyPassword, newSessionToken, sessionCookieHeader } from "./lib/session";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
};
