import type { Env } from "./lib/db";
import { requireUser, errorJson, json } from "./lib/http";
import { b2cPayout } from "./lib/mpesa";
import { paymentAgentWithdraw } from "./lib/deriv";
import { decryptToken } from "./lib/crypto";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireUser(request, env);
    const { amount } = await request.json<{ amount: number }>();
    if (!amount || amount <= 0) return errorJson("Enter an amount greater than 0.");
    if (!user.phone) return errorJson("Set up mobile money first.", 409);
    if (!user.deriv_oauth_token_encrypted) return errorJson("Deriv account not linked.", 409);

    const txId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, currency, status) VALUES (?, ?, 'withdraw', ?, 'USD', 'pending')`
    )
      .bind(txId, user.id, amount)
      .run();

    // Pull funds out of the client's Deriv account first — only pay out
    // over M-Pesa once that leg actually succeeds, so a failed Deriv pull
    // never results in a payout with nothing behind it.
    const clientToken = await decryptToken(env, user.deriv_oauth_token_encrypted);
    const { transferId } = await paymentAgentWithdraw({
      clientEncryptedToken: clientToken,
      amount,
      currency: "USD",
    });

    const { conversationId } = await b2cPayout(env, { phone: user.phone, amount });

    await env.DB.prepare(
      `UPDATE transactions SET status = 'completed', mpesa_receipt = ?, deriv_transfer_id = ? WHERE id = ?`
    )
      .bind(conversationId, transferId, txId)
      .run();

    return json({ status: "completed", transactionId: txId });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Withdrawal failed.", 500);
  }
};
