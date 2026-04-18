import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";
import { VisitorRequestPopup } from "../components/VisitorRequestPopup";

export function MainLayout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Fixed sidebar ── */}
      <Sidebar />

      {/* ── Scrollable content area ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#F7F9FF",
          backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Sticky topbar inside the scroll area */}
        <TopNav />

        {/* Page content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Global popup — appears on any page when a visitor request arrives */}
      <VisitorRequestPopup />
    </div>
  );
}
