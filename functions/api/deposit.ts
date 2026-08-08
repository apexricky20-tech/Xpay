import type { Env } from "./lib/db";
import { requireUser, errorJson, json } from "./lib/http";
import { stkPush } from "./lib/mpesa";
import { paymentAgentTransfer } from "./lib/deriv";

/**
 * MOCKED end-to-end. The real flow is asynchronous, not a single request:
 *
 *   1. stkPush() only *requests* the prompt — the phone's PIN approval
 *      comes back later as a Safaricom POST to functions/api/mpesa-
 *      callback.ts, which is where you'd actually confirm payment.
 *   2. Only after that callback confirms payment should you call
 *      paymentAgentTransfer() to credit Deriv — crediting on the strength
 *      of the STK push *request* alone would let someone claim a deposit
 *      they never completed.
 *   3. This handler collapses both steps into one request so the demo
 *      works without a real phone. Swap it for: record `pending` here,
 *      have the mpesa-callback handler flip it to `completed` and fire
 *      paymentAgentTransfer at that point instead.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    const { amount } = await request.json<{ amount: number }>();
    if (!amount || amount <= 0) return errorJson("Enter an amount greater than 0.");
    if (!user.phone) return errorJson("Set up mobile money first.", 409);

    const txId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, currency, status) VALUES (?, ?, 'deposit', ?, 'USD', 'pending')`
    )
      .bind(txId, user.id, amount)
      .run();

    const { checkoutRequestId } = await stkPush(env, { phone: user.phone, amount });
    const { transferId } = await paymentAgentTransfer({
      clientLoginId: user.deriv_loginid,
      amount,
      currency: "USD",
    });

    await env.DB.prepare(
      `UPDATE transactions SET status = 'completed', mpesa_receipt = ?, deriv_transfer_id = ? WHERE id = ?`
    )
      .bind(checkoutRequestId, transferId, txId)
      .run();

    return json({ status: "completed", transactionId: txId });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Deposit failed.", 500);
  }
};
