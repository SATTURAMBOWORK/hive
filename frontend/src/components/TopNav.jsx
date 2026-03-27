import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

function navClass({ isActive }) {
  return isActive
    ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
    : "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200";
}

export function TopNav() {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <header className="panel mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">AptHive</h1>
        <p className="text-sm text-slate-600">Apartment community workspace</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <NavLink to="/" className={navClass}>Dashboard</NavLink>
        {!isLoggedIn ? <NavLink to="/login" className={navClass}>Login</NavLink> : null}
        {!isLoggedIn ? <NavLink to="/register" className={navClass}>Register</NavLink> : null}
        {isLoggedIn ? <button className="btn-muted" onClick={logout}>Logout</button> : null}
      </nav>
      {isLoggedIn ? (
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
          {user?.fullName}
        </p>
      ) : null}
    </header>
  );
}
