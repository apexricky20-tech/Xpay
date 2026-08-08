import type { Env } from "../lib/db";
import { readSessionToken, clearSessionCookieHeader } from "../lib/session";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = readSessionToken(request);
  if (token) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  }
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookieHeader() } });
};
