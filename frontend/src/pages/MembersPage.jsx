import { useState, useEffect, useMemo, useCallback } from "react";
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

  .mem-row {
    padding: 16px 8px;
    border-bottom: 1px solid ${T.border};
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: background 0.15s;
  }
  .mem-row:hover {
    background: ${T.surfaceHi};
  }

  .mem-row-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .mem-row-name {
    font-size: 14px;
    font-weight: 700;
    color: ${T.text};
    margin: 0;
  }

  .mem-row-desc {
    font-size: 12px;
    color: ${T.textMuted};
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mem-row-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
    min-width: 180px;
    flex-shrink: 0;
  }

  .mem-role-select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid ${T.border};
    background: ${T.surface};
    color: ${T.text};
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .mem-role-select:hover {
    border-color: ${T.borderHov};
  }

  .mem-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, background 0.15s;
    background: ${T.surfaceHi};
    color: ${T.text};
  }
  .mem-btn:hover:not(:disabled) {
    opacity: 0.8;
  }
  .mem-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .mem-confirm-box {
    animation: slide-down 0.18s ease;
  }

  @media (max-width: 600px) {
    .mem-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 8px;
    }
    .mem-row-right {
      min-width: 0;
      width: 100%;
      justify-content: flex-start;
    }
    .mem-btn {
      padding: 8px 14px;
      min-height: 36px;
    }
    .mem-role-select {
      padding: 8px 10px;
      min-height: 36px;
      flex: 1;
    }
  }
`;

function SkeletonRow() {
  return (
    <div className="mem-row" style={{ pointerEvents: "none" }}>
      <div className="mem-row-left">
        <div className="mem-skeleton" style={{ height: 14, width: "35%", borderRadius: 4, background: `${T.textMuted}18` }} />
        <div className="mem-skeleton" style={{ height: 12, width: "55%", borderRadius: 4, background: `${T.textMuted}10` }} />
      </div>
      <div className="mem-row-right">
        <div className="mem-skeleton" style={{ height: 24, width: 60, borderRadius: 4, background: `${T.textMuted}10` }} />
        <div className="mem-skeleton" style={{ height: 24, width: 70, borderRadius: 4, background: `${T.textMuted}10` }} />
      </div>
    </div>
  );
}

function MemberRow({ item, wings, units, onRemoved, onRoleChanged }) {
  const { token } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [currentRole, setCurrentRole] = useState(item.userId?.role || "resident");
  const [showUnitPanel, setShowUnitPanel] = useState(false);
  const [selWingId, setSelWingId] = useState("");
  const [selUnitId, setSelUnitId] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  const wingUnits = useMemo(
    () => units.filter(u => String(u.wing?._id) === selWingId),
    [units, selWingId]
  );

  const name = item.userId?.fullName || "Resident";
  const email = item.userId?.email || "";
  const phone = item.userId?.phone || "";
  const unit = `${item.wingId?.name || ""}‑${item.unitId?.unitNumber || ""}`;

  async function handleRemove() {
    setRemoving(true);
    try {
      await apiRequest(`/admin/residents/${item._id}`, { token, method: "DELETE" });
      onRemoved(item._id);
    } catch (_) {}
    finally { setRemoving(false); setConfirmRemove(false); }
  }

  async function handleUnitChange() {
    if (!selUnitId || !selWingId) return;
    setSavingUnit(true);
    try {
      await apiRequest(`/admin/residents/${item._id}/unit`, {
        token, method: "PATCH", body: { unitId: selUnitId, wingId: selWingId },
      });
      setShowUnitPanel(false);
      setSelWingId(""); setSelUnitId("");
      window.location.reload();
    } catch (_) {}
    finally { setSavingUnit(false); }
  }

  async function handleRoleChange(role) {
    setSavingRole(true);
    try {
      await apiRequest(`/admin/residents/${item._id}/role`, {
        token, method: "PATCH", body: { role },
      });
      setCurrentRole(role);
      onRoleChanged(item._id, role);
    } catch (_) {}
    finally { setSavingRole(false); }
  }

  return (
    <>
      <div className="mem-row">
        <div className="mem-row-left">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p className="mem-row-name">{name}</p>
            <span style={{
              padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: currentRole === "committee" ? "#fff8f0" : "#f3f4f6",
              color:      currentRole === "committee" ? T.goldLight : T.textMuted,
              border:     `1px solid ${currentRole === "committee" ? `${T.goldLight}66` : T.border}`,
              flexShrink: 0,
            }}>
              {currentRole === "committee" ? "Committee" : "Resident"}
            </span>
          </div>
          <p className="mem-row-desc">{unit} · {email || phone || "—"}</p>
        </div>
        <div className="mem-row-right">
          <select
            value={currentRole}
            onChange={e => handleRoleChange(e.target.value)}
            disabled={savingRole}
            className="mem-role-select"
            style={{ minWidth: 100 }}
          >
            <option value="resident">Resident</option>
            <option value="committee">Committee</option>
          </select>
          {!showUnitPanel && !confirmRemove && (
            <>
              <button
                className="mem-btn"
                onClick={() => setShowUnitPanel(true)}
                disabled={savingUnit}
              >
                Move Unit
              </button>
              <button
                className="mem-btn"
                onClick={() => setConfirmRemove(true)}
                style={{ color: T.red }}
              >
                <UserX size={12} /> Remove
              </button>
            </>
          )}
        </div>
      </div>

      {showUnitPanel && (
        <div style={{
          padding: "12px 8px",
          background: T.blueL,
          borderBottom: `1px solid ${T.blueBr}`,
          display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        }}>
          <select
            value={selWingId}
            onChange={e => { setSelWingId(e.target.value); setSelUnitId(""); }}
            className="mem-role-select"
          >
            <option value="">Select tower</option>
            {wings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select
            value={selUnitId}
            onChange={e => setSelUnitId(e.target.value)}
            disabled={!selWingId}
            className="mem-role-select"
          >
            <option value="">Select flat</option>
            {wingUnits.map(u => <option key={u._id} value={u._id}>{u.unitNumber} · Floor {u.floor}</option>)}
          </select>
          <button
            className="mem-btn"
            onClick={handleUnitChange}
            disabled={savingUnit || !selUnitId}
            style={{ background: T.blue, color: "#fff" }}
          >
            {savingUnit ? "Saving…" : "Confirm"}
          </button>
          <button
            className="mem-btn"
            onClick={() => { setShowUnitPanel(false); setSelWingId(""); setSelUnitId(""); }}
          >
            Cancel
          </button>
        </div>
      )}

      {confirmRemove && (
        <div style={{
          padding: "12px 8px",
          background: T.redL,
          borderBottom: `1px solid ${T.redBr}`,
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>Remove this member?</span>
          <button
            className="mem-btn"
            onClick={handleRemove}
            disabled={removing}
            style={{ background: T.red, color: "#fff", marginLeft: "auto" }}
          >
            {removing ? "Removing…" : "Yes, remove"}
          </button>
          <button
            className="mem-btn"
            onClick={() => setConfirmRemove(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

function GuardRow({ guard, onRemoved }) {
  const { token } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing,      setRemoving]      = useState(false);

  async function handleRemove() {
    setRemoving(true);
    try {
      await apiRequest(`/admin/guards/${guard._id}`, { token, method: "DELETE" });
      onRemoved(guard._id);
    } catch (_) {}
    finally { setRemoving(false); setConfirmRemove(false); }
  }

  return (
    <>
      <div className="mem-row">
        <div className="mem-row-left">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p className="mem-row-name">{guard.fullName}</p>
            <span style={{
              padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: "#f0f9ff", color: "#0369a1",
              border: "1px solid #bae6fd", flexShrink: 0,
            }}>
              Security
            </span>
          </div>
          <p className="mem-row-desc">
            {guard.email || guard.phone || "—"}
            {guard.shift ? ` · ${guard.shift} shift` : ""}
          </p>
        </div>
        <div className="mem-row-right">
          {!confirmRemove && (
            <button
              className="mem-btn"
              onClick={() => setConfirmRemove(true)}
              style={{ color: T.red }}
            >
              <UserX size={12} /> Remove
            </button>
          )}
        </div>
      </div>

      {confirmRemove && (
        <div style={{
          padding: "12px 8px", background: T.redL,
          borderBottom: `1px solid ${T.redBr}`,
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>Remove this guard?</span>
          <button
            className="mem-btn"
            onClick={handleRemove}
            disabled={removing}
            style={{ background: T.red, color: "#fff", marginLeft: "auto" }}
          >
            {removing ? "Removing…" : "Yes, remove"}
          </button>
          <button className="mem-btn" onClick={() => setConfirmRemove(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}

export function MembersPage() {
  const { token, user } = useAuth();
  const [tab,     setTab]     = useState("members");
  const [items,   setItems]   = useState([]);
  const [guards,  setGuards]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [wings,   setWings]   = useState([]);
  const [units,   setUnits]   = useState([]);

  const canManage = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [membersData, unitsData, guardsData] = await Promise.all([
        apiRequest("/admin/residents", { token }),
        apiRequest(`/societies/${user.tenantId}/units`, { token }),
        apiRequest("/admin/guards", { token }),
      ]);
      setItems(membersData.items || []);
      setWings(unitsData.wings || []);
      setUnits(unitsData.allUnits || []);
      setGuards(guardsData.guards || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (canManage) loadAll(); }, [canManage]);

  function handleMemberRemoved(id) { setItems(prev => prev.filter(i => i._id !== id)); }
  function handleGuardRemoved(id)  { setGuards(prev => prev.filter(g => g._id !== id)); }
  function handleRoleChanged(id, role) {
    setItems(prev => prev.map(i => i._id === id ? { ...i, _roleHint: role } : i));
  }

  if (!canManage) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: T.textMuted, fontSize: 14 }}>Only committee admins can view this page.</p>
      </div>
    );
  }

  const TABS = [
    { key: "members", label: `Members (${items.length})` },
    { key: "guards",  label: `Guards (${guards.length})` },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "32px 16px 64px",
        fontFamily: "'DM Sans', sans-serif", background: T.page,
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 20, flexWrap: "wrap",
          borderRadius: 8, border: `1px solid ${T.border}`,
          background: T.surface, padding: "16px 20px",
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>People</h1>
          <button
            onClick={loadAll}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              borderRadius: 6, border: `1px solid ${T.border}`,
              padding: "7px 14px", background: T.surfaceHi,
              cursor: "pointer", color: T.textSub, fontSize: 12, fontWeight: 600,
              transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "8px 18px", borderRadius: 6, border: `1px solid ${tab === t.key ? T.goldLight : T.border}`,
                background: tab === t.key ? "#fff8f0" : T.surface,
                color: tab === t.key ? T.goldLight : T.textMuted,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, borderRadius: 8, background: T.redL, border: `1px solid ${T.redBr}`, padding: "12px 16px", fontSize: 12, color: T.red }}>
            {error}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        )}

        {/* Members tab */}
        {!loading && tab === "members" && (
          items.length === 0 ? (
            <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, padding: "40px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>👥</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>No members yet</p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              {items.map(item => (
                <MemberRow key={item._id} item={item} wings={wings} units={units}
                  onRemoved={handleMemberRemoved} onRoleChanged={handleRoleChanged} />
              ))}
            </div>
          )
        )}

        {/* Guards tab */}
        {!loading && tab === "guards" && (
          guards.length === 0 ? (
            <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, padding: "40px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🛡️</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>No guards found</p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              {guards.map(g => (
                <GuardRow key={g._id} guard={g} onRemoved={handleGuardRemoved} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
