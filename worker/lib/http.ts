import type { Env } from "./db";
import { getUserBySession, type UserRow } from "./db";
import { readSessionToken } from "./session";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function errorJson(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Loads the session user or throws a 401 Response — call inside a try/catch,
 *  or let it propagate (Pages Functions will render it as the response). */
export async function requireUser(request: Request, env: Env): Promise<UserRow> {
  const token = readSessionToken(request);
  if (!token) throw errorJson("Not signed in.", 401);
  const user = await getUserBySession(env.DB, token);
  if (!user) throw errorJson("Session expired.", 401);
  return user;
}

export function toSessionUser(u: UserRow) {
  return {
    id: u.id,
    clientNickname: u.client_nickname,
    name: u.name,
    country: u.country,
    derivEmail: u.deriv_email,
    phone: u.phone,
    provider: u.provider,
    onboardingStep: u.onboarding_step,
  };
}
