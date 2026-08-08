import type { Env } from "./lib/db";
import { requireUser, errorJson } from "./lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
};
