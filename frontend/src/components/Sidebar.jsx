import { NavLink, Link } from "react-router-dom";
import {
  Building2, LayoutDashboard, Megaphone, Ticket, Calendar,
  BarChart2, Dumbbell, Users, PackageCheck,
  UserCog, ClipboardCheck, Settings, LogOut, Package, PackageSearch,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .sb-nav { overflow-y: auto; flex: 1; padding: 12px 10px; }
  .sb-nav::-webkit-scrollbar { width: 3px; }
  .sb-nav::-webkit-scrollbar-track { background: transparent; }
  .sb-nav::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }

  .sb-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    color: #64748B;
    text-decoration: none;
    transition: background 0.14s, color 0.14s;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    margin-bottom: 1px;
    box-sizing: border-box;
    border-left: 3px solid transparent;
  }
  .sb-item:hover {
    background: #F8FAFC;
    color: #0F172A;
  }
  .sb-item.active {
    background: #0F172A;
    color: #FFFFFF;
    font-weight: 600;
    border-left: 3px solid #0F172A;
    padding-left: 9px;
    border-radius: 8px;
  }
  .sb-item.active svg {
    color: #FFFFFF;
    opacity: 0.85;
  }

  .sb-logout:hover {
    background: #F1F5F9 !important;
    color: #0F172A !important;
  }
  .sb-profile:hover {
    background: #F1F5F9 !important;
  }
`;

const NAV_GROUPS = [
  {
    label: "GENERAL",
    items: [
      { to: "/",              label: "Dashboard",      Icon: LayoutDashboard, roles: null },
      { to: "/announcements", label: "Announcements",  Icon: Megaphone,       roles: null },
      { to: "/tickets",       label: "My Tickets",     Icon: Ticket,          roles: null },
      { to: "/events",        label: "Events",         Icon: Calendar,        roles: null },
      { to: "/amenities",     label: "Amenities",      Icon: Dumbbell,        roles: null },
      { to: "/polls",         label: "Polls",          Icon: BarChart2,       roles: ["resident","committee","super_admin"] },
      { to: "/lost-found",    label: "Lost & Found",   Icon: PackageSearch,   roles: null },
    ],
  },
  {
    label: "RESIDENTS",
    items: [
      { to: "/visitors/prereg", label: "Visitor Passes", Icon: Users,   roles: ["resident","committee","super_admin"] },
      { to: "/staff",           label: "My Staff",       Icon: UserCog, roles: ["resident","committee","super_admin"] },
      { to: "/deliveries/my",   label: "My Deliveries",  Icon: Package, roles: ["resident","committee","super_admin"] },
    ],
  },
  {
    label: "SECURITY",
    items: [
      { to: "/visitors",   label: "Visitor Log",  Icon: Users,        roles: ["security","committee","super_admin"] },
      { to: "/staff/gate", label: "Staff Gate",   Icon: PackageCheck, roles: ["security","committee","super_admin"] },
    ],
  },
  {
    label: "COMMITTEE",
    items: [
      { to: "/admin/approvals",     label: "Approvals",     Icon: ClipboardCheck, roles: ["committee","super_admin"] },
      { to: "/admin/society-setup", label: "Society Setup", Icon: Settings,       roles: ["committee","super_admin"] },
    ],
  },
];

const ROLE_BADGE = {
  security:    { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
  committee:   { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
  super_admin: { bg: "#0F172A", color: "#FFFFFF", border: "#0F172A" },
  resident:    { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const initials = (user?.fullName || "")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const badge = ROLE_BADGE[role] || { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0" };

  return (
    <>
      <style>{CSS}</style>
      <aside
        style={{
          width: 228,
          minWidth: 228,
          height: "100vh",
          background: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 16px 16px",
            textDecoration: "none",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34, height: 34,
              borderRadius: 10,
              background: "#0F172A",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(15,23,42,.25)",
              flexShrink: 0,
            }}
          >
            <Building2 size={17} color="#fff" strokeWidth={2} />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.5px",
            }}
          >
            AptHive
          </span>
        </Link>

        {/* ── Navigation ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map(({ label, items }) => {
            const visible = items.filter(({ roles }) => !roles || roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={label} style={{ marginBottom: 18 }}>
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.11em",
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    padding: "0 12px",
                    marginBottom: 4,
                    margin: "0 0 5px",
                  }}
                >
                  {label}
                </p>
                {visible.map(({ to, label: itemLabel, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
                  >
                    <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    {itemLabel}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom: User card + Logout ── */}
        <div
          style={{
            padding: "10px",
            borderTop: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          {/* Profile link */}
          <Link
            to="/profile"
            className="sb-profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
              marginBottom: 6,
              transition: "background 0.14s",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 34, height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0F172A, #334155)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.72rem", fontWeight: 800, color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: "0.8rem", fontWeight: 700, color: "#0F172A",
                  margin: "0 0 3px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {user?.fullName || "User"}
              </p>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.58rem", fontWeight: 700,
                  padding: "2px 7px", borderRadius: 100,
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.border}`,
                  textTransform: "capitalize",
                }}
              >
                {role?.replace("_", " ")}
              </span>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="sb-item sb-logout"
            style={{
              color: "#94A3B8",
              gap: 9,
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: "0.8rem",
            }}
          >
            <LogOut size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
