import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";

interface FieldWrapProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldWrap({ label, hint, error, children }: FieldWrapProps) {
  return (
    <label className="block text-left mb-5">
      <span className="block text-sm font-medium text-slate-300 mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-slate-500 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-rose-500 mt-1.5">{error}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-500";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} className={baseInput} {...props} />
);
TextInput.displayName = "TextInput";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, ...props }, ref) => (
    <select ref={ref} className={`${baseInput} appearance-none`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export function Button({ variant = "primary", loading, children, className = "", disabled, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand-gradient text-white shadow-glow hover:brightness-110",
    secondary: "bg-ink-700 text-white hover:bg-ink-600",
    ghost: "bg-transparent text-slate-400 hover:text-white",
  }[variant];

  return (
    <button
      className={`w-full rounded-xl py-3.5 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
