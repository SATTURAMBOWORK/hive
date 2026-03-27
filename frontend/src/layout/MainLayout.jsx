import { Outlet } from "react-router-dom";
import { TopNav } from "../components/TopNav";

export function MainLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
      <TopNav />
      <main className="mt-5">
        <Outlet />
      </main>
    </div>
  );
}
