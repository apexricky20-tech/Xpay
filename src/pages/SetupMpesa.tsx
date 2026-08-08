import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { AuthShell } from "../components/AuthShell";
import { Button, FieldWrap } from "../components/Field";
import { api, type MoneyProvider } from "../lib/api";

const PROVIDERS: { id: MoneyProvider; label: string; network: string; accent: string }[] = [
  { id: "mpesa", label: "M-Pesa", network: "Safaricom", accent: "border-mint-500 text-mint-500" },
  { id: "airtel", label: "Airtel Money", network: "Airtel", accent: "border-rose-500 text-rose-500" },
];

export default function SetupMpesa() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<MoneyProvider>("mpesa");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/mpesa-profile", { phone: `+254${phone}`, provider });
      navigate("/create-password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Set Up Mobile Money" subtitle="Choose your country and enter your number">
      <form onSubmit={onSubmit} className="text-left">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
          <Phone className="text-cyan-400" size={26} />
        </div>

        <FieldWrap label="Phone Number">
          <div className="flex items-center rounded-xl bg-ink-800 border border-ink-600 focus-within:border-indigo-500 overflow-hidden">
            <span className="px-4 py-3 text-slate-400 text-sm border-r border-ink-600">KE +254</span>
            <input
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 outline-none"
              placeholder="7XXXXXXXX"
              pattern="[0-9]{9}"
              maxLength={9}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
        </FieldWrap>

        <span className="block text-sm font-medium text-slate-300 mb-2">Mobile Money Provider</span>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PROVIDERS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-xl border px-4 py-4 text-center transition-colors ${
                provider === p.id ? p.accent + " bg-ink-800" : "border-ink-600 text-slate-400 hover:border-ink-500"
              }`}
            >
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{p.network}</span>
            </button>
          ))}
        </div>

        <Button type="submit" loading={submitting}>
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
