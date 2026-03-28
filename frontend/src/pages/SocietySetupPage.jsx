import { useEffect, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

export function SocietySetupPage() {
  const { token, user } = useAuth();
  const societyId = user?.tenantId;

  const [wings, setWings] = useState([]);
  const [units, setUnits] = useState([]);
  const [wingName, setWingName] = useState("");
  const [wingCode, setWingCode] = useState("");
  const [unitWingId, setUnitWingId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState(0);
  const [error, setError] = useState("");

  async function loadSocietyData() {
    if (!societyId) return;
    setError("");

    try {
      const data = await apiRequest(`/societies/${societyId}/units`, { token });
      setWings(data.wings || []);
      setUnits(data.items || []);
      if (!unitWingId && data.wings?.length) {
        setUnitWingId(data.wings[0]._id);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateWing(event) {
    event.preventDefault();
    if (!societyId) return;
    setError("");

    try {
      await apiRequest(`/societies/${societyId}/wings`, {
        method: "POST",
        token,
        body: {
          name: wingName,
          code: wingCode
        }
      });

      setWingName("");
      setWingCode("");
      await loadSocietyData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateUnit(event) {
    event.preventDefault();
    if (!societyId) return;
    setError("");

    try {
      await apiRequest(`/societies/${societyId}/units`, {
        method: "POST",
        token,
        body: {
          wingId: unitWingId,
          unitNumber,
          floor: Number(floor)
        }
      });

      setUnitNumber("");
      setFloor(0);
      await loadSocietyData();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSocietyData();
  }, [societyId]);

  return (
    <section className="panel space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Society Setup</h2>
        <button className="btn-muted" onClick={loadSocietyData}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreateWing} className="space-y-2 rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold">Create Wing</h3>
          <input className="field" placeholder="Wing name (Tower A)" value={wingName} onChange={(e) => setWingName(e.target.value)} />
          <input className="field" placeholder="Wing code (A)" value={wingCode} onChange={(e) => setWingCode(e.target.value)} />
          <button className="btn-primary" type="submit">Create wing</button>
        </form>

        <form onSubmit={handleCreateUnit} className="space-y-2 rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold">Create Unit</h3>
          <select className="field" value={unitWingId} onChange={(e) => setUnitWingId(e.target.value)}>
            <option value="">Select wing</option>
            {wings.map((wing) => (
              <option key={wing._id} value={wing._id}>{wing.name} ({wing.code})</option>
            ))}
          </select>
          <input className="field" placeholder="Unit number (A-402)" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
          <input className="field" type="number" placeholder="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
          <button className="btn-primary" type="submit">Create unit</button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-2 font-semibold">Wings</h3>
          <div className="space-y-2 text-sm">
            {!wings.length ? <p className="text-slate-500">No wings yet.</p> : null}
            {wings.map((wing) => (
              <p key={wing._id} className="rounded-lg bg-slate-50 px-3 py-2">{wing.name} ({wing.code})</p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-2 font-semibold">Available Units</h3>
          <div className="space-y-2 text-sm">
            {!units.length ? <p className="text-slate-500">No units yet.</p> : null}
            {units.map((unit) => (
              <p key={unit._id} className="rounded-lg bg-slate-50 px-3 py-2">
                {unit.wing?.code || "-"} • {unit.unitNumber} • Floor {unit.floor}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
