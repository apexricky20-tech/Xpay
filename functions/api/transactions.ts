import type { Env } from "./lib/db";
import { requireUser, errorJson, json } from "./lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);

    const { results } = await env.DB.prepare(
      `SELECT id, type, amount, currency, status, created_at FROM transactions
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
      .bind(user.id, limit)
      .all<{ id: string; type: string; amount: number; currency: string; status: string; created_at: string }>();

    return json(
      results.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.created_at,
      }))
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
};
