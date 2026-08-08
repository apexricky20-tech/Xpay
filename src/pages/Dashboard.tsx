import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RefreshCw, Eye, EyeOff, ExternalLink, History } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api, type Transaction, type WalletBalance } from "../lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [recent, setRecent] = useState<Transaction[]>([]);

  const loadBalance = async () => {
    setLoadingBalance(true);
    const b = await api.get<WalletBalance>("/deriv/balance");
    setBalance(b);
    setLoadingBalance(false);
  };

  useEffect(() => {
    loadBalance();
    api.get<Transaction[]>("/transactions?limit=5").then(setRecent);
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-slate-500 uppercase">Welcome back</p>
          <h1 className="text-2xl font-semibold">{user?.name ?? "…"}</h1>
        </div>
        <span className="id-badge mt-1">{user?.clientNickname}</span>
      </div>

      <div className="rounded-xl2 bg-brand-gradient p-6 mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-white/80 text-xs font-medium tracking-wide uppercase mb-2">
          <span>USD Wallet · {user?.clientNickname}</span>
          <div className="flex items-center gap-2">
            <button onClick={loadBalance} aria-label="Refresh balance" className="hover:text-white transition-colors">
              <RefreshCw size={14} className={loadingBalance ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setHidden((h) => !h)} aria-label="Toggle balance visibility" className="hover:text-white transition-colors">
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <p className="text-4xl font-display font-semibold text-white mb-1">
          {hidden ? "••••••" : `$${(balance?.amount ?? 0).toFixed(2)}`}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">Live Balance</span>
          <Link to="/settings" className="text-xs text-white/80 hover:text-white flex items-center gap-1">
            All accounts <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      <button className="w-full flex items-center justify-between rounded-xl2 bg-ink-800 border border-ink-600 px-5 py-4 mb-4 hover:border-ink-500 transition-colors text-left">
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <ArrowLeftRight size={16} />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Transfer to Options</span>
            <span className="block text-xs text-slate-500">Move funds to your options account</span>
          </span>
        </span>
        <ExternalLink size={15} className="text-slate-500" />
      </button>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/deposit"
          className="rounded-xl2 bg-brand-gradient p-5 hover:brightness-110 transition-all"
        >
          <ArrowDownLeft className="text-white mb-6" size={20} />
          <span className="block text-white font-semibold text-sm">Deposit</span>
          <span className="block text-white/70 text-xs">Add funds</span>
        </Link>
        <Link
          to="/withdraw"
          className="rounded-xl2 bg-cyan-500 p-5 hover:brightness-110 transition-all"
        >
          <ArrowUpRight className="text-white mb-6" size={20} />
          <span className="block text-white font-semibold text-sm">Withdraw</span>
          <span className="block text-white/70 text-xs">Send to M-Pesa</span>
        </Link>
      </div>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600">
        <h2 className="text-sm font-semibold text-white px-5 pt-4 pb-3 border-b border-ink-700">Recent Activity</h2>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-500">
            <History size={28} className="mb-3 opacity-60" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-700">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      t.type === "deposit" ? "bg-indigo-500/15 text-indigo-400" : "bg-cyan-500/15 text-cyan-400"
                    }`}
                  >
                    {t.type === "deposit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </span>
                  <div>
                    <p className="text-sm text-white capitalize">{t.type}</p>
                    <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">
                    {t.type === "deposit" ? "+" : "-"}${t.amount.toFixed(2)}
                  </p>
                  <p
                    className={`text-xs capitalize ${
                      t.status === "completed"
                        ? "text-mint-500"
                        : t.status === "failed"
                        ? "text-rose-500"
                        : "text-amber-500"
                    }`}
                  >
                    {t.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
