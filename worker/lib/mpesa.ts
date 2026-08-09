/**
 * Safaricom Daraja integration layer. MOCKED — see the checklist below.
 *
 * ---------------------------------------------------------------------
 * GOING LIVE — in order
 * ---------------------------------------------------------------------
 * 1. Register at developer.safaricom.co.ke, build against the sandbox
 *    first (no business docs needed for that stage).
 * 2. Apply for a live Paybill or Till number through Safaricom's business
 *    onboarding team — this is a separate process from the Daraja portal
 *    account and needs KRA compliance documents.
 * 3. On the Daraja portal, request "Go Live" for your app: pick only the
 *    API products you use (STK Push for deposits, B2C for withdrawals),
 *    submit business details + a signed go-live request letter. Review
 *    is manual and typically takes a few business days.
 * 4. Safaricom whitelists your production server's IP before enabling
 *    live endpoints — note this if you move hosting later.
 * 5. Callback URLs (stkPushCallback, b2cResultCallback below) must be
 *    public HTTPS endpoints — Safaricom will not call back to HTTP or to
 *    an unreachable URL, and it may retry, so handlers must be
 *    idempotent (check the transaction isn't already marked complete
 *    before applying a callback).
 * 6. Consumer key/secret are server-side only, and every request gets a
 *    fresh OAuth token (valid ~1 hour) from the Daraja /oauth endpoint —
 *    never cache a token past its expiry.
 */

import type { Env } from "./db";

/**
 * MOCK. Real version: POST to
 * https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest with an
 * OAuth bearer token, business shortcode, and a base64 password of
 * `shortcode + passkey + timestamp`.
 */
export async function stkPush(_env: Env, args: { phone: string; amount: number }): Promise<{ checkoutRequestId: string }> {
  return { checkoutRequestId: `mock_ckid_${crypto.randomUUID()}` };
}

/**
 * MOCK. Real version: POST to
 * https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest (Business to
 * Customer) to pay a withdrawal out to the user's phone.
 */
export async function b2cPayout(_env: Env, args: { phone: string; amount: number }): Promise<{ conversationId: string }> {
  return { conversationId: `mock_conv_${crypto.randomUUID()}` };
}
