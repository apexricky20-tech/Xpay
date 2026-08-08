import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Button, FieldWrap, Select, TextInput } from "../components/Field";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

// TODO: expand as Xpay adds countries/payout providers.
const COUNTRIES = [{ code: "KE", name: "Kenya" }];

export default function CompleteProfile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [derivEmail, setDerivEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/profile", { name, country, derivEmail });
      await refresh();
      navigate("/setup-mpesa");
    } catch {
      setError("Couldn't save that — check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Complete your profile"
      subtitle="Just a couple details to finish setting up your account."
      wide
    >
      <form onSubmit={onSubmit} className="bg-ink-800/70 border border-ink-600 rounded-xl2 p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-5 text-left">
          <span className="text-xs font-medium text-slate-400">YOUR DERIV NICKNAME</span>
          <span className="id-badge">{user?.clientNickname ?? "…"}</span>
        </div>

        <FieldWrap label="Country" hint="More countries are coming soon.">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} required>
            <option value="" disabled>
              Select your country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label="Your name">
          <TextInput
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FieldWrap>

        <FieldWrap
          label="Deriv email address"
          hint="Used for withdrawal verification codes. Must match your Deriv account email."
          error={error ?? undefined}
        >
          <TextInput
            type="email"
            placeholder="email@example.com"
            value={derivEmail}
            onChange={(e) => setDerivEmail(e.target.value)}
            required
          />
        </FieldWrap>

        <Button type="submit" loading={submitting}>
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
