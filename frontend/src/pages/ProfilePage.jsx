import { useEffect, useState } from "react";
import { User, Phone, Mail, Home, ShieldCheck, BadgeCheck, Pencil, X, Check } from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

const ROLE_BADGE = {
  resident:    "bg-sky-100 text-sky-700",
  committee:   "bg-violet-100 text-violet-700",
  staff:       "bg-amber-100 text-amber-700",
  security:    "bg-orange-100 text-orange-700",
  super_admin: "bg-emerald-100 text-emerald-700",
};

const MEMBERSHIP_BADGE = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-rose-100 text-rose-700",
};

const RESIDENT_ROLE_BADGE = {
  owner:  "bg-violet-100 text-violet-700",
  tenant: "bg-sky-100 text-sky-700",
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 font-semibold text-slate-900 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { token, user: authUser } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/users/me", { token });
      setProfile(data.user);
      setMembership(data.membership);
      setFullName(data.user.fullName);
      setPhone(data.user.phone || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      const data = await apiRequest("/users/me", {
        method: "PATCH",
        token,
        body: { fullName, phone }
      });
      setProfile(data.user);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFullName(profile.fullName);
    setPhone(profile.phone || "");
    setSaveError("");
    setEditing(false);
  }

  useEffect(() => { loadProfile(); }, []);

  if (loading) {
    return (
      <div className="space-y-4 pb-12">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }

  const initials = profile?.fullName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto">

      {/* Avatar + name card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-lg shadow-emerald-600/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                className="field text-lg font-bold"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            ) : (
              <h2 className="text-2xl font-black text-slate-900 truncate">{profile?.fullName}</h2>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[profile?.role] || "bg-slate-100 text-slate-600"}`}>
                {profile?.role?.replace("_", " ")}
              </span>
              {membership && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${MEMBERSHIP_BADGE[membership.status] || "bg-slate-100 text-slate-600"}`}>
                  {membership.status}
                </span>
              )}
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
        {saveError && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>
        )}
      </div>

      {/* Contact info */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</h3>
        <InfoRow icon={Mail} label="Email" value={profile?.email} />
        {editing ? (
          <div className="flex items-center gap-3 py-3 border-b border-slate-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</p>
              <input
                className="field mt-0.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>
        ) : (
          <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
        )}
      </div>

      {/* Membership / flat info */}
      {membership && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Society</h3>
          <InfoRow
            icon={Home}
            label="Flat"
            value={`${membership.wingId?.name || "—"}-${membership.unitId?.unitNumber || "—"} · Floor ${membership.unitId?.floor ?? "—"}`}
          />
          <InfoRow
            icon={BadgeCheck}
            label="Resident Type"
            value={
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${RESIDENT_ROLE_BADGE[membership.residentRole] || ""}`}>
                {membership.residentRole}
              </span>
            }
          />
          <InfoRow icon={ShieldCheck} label="Membership Status" value={membership.status} />
          {membership.status === "rejected" && membership.rejectedReason && (
            <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span className="font-semibold">Rejection reason:</span> {membership.rejectedReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
