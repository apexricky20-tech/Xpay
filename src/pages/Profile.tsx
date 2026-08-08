import { useAuth } from "../lib/auth";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white font-medium">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2 px-1">Deriv account</h2>
      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 divide-y divide-ink-700 mb-6">
        <Row label="Nickname" value={user?.clientNickname} />
        <Row label="Name" value={user?.name} />
        <Row label="Deriv email" value={user?.derivEmail} />
        <Row label="Country" value={user?.country} />
      </div>

      <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2 px-1">Mobile money</h2>
      <div className="rounded-xl2 bg-ink-800/60 border border-ink-600 divide-y divide-ink-700">
        <Row label="Provider" value={user?.provider === "mpesa" ? "M-Pesa (Safaricom)" : "Airtel Money"} />
        <Row label="Phone number" value={user?.phone} />
      </div>
    </div>
  );
}
