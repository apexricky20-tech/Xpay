# Xpay

Instant transfers between M-Pesa and a Deriv trading account — a Vite/React
frontend on Cloudflare Pages, with Cloudflare Pages Functions + D1 as the
backend. Modeled on the AbePay onboarding flow: link Deriv → complete
profile → set up mobile money → set a password → dashboard.

**Status:** every screen is built and wired together. The Deriv and M-Pesa
integrations are mocked behind clean service modules so the whole flow is
clickable today — see "Going live" below for what's left to connect real
money movement.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind, client-side routing
  via `react-router-dom`.
- **Backend:** Cloudflare Pages Functions (`/functions/api/**`), one file
  per route, file-based routing.
- **Database:** Cloudflare D1 (`schema.sql`) — users, sessions,
  transactions.
- **Auth:** Deriv OAuth to link an account, then a local email+password
  session (httpOnly cookie) for return visits, matching the flow in the
  reference screenshots.

## Local development

```
npm install
npm run dev          # frontend, http://localhost:5173
npm run pages:dev     # in a second terminal — serves /api/* via wrangler
```

`vite.config.ts` proxies `/api` to the wrangler dev server (port 8788), so
the frontend can call the real function handlers locally against a local
D1 database (`wrangler d1 execute xpay-db --local --file=./schema.sql`
before your first run).

## Deploying

See the step-by-step card from Claude for connecting this repo to
Cloudflare Pages, creating the D1 database, and adding environment
variables. In short: Git-connect the repo, build command `npm run build`,
output directory `dist`, then add a D1 binding named `DB` and the env vars
listed below.

## Environment variables / bindings

| Name | Where it's used | Required to... |
|---|---|---|
| `DB` (D1 binding) | everywhere in `functions/api/lib/db.ts` | run at all |
| `DERIV_APP_ID` | `functions/api/lib/deriv.ts` | make "Login with Deriv" go anywhere real |
| `DERIV_OAUTH_REDIRECT_URI` | same | must exactly match what you register with Deriv |
| `TOKEN_ENCRYPTION_KEY` | `functions/api/lib/crypto.ts` | encrypt stored Deriv tokens (`openssl rand -base64 32`) |
| `DERIV_PA_API_TOKEN` | not wired yet — see below | real `paymentagent_transfer`/`withdraw` calls |
| `DARAJA_CONSUMER_KEY` / `_SECRET` / `DARAJA_SHORTCODE` / `DARAJA_PASSKEY` | not wired yet | real STK Push / B2C calls |

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
  (`functions/api/lib/crypto.ts`) rather than in plaintext, but the real
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
  `functions/api/deposit.ts` and the reference handler in
  `functions/api/mpesa/callback.ts`. Right now deposit.ts mocks both legs
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
   `paymentagent_withdraw` in `functions/api/lib/deriv.ts` — replace the
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
   `functions/api/lib/mpesa.ts` with real calls once approved.
5. Wire `functions/api/mpesa/callback.ts` as your real STK Push callback
   URL and split `deposit.ts` into request/confirm as described above.

## Design tokens

Dark ink background (`#0B0D14`) with an indigo→cyan brand gradient — the
gradient itself is meant to read as the bridge between the two systems
(indigo toward Deriv, cyan toward M-Pesa's cash-out side). Space Grotesk
for display type, Inter for body, JetBrains Mono for account IDs and
monetary figures. Full token set in `tailwind.config.js`.
