import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button, FieldWrap, TextInput } from "../components/Field";

type Stage = "form" | "processing" | "success" | "failed";

export default function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setStage("processing");
    setError(null);
    try {
      // Kicks off functions/api/withdraw.ts: paymentagent_withdraw pulls
      // funds from the client's Deriv account into Xpay's PA account,
      // then a Daraja B2C call pays it out to their M-Pesa number.
      const result = await api.post<{ status: "completed" | "failed" }>("/withdraw", {
        amount: Number(amount),
      });
      setStage(result.status === "completed" ? "success" : "failed");
    } catch {
      setError("Couldn't reach Xpay — check your connection and try again.");
      setStage("form");
    }
  };

  if (stage === "processing") {
    return (
      <Centered>
        <Loader2 className="animate-spin text-cyan-400 mb-4" size={32} />
        <h1 className="text-xl font-semibold mb-1">Processing withdrawal</h1>
        <p className="text-sm text-slate-400">Pulling funds from Deriv and sending them to M-Pesa.</p>
      </Centered>
    );
  }

  if (stage === "success") {
    return (
      <Centered>
        <CheckCircle2 className="text-mint-500 mb-4" size={40} />
        <h1 className="text-xl font-semibold mb-1">Withdrawal sent</h1>
        <p className="text-sm text-slate-400 mb-6">${amount} is on its way to {user?.phone}.</p>
        <Button onClick={() => navigate("/dashboard")} className="max-w-xs">
          Back to dashboard
        </Button>
      </Centered>
    );
  }

  if (stage === "failed") {
    return (
      <Centered>
        <XCircle className="text-rose-500 mb-4" size={40} />
        <h1 className="text-xl font-semibold mb-1">Withdrawal didn't go through</h1>
        <p className="text-sm text-slate-400 mb-6">No funds left your Deriv account. You can try again.</p>
        <Button onClick={() => setStage("form")} variant="secondary" className="max-w-xs">
          Try again
        </Button>
      </Centered>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Withdraw</h1>
      <p className="text-sm text-slate-400 mb-6">Move funds from Deriv back to M-Pesa.</p>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-400 bg-ink-900/60 rounded-lg px-4 py-3 mb-5">
          <Smartphone size={16} className="text-cyan-400 shrink-0" />
          Payout goes to <span className="text-white font-medium">{user?.phone ?? "your linked number"}</span>
        </div>

        <FieldWrap label="Amount (USD)" error={error ?? undefined}>
          <TextInput
            type="number"
            min={1}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FieldWrap>

        <Button onClick={submit} disabled={!amount || Number(amount) <= 0}>
          Withdraw to M-Pesa
        </Button>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center py-16">{children}</div>
  );
}
