import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/login"), 1400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <AuthShell eyebrow="M-Pesa ⇄ Deriv" title="">
      <div className="flex flex-col items-center gap-4 -mt-4">
        <p className="text-sm text-slate-400 max-w-[220px]">
          Move money in and out of your Deriv account in seconds.
        </p>
        <div className="flex gap-1.5 mt-2" role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ animation: `pulse-ring 1.4s ${i * 0.2}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
