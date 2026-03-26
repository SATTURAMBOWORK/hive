import { Outlet } from "react-router-dom";
import { TopNav } from "../components/TopNav";

export function MainLayout() {
  return (
    <div className="layout-shell">
      <TopNav />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
