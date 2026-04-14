import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { NotificationBell } from "./NotificationBell";

/* ─── Design tokens ───────────────────────────────────────────── */
const T = {
  bg:          "rgba(10,9,7,0.88)",
  surface:     "#111111",
  border:      "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.22)",
  gold:        "#f2f2f2",
  goldLight:   "#d7d7d7",
  textPrimary: "#f5f5f5",
  textMuted:   "rgba(245,245,245,0.45)",
};

/* ─── Injected CSS ────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

  /* Light underline slide-in from left */
  .tn-link {
    position: relative;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    color: rgba(245,245,245,0.45);
    text-decoration: none;
    padding: 4px 0;
    letter-spacing: 0.01em;
    transition: color 0.2s ease;
    white-space: nowrap;
  }
  .tn-link::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: linear-gradient(90deg, #f2f2f2, #d7d7d7);
    border-radius: 2px;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tn-link:hover {
    color: rgba(245,245,245,0.85);
  }
  .tn-link:hover::after {
    width: 100%;
  }
  .tn-link.active {
    color: #f2f2f2;
  }
  .tn-link.active::after {
    width: 100%;
    background: linear-gradient(90deg, #f2f2f2, #d7d7d7);
    box-shadow: 0 0 8px rgba(255,255,255,0.24);
  }

  /* Logo shimmer on hover */
  @keyframes logoShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .tn-logo-text-hover {
    background: linear-gradient(90deg, #ffffff 0%, #ededed 40%, #ffffff 60%, #d7d7d7 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: logoShimmer 1.8s linear infinite;
  }

  /* Mobile drawer slide */
  @keyframes drawerIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tn-drawer { animation: drawerIn 0.22s ease forwards; }

  /* Avatar ring pulse on hover */
  .tn-avatar:hover {
    box-shadow: 0 0 0 3px rgba(255,255,255,0.26), 0 0 16px rgba(255,255,255,0.12) !important;
  }

  /* Logout ghost button */
  .tn-logout {
    background: none;
    border: 1px solid rgba(245,245,245,0.1);
    color: rgba(245,245,245,0.45);
    border-radius: 9px;
    padding: 6px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .tn-logout:hover {
    border-color: rgba(255,255,255,0.25);
    color: #f2f2f2;
    background: rgba(255,255,255,0.06);
  }

  /* Hamburger button */
  .tn-ham {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(245,245,245,0.6);
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  .tn-ham:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.22);
    color: #f2f2f2;
  }
`;

/* ─── Nav link definitions ────────────────────────────────────── */
const NAV_LINKS = [
  { to: "/",                    label: "Dashboard", roles: null },
  { to: "/announcements",       label: "Notices",   roles: null },
  { to: "/tickets",             label: "Tickets",   roles: null },
  { to: "/events",              label: "Events",    roles: null },
  { to: "/amenities",           label: "Amenities", roles: null },
  { to: "/visitors",            label: "Visitors",  roles: ["security", "committee"] },
  { to: "/visitors/prereg",     label: "My Passes", roles: ["resident", "committee", "super_admin"] },
  { to: "/staff",               label: "My Staff",  roles: ["resident", "committee", "super_admin"] },
  { to: "/staff/gate",          label: "Staff Gate",roles: ["security", "committee"] },
  { to: "/polls",               label: "Polls",     roles: ["resident", "committee", "super_admin"] },
  { to: "/admin/approvals",     label: "Approvals", roles: ["committee", "super_admin"] },
  { to: "/admin/society-setup", label: "Society",   roles: ["committee", "super_admin"] },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) => `tn-link${isActive ? " active" : ""}`}
    >
      {label}
    </NavLink>
  );
}

export function TopNav() {
  const { isLoggedIn, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  const visibleLinks = NAV_LINKS.filter(({ roles }) =>
    isLoggedIn && (!roles || roles.includes(user?.role))
  );

  const initial = user?.fullName?.[0]?.toUpperCase() || "?";

  return (
    <>
      <style>{CSS}</style>
      <header
        style={{
          position:        "sticky",
          top:             0,
          zIndex:          50,
          background:      T.bg,
          backdropFilter:  "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom:    `1px solid ${T.border}`,
          fontFamily:      "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth:       "1280px",
            margin:         "0 auto",
            padding:        "0 24px",
            height:         "58px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            "16px",
          }}
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            className="tn-logo"
            style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", flexShrink: 0 }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            <div
              style={{
                width:      32, height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg,#ffffff,#d7d7d7)",
                display:    "flex", alignItems: "center", justifyContent: "center",
                boxShadow:  logoHovered
                  ? "0 4px 20px rgba(255,255,255,0.26)"
                  : "0 2px 10px rgba(255,255,255,0.12)",
                transition: "box-shadow 0.3s",
                flexShrink: 0,
              }}
            >
              <Shield size={14} color="#0a0907" strokeWidth={2.5} />
            </div>
            <span
              className={logoHovered ? "tn-logo-text-hover" : ""}
              style={logoHovered ? {} : {
                fontFamily:     "'Cormorant Garamond', serif",
                fontSize:       "1.1rem",
                fontWeight:     600,
                color:          T.textPrimary,
                letterSpacing:  "0.05em",
              }}
            >
              AptHive
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "22px",
              flex:       1,
              overflow:   "hidden",
            }}
            className="hidden md:flex"
          >
            {visibleLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} />
            ))}
          </nav>

          {/* ── Right side ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {isLoggedIn && (
              <>
                {/* Notification bell — keeps existing component, wrapped in dark context */}
                <div style={{ color: T.textMuted }}>
                  <NotificationBell />
                </div>

                {/* Profile avatar */}
                <NavLink
                  to="/profile"
                  title={user?.fullName}
                  className="tn-avatar"
                  style={({ isActive }) => ({
                    width:          34, height: 34,
                    borderRadius:   "50%",
                      background:     isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
                        border:         `1.5px solid ${isActive ? T.gold : "rgba(255,255,255,0.25)"}`,
                    display:        "flex", alignItems: "center", justifyContent: "center",
                    fontFamily:     "'DM Sans', sans-serif",
                    fontSize:       "0.78rem",
                    fontWeight:     700,
                    color:          T.gold,
                    textDecoration: "none",
                    boxShadow:      isActive ? "0 0 0 3px rgba(255,255,255,0.14)" : "none",
                    transition:     "box-shadow 0.25s, border-color 0.25s",
                  })}
                >
                  {initial}
                </NavLink>

                {/* Logout — desktop only */}
                <button
                  onClick={logout}
                  className="tn-logout"
                  style={{ display: "none" }}
                  // shown via media query workaround below
                >
                  <LogOut size={12} /> Logout
                </button>
                <button
                  onClick={logout}
                  className="tn-logout hidden-mobile"
                  style={{ display: "flex" }}
                >
                  <LogOut size={12} /> Logout
                </button>

                {/* Hamburger — mobile only */}
                <button
                  className="tn-ham md:hidden"
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  {mobileOpen
                    ? <X size={16} />
                    : <Menu size={16} />}
                </button>
              </>
            )}

            {!isLoggedIn && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  to="/login"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.84rem", fontWeight: 500,
                    color: T.textMuted, textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = T.textPrimary)}
                  onMouseLeave={(e) => (e.target.style.color = T.textMuted)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.82rem", fontWeight: 600,
                    color: "#0a0907", textDecoration: "none",
                    background: "linear-gradient(135deg,#ffffff,#d7d7d7)",
                    padding: "7px 14px", borderRadius: "9px",
                    boxShadow: "0 2px 12px rgba(255,255,255,0.18)",
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && isLoggedIn && (
          <div
            className="tn-drawer md:hidden"
            style={{
              borderTop:      `1px solid ${T.border}`,
              background:     "rgba(11,9,7,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding:        "16px 20px 20px",
            }}
          >
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {visibleLinks.map(({ to, label }) => (
                <NavItem
                  key={to}
                  to={to}
                  label={label}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div
              style={{
                marginTop:   "16px",
                paddingTop:  "16px",
                borderTop:   `1px solid rgba(255,255,255,0.08)`,
              }}
            >
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="tn-logout"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hide desktop logout on mobile via style tag */}
      <style>{`
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </>
  );
}
