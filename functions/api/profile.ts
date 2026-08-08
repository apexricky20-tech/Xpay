import type { Env } from "./lib/db";
import { requireUser, errorJson } from "./lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
};
