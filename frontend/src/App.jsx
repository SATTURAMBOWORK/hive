import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layout/MainLayout";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage";
import { AmenitiesPage } from "./pages/AmenitiesPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SocietySetupPage } from "./pages/SocietySetupPage";
import { TicketsPage } from "./pages/TicketsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VisitorLogPage } from "./pages/VisitorLogPage";
import { VisitorPreRegPage } from "./pages/VisitorPreRegPage";
import { StaffPage } from "./pages/StaffPage";
import { StaffGatePage } from "./pages/StaffGatePage";
import { PollsPage } from "./pages/PollsPage";
import { useAuth } from "./components/AuthContext";

function ProtectedDashboard() {
  const { isLoggedIn, user, isMembershipApproved, isMembershipLoading } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  if (isMembershipLoading) {
    return <p className="mx-auto mt-8 max-w-3xl text-sm text-slate-600">Loading profile...</p>;
  }

  if (user?.role === "resident" && !isMembershipApproved) {
    return <Navigate to="/onboarding" replace />;
  }

  return <DashboardPage />;
}

function ProtectedOnboarding() {
  const { isLoggedIn, user, isMembershipApproved, isMembershipLoading } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  if (isMembershipLoading) {
    return <p className="mx-auto mt-8 max-w-3xl text-sm text-slate-600">Loading profile...</p>;
  }

  if (user?.role !== "resident") {
    return <Navigate to="/" replace />;
  }

  if (isMembershipApproved) {
    return <Navigate to="/" replace />;
  }

  return <OnboardingPage />;
}

function ProtectedFeature({ children }) {
  const { isLoggedIn, user, isMembershipApproved, isMembershipLoading } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  if (isMembershipLoading) {
    return <p className="mx-auto mt-8 max-w-3xl text-sm text-slate-600">Loading profile...</p>;
  }

  if (user?.role === "resident" && !isMembershipApproved) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<ProtectedDashboard />} />
        <Route path="/onboarding" element={<ProtectedOnboarding />} />
        <Route path="/announcements" element={<ProtectedFeature><AnnouncementsPage /></ProtectedFeature>} />
        <Route path="/tickets" element={<ProtectedFeature><TicketsPage /></ProtectedFeature>} />
        <Route path="/events" element={<ProtectedFeature><EventsPage /></ProtectedFeature>} />
        <Route path="/amenities" element={<ProtectedFeature><AmenitiesPage /></ProtectedFeature>} />
        <Route path="/admin/approvals" element={<ProtectedFeature><AdminApprovalsPage /></ProtectedFeature>} />
        <Route path="/admin/society-setup" element={<ProtectedFeature><SocietySetupPage /></ProtectedFeature>} />
        <Route path="/profile" element={<ProtectedFeature><ProfilePage /></ProtectedFeature>} />
        <Route path="/visitors" element={<ProtectedFeature><VisitorLogPage /></ProtectedFeature>} />
        <Route path="/visitors/prereg" element={<ProtectedFeature><VisitorPreRegPage /></ProtectedFeature>} />
        <Route path="/staff" element={<ProtectedFeature><StaffPage /></ProtectedFeature>} />
        <Route path="/staff/gate" element={<ProtectedFeature><StaffGatePage /></ProtectedFeature>} />
        <Route path="/polls" element={<ProtectedFeature><PollsPage /></ProtectedFeature>} />
      </Route>
    </Routes>
  );
}
