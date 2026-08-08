import { ShieldCheck, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Button } from "../components/Field";

export default function Login() {
  const [params] = useSearchParams();
  const oauthError = params.get("error");

  const startDerivOAuth = () => {
    // Full page navigation on purpose: this leaves our SPA and goes to
    // Deriv's own login page. See functions/api/auth/deriv/start.ts.
    window.location.href = "/api/auth/deriv/start";
  };

  return (
    <AuthShell title="Xpay" subtitle="Instant Transactions">
      {oauthError && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 mb-4 text-left">
          <AlertCircle size={14} className="shrink-0" />
          Deriv sign-in didn't go through. Give it another try.
        </div>
      )}
      <div className="bg-ink-800/70 border border-ink-600 rounded-xl2 p-6 backdrop-blur">
        <h2 className="font-display text-lg font-semibold text-white mb-1">Get started</h2>
        <p className="text-sm text-slate-400 mb-6">
          Link your Deriv account to continue — we never see or store your Deriv password.
        </p>
        <Button onClick={startDerivOAuth}>Login with Deriv</Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-4">
          <ShieldCheck size={13} />
          Authenticated directly by Deriv via OAuth
        </p>
      </div>
      <p className="text-xs text-slate-500 mt-6">
        Already set a password?{" "}
        <a href="/welcome-back" className="text-cyan-400 hover:text-cyan-300">
          Log in instead
        </a>
      </p>
    </AuthShell>
  );
}
