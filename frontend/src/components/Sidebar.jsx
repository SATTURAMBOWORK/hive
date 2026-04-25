import { NavLink, Link } from "react-router-dom";
import {
  Building2, LayoutDashboard, Megaphone, Ticket, Calendar,
  BarChart2, Dumbbell, Users, PackageCheck,
  UserCog, ClipboardCheck, Settings, LogOut, Package, PackageSearch,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  .sb-shell {
    position: relative;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
    overflow: hidden;
  }

  .sb-shell::before,
  .sb-shell::after {
    content: '';
    position: absolute;
    inset: auto;
    pointer-events: none;
    border-radius: 999px;
    filter: blur(2px);
    opacity: 0.65;
  }

  .sb-shell::before {
    width: 180px; height: 180px;
    right: -90px; top: -60px;
    background: radial-gradient(circle, rgba(232,137,12,0.18), transparent 68%);
  }

  .sb-shell::after {
    width: 220px; height: 220px;
    left: -120px; bottom: 160px;
    background: radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%);
  }

  .sb-brand {
    position: relative;
    background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94));
    backdrop-filter: blur(14px);
  }

  .sb-brand::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(232,137,12,0.55), rgba(37,99,235,0.12), rgba(15,23,42,0.04));
  }

  .sb-brand-mark {
    position: relative;
    overflow: hidden;
  }

  .sb-brand-mark::before {
    content: '';
    position: absolute;
    inset: -30%;
    background: linear-gradient(120deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0));
    transform: translateX(-120%) rotate(18deg);
    transition: transform 0.55s ease;
  }

  .sb-brand:hover .sb-brand-mark::before {
    transform: translateX(120%) rotate(18deg);
  }

  .sb-brand-sub {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #94A3B8;
  }

  .sb-nav {
    overflow-y: auto;
    flex: 1;
    padding: 10px 8px 8px;
  }
  .sb-nav::-webkit-scrollbar { width: 4px; }
  .sb-nav::-webkit-scrollbar-track { background: transparent; }
  .sb-nav::-webkit-scrollbar-thumb { background: #E8EDF4; border-radius: 999px; }

  .sb-group + .sb-group { margin-top: 14px; }

  .sb-group-label {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: #A3AAB8;
    text-transform: uppercase;
    padding: 0 12px;
    margin: 0 0 6px;
  }

  .sb-item {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    text-align: left;
    padding: 9px 12px;
    margin-bottom: 4px;
    border: 1px solid transparent;
    border-radius: 14px;
    background: transparent;
    color: #64748B;
    font-size: 0.79rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    box-sizing: border-box;
  }

  .sb-item::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(247,249,255,0.98));
    opacity: 0;
    transform: translateX(-8px) scale(0.98);
    transition: opacity 0.22s ease, transform 0.22s ease;
    z-index: 0;
  }

  .sb-item:hover {
    color: #111827;
    transform: translateX(3px);
  }

  .sb-item:hover::before {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  .sb-item.active {
    color: #111827;
    border-color: rgba(232,137,12,0.20);
    box-shadow: 0 10px 24px rgba(15,23,42,0.06);
    transform: translateX(3px);
  }

  .sb-item.active::before {
    opacity: 1;
    transform: translateX(0) scale(1);
    background: linear-gradient(135deg, rgba(255,248,240,1), rgba(255,255,255,1));
  }

  .sb-item:active { transform: translateX(3px) scale(0.985); }
  .sb-item > * { position: relative; z-index: 1; }

  .sb-icon {
    transition: transform 0.22s ease, color 0.22s ease;
  }

  .sb-item:hover .sb-icon {
    transform: translateY(-1px) scale(1.1);
    color: #E8890C;
  }

  .sb-item.active .sb-icon {
    color: #E8890C;
  }

  .sb-item-text {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .sb-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sb-item-caret {
    color: #CBD5E1;
    font-size: 0.82rem;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
  }

  .sb-item:hover .sb-item-caret,
  .sb-item.active .sb-item-caret {
    opacity: 1;
    transform: translateX(0);
    color: #E8890C;
  }

  .sb-logout {
    margin-top: 4px;
  }

  .sb-logout:hover {
    color: #B42318 !important;
  }

  .sb-logout:hover::before {
    background: linear-gradient(135deg, rgba(255,241,241,0.98), rgba(255,255,255,0.98)) !important;
  }

  .sb-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 11px;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));
    border: 1px solid #E9EEF5;
    text-decoration: none;
    margin-bottom: 6px;
    box-shadow: 0 12px 28px rgba(15,23,42,0.05);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .sb-profile:hover {
    transform: translateY(-2px);
    border-color: rgba(232,137,12,0.25) !important;
    box-shadow: 0 18px 30px rgba(15,23,42,0.08), 0 0 0 4px rgba(232,137,12,0.08);
  }

  .sb-profile-name {
    font-size: 0.78rem;
    font-weight: 800;
    color: #111827;
    margin: 0 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sb-profile-role {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.58rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: capitalize;
  }

  .sb-logout-wrap {
    padding-top: 8px;
    border-top: 1px solid #EEF2F7;
  }
`;

const NAV_GROUPS = [
  {
    label: "GENERAL",
    items: [
      { to: "/",              label: "Dashboard",     Icon: LayoutDashboard, roles: null },
      { to: "/announcements", label: "Announcements", Icon: Megaphone,       roles: null },
      { to: "/tickets",       label: "My Tickets",    Icon: Ticket,          roles: null },
      { to: "/events",        label: "Events",        Icon: Calendar,        roles: null },
      { to: "/amenities",     label: "Amenities",     Icon: Dumbbell,        roles: null },
      { to: "/polls",         label: "Polls",         Icon: BarChart2,       roles: ["resident","committee","super_admin"] },
      { to: "/lost-found",    label: "Lost & Found",  Icon: PackageSearch,   roles: null },
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
      { to: "/visitors",   label: "Visitor Log", Icon: Users,        roles: ["security"] },
      { to: "/staff/gate", label: "Staff Gate",  Icon: PackageCheck, roles: ["security"] },
    ],
  },
  {
    label: "COMMITTEE",
    items: [
      { to: "/admin/approvals",     label: "Approvals",    Icon: ClipboardCheck, roles: ["committee","super_admin"] },
      { to: "/admin/society-setup", label: "Society Setup", Icon: Settings,      roles: ["committee","super_admin"] },
    ],
  },
];

const ROLE_BADGE = {
  security:    { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  committee:   { bg: "#FFF8F0", color: "#E8890C", border: "#FDECC8" },
  super_admin: { bg: "#111827", color: "#FFFFFF", border: "#111827" },
  resident:    { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const initials = (user?.fullName || "")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const badge = ROLE_BADGE[role] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };

  return (
    <>
      <style>{CSS}</style>
      <aside className="sb-shell" style={{
        width: 228, minWidth: 228, height: "100vh",
        background: "#FFFFFF", borderRight: "1px solid #EAEFF5",
        display: "flex", flexDirection: "column", flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "10px 0 30px rgba(15,23,42,0.04)",
      }}>

        {/* ── Logo ── */}
        <Link to="/" className="sb-brand" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "18px 16px 16px", textDecoration: "none",
          borderBottom: "1px solid #F0F0F0", flexShrink: 0,
        }}>
          <div className="sb-brand-mark" style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #E8890C 0%, #C97508 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(232,137,12,.3)", flexShrink: 0,
          }}>
            <Building2 size={17} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="sb-brand-sub">AptHive Workspace</span>
            <span style={{
              display: "block",
              fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.05rem", fontWeight: 800,
            color: "#111827", letterSpacing: "-0.5px", lineHeight: 1,
            }}>
              AptHive
            </span>
          </div>
        </Link>

        {/* ── Navigation ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map(({ label, items }) => {
            const visible = items.filter(({ roles }) => !roles || roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={label} className="sb-group">
                <p className="sb-group-label">
                  {label}
                </p>
                {visible.map(({ to, label: itemLabel, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
                  >
                    <Icon size={14} strokeWidth={1.8} className="sb-icon" style={{ flexShrink: 0 }} />
                    <span className="sb-item-text">
                      <span className="sb-item-label">{itemLabel}</span>
                      <span className="sb-item-caret">→</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom: User card + Logout ── */}
        <div style={{ padding: "10px", flexShrink: 0 }}>

          {/* Profile link */}
          <Link to="/profile" className="sb-profile">
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #E8890C, #C97508)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.66rem", fontWeight: 800, color: "#fff",
              boxShadow: "0 2px 8px rgba(232,137,12,.25)",
            }}>
              {initials}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="sb-profile-name">
                {user?.fullName || "User"}
              </p>
              <span
                className="sb-profile-role"
                style={{
                  background: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                }}
              >
                {role?.replace("_", " ")}
              </span>
            </div>
          </Link>

          {/* Logout */}
          <div className="sb-logout-wrap">
          <button
            onClick={logout}
            className="sb-item sb-logout"
            style={{ color: "#9CA3AF", gap: 8, padding: "8px 12px", borderRadius: 14, fontSize: "0.76rem" }}
          >
            <LogOut size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            Sign out
          </button>
          </div>
        </div>
      </aside>
    </>
  );
}
