import { useState, useEffect, useMemo } from "react";
import { RefreshCw, UserX, Shield, User, Mail, Phone } from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const T = {
  page:      "#f8fafc",
  surface:   "#ffffff",
  surfaceHi: "#f9fafb",
  border:    "#e2e8f0",
  borderHov: "#cbd5e1",
  gold:      "#b45309",
  goldLight: "#E8890C",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#16a34a",
  greenL:    "#f0fdf4",
  greenBr:   "#bbf7d0",
  red:       "#dc2626",
  redL:      "#fef2f2",
  redBr:     "#fecaca",
  amber:     "#d97706",
  blue:      "#2563eb",
  blueL:     "#eff6ff",
  blueBr:    "#bfdbfe",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes pulse-skeleton {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }

  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mem-skeleton { animation: pulse-skeleton 1.5s ease-in-out infinite; }

  .mem-card {
    border-radius: 18px;
    border: 1px solid ${T.border};
    border-left: 3px solid ${T.goldLight};
    background: ${T.surface};
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(15,23,42,0.05);
  }
  .mem-card:hover {
    border-color: ${T.borderHov};
    box-shadow: 0 10px 28px rgba(15,23,42,0.09);
  }

  .mem-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 14px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, background 0.15s, border-color 0.15s;
    border: 1.5px solid transparent;
  }
  .mem-pill-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.82; }
  .mem-pill-btn:disabled { cursor: not-allowed; opacity: 0.6; }

  .mem-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    border: none;
  }
  .mem-action-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.85; }
  .mem-action-btn:disabled { cursor: not-allowed; opacity: 0.55; }

  .mem-confirm-box {
    animation: slide-down 0.18s ease;
  }
`;

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 18, border: `1px solid ${T.border}`,
      background: T.surface, padding: 22,
      display: "flex", alignItems: "flex-start", gap: 16,
    }}>
      <div className="mem-skeleton" style={{ width: 46, height: 46, borderRadius: "50%", background: `${T.goldLight}22`, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="mem-skeleton" style={{ height: 16, width: "45%", borderRadius: 8, background: `${T.gold}18` }} />
        <div className="mem-skeleton" style={{ height: 13, width: "65%", borderRadius: 8, background: `${T.gold}10` }} />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <div className="mem-skeleton" style={{ height: 24, width: 80, borderRadius: 99, background: `${T.gold}10` }} />
          <div className="mem-skeleton" style={{ height: 24, width: 60, borderRadius: 99, background: `${T.gold}10` }} />
        </div>
      </div>
    </div>
  );
}

function MemberCard({ item, onRemoved, onRoleChanged }) {
  const { token } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing,      setRemoving]      = useState(false);
  const [savingRole,    setSavingRole]    = useState(null); // "resident" | "committee" | null
  const [roleSuccess,   setRoleSuccess]   = useState("");
  const [currentRole,   setCurrentRole]   = useState(item.userId?.role || "resident");

  const name  = item.userId?.fullName || "Resident";
  const email = item.userId?.email    || "";
  const phone = item.userId?.phone    || "";
  const unit  = `${item.wingId?.name || ""}‑${item.unitId?.unitNumber || ""}`;
  const initial = name[0]?.toUpperCase() || "?";

  async function handleRemove() {
    setRemoving(true);
    try {
      await apiRequest(`/admin/residents/${item._id}`, { token, method: "DELETE" });
      onRemoved(item._id);
    } catch (_) {}
    finally { setRemoving(false); setConfirmRemove(false); }
  }

  async function handleRoleChange(role) {
    setSavingRole(role);
    setRoleSuccess("");
    try {
      await apiRequest(`/admin/residents/${item._id}/role`, {
        token, method: "PATCH", body: { role },
      });
      setRoleSuccess(role);
      setCurrentRole(role);
      onRoleChanged(item._id, role);
      setTimeout(() => setRoleSuccess(""), 2500);
    } catch (_) {}
    finally { setSavingRole(null); }
  }

  return (
    <article className="mem-card">
      <div style={{ padding: "20px 22px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
            boxShadow: `0 3px 10px ${T.goldLight}44`,
          }}>
            {initial}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 5px" }}>
              {name}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {email && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.textMuted }}>
                  <Mail size={11} color={T.textMuted} /> {email}
                </span>
              )}
              {phone && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.textMuted }}>
                  <Phone size={11} color={T.textMuted} /> {phone}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <span style={{
                padding: "4px 11px", borderRadius: 99,
                background: "#fffbeb", border: `1px solid ${T.border}`,
                fontSize: 11, fontWeight: 700, color: T.textSub,
              }}>
                🏠 {unit}
              </span>
              <span style={{
                padding: "4px 11px", borderRadius: 99,
                background: T.blueL, border: `1px solid ${T.blueBr}`,
                fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "capitalize",
              }}>
                {item.residentRole || "resident"}
              </span>
              {item.userId?.role && (
                <span style={{
                  padding: "4px 11px", borderRadius: 99,
                  background: item.userId.role === "committee" ? "#fff8f0" : "#f3f4f6",
                  border: `1px solid ${item.userId.role === "committee" ? `${T.goldLight}55` : T.border}`,
                  fontSize: 11, fontWeight: 700,
                  color: item.userId.role === "committee" ? T.goldLight : T.textMuted,
                  textTransform: "capitalize",
                }}>
                  {item.userId.role === "committee" ? "🛡 Committee" : "👤 Resident"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{
          paddingTop: 14, borderTop: `1px solid ${T.border}`,
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: 10, justifyContent: "space-between",
        }}>
          {/* Role pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Set role:
            </span>
            {["resident", "committee"].map(role => {
              const isThis   = savingRole === role;
              const success  = roleSuccess === role;
              const isCurrent = currentRole === role && !isThis && !success;
              return (
                <button
                  key={role}
                  className="mem-pill-btn"
                  onClick={() => !isCurrent && handleRoleChange(role)}
                  disabled={!!savingRole || isCurrent}
                  title={isCurrent ? "Current role" : `Set as ${role}`}
                  style={{
                    background:  success ? T.greenL : isCurrent ? (role === "committee" ? "#fff8f0" : "#f3f4f6") : T.surfaceHi,
                    color:       success ? T.green  : isCurrent ? (role === "committee" ? T.goldLight : T.textSub) : T.textMuted,
                    borderColor: success ? T.greenBr : isCurrent ? (role === "committee" ? T.goldLight : T.borderHov) : T.border,
                    fontWeight:  isCurrent ? 800 : 700,
                    opacity:     isCurrent ? 1 : undefined,
                  }}
                >
                  {role === "committee" ? <Shield size={11} /> : <User size={11} />}
                  {isThis ? "Saving…" : success ? "✓ Set" : isCurrent ? `${role.charAt(0).toUpperCase() + role.slice(1)} ✓` : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Remove button */}
          {!confirmRemove && (
            <button
              className="mem-action-btn"
              onClick={() => setConfirmRemove(true)}
              style={{ background: T.redL, color: T.red, border: `1px solid ${T.redBr}` }}
            >
              <UserX size={13} /> Remove
            </button>
          )}
        </div>

        {/* Inline remove confirmation */}
        {confirmRemove && (
          <div className="mem-confirm-box" style={{
            marginTop: 12, padding: "14px 16px",
            background: T.redL, border: `1px solid ${T.redBr}`,
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.red, margin: "0 0 4px" }}>
              Remove this member?
            </p>
            <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 12px", lineHeight: 1.5 }}>
              This will revoke their access to the society immediately.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="mem-action-btn"
                onClick={handleRemove}
                disabled={removing}
                style={{
                  background: removing ? "#fca5a5" : T.red,
                  color: "#fff", opacity: 1,
                }}
              >
                <UserX size={13} /> {removing ? "Removing…" : "Yes, remove"}
              </button>
              <button
                className="mem-action-btn"
                onClick={() => setConfirmRemove(false)}
                style={{ background: T.surface, color: T.textMuted, border: `1px solid ${T.border}` }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function MembersPage() {
  const { token, user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const canManage = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  async function loadMembers() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/admin/residents", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (canManage) loadMembers(); }, [canManage]);

  function handleRemoved(membershipId) {
    setItems(prev => prev.filter(i => i._id !== membershipId));
  }

  function handleRoleChanged(membershipId, role) {
    // role change doesn't affect the membership list display, just a UI hint
    // The actual role is on the User document; we just acknowledge success
    setItems(prev => prev.map(i => i._id === membershipId ? { ...i, _roleHint: role } : i));
  }

  if (!canManage) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: T.textMuted, fontSize: 14 }}>Only committee admins can view this page.</p>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px",
        fontFamily: "'DM Sans', sans-serif",
        background: `radial-gradient(circle at 8% -10%, #fde68a44 0%, transparent 36%), ${T.page}`,
        borderRadius: 24,
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 24, flexWrap: "wrap",
          borderRadius: 18, border: `1px solid ${T.border}`,
          background: T.surface, padding: "18px 22px",
          boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Members</h1>
            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
              {loading
                ? "Loading members…"
                : items.length > 0
                  ? `${items.length} approved member${items.length !== 1 ? "s" : ""}`
                  : "No approved members yet"}
            </p>
          </div>
          <button
            onClick={loadMembers}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              borderRadius: 12, border: `1px solid ${T.border}`,
              padding: "8px 16px", background: T.surfaceHi,
              cursor: "pointer", color: T.textSub, fontSize: 13, fontWeight: 600,
              transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldLight; e.currentTarget.style.color = T.goldLight; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.textSub;   }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, borderRadius: 12,
            background: T.redL, border: `1px solid ${T.redBr}`,
            padding: "12px 16px", fontSize: 13, color: T.red,
          }}>
            {error}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && !error && (
          <div style={{
            borderRadius: 20, border: `1px solid ${T.border}`,
            background: T.surface, padding: "56px 24px",
            textAlign: "center", boxShadow: "0 18px 38px rgba(15,23,42,0.06)",
          }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>👥</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>No members yet</p>
            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Approved members will appear here.</p>
          </div>
        )}

        {/* Member cards */}
        {!loading && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map(item => (
              <MemberCard
                key={item._id}
                item={item}
                onRemoved={handleRemoved}
                onRoleChanged={handleRoleChanged}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
