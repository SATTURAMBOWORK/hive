import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { NotificationBell } from "./NotificationBell";

const NAV_LINKS = [
  { to: "/",                    label: "Dashboard",    roles: null },
  { to: "/announcements",       label: "Notices",      roles: null },
  { to: "/tickets",             label: "Tickets",      roles: null },
  { to: "/events",              label: "Events",       roles: null },
  { to: "/amenities",           label: "Amenities",    roles: null },
  { to: "/visitors",            label: "Visitors",     roles: ["security", "committee", "super_admin"] },
  { to: "/admin/approvals",     label: "Approvals",    roles: ["committee", "super_admin"] },
  { to: "/admin/society-setup", label: "Society",      roles: ["committee", "super_admin"] },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
          isActive
            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function TopNav() {
  const { isLoggedIn, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(({ roles }) =>
    isLoggedIn && (!roles || roles.includes(user?.role))
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-black text-slate-900 tracking-tight" style={{ fontFamily: "Nunito, sans-serif" }}>
            SocietyHub
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map(({ to, label }) => (
            <NavItem key={to} to={to} label={label} />
          ))}
          {!isLoggedIn && (
            <>
              <NavItem to="/login" label="Login" />
              <Link
                to="/register"
                className="ml-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        {isLoggedIn && (
          <div className="flex items-center gap-2">
            <NotificationBell />

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                }`
              }
              title={user?.fullName}
            >
              {user?.fullName?.[0]?.toUpperCase() || "?"}
            </NavLink>

            <button
              onClick={logout}
              className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 md:block"
            >
              Logout
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        )}

        {!isLoggedIn && (
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/login" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Login
            </Link>
            <Link to="/register" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {visibleLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} onClick={() => setMobileOpen(false)} />
            ))}
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
