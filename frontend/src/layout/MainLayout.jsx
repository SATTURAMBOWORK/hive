import { Outlet } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { VisitorRequestPopup } from "../components/VisitorRequestPopup";

export function MainLayout() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0907" }}>
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6">
        <Outlet />
      </main>
      {/* Global popup — appears on any page when a visitor request arrives */}
      <VisitorRequestPopup />
    </div>
  );
}
