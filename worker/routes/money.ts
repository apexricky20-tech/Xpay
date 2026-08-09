import type { Env } from "../lib/db";
import { requireUser, errorJson, json } from "../lib/http";
import { getBalance, paymentAgentTransfer, paymentAgentWithdraw } from "../lib/deriv";
import { stkPush, b2cPayout } from "../lib/mpesa";
import { decryptToken } from "../lib/crypto";

export async function balance(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    if (!user.deriv_oauth_token_encrypted) return errorJson("Deriv account not linked.", 409);
    const token = await decryptToken(env, user.deriv_oauth_token_encrypted);
    const { amount, currency } = await getBalance(token);
    return json({ amount, currency, asOf: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Couldn't reach Deriv.", 502);
  }
}

/**
 * MOCKED end-to-end — see functions history / README for the real,
 * webhook-driven flow this collapses for demo purposes.
 */
export async function deposit(request: Request, env: Env): Promise<Response> {
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
    const { transferId } = await paymentAgentTransfer({ clientLoginId: user.deriv_loginid, amount, currency: "USD" });

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
}

export async function withdraw(request: Request, env: Env): Promise<Response> {
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

    const clientToken = await decryptToken(env, user.deriv_oauth_token_encrypted);
    const { transferId } = await paymentAgentWithdraw({ clientEncryptedToken: clientToken, amount, currency: "USD" });
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
}

export async function transactions(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireUser(request, env);
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);

    const { results } = await env.DB.prepare(
      `SELECT id, type, amount, currency, status, created_at FROM transactions
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
      .bind(user.id, limit)
      .all<{ id: string; type: string; amount: number; currency: string; status: string; created_at: string }>();

    return json(
      results.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.created_at,
      }))
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return errorJson("Something went wrong.", 500);
  }
}
