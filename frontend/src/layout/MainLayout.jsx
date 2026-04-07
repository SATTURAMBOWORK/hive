import { Outlet } from "react-router-dom";
import { TopNav } from "../components/TopNav";

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
