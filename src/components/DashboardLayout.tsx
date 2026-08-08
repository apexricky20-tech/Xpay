import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth";

const TABS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/deposit", label: "Deposit" },
  { to: "/withdraw", label: "Withdraw" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
];

export function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-700/80 bg-ink-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden sm:flex items-center gap-1">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-gradient text-white"
                      : "text-slate-400 hover:text-white hover:bg-ink-700/60"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            aria-label="Log out"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-ink-700/60 text-slate-300 hover:text-white hover:bg-ink-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
        {/* Mobile tab bar */}
        <nav className="sm:hidden flex overflow-x-auto gap-1 px-4 pb-3 -mt-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-brand-gradient text-white" : "text-slate-400"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
