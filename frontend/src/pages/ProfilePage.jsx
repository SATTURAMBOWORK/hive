import { useEffect, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

const ROLE_COLOR = {
  resident:    { bg: tok.indigoLight, color: tok.indigo, border: tok.indigoBorder },
  committee:   { bg: tok.violetLight, color: tok.violet, border: tok.violetBorder },
  staff:       { bg: tok.amberLight,  color: tok.amber,  border: tok.amberBorder  },
  security:    { bg: tok.roseLight,   color: tok.rose,   border: tok.roseBorder   },
  super_admin: { bg: tok.emeraldLight,color: tok.emerald,border: tok.emeraldBorder},
};
const MEMBERSHIP_COLOR = {
  approved: { bg: tok.emeraldLight, color: tok.emerald, border: tok.emeraldBorder },
  pending:  { bg: tok.amberLight,   color: tok.amber,   border: tok.amberBorder   },
  rejected: { bg: tok.roseLight,    color: tok.rose,    border: tok.roseBorder    },
};
const RESIDENT_ROLE_COLOR = {
  owner:  { bg: tok.violetLight, color: tok.violet, border: tok.violetBorder },
  tenant: { bg: tok.indigoLight, color: tok.indigo, border: tok.indigoBorder },
};

function Chip({ label, style: s }) {
  return (
    <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "capitalize", border: "1px solid", ...s }}>
      {label}
    </span>
  );
}

function InfoRow({ emoji, label, value }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${tok.stone100}` }}>
      <span style={{ fontSize: 20, flexShrink: 0, width: 32, textAlign: "center" }}>{emoji}</span>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
        <p style={{ fontSize: 15, fontWeight: 500, color: tok.stone800 }}>{value || "—"}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { token } = useAuth();
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
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/users/me", { token });
      setProfile(data.user);
      setMembership(data.membership);
      setFullName(data.user.fullName);
      setPhone(data.user.phone || "");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true); setSaveError("");
    try {
      const data = await apiRequest("/users/me", { method: "PATCH", token, body: { fullName, phone } });
      setProfile(data.user);
      setEditing(false);
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
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
      <div style={{ fontFamily: fonts.sans, maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {[180, 120, 160].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 20, background: tok.stone100, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, fontFamily: fonts.sans, maxWidth: 600, margin: "0 auto", color: tok.rose }}>{error}</div>
    );
  }

  const initials = profile?.fullName?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const roleStyle = ROLE_COLOR[profile?.role] || { bg: tok.stone100, color: tok.stone600, border: tok.stone200 };
  const memberStyle = membership ? MEMBERSHIP_COLOR[membership.status] : null;

  return (
    <div style={{ fontFamily: fonts.sans, maxWidth: 600, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>My Profile</h1>
        <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>Your account details and society membership</p>
      </div>

      {/* Avatar + identity card */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: tok.emeraldLight, border: `2px solid ${tok.emeraldBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: fonts.display, fontSize: 26, color: tok.emerald,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input style={fieldStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" autoFocus />
                <input style={fieldStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                {saveError && <p style={{ fontSize: 12, color: tok.rose }}>{saveError}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btn.primary, padding: "8px 16px", fontSize: 13 }} onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "✓ Save"}
                  </button>
                  <button style={{ ...btn.muted, padding: "8px 16px", fontSize: 13 }} onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: tok.stone800, margin: 0 }}>{profile.fullName}</h2>
                  <button
                    style={{ ...btn.muted, padding: "4px 12px", fontSize: 12 }}
                    onClick={() => setEditing(true)}
                  >
                    ✎ Edit
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Chip label={profile.role?.replace("_", " ")} style={{ background: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border }} />
                  {memberStyle && (
                    <Chip label={membership.status} style={{ background: memberStyle.bg, color: memberStyle.color, borderColor: memberStyle.border }} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Contact</h3>
        <InfoRow emoji="✉️" label="Email" value={profile?.email} />
        <div style={{ borderBottom: "none" }}>
          <InfoRow emoji="📞" label="Phone" value={profile?.phone || "Not provided"} />
        </div>
      </div>

      {/* Membership */}
      {membership && (
        <div style={{ ...card, borderLeft: `4px solid ${tok.emerald}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Society</h3>
          <InfoRow emoji="🏠" label="Flat" value={`${membership.wingId?.name || "—"}-${membership.unitId?.unitNumber || "—"} · Floor ${membership.unitId?.floor ?? "—"}`} />
          <InfoRow emoji="🏢" label="Tower" value={membership.wingId?.name} />
          <div style={{ padding: "14px 0 0", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 20, width: 32, textAlign: "center" }}>🪪</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: tok.stone400, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Resident Type</p>
              {membership.residentRole && (() => {
                const rs = RESIDENT_ROLE_COLOR[membership.residentRole] || { bg: tok.stone100, color: tok.stone600, border: tok.stone200 };
                return <Chip label={membership.residentRole} style={{ background: rs.bg, color: rs.color, borderColor: rs.border }} />;
              })()}
            </div>
          </div>
          {membership.status === "rejected" && membership.rejectedReason && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: tok.rose }}><strong>Rejection reason:</strong> {membership.rejectedReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
