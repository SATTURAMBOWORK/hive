import { Outlet } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { VisitorRequestPopup } from "../components/VisitorRequestPopup";

export function MainLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#F3F3F3", display: "flex", flexDirection: "column" }}>
      <Topbar />
      <main style={{ flex: 1, overflowX: "hidden" }}>
        <Outlet />
      </main>
      <VisitorRequestPopup />
    </div>
  );
}
