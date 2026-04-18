import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { useAuth } from "./AuthContext";
import { NotificationBell } from "./NotificationBell";

const PAGE_META = {
  "/":                    { title: "Dashboard",          subtitle: "Your community at a glance" },
  "/announcements":       { title: "Announcements",      subtitle: "Society notices & updates" },
  "/tickets":             { title: "My Tickets",         subtitle: "Raise and track maintenance requests" },
  "/events":              { title: "Events",             subtitle: "Upcoming community events" },
  "/amenities":           { title: "Amenities",          subtitle: "Book club facilities" },
  "/polls":               { title: "Polls",              subtitle: "Community decisions & voting" },
  "/visitors":            { title: "Visitor Log",        subtitle: "Today's visitor activity" },
  "/visitors/prereg":     { title: "Visitor Passes",     subtitle: "Pre-register your guests" },
  "/staff":               { title: "My Staff",           subtitle: "Manage household staff" },
  "/staff/gate":          { title: "Staff Gate",         subtitle: "Gate entry & exit log" },
  "/admin/approvals":     { title: "Approvals",          subtitle: "Pending membership requests" },
  "/admin/society-setup": { title: "Society Setup",      subtitle: "Configure your society" },
  "/profile":             { title: "My Profile",         subtitle: "Account & preferences" },
  "/onboarding":          { title: "Welcome",            subtitle: "Set up your account" },
};

const CSS = `
  .tn-search-input {
    background: none;
    border: none;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 400;
    color: #0F172A;
    width: 100%;
  }
  .tn-search-input::placeholder { color: #94A3B8; }

  .tn-search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 8px 12px;
    width: 220px;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .tn-search-wrap:focus-within {
    background: #fff;
    border-color: #94A3B8;
    box-shadow: 0 0 0 3px rgba(15,23,42,.06);
  }

  .tn-avatar-link {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0F172A, #334155);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem; font-weight: 800; color: #fff;
    text-decoration: none;
    flex-shrink: 0;
    border: 2px solid transparent;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .tn-avatar-link:hover {
    border-color: #94A3B8;
    box-shadow: 0 0 0 3px rgba(15,23,42,.08);
  }
  .tn-avatar-link.active {
    border-color: #0F172A;
    box-shadow: 0 0 0 3px rgba(15,23,42,.12);
  }
`;

export function TopNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const meta = PAGE_META[pathname] || { title: "AptHive", subtitle: "" };

  const initials = (user?.fullName || "")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <>
      <style>{CSS}</style>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(247,249,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 28px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Page title ── */}
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "1.18rem",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.4px",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p
              style={{
                fontSize: "0.72rem",
                color: "#94A3B8",
                margin: 0,
                fontWeight: 400,
                lineHeight: 1,
              }}
            >
              {meta.subtitle}
            </p>
          )}
        </div>

        {/* ── Right controls ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Search */}
          <div className="tn-search-wrap">
            <Search size={14} color="#94A3B8" strokeWidth={2} style={{ flexShrink: 0 }} />
            <input
              className="tn-search-input"
              placeholder="Search…"
              type="text"
            />
          </div>

          {/* Notification bell */}
          <div
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B",
              flexShrink: 0,
            }}
          >
            <NotificationBell />
          </div>

          {/* Avatar */}
          <NavLink
            to="/profile"
            className={({ isActive }) => `tn-avatar-link${isActive ? " active" : ""}`}
            title={user?.fullName}
          >
            {initials}
          </NavLink>
        </div>
      </header>
    </>
  );
}
