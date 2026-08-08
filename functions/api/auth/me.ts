import type { Env } from "../lib/db";
import { requireUser, toSessionUser, errorJson, json } from "../lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    return json(toSessionUser(user));
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
};
