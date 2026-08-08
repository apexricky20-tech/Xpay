import type { Env } from "../lib/db";
import { requireUser, errorJson, json } from "../lib/http";
import { getBalance } from "../lib/deriv";
import { decryptToken } from "../lib/crypto";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    if (!user.deriv_oauth_token_encrypted) return errorJson("Deriv account not linked.", 409);

    const token = await decryptToken(env, user.deriv_oauth_token_encrypted);
    const { amount, currency } = await getBalance(token);

    return json({ amount, currency, asOf: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Couldn't reach Deriv.", 502);
  }
};
