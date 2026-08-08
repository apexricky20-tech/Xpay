import type { Env } from "../lib/db";
import { json } from "../lib/http";

/**
 * Reference shape only — not called by anything yet, since deposit.ts
 * currently mocks the whole deposit synchronously. Once Daraja is live,
 * point your STK Push callback URL here and this becomes the real trigger
 * for crediting Deriv (see the note atop deposit.ts).
 *
 * Safaricom POSTs a body shaped roughly like:
 *   { Body: { stkCallback: { CheckoutRequestID, ResultCode, ResultDesc,
 *     CallbackMetadata?: { Item: [{ Name, Value }] } } } }
 * ResultCode 0 means success; anything else means the prompt was declined,
 * timed out, or failed. Safaricom may retry this webhook, so look up the
 * transaction by CheckoutRequestID and no-op if it's already completed.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<any>();
  const callback = body?.Body?.stkCallback;
  const checkoutRequestId: string | undefined = callback?.CheckoutRequestID;
  const succeeded = callback?.ResultCode === 0;

  if (checkoutRequestId) {
    const existing = await env.DB.prepare(`SELECT status FROM transactions WHERE mpesa_receipt = ?`)
      .bind(checkoutRequestId)
      .first<{ status: string }>();

    // Idempotency guard — Safaricom may deliver this more than once.
    if (existing && existing.status === "pending") {
      await env.DB.prepare(`UPDATE transactions SET status = ? WHERE mpesa_receipt = ?`)
        .bind(succeeded ? "completed" : "failed", checkoutRequestId)
        .run();
      // TODO: only on success, call paymentAgentTransfer() here to credit
      // Deriv — see the note atop deposit.ts for why that has to happen
      // after this confirmation, not before it.
    }
  }

  // Safaricom expects a 200 with this exact shape regardless of outcome.
  return json({ ResultCode: 0, ResultDesc: "Accepted" });
};
