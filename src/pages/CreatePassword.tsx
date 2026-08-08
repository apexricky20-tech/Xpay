import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { AuthShell } from "../components/AuthShell";
import { Button, FieldWrap, TextInput } from "../components/Field";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { rememberAccount } from "../lib/remembered";

export default function CreatePassword() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    setError(null);
    try {
      // Server hashes with a memory-hard KDF (see functions/api/lib/session.ts) —
      // the plaintext never touches storage.
      const { name, email } = await api.post<{ name: string; email: string }>("/password", { password });
      rememberAccount({ name, email });
      await refresh();
      navigate("/dashboard");
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create Password" subtitle="Please create and confirm your password to continue">
      <form onSubmit={onSubmit} className="text-left">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
          <Lock className="text-indigo-400" size={24} />
        </div>

        <FieldWrap label="Password">
          <TextInput
            type="password"
            placeholder="Enter password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </FieldWrap>

        <FieldWrap label="Confirm Password" error={error ?? undefined}>
          <TextInput
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </FieldWrap>

        <Button type="submit" loading={submitting}>
          Complete Setup
        </Button>
      </form>
    </AuthShell>
  );
}
