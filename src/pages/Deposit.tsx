import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button, FieldWrap, TextInput } from "../components/Field";

type Stage = "form" | "awaiting-pin" | "success" | "failed";

export default function Deposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setStage("awaiting-pin");
    setError(null);
    try {
      // Kicks off functions/api/deposit.ts: STK push -> (mock) M-Pesa
      // callback -> paymentagent_transfer into the linked Deriv account.
      const result = await api.post<{ status: "completed" | "failed" }>("/deposit", {
        amount: Number(amount),
      });
      setStage(result.status === "completed" ? "success" : "failed");
    } catch {
      setError("Couldn't reach Xpay — check your connection and try again.");
      setStage("form");
    }
  };

  if (stage === "awaiting-pin") {
    return (
      <Centered>
        <Loader2 className="animate-spin text-indigo-400 mb-4" size={32} />
        <h1 className="text-xl font-semibold mb-1">Enter your M-Pesa PIN</h1>
        <p className="text-sm text-slate-400">
          A prompt was sent to {user?.phone}. Approve it on your phone to continue.
        </p>
      </Centered>
    );
  }

  if (stage === "success") {
    return (
      <Centered>
        <CheckCircle2 className="text-mint-500 mb-4" size={40} />
        <h1 className="text-xl font-semibold mb-1">Deposit complete</h1>
        <p className="text-sm text-slate-400 mb-6">${amount} has been credited to your Deriv account.</p>
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
        <h1 className="text-xl font-semibold mb-1">Deposit didn't go through</h1>
        <p className="text-sm text-slate-400 mb-6">No funds were moved. You can try again.</p>
        <Button onClick={() => setStage("form")} variant="secondary" className="max-w-xs">
          Try again
        </Button>
      </Centered>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Deposit</h1>
      <p className="text-sm text-slate-400 mb-6">Send from M-Pesa straight into your Deriv account.</p>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-400 bg-ink-900/60 rounded-lg px-4 py-3 mb-5">
          <Smartphone size={16} className="text-mint-500 shrink-0" />
          STK push goes to <span className="text-white font-medium">{user?.phone ?? "your linked number"}</span>
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
          Request STK Push
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
