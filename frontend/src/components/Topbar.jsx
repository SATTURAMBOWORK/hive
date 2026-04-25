import { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { Building2, Search, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "./AuthContext";
import { NotificationBell } from "./NotificationBell";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .tb-root {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #111111;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  .tb-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 28px;
    height: 64px;
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  /* ── Logo ── */
  .tb-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    padding-right: 24px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.08);
    margin-right: 8px;
  }

  .tb-logo-box {
    width: 32px;
    height: 32px;
    background: #DC2626;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 12px rgba(220,38,38,0.4);
  }

  .tb-logo-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.3px;
    line-height: 1;
  }

  /* ── Nav links ── */
  .tb-nav {
    display: flex;
    align-items: stretch;
    flex: 1;
    gap: 0;
  }

  .tb-link {
    display: flex;
    align-items: center;
    padding: 0 13px;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: color 0.18s;
    position: relative;
    white-space: nowrap;
    cursor: pointer;
  }

  .tb-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 13px;
    right: 13px;
    height: 2px;
    background: #4F46E5;
    border-radius: 2px 2px 0 0;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1);
  }

  .tb-link:hover { color: #FFFFFF; }
  .tb-link.active { color: #FFFFFF; }
  .tb-link:hover::after { transform: scaleX(1); }
  .tb-link.active::after { transform: scaleX(1); }

  /* ── Dropdown wrapper ── */
  .tb-drop-outer {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .tb-drop-trigger {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 13px;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    background: none;
    height: 100%;
    position: relative;
    white-space: nowrap;
    transition: color 0.18s;
  }

  .tb-drop-trigger::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 13px;
    right: 13px;
    height: 2px;
    background: #4F46E5;
    border-radius: 2px 2px 0 0;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1);
  }

  .tb-drop-outer:hover .tb-drop-trigger { color: #FFFFFF; }
  .tb-drop-outer:hover .tb-drop-trigger::after { transform: scaleX(1); }

  .tb-chevron {
    transition: transform 0.22s ease;
    opacity: 0.5;
  }
  .tb-drop-outer:hover .tb-chevron {
    transform: rotate(180deg);
    opacity: 1;
  }

  .tb-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 196px;
    background: #1A1A1A;
    border: 1px solid rgba(255,255,255,0.1);
    border-top: 2px solid #4F46E5;
    border-radius: 0 0 12px 12px;
    padding: 6px;
    box-shadow: 0 28px 56px rgba(0,0,0,0.55);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.18s ease, transform 0.18s ease;
    z-index: 200;
  }

  .tb-drop-outer:hover .tb-dropdown {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
  }

  .tb-drop-link {
    display: flex;
    align-items: center;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    letter-spacing: 0.03em;
  }

  .tb-drop-link:hover,
  .tb-drop-link.active {
    background: rgba(79,70,229,0.15);
    color: #818CF8;
  }

  .tb-drop-divider {
    height: 1px;
    background: rgba(255,255,255,0.07);
    margin: 4px 0;
  }

  /* ── Right controls ── */
  .tb-right {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 16px;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.08);
    margin-left: 8px;
  }

  .tb-search {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 7px 11px;
    width: 165px;
    transition: background 0.18s, border-color 0.18s;
  }

  .tb-search:focus-within {
    background: rgba(255,255,255,0.1);
    border-color: rgba(79,70,229,0.5);
  }

  .tb-search-input {
    background: none;
    border: none;
    outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.79rem;
    color: #FFFFFF;
    width: 100%;
  }

  .tb-search-input::placeholder { color: rgba(255,255,255,0.28); }

  .tb-bell {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    transition: background 0.18s, border-color 0.18s, color 0.18s;
    cursor: pointer;
  }

  .tb-bell:hover {
    background: rgba(79,70,229,0.15);
    border-color: rgba(79,70,229,0.3);
    color: #818CF8;
  }

  /* ── Profile dropdown ── */
  .tb-profile-outer {
    position: relative;
  }

  .tb-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #4F46E5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.66rem;
    font-weight: 800;
    color: #fff;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.18s, box-shadow 0.18s;
    flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(79,70,229,0.35);
  }

  .tb-profile-outer:hover .tb-avatar {
    border-color: rgba(79,70,229,0.6);
    box-shadow: 0 0 0 4px rgba(79,70,229,0.15);
  }

  .tb-profile-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 210px;
    background: #1A1A1A;
    border: 1px solid rgba(255,255,255,0.1);
    border-top: 2px solid #4F46E5;
    border-radius: 0 0 12px 12px;
    padding: 6px;
    box-shadow: 0 28px 56px rgba(0,0,0,0.55);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.18s ease, transform 0.18s ease;
    z-index: 200;
  }

  .tb-profile-dropdown.open {
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
  }

  .tb-profile-head {
    padding: 10px 12px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 4px;
  }

  .tb-profile-name {
    font-size: 0.84rem;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tb-profile-role {
    font-size: 0.68rem;
    color: #818CF8;
    font-weight: 700;
    text-transform: capitalize;
    letter-spacing: 0.04em;
  }

  .tb-profile-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    letter-spacing: 0.02em;
  }

  .tb-profile-item:hover {
    background: rgba(79,70,229,0.15);
    color: #818CF8;
  }
`;

/* ─── Nav config ─────────────────────────────── */
const MAIN_LINKS = [
  { to: "/",            label: "Dashboard",     end: true },
  { to: "/announcements", label: "Announcements" },
  { to: "/events",      label: "Events" },
  { to: "/amenities",   label: "Amenities",     roles: ["resident","committee","super_admin"] },
  { to: "/tickets",     label: "Tickets",       roles: ["resident","committee","super_admin"] },
];

const COMMUNITY_LINKS = [
  { to: "/polls",           label: "Polls",           roles: ["resident","committee","super_admin"] },
  { to: "/lost-found",      label: "Lost & Found",    roles: null },
  { to: "/visitors/prereg", label: "Visitor Passes",  roles: ["resident","committee","super_admin"] },
  { to: "/staff",           label: "My Staff",         roles: ["resident","committee","super_admin"] },
  { to: "/deliveries/my",   label: "My Deliveries",   roles: ["resident","committee","super_admin"] },
];

const SECURITY_LINKS = [
  { to: "/visitors",        label: "Visitor Log",    roles: ["security","super_admin"] },
  { to: "/staff/gate",      label: "Staff Gate",     roles: ["security","super_admin"] },
  { to: "/deliveries/gate", label: "Delivery Gate",  roles: ["security","super_admin"] },
];

const ADMIN_LINKS = [
  { to: "/admin/approvals",     label: "Approvals",    roles: ["committee","super_admin"] },
  { to: "/admin/society-setup", label: "Society Setup", roles: ["committee","super_admin"] },
];

function filterLinks(links, role) {
  return links.filter(l => !l.roles || l.roles.includes(role));
}

/* ─── Dropdown ───────────────────────────────── */
function NavDropdown({ label, links, role }) {
  const visible = filterLinks(links, role);
  if (!visible.length) return null;
  return (
    <div className="tb-drop-outer">
      <button className="tb-drop-trigger">
        {label}
        <ChevronDown size={12} className="tb-chevron" />
      </button>
      <div className="tb-dropdown">
        {visible.map((l, i) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `tb-drop-link${isActive ? " active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────── */
export function Topbar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.fullName || "")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const showSecurity  = ["security","super_admin"].includes(role);
  const showAdmin     = ["committee","super_admin"].includes(role);
  const showCommunity = ["resident","committee","super_admin"].includes(role);

  return (
    <>
      <style>{CSS}</style>
      <header className="tb-root">
        <div className="tb-inner">

          {/* Logo */}
          <Link to="/" className="tb-logo">
            <div className="tb-logo-box">
              <Building2 size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="tb-logo-name">AptHive</span>
          </Link>

          {/* Main nav */}
          <nav className="tb-nav">
            {filterLinks(MAIN_LINKS, role).map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `tb-link${isActive ? " active" : ""}`}
              >
                {l.label}
              </NavLink>
            ))}

            {showCommunity && (
              <NavDropdown label="Community" links={COMMUNITY_LINKS} role={role} />
            )}

            {showSecurity && (
              <NavDropdown label="Security" links={SECURITY_LINKS} role={role} />
            )}

            {showAdmin && (
              <NavDropdown label="Admin" links={ADMIN_LINKS} role={role} />
            )}
          </nav>

          {/* Right controls */}
          <div className="tb-right">
            {/* Search */}
            <div className="tb-search">
              <Search size={13} color="rgba(255,255,255,0.35)" strokeWidth={2} />
              <input className="tb-search-input" placeholder="Search…" />
            </div>

            {/* Notification bell */}
            <div className="tb-bell">
              <NotificationBell />
            </div>

            {/* Profile */}
            <div className="tb-profile-outer" ref={profileRef}>
              <div
                className="tb-avatar"
                onClick={() => setProfileOpen(o => !o)}
                title="Account"
              >
                {initials}
              </div>
              <div className={`tb-profile-dropdown${profileOpen ? " open" : ""}`}>
                <div className="tb-profile-head">
                  <p className="tb-profile-name">{user?.fullName || "User"}</p>
                  <span className="tb-profile-role">{role?.replace("_", " ")}</span>
                </div>
                <Link to="/profile" className="tb-profile-item" onClick={() => setProfileOpen(false)}>
                  <User size={13} /> My Profile
                </Link>
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="tb-profile-item"
                  style={{ color: "rgba(255,100,100,0.8)" }}
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}
