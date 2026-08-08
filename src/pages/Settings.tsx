import { ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "../components/Field";

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-9 h-9 rounded-lg bg-mint-500/15 flex items-center justify-center text-mint-500 shrink-0">
            <ShieldCheck size={16} />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Deriv connection</p>
            <p className="text-xs text-slate-500">
              Linked — Xpay can read your balance and process withdrawals you approve. Revoking this
              disables Deposit and Withdraw until you reconnect.
            </p>
          </div>
        </div>
        <Button variant="secondary">Reconnect Deriv account</Button>
      </div>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
            <KeyRound size={16} />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Password</p>
            <p className="text-xs text-slate-500">Used to log in to Xpay on this and other devices.</p>
          </div>
        </div>
        <Button variant="secondary">Change password</Button>
      </div>
    </div>
  );
}
