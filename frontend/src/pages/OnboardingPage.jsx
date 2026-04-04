import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const STEPS = {
  SOCIETY: 1,
  UNIT: 2,
  ROLE_DOC: 3,
  PENDING: 4
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const {
    token,
    membership,
    membershipStatus,
    isMembershipApproved,
    refreshMembership
  } = useAuth();

  const [step, setStep] = useState(() => {
    if (membershipStatus === "pending") return STEPS.PENDING;
    if (membershipStatus === "approved") return STEPS.PENDING;
    return STEPS.SOCIETY;
  });
  const [query, setQuery] = useState("");
  const [societies, setSocieties] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [selectedWingId, setSelectedWingId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [residentRole, setResidentRole] = useState("owner");
  const [verificationDocUrl, setVerificationDocUrl] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wingOptions = useMemo(() => {
    const map = new Map();
    units.forEach((unit) => {
      if (unit.wing?._id && !map.has(unit.wing._id)) {
        map.set(unit.wing._id, unit.wing);
      }
    });
    return Array.from(map.values());
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (!selectedWingId) return [];
    return units.filter((unit) => unit.wing?._id === selectedWingId);
  }, [selectedWingId, units]);

  useEffect(() => {
    if (membershipStatus === "pending" || membershipStatus === "rejected") {
      setStep(STEPS.PENDING);
    }
  }, [membershipStatus]);

  async function handleSearchSocieties(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      const data = await apiRequest(`/societies/search?q=${encodeURIComponent(query)}`, { token });
      setSocieties(data.items || []);
      if (!data.items?.length) {
        setInfo("No societies found for this search");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectSociety(society) {
    setError("");
    setInfo("");
    setSelectedSociety(society);
    setSelectedWingId("");
    setSelectedUnitId("");

    try {
      const data = await apiRequest(`/societies/${society._id}/units`, { token });
      setUnits(data.items || []);
      setStep(STEPS.UNIT);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleContinueFromUnits(event) {
    event.preventDefault();
    if (!selectedWingId || !selectedUnitId) {
      setError("Select both wing and flat");
      return;
    }

    setError("");
    setStep(STEPS.ROLE_DOC);
  }

  async function handleSubmitJoin(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!selectedSociety || !selectedWingId || !selectedUnitId) {
      setError("Please complete society and flat selection");
      return;
    }

    if (!verificationDocUrl) {
      setError("Proof of residency document URL is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/membership/join", {
        method: "POST",
        token,
        body: {
          societyId: selectedSociety._id,
          wingId: selectedWingId,
          unitId: selectedUnitId,
          residentRole,
          verificationDocUrl
        }
      });

      await refreshMembership();
      setStep(STEPS.PENDING);
      setInfo("Request submitted. Admin approval is pending.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefreshStatus() {
    const nextMembership = await refreshMembership();
    if (nextMembership?.status === "approved") {
      navigate("/");
    }
  }

  if (isMembershipApproved) {
    return (
      <section className="mx-auto max-w-2xl panel">
        <h2 className="text-2xl font-bold text-slate-900">Membership Approved</h2>
        <p className="mt-2 text-sm text-slate-600">Your profile is now verified for society access.</p>
        <button className="btn-primary mt-4" onClick={() => navigate("/")}>Go to dashboard</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl panel space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Join Society</h2>
        <p className="mt-1 text-sm text-slate-600">
          Complete onboarding to access resident features. Step {step} of 4.
        </p>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {info ? <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">{info}</p> : null}

      {step === STEPS.SOCIETY ? (
        <div className="space-y-4">
          <form className="flex gap-3" onSubmit={handleSearchSocieties}>
            <input
              className="field"
              placeholder="Search society by name/city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn-primary" type="submit">Search</button>
          </form>

          <div className="space-y-3">
            {societies.map((society) => (
              <button
                key={society._id}
                type="button"
                className="w-full rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-300"
                onClick={() => handleSelectSociety(society)}
              >
                <p className="font-semibold text-slate-900">{society.name}</p>
                <p className="text-sm text-slate-600">{society.city} • {society.slug}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === STEPS.UNIT ? (
        <form className="space-y-4" onSubmit={handleContinueFromUnits}>
          <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            Selected society: <span className="font-semibold">{selectedSociety?.name}</span>
          </div>

          <select
            className="field"
            value={selectedWingId}
            onChange={(event) => {
              setSelectedWingId(event.target.value);
              setSelectedUnitId("");
            }}
          >
            <option value="">Select wing</option>
            {wingOptions.map((wing) => (
              <option key={wing._id} value={wing._id}>
                {wing.name} ({wing.code})
              </option>
            ))}
          </select>

          <select
            className="field"
            value={selectedUnitId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            disabled={!selectedWingId}
          >
            <option value="">Select flat</option>
            {filteredUnits.map((unit) => (
              <option key={unit._id} value={unit._id}>
                Flat {unit.unitNumber} • Floor {unit.floor}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <button className="btn-muted" type="button" onClick={() => setStep(STEPS.SOCIETY)}>Back</button>
            <button className="btn-primary" type="submit">Continue</button>
          </div>
        </form>
      ) : null}

      {step === STEPS.ROLE_DOC ? (
        <form className="space-y-4" onSubmit={handleSubmitJoin}>
          <select
            className="field"
            value={residentRole}
            onChange={(event) => setResidentRole(event.target.value)}
          >
            <option value="owner">Owner</option>
            <option value="tenant">Tenant</option>
          </select>

          <input
            className="field"
            placeholder="Proof document URL (image/pdf link)"
            value={verificationDocUrl}
            onChange={(event) => setVerificationDocUrl(event.target.value)}
          />

          <p className="text-xs text-slate-500">
            File upload API can be plugged here later. For now this accepts an uploaded file URL.
          </p>

          <div className="flex gap-3">
            <button className="btn-muted" type="button" onClick={() => setStep(STEPS.UNIT)}>Back</button>
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit for approval"}
            </button>
          </div>
        </form>
      ) : null}

      {step === STEPS.PENDING ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Approval pending</p>
            <p className="mt-1 text-sm text-amber-800">
              Your request is under review by your society admin. Dashboard access will open after approval.
            </p>
          </div>

          {membership ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
              <p>Status: <span className="font-semibold">{membership.status}</span></p>
              <p>Society: {membership.tenantId?.name || "-"}</p>
              <p>Wing: {membership.wingId?.name || "-"}</p>
              <p>Flat: {membership.wingId?.name || "-"}-{membership.unitId?.unitNumber || "-"}</p>
            </div>
          ) : null}

          <button className="btn-primary" onClick={handleRefreshStatus}>Refresh status</button>
        </div>
      ) : null}
    </section>
  );
}
