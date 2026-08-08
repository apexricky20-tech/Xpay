import type { Env } from "./lib/db";
import { requireUser, errorJson, json } from "./lib/http";
import { hashPassword, newSessionToken, sessionCookieHeader } from "./lib/session";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    const { password } = await request.json<{ password: string }>();

    if (!password || password.length < 8) {
      return errorJson("Password must be at least 8 characters.");
    }

    const passwordHash = await hashPassword(password);
    await env.DB.prepare(`UPDATE users SET password_hash = ?, onboarding_step = 'complete' WHERE id = ?`)
      .bind(passwordHash, user.id)
      .run();

    // Rotate the session token now that the account is fully set up.
    const token = newSessionToken();
    await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
      .bind(token, user.id)
      .run();

    return json(
      { name: user.name, email: user.deriv_email },
      200,
      { "Set-Cookie": sessionCookieHeader(token) }
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
};
