import type { ReactNode } from "react";
import { Logo } from "./Logo";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  wide?: boolean;
}

export function AuthShell({ eyebrow, title, subtitle, children, wide }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* Ambient signature orb — the brand gradient, softly drifting behind the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-brand-gradient opacity-20 blur-[110px] animate-drift"
      />

      <div className="relative mb-8">
        <Logo />
      </div>

      <div className={`relative w-full ${wide ? "max-w-md" : "max-w-sm"} text-center`}>
        {eyebrow && (
          <p className="text-xs font-medium tracking-[0.2em] text-cyan-400 uppercase mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mb-8">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
