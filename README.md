# Xpay

Instant transfers between M-Pesa and a Deriv trading account — a Vite/React
frontend and a Hono-based Worker backend, both deployed as a single
Cloudflare Worker with static assets. Modeled on the AbePay onboarding
flow: link Deriv → complete profile → set up mobile money → set a
password → dashboard.

**Status:** every screen is built and wired together. The Deriv and M-Pesa
integrations are mocked behind clean service modules so the whole flow is
clickable today — see "Going live" below for what's left to connect real
money movement.

**A note on architecture:** this started out built against Cloudflare
Pages Functions (a `/functions` folder with one file per route). It's
since been rewritten to Cloudflare's native Workers-with-static-assets
model (one Worker entry point in `worker/`, using Hono for routing) — this
project's Cloudflare resource turned out to be a Workers service rather
than a Pages project, and only the native model deploys cleanly against
that. If you're following along from an earlier version of this repo,
`functions/` is gone; `worker/` replaces it, with the same underlying
logic.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind, client-side routing
  via `react-router-dom`.
- **Backend:** a single Cloudflare Worker (`worker/index.ts`) using Hono
  for routing — `/api/*` hits the Worker, everything else falls through to
  the static build via the `ASSETS` binding.
- **Database:** Cloudflare D1 (`schema.sql`) — users, sessions,
  transactions. Not bound yet — see "Going live."
- **Auth:** Deriv OAuth to link an account, then a local email+password
  session (httpOnly cookie) for return visits, matching the flow in the
  reference screenshots.

## Local development

```
npm install
npm run dev          # frontend, http://localhost:5173
npm run worker:dev    # in a second terminal — serves /api/* via wrangler, port 8787
```

`vite.config.ts` proxies `/api` to the wrangler dev server, so the
frontend can call the real Worker routes locally. For local D1, run
`wrangler d1 execute xpay-db --local --file=./schema.sql` once first.

## Deploying

This repo deploys as a Worker (`wrangler deploy`), not `wrangler pages
deploy` — if your Cloudflare project's Settings has the deploy command set
to anything else, change it to `npx wrangler deploy`. Push to `main` and
Cloudflare's connected build should pick it up automatically.

## Environment variables / bindings

| Name | Where it's used | Required to... |
|---|---|---|
| `DB` (D1 binding) | everywhere in `worker/lib/db.ts` | run at all — currently commented out in `wrangler.toml`, see below |
| `ASSETS` (assets binding) | `worker/index.ts` | serve the frontend — configured automatically via the `[assets]` block |
| `DERIV_APP_ID` | `worker/lib/deriv.ts` | make "Login with Deriv" go anywhere real |
| `DERIV_OAUTH_REDIRECT_URI` | same | must exactly match what you register with Deriv |
| `TOKEN_ENCRYPTION_KEY` | `worker/lib/crypto.ts` | encrypt stored Deriv tokens (`openssl rand -base64 32`) |
| `DERIV_PA_API_TOKEN` | not wired yet — see below | real `paymentagent_transfer`/`withdraw` calls |
| `DARAJA_CONSUMER_KEY` / `_SECRET` / `DARAJA_SHORTCODE` / `DARAJA_PASSKEY` | not wired yet | real STK Push / B2C calls |

**D1 setup:** create the database (dashboard: D1 SQL database > Create
Database, or `wrangler d1 create xpay-db`), run `schema.sql` against it,
then uncomment the `[[d1_databases]]` block in `wrangler.toml` and paste
in the real `database_id` — a placeholder id there will fail the deploy
itself, which is why it ships commented out. Cloudflare's own environment
variables UI (Settings > Environment Variables) is for everything else in
the table above.

## The onboarding flow

| Route | What happens |
|---|---|
| `/` | Splash, auto-forwards to `/login` |
| `/login` | "Login with Deriv" → full-page redirect to `/api/auth/deriv/start` → Deriv's OAuth page |
| `/api/auth/deriv/callback` (server) | Deriv redirects back here with account/token(s); we create or find the user, encrypt+store the token, start a session, and redirect into onboarding wherever the account left off |
| `/complete-profile` | Country, name, Deriv email (must match the Deriv account — it's how withdrawal verification emails land in the right inbox) |
| `/setup-mpesa` | Phone number + M-Pesa/Airtel Money |
| `/create-password` | Sets the local Xpay password used for return visits |
| `/welcome-back` | Email+password login for returning users, personalized via a non-sensitive localStorage hint (never a token) |
| `/dashboard`, `/deposit`, `/withdraw`, `/history`, `/profile`, `/settings` | Behind `RequireAuth` — bounces to whichever onboarding step is incomplete otherwise |

## Security notes (read before going live)

- **The per-user Deriv token is the highest-value target in this system.**
  Once linked, it can authorize `paymentagent_withdraw` — i.e., pull money
  out of that person's Deriv account. It's stored AES-GCM encrypted
  (`worker/lib/crypto.ts`) rather than in plaintext, but the real
  protection is requesting the narrowest OAuth scope Deriv allows (`read`
  + `payments` — never `trade` or `admin`) and keeping
  `TOKEN_ENCRYPTION_KEY` out of the repo and rotated if it's ever exposed.
- **Passwords** are hashed with PBKDF2-SHA256 (210k iterations) via Web
  Crypto — there's no native bcrypt/argon2 in the Workers runtime, and
  this is a supported, dependency-free alternative.
- **Sessions** are random 256-bit tokens in an httpOnly, Secure,
  SameSite=Lax cookie — never readable from client JS, never stored in
  localStorage.
- **Deposit is written to credit Deriv only after M-Pesa confirms**, not
  on the strength of the STK push request — see the comment atop
  `worker/routes/money.ts (deposit)` and the reference handler in
  `worker/routes/mpesa-callback.ts`. Right now deposit.ts mocks both legs
  synchronously so the demo works without a real phone; going live means
  splitting that into "request" + "confirm via webhook."
- Every transfer keeps both a `mpesa_receipt` and a `deriv_transfer_id`
  on its `transactions` row — the ability to reconcile every payment
  against the matching Deriv transfer 1:1 matters more than any screen in
  the app.

## Going live — in order

1. **Register a Deriv OAuth app** at api.deriv.com/dashboard — free,
   instant, no approval needed. Gets you `DERIV_APP_ID` and lets you set
   the redirect URI. This alone makes "Login with Deriv" real.
2. **Apply for Deriv Payment Agent status** on the account that'll hold
   `DERIV_PA_API_TOKEN` — needs a verified Deriv account with a minimum
   balance (confirm the current figure with Deriv; don't assume old
   figures still hold). This is what unlocks `paymentagent_transfer` and
   `paymentagent_withdraw` in `worker/lib/deriv.ts` — replace the
   mocked bodies with real WebSocket API calls once approved. Deriv's
   Payment Agent terms require avoiding "Deriv" in your business name
   (Xpay's fine) and put client due-diligence/AML responsibility on you.
3. **Get a Safaricom Paybill/Till** through Safaricom's business
   onboarding team (separate from the Daraja developer portal account),
   with KRA compliance docs in hand.
4. **Go live on Daraja**: request production access for STK Push and B2C
   specifically, submit a signed go-live request, wait for Safaricom's
   manual review (a few business days), and have Safaricom whitelist your
   production server's IP. Replace the mocked bodies in
   `worker/lib/mpesa.ts` with real calls once approved.
5. Wire `worker/routes/mpesa-callback.ts` as your real STK Push callback
   URL and split `deposit.ts` into request/confirm as described above.

## Design tokens

Dark ink background (`#0B0D14`) with an indigo→cyan brand gradient — the
gradient itself is meant to read as the bridge between the two systems
(indigo toward Deriv, cyan toward M-Pesa's cash-out side). Space Grotesk
for display type, Inter for body, JetBrains Mono for account IDs and
monetary figures. Full token set in `tailwind.config.js`.
