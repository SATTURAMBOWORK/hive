import { useEffect, useMemo, useState } from "react";
import {
  Building2, Users, LayoutGrid, Plus, RefreshCw,
  Phone, Mail, Home, UserCheck, XCircle, Trash2
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const TABS = [
  { key: "setup",     label: "Setup",     icon: Building2 },
  { key: "residents", label: "Residents", icon: Users },
  { key: "units",     label: "Units",     icon: LayoutGrid },
];

const RESIDENT_ROLE_BADGE = {
  owner:  "bg-violet-100 text-violet-700",
  tenant: "bg-sky-100 text-sky-700",
};

/* ── Sub-components ─────────────────────────────────────── */
function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition
            ${active === key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

/* ── Setup Tab ──────────────────────────────────────────── */
function SetupTab({ societyId, token, wings, units, onRefresh }) {
  const [wingName, setWingName]     = useState("");
  const [unitWingId, setUnitWingId] = useState(wings[0]?._id || "");
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor]           = useState("");
  const [error, setError]           = useState("");
  const [wingLoading, setWingLoading] = useState(false);
  const [unitLoading, setUnitLoading] = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  useEffect(() => {
    if (!unitWingId && wings.length) setUnitWingId(wings[0]._id);
  }, [wings]);

  async function handleCreateWing(e) {
    e.preventDefault();
    setError("");
    setWingLoading(true);
    try {
      const autoCode = wingName.trim().split(/\s+/).pop().slice(0, 5).toUpperCase();
      await apiRequest(`/societies/${societyId}/wings`, {
        method: "POST", token, body: { name: wingName, code: autoCode }
      });
      setWingName("");
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setWingLoading(false); }
  }

  async function handleDeleteWing(wingId) {
    if (!window.confirm("Delete this tower? This will fail if it still has flats.")) return;
    setDeletingId(wingId);
    setError("");
    try {
      await apiRequest(`/societies/${societyId}/wings/${wingId}`, { method: "DELETE", token });
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setDeletingId(null); }
  }

  async function handleDeleteUnit(unitId) {
    if (!window.confirm("Delete this flat?")) return;
    setDeletingId(unitId);
    setError("");
    try {
      await apiRequest(`/societies/${societyId}/units/${unitId}`, { method: "DELETE", token });
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setDeletingId(null); }
  }

  async function handleCreateUnit(e) {
    e.preventDefault();
    setError("");
    setUnitLoading(true);
    try {
      await apiRequest(`/societies/${societyId}/units`, {
        method: "POST", token, body: { wingId: unitWingId, unitNumber, floor: Number(floor) }
      });
      setUnitNumber(""); setFloor("");
      await onRefresh();
    } catch (err) { setError(err.message); }
    finally { setUnitLoading(false); }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Wing */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <SectionHeader title="Add Tower / Wing" subtitle="Create a new block or tower in your society" />
          <form onSubmit={handleCreateWing} className="space-y-4">
            <FieldGroup label="Tower Name">
              <input className="field" placeholder="e.g. Tower A" value={wingName} onChange={(e) => setWingName(e.target.value)} required />
            </FieldGroup>
            <button className="btn-primary w-full" type="submit" disabled={wingLoading}>
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                {wingLoading ? "Creating…" : "Add Tower"}
              </span>
            </button>
          </form>

          {wings.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Existing Towers</p>
              {wings.map((w) => (
                <div key={w._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                  <span className="font-semibold text-slate-800">{w.name}</span>
                  <button
                    onClick={() => handleDeleteWing(w._id)}
                    disabled={deletingId === w._id}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Unit */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <SectionHeader title="Add Flat / Unit" subtitle="Register a new flat under a tower" />
          <form onSubmit={handleCreateUnit} className="space-y-4">
            <FieldGroup label="Tower">
              <select className="field" value={unitWingId} onChange={(e) => setUnitWingId(e.target.value)}>
                <option value="">Select tower</option>
                {wings.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Flat Number">
              <input className="field" placeholder="e.g. 402" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Floor">
              <input className="field" type="number" placeholder="e.g. 4" value={floor} onChange={(e) => setFloor(e.target.value)} required />
            </FieldGroup>
            <button className="btn-primary w-full" type="submit" disabled={unitLoading || !wings.length}>
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                {unitLoading ? "Creating…" : "Add Flat"}
              </span>
            </button>
          </form>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{units.length}</span> flats registered across{" "}
            <span className="font-semibold text-slate-700">{wings.length}</span> towers
          </div>
        </div>
      </div>

      {units.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Existing Flats</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((u) => (
              <div key={u._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="font-semibold text-slate-800">
                  {u.wing?.name || "—"}-{u.unitNumber}
                  <span className="ml-2 text-xs font-normal text-slate-400">Floor {u.floor}</span>
                </span>
                <button
                  onClick={() => handleDeleteUnit(u._id)}
                  disabled={deletingId === u._id}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
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
    return residents.filter((r) =>
      r.userId?.fullName?.toLowerCase().includes(q) ||
      r.userId?.phone?.includes(q) ||
      r.unitId?.unitNumber?.toLowerCase().includes(q) ||
      r.wingId?.name?.toLowerCase().includes(q)
    );
  }, [residents, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">{residents.length}</span> approved residents
        </p>
        <input
          className="field max-w-xs"
          placeholder="Search by name, phone, flat…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!filtered.length ? (
        <p className="py-8 text-center text-sm text-slate-400">No residents found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Resident</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Flat</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id} className={`border-b border-slate-50 transition hover:bg-slate-50 ${i === filtered.length - 1 ? "border-0" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {r.userId?.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-semibold text-slate-900">{r.userId?.fullName || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      {r.userId?.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {r.userId.phone}
                        </div>
                      )}
                      {r.userId?.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Mail className="h-3 w-3" />
                          {r.userId.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Home className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold">{r.wingId?.name || "—"}-{r.unitId?.unitNumber || "—"}</span>
                      <span className="text-slate-400">· Floor {r.unitId?.floor ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${RESIDENT_ROLE_BADGE[r.residentRole] || "bg-slate-100 text-slate-600"}`}>
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
  const [filterWing, setFilterWing] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const occupiedUnitIds = useMemo(
    () => new Set(residents.map((r) => String(r.unitId?._id || r.unitId))),
    [residents]
  );

  const filtered = useMemo(() => {
    return units.filter((u) => {
      const wingMatch = filterWing === "all" || String(u.wing?._id) === filterWing;
      const occupied = occupiedUnitIds.has(String(u._id));
      const statusMatch =
        filterStatus === "all" ||
        (filterStatus === "occupied" && occupied) ||
        (filterStatus === "vacant" && !occupied);
      return wingMatch && statusMatch;
    });
  }, [units, filterWing, filterStatus, occupiedUnitIds]);

  const totalOccupied = useMemo(() => units.filter((u) => occupiedUnitIds.has(String(u._id))).length, [units, occupiedUnitIds]);
  const totalVacant = units.length - totalOccupied;

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Flats",  value: units.length,   color: "bg-slate-50 text-slate-700" },
          { label: "Occupied",     value: totalOccupied,  color: "bg-emerald-50 text-emerald-700" },
          { label: "Vacant",       value: totalVacant,    color: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl ${color} p-4 text-center`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="field max-w-[180px]" value={filterWing} onChange={(e) => setFilterWing(e.target.value)}>
          <option value="all">All Towers</option>
          {wings.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <select className="field max-w-[160px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
        <p className="text-sm text-slate-400">{filtered.length} flats shown</p>
      </div>

      {/* Grid */}
      {!filtered.length ? (
        <p className="py-8 text-center text-sm text-slate-400">No flats match your filter.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((unit) => {
            const occupied = occupiedUnitIds.has(String(unit._id));
            const resident = residents.find((r) => String(r.unitId?._id || r.unitId) === String(unit._id));
            return (
              <div
                key={unit._id}
                className={`rounded-2xl border p-4 transition
                  ${occupied
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-100 bg-white"
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {unit.wing?.name || "—"}-{unit.unitNumber}
                    </p>
                    <p className="text-xs text-slate-400">Floor {unit.floor}</p>
                  </div>
                  {occupied
                    ? <UserCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                    : <Home className="h-4 w-4 shrink-0 text-slate-300" />
                  }
                </div>
                {occupied && resident ? (
                  <div className="mt-2.5 border-t border-emerald-100 pt-2.5">
                    <p className="text-xs font-semibold text-slate-700 truncate">{resident.userId?.fullName}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${RESIDENT_ROLE_BADGE[resident.residentRole]}`}>
                      {resident.residentRole}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-amber-500">Vacant</p>
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

  const [tab, setTab]           = useState("setup");
  const [wings, setWings]       = useState([]);
  const [units, setUnits]       = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [resLoading, setResLoading] = useState(false);
  const [error, setError]       = useState("");

  async function loadSocietyData() {
    if (!societyId) return;
    setError("");
    try {
      const data = await apiRequest(`/societies/${societyId}/units`, { token });
      setWings(data.wings || []);
      setUnits(data.allUnits || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadResidents() {
    setResLoading(true);
    try {
      const data = await apiRequest("/admin/residents", { token });
      setResidents(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setResLoading(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSocietyData(), loadResidents()]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [societyId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Society Setup</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage towers, flats and residents</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />

      <div>
        {tab === "setup" && (
          <SetupTab
            societyId={societyId}
            token={token}
            wings={wings}
            units={units}
            onRefresh={loadSocietyData}
          />
        )}
        {tab === "residents" && (
          <ResidentsTab residents={residents} loading={resLoading} />
        )}
        {tab === "units" && (
          <UnitsTab units={units} residents={residents} wings={wings} />
        )}
      </div>
    </div>
  );
}
