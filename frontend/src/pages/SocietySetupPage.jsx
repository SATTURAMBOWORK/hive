import { useEffect, useMemo, useState } from "react";
import { Building2, Users, LayoutGrid, Plus, RefreshCw, Phone, Mail, Home, UserCheck, XCircle, Trash2, Pencil, Check, X } from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const T = {
  page:      "#f8fafc",
  surface:   "#ffffff",
  surfaceHi: "#f9fafb",
  border:    "#e2e8f0",
  borderHov: "#cbd5e1",
  gold:      "#b45309",
  goldLight: "#f59e0b",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#16a34a",
  red:       "#dc2626",
  amber:     "#d97706",
  blue:      "#2563eb",
};

const TABS = [
  { key: "setup",     label: "Setup",     icon: Building2 },
  { key: "residents", label: "Residents", icon: Users      },
  { key: "units",     label: "Units",     icon: LayoutGrid },
];

const inputStyle = {
  width: "100%", borderRadius: 12, border: `1px solid ${T.border}`,
  background: "#ffffff", padding: "10px 14px",
  color: T.text, fontSize: 14, outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};

function Label({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{children}</p>;
}

function FocusInput({ style: s = {}, ...props }) {
  return (
    <input style={{ ...inputStyle, ...s }}
      onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props} />
  );
}

function FocusSelect({ children, style: s = {}, ...props }) {
  return (
    <select style={{ ...inputStyle, cursor: "pointer", ...s }}
      onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props}>
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, type = "button", onClick, style: s = {} }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, background: disabled ? "#fed7aa" : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, padding: "10px 0", width: "100%", fontSize: 13, fontWeight: 700, color: "#ffffff", border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", ...s }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}

/* ── Setup Tab ──────────────────────────────────────────── */
function SetupTab({ societyId, token, wings, units, onRefresh }) {
  const [wingName, setWingName]       = useState("");
  const [unitWingId, setUnitWingId]   = useState(wings[0]?._id || "");
  const [unitNumber, setUnitNumber]   = useState("");
  const [floor, setFloor]             = useState("");
  const [error, setError]             = useState("");
  const [wingLoading, setWingLoading] = useState(false);
  const [unitLoading, setUnitLoading] = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [editingWingId, setEditingWingId]   = useState(null);
  const [editingWingName, setEditingWingName] = useState("");
  const [renamingId, setRenamingId]         = useState(null);

  useEffect(() => { if (!unitWingId && wings.length) setUnitWingId(wings[0]._id); }, [wings]);

  async function handleCreateWing(e) {
    e.preventDefault(); setError(""); setWingLoading(true);
    try {
      const autoCode = wingName.trim().split(/\s+/).pop().slice(0, 5).toUpperCase();
      await apiRequest(`/societies/${societyId}/wings`, { method: "POST", token, body: { name: wingName, code: autoCode } });
      setWingName("");
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setWingLoading(false); }
  }

  async function handleRenameWing(wingId) {
    if (!editingWingName.trim()) return;
    setRenamingId(wingId); setError("");
    try {
      await apiRequest(`/societies/${societyId}/wings/${wingId}`, {
        method: "PATCH", token, body: { name: editingWingName.trim() },
      });
      setEditingWingId(null);
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setRenamingId(null); }
  }

  async function handleDeleteWing(wingId) {
    if (!window.confirm("Delete this tower? This will fail if it still has flats.")) return;
    setDeletingId(wingId); setError("");
    try {
      await apiRequest(`/societies/${societyId}/wings/${wingId}`, { method: "DELETE", token });
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setDeletingId(null); }
  }

  async function handleDeleteUnit(unitId) {
    if (!window.confirm("Delete this flat?")) return;
    setDeletingId(unitId); setError("");
    try {
      await apiRequest(`/societies/${societyId}/units/${unitId}`, { method: "DELETE", token });
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setDeletingId(null); }
  }

  async function handleCreateUnit(e) {
    e.preventDefault(); setError(""); setUnitLoading(true);
    try {
      await apiRequest(`/societies/${societyId}/units`, { method: "POST", token, body: { wingId: unitWingId, unitNumber, floor: Number(floor) } });
      setUnitNumber(""); setFloor("");
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setUnitLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div style={{ borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", padding: "12px 16px", fontSize: 13, color: T.red, display: "flex", alignItems: "center", gap: 8 }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>

        {/* Create Wing */}
        <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>Add Tower / Wing</p>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Create a new block or tower in your society</p>
          <form onSubmit={handleCreateWing} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><Label>Tower Name</Label><FocusInput placeholder="e.g. Tower A" value={wingName} onChange={e => setWingName(e.target.value)} required /></div>
            <GoldBtn type="submit" disabled={wingLoading}><Plus size={14} />{wingLoading ? "Creating…" : "Add Tower"}</GoldBtn>
          </form>

          {wings.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
              <Label>Existing Towers</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {wings.map(w => (
                  <div key={w._id} style={{ borderRadius: 10, background: "#fffbeb", border: `1px solid ${T.border}`, padding: "10px 14px" }}>
                    {editingWingId === w._id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          value={editingWingName}
                          onChange={e => setEditingWingName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleRenameWing(w._id); if (e.key === "Escape") setEditingWingId(null); }}
                          autoFocus
                          style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 13 }}
                          onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
                          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
                        />
                        <button onClick={() => handleRenameWing(w._id)} disabled={renamingId === w._id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.green, padding: 4 }}>
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingWingId(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{w.name}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => { setEditingWingId(w._id); setEditingWingName(w.name); }}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.color = T.gold}
                            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDeleteWing(w._id)} disabled={deletingId === w._id}
                            style={{ background: "transparent", border: "none", cursor: deletingId === w._id ? "not-allowed" : "pointer", color: T.textMuted, padding: 4, borderRadius: 6, transition: "color 0.15s", opacity: deletingId === w._id ? 0.4 : 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = T.red}
                            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Unit */}
        <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>Add Flat / Unit</p>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Register a new flat under a tower</p>
          <form onSubmit={handleCreateUnit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Tower</Label>
              <FocusSelect value={unitWingId} onChange={e => setUnitWingId(e.target.value)}>
                <option value="" style={{ background: "#ffffff" }}>Select tower</option>
                {wings.map(w => <option key={w._id} value={w._id} style={{ background: "#ffffff" }}>{w.name} ({w.code})</option>)}
              </FocusSelect>
            </div>
            <div><Label>Flat Number</Label><FocusInput placeholder="e.g. 402" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} required /></div>
            <div><Label>Floor</Label><FocusInput type="number" placeholder="e.g. 4" value={floor} onChange={e => setFloor(e.target.value)} required /></div>
            <GoldBtn type="submit" disabled={unitLoading || !wings.length}><Plus size={14} />{unitLoading ? "Creating…" : "Add Flat"}</GoldBtn>
          </form>

          <div style={{ marginTop: 16, borderRadius: 10, background: "#fffbeb", border: `1px solid ${T.border}`, padding: "12px 14px", fontSize: 13, color: T.textSub }}>
            <span style={{ fontWeight: 700, color: T.text }}>{units.length}</span> flats registered across <span style={{ fontWeight: 700, color: T.text }}>{wings.length}</span> towers
          </div>
        </div>
      </div>

      {/* Existing flats */}
      {units.length > 0 && (
        <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: 24 }}>
          <Label>Existing Flats</Label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", marginTop: 10 }}>
            {units.map(u => (
              <div key={u._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, background: "#fffbeb", border: `1px solid ${T.border}`, padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  {u.wing?.name || "—"}-{u.unitNumber}
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: T.textMuted }}>Floor {u.floor}</span>
                </span>
                <button onClick={() => handleDeleteUnit(u._id)} disabled={deletingId === u._id}
                  style={{ background: "transparent", border: "none", cursor: deletingId === u._id ? "not-allowed" : "pointer", color: T.textMuted, padding: 4, borderRadius: 6, transition: "color 0.15s", opacity: deletingId === u._id ? 0.4 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.red}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Residents Tab ──────────────────────────────────────── */
function ResidentsTab({ residents, loading }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return residents;
    return residents.filter(r =>
      r.userId?.fullName?.toLowerCase().includes(q) ||
      r.userId?.phone?.includes(q) ||
      r.unitId?.unitNumber?.toLowerCase().includes(q) ||
      r.wingId?.name?.toLowerCase().includes(q)
    );
  }, [residents, search]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 56, borderRadius: 12, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />)}
      </div>
    );
  }

  const ROLE_COLOR = { owner: T.blue, tenant: T.gold };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: T.textSub }}>
          <span style={{ fontWeight: 700, color: T.text }}>{residents.length}</span> approved residents
        </p>
        <input
          style={{ ...inputStyle, maxWidth: 260 }}
          placeholder="Search by name, phone, flat…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.gold}22`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {!filtered.length ? (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: T.textMuted }}>No residents found.</p>
      ) : (
        <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#fff7ed" }}>
                {["Resident", "Contact", "Flat", "Type"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flexShrink: 0, height: 36, width: 36, borderRadius: "50%", background: `${T.gold}22`, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.gold }}>
                        {r.userId?.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span style={{ fontWeight: 600, color: T.text }}>{r.userId?.fullName || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {r.userId?.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textSub }}>
                          <Phone size={11} color={T.textMuted} /> {r.userId.phone}
                        </div>
                      )}
                      {r.userId?.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textMuted }}>
                          <Mail size={10} color={T.textMuted} /> {r.userId.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.textSub }}>
                      <Home size={12} color={T.textMuted} />
                      <span style={{ fontWeight: 600, color: T.text }}>{r.wingId?.name || "—"}-{r.unitId?.unitNumber || "—"}</span>
                      <span style={{ color: T.textMuted, fontSize: 11 }}>· Floor {r.unitId?.floor ?? "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ borderRadius: 100, background: `${ROLE_COLOR[r.residentRole] || T.gold}22`, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: ROLE_COLOR[r.residentRole] || T.gold, textTransform: "capitalize", border: `1px solid ${ROLE_COLOR[r.residentRole] || T.gold}44` }}>
                      {r.residentRole}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Units Tab ──────────────────────────────────────────── */
function UnitsTab({ units, residents, wings }) {
  const [filterWing,   setFilterWing]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const occupiedUnitIds = useMemo(
    () => new Set(residents.map(r => String(r.unitId?._id || r.unitId))),
    [residents]
  );

  const filtered = useMemo(() => units.filter(u => {
    const wingMatch   = filterWing === "all" || String(u.wing?._id) === filterWing;
    const occupied    = occupiedUnitIds.has(String(u._id));
    const statusMatch = filterStatus === "all" || (filterStatus === "occupied" && occupied) || (filterStatus === "vacant" && !occupied);
    return wingMatch && statusMatch;
  }), [units, filterWing, filterStatus, occupiedUnitIds]);

  const totalOccupied = useMemo(() => units.filter(u => occupiedUnitIds.has(String(u._id))).length, [units, occupiedUnitIds]);
  const totalVacant   = units.length - totalOccupied;

  const selectStyle = { ...inputStyle, maxWidth: 180 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Flats", value: units.length,   color: T.gold  },
          { label: "Occupied",    value: totalOccupied,  color: T.green },
          { label: "Vacant",      value: totalVacant,    color: T.amber },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius: 16, border: `1px solid ${color}33`, background: "#ffffff", padding: "16px 20px", textAlign: "center", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: `${color}aa`, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <FocusSelect style={selectStyle} value={filterWing} onChange={e => setFilterWing(e.target.value)}>
          <option value="all" style={{ background: "#ffffff" }}>All Towers</option>
          {wings.map(w => <option key={w._id} value={w._id} style={{ background: "#ffffff" }}>{w.name}</option>)}
        </FocusSelect>
        <FocusSelect style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all"      style={{ background: "#ffffff" }}>All Status</option>
          <option value="occupied" style={{ background: "#ffffff" }}>Occupied</option>
          <option value="vacant"   style={{ background: "#ffffff" }}>Vacant</option>
        </FocusSelect>
        <p style={{ fontSize: 12, color: T.textMuted }}>{filtered.length} flats shown</p>
      </div>

      {/* Grid */}
      {!filtered.length ? (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: T.textMuted }}>No flats match your filter.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {filtered.map(unit => {
            const occupied = occupiedUnitIds.has(String(unit._id));
            const resident = residents.find(r => String(r.unitId?._id || r.unitId) === String(unit._id));
            const borderCol = occupied ? T.green : T.border;
            return (
              <div key={unit._id}
                style={{ borderRadius: 14, border: `1px solid ${borderCol}44`, background: occupied ? "#f0fdf4" : T.surface, padding: 16, transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = occupied ? T.green : T.borderHov}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${borderCol}44`}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: T.text, fontSize: 14, margin: 0 }}>{unit.wing?.name || "—"}-{unit.unitNumber}</p>
                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Floor {unit.floor}</p>
                  </div>
                  {occupied
                    ? <UserCheck size={15} color={T.green} />
                    : <Home size={15} color={T.textMuted} />
                  }
                </div>
                {occupied && resident ? (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.green}33` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{resident.userId?.fullName}</p>
                    <span style={{ marginTop: 4, display: "inline-block", borderRadius: 100, background: "#eff6ff", padding: "2px 8px", fontSize: 10, fontWeight: 700, color: T.blue, textTransform: "capitalize", border: "1px solid #bfdbfe" }}>
                      {resident.residentRole}
                    </span>
                  </div>
                ) : (
                  <p style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: T.amber }}>Vacant</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export function SocietySetupPage() {
  const { token, user } = useAuth();
  const societyId = user?.tenantId;

  const [tab,        setTab]        = useState("setup");
  const [wings,      setWings]      = useState([]);
  const [units,      setUnits]      = useState([]);
  const [residents,  setResidents]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [resLoading, setResLoading] = useState(false);
  const [error,      setError]      = useState("");

  async function loadSocietyData() {
    if (!societyId) return;
    setError("");
    try {
      const data = await apiRequest(`/societies/${societyId}/units`, { token });
      setWings(data.wings || []);
      setUnits(data.allUnits || []);
    } catch (err) { setError(err.message); }
  }

  async function loadResidents() {
    setResLoading(true);
    try {
      const data = await apiRequest("/admin/residents", { token });
      setResidents(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setResLoading(false); }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSocietyData(), loadResidents()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [societyId]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px 48px", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", gap: 24, background: `radial-gradient(circle at 8% -10%, #fde68a66 0%, transparent 36%), ${T.page}`, borderRadius: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: "20px 24px", flexWrap: "wrap", boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Society Setup</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Manage towers, flats and residents</p>
        </div>
        <button onClick={loadAll} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, border: `1px solid ${T.border}`, padding: "8px 16px", background: T.surfaceHi, cursor: loading ? "not-allowed" : "pointer", color: T.textSub, fontSize: 13, fontWeight: 600, opacity: loading ? 0.5 : 1, transition: "all 0.2s" }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", padding: "12px 16px", fontSize: 13, color: T.red, display: "flex", alignItems: "center", gap: 8 }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderRadius: 16, background: "#fff7ed", padding: 4, border: `1px solid ${T.border}` }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s", background: tab === key ? T.gold : "transparent", color: tab === key ? "#ffffff" : T.textMuted }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "setup"     && <SetupTab societyId={societyId} token={token} wings={wings} units={units} onRefresh={loadSocietyData} />}
      {tab === "residents" && <ResidentsTab residents={residents} loading={resLoading} />}
      {tab === "units"     && <UnitsTab units={units} residents={residents} wings={wings} />}
    </div>
  );
}
