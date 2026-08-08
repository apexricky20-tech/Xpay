import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ReturningLogin from "./pages/ReturningLogin";
import CompleteProfile from "./pages/CompleteProfile";
import SetupMpesa from "./pages/SetupMpesa";
import CreatePassword from "./pages/CreatePassword";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { DashboardLayout } from "./components/DashboardLayout";
import { RequireAuth, RequireOnboardingStep } from "./components/RouteGuards";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/welcome-back" element={<ReturningLogin />} />

      <Route element={<RequireOnboardingStep step="profile" />}>
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Route>
      <Route element={<RequireOnboardingStep step="mpesa" />}>
        <Route path="/setup-mpesa" element={<SetupMpesa />} />
      </Route>
      <Route element={<RequireOnboardingStep step="password" />}>
        <Route path="/create-password" element={<CreatePassword />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}
