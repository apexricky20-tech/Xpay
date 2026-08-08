import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, History as HistoryIcon } from "lucide-react";
import { api, type Transaction } from "../lib/api";

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    api.get<Transaction[]>("/transactions").then(setTransactions);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">History</h1>

      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600">
        {transactions === null ? (
          <p className="text-center text-sm text-slate-500 py-16">Loading…</p>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <HistoryIcon size={28} className="mb-3 opacity-60" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-700">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      t.type === "deposit" ? "bg-indigo-500/15 text-indigo-400" : "bg-cyan-500/15 text-cyan-400"
                    }`}
                  >
                    {t.type === "deposit" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
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
                      t.status === "completed" ? "text-mint-500" : t.status === "failed" ? "text-rose-500" : "text-amber-500"
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
