import type { Env } from "../lib/db";
import { json } from "../lib/http";

/**
 * Reference shape only — not routed to anything yet, since deposit() in
 * money.ts currently mocks the whole deposit synchronously. Once Daraja is
 * live, point your STK Push callback URL at /api/mpesa/callback and wire
 * this in — see the note atop deposit() in money.ts for why crediting
 * Deriv has to wait for this confirmation, not the initial STK request.
 */
export async function mpesaCallback(request: Request, env: Env): Promise<Response> {
  const body = await request.json<any>();
  const callback = body?.Body?.stkCallback;
  const checkoutRequestId: string | undefined = callback?.CheckoutRequestID;
  const succeeded = callback?.ResultCode === 0;

  if (checkoutRequestId) {
    const existing = await env.DB.prepare(`SELECT status FROM transactions WHERE mpesa_receipt = ?`)
      .bind(checkoutRequestId)
      .first<{ status: string }>();

    if (existing && existing.status === "pending") {
      await env.DB.prepare(`UPDATE transactions SET status = ? WHERE mpesa_receipt = ?`)
        .bind(succeeded ? "completed" : "failed", checkoutRequestId)
        .run();
      // TODO: only on success, call paymentAgentTransfer() here to credit Deriv.
    }
  }

  return json({ ResultCode: 0, ResultDesc: "Accepted" });
}
