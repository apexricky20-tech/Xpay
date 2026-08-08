import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Button, FieldWrap, TextInput } from "../components/Field";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getRememberedAccount, forgetAccount, rememberAccount } from "../lib/remembered";

export default function ReturningLogin() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const remembered = getRememberedAccount();

  const [email, setEmail] = useState(remembered?.email ?? "");
  const [password, setPassword] = useState("");
  const [showEmailField, setShowEmailField] = useState(!remembered);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ name: string }>("/login", { email, password });
      rememberAccount({ name: res.name, email });
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Incorrect email or password." : "Couldn't log in — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={remembered && !showEmailField ? `Welcome back, ${remembered.name}` : "Log in"}
      subtitle="Enter your password to continue"
    >
      <form onSubmit={onSubmit} className="bg-ink-800/70 border border-ink-600 rounded-xl2 p-6 backdrop-blur text-left">
        {showEmailField && (
          <FieldWrap label="Email">
            <TextInput
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldWrap>
        )}
        {!showEmailField && (
          <FieldWrap label="Email">
            <TextInput value={email} disabled className="opacity-60" />
          </FieldWrap>
        )}

        <FieldWrap label="Password" error={error ?? undefined}>
          <TextInput
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </FieldWrap>

        <Button type="submit" loading={submitting}>
          Login
        </Button>

        {!showEmailField && (
          <button
            type="button"
            onClick={() => {
              forgetAccount();
              setShowEmailField(true);
              setEmail("");
            }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-4"
          >
            Use a different account
          </button>
        )}
      </form>
    </AuthShell>
  );
}
