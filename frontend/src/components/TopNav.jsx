import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { NotificationBell } from "./NotificationBell";

function navClass({ isActive }) {
  return isActive
    ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
    : "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200";
}

export function TopNav() {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <header className="panel mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <nav className="flex flex-wrap items-center gap-2">
        {isLoggedIn ? <NavLink to="/" className={navClass}>Dashboard</NavLink> : null}
        {isLoggedIn ? <NavLink to="/announcements" className={navClass}>Announcements</NavLink> : null}
        {isLoggedIn ? <NavLink to="/tickets" className={navClass}>Tickets</NavLink> : null}
        {isLoggedIn ? <NavLink to="/events" className={navClass}>Events</NavLink> : null}
        {isLoggedIn ? <NavLink to="/amenities" className={navClass}>Amenities</NavLink> : null}
        {isLoggedIn && ["committee", "super_admin"].includes(user?.role) ? (
          <NavLink to="/admin/approvals" className={navClass}>Approvals</NavLink>
        ) : null}
        {isLoggedIn && ["committee", "super_admin"].includes(user?.role) ? (
          <NavLink to="/admin/society-setup" className={navClass}>Society Setup</NavLink>
        ) : null}
        {!isLoggedIn ? <NavLink to="/login" className={navClass}>Login</NavLink> : null}
        {!isLoggedIn ? <NavLink to="/register" className={navClass}>Register</NavLink> : null}
        {isLoggedIn ? <button className="btn-muted" onClick={logout}>Logout</button> : null}
      </nav>

      {isLoggedIn && (
        <div className="flex items-center gap-3">
          <NotificationBell />
          <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
            {user?.fullName}
          </p>
        </div>
      )}
    </header>
  );
}
