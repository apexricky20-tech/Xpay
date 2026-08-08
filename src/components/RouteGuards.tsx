import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const STEP_PATH: Record<string, string> = {
  profile: "/complete-profile",
  mpesa: "/setup-mpesa",
  password: "/create-password",
  complete: "/dashboard",
};

function Splash() {
  return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Loading…</div>;
}

/** Wraps the onboarding-step pages: needs a Deriv-linked session, and bounces
 *  forward/back to whichever step the account actually hasn't finished yet. */
export function RequireOnboardingStep({ step }: { step: keyof typeof STEP_PATH }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingStep !== step) return <Navigate to={STEP_PATH[user.onboardingStep]} replace />;
  return <Outlet />;
}

/** Wraps the dashboard pages: needs a fully onboarded session. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingStep !== "complete") return <Navigate to={STEP_PATH[user.onboardingStep]} replace />;
  return <Outlet />;
}
