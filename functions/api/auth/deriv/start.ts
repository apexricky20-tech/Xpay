import type { Env } from "../../lib/db";
import { buildOAuthAuthorizeUrl } from "../../lib/deriv";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  // `state` guards against CSRF on the redirect back — a real implementation
  // should also stash it in a short-lived cookie and check it matches in
  // deriv/callback.ts before trusting the redirect.
  const state = crypto.randomUUID();
  const url = buildOAuthAuthorizeUrl(env, state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": `xpay_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};
