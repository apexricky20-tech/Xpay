import { Hono } from "hono";
import type { Env } from "./lib/db";
import * as auth from "./routes/auth";
import * as money from "./routes/money";
import { mpesaCallback } from "./routes/mpesa-callback";

const app = new Hono<{ Bindings: Env }>();

// Thin wrappers: every handler already takes plain (request, env) so the
// same functions work in tests or a different router without change.
app.get("/api/auth/deriv/start", (c) => auth.derivStart(c.req.raw, c.env));
app.get("/api/auth/deriv/callback", (c) => auth.derivCallback(c.req.raw, c.env));
app.get("/api/auth/me", (c) => auth.me(c.req.raw, c.env));
app.post("/api/auth/logout", (c) => auth.logout(c.req.raw, c.env));
app.post("/api/profile", (c) => auth.saveProfile(c.req.raw, c.env));
app.post("/api/mpesa-profile", (c) => auth.saveMpesaProfile(c.req.raw, c.env));
app.post("/api/password", (c) => auth.createPassword(c.req.raw, c.env));
app.post("/api/login", (c) => auth.login(c.req.raw, c.env));

app.get("/api/deriv/balance", (c) => money.balance(c.req.raw, c.env));
app.post("/api/deposit", (c) => money.deposit(c.req.raw, c.env));
app.post("/api/withdraw", (c) => money.withdraw(c.req.raw, c.env));
app.get("/api/transactions", (c) => money.transactions(c.req.raw, c.env));
app.post("/api/mpesa/callback", (c) => mpesaCallback(c.req.raw, c.env));

// Anything under /api/* that isn't matched above is a real 404, not the SPA.
app.notFound((c) => {
  const { pathname } = new URL(c.req.url);
  if (pathname.startsWith("/api/")) return c.json({ error: "Not found." }, 404);
  // Every other path (client-side routes like /dashboard, /deposit, ...)
  // falls through to the built site. not_found_handling =
  // "single-page-application" in wrangler.toml makes this serve
  // index.html so React Router can take over.
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
