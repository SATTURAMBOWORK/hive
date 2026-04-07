import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import { tok, fonts, card, fieldStyle, btn } from "../lib/tokens";

function Sk() {
  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
      {[80, 60, 40, 24].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 8, background: tok.stone100, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export function AdminApprovalsPage() {
  const { token, user } = useAuth();
  const [items, setItems]           = useState([]);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError]   = useState("");

  const canModerate = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  async function loadItems() {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/admin/pending-approvals", { token });
      setItems(data.items || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleApprove(id) {
    setError("");
    try {
      await apiRequest(`/admin/approve-resident/${id}`, { method: "PATCH", token });
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) { setError(err.message); }
  }

  function openReject(id) { setRejectingId(id); setRejectReason(""); setRejectError(""); }
  function cancelReject() { setRejectingId(null); setRejectReason(""); setRejectError(""); }

  async function handleReject(id) {
    if (!rejectReason.trim()) { setRejectError("Please enter a reason."); return; }
    setRejectError("");
    try {
      await apiRequest(`/admin/reject-resident/${id}`, { method: "PATCH", token, body: { reason: rejectReason.trim() } });
      setItems(prev => prev.filter(i => i._id !== id));
      setRejectingId(null);
    } catch (err) { setRejectError(err.message); }
  }

  useEffect(() => { if (canModerate) loadItems(); }, [canModerate]);

  if (!canModerate) {
    return (
      <div style={{ ...card, fontFamily: fonts.sans, textAlign: "center", padding: 48 }}>
        <p style={{ color: tok.stone400 }}>Only committee admins can view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: fonts.sans, maxWidth: 760, margin: "0 auto", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: tok.stone800, margin: 0 }}>Approvals</h1>
            <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>
              {items.length > 0
                ? `${items.length} resident${items.length > 1 ? "s" : ""} waiting for approval`
                : "Resident membership requests"}
            </p>
          </div>
          <button style={btn.muted} onClick={loadItems}>↻ Refresh</button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 12, fontSize: 14, color: tok.rose }}>
            {error}
          </div>
        )}
      </div>

      {/* List */}
      {loading && [1, 2].map(i => <div key={i} style={{ marginBottom: 14 }}><Sk /></div>)}

      {!loading && items.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 56 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: tok.stone800 }}>All clear!</p>
          <p style={{ fontSize: 14, color: tok.stone400, marginTop: 4 }}>No pending requests.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!loading && items.map(item => (
          <article key={item._id} style={{ ...card, borderLeft: `4px solid ${tok.amber}` }}>

            {/* Resident info */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: tok.amberLight, border: `1px solid ${tok.amberBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: fonts.display, fontSize: 20, color: tok.amber,
              }}>
                {item.userId?.fullName?.[0]?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: tok.stone800, margin: "0 0 4px" }}>
                  {item.userId?.fullName || "Resident"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {item.userId?.email && <span style={{ fontSize: 13, color: tok.stone400 }}>✉ {item.userId.email}</span>}
                  {item.userId?.phone && <span style={{ fontSize: 13, color: tok.stone400 }}>📞 {item.userId.phone}</span>}
                </div>
              </div>
            </div>

            {/* Details row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <span style={{ padding: "5px 12px", borderRadius: 100, background: tok.stone50, border: `1px solid ${tok.stone200}`, fontSize: 13, color: tok.stone600 }}>
                🏠 {item.wingId?.name || "—"}-{item.unitId?.unitNumber || "—"}
              </span>
              {item.residentRole && (
                <span style={{ padding: "5px 12px", borderRadius: 100, background: tok.indigoLight, border: `1px solid ${tok.indigoBorder}`, fontSize: 13, color: tok.indigo, textTransform: "capitalize" }}>
                  {item.residentRole}
                </span>
              )}
              <a
                href={item.verificationDocUrl}
                target="_blank" rel="noreferrer"
                style={{ padding: "5px 12px", borderRadius: 100, background: tok.emeraldLight, border: `1px solid ${tok.emeraldBorder}`, fontSize: 13, color: tok.emerald, textDecoration: "none", fontWeight: 600 }}
              >
                📄 View Document
              </a>
            </div>

            {/* Action buttons */}
            {rejectingId !== item._id && (
              <div style={{ display: "flex", gap: 10 }}>
                <button style={btn.primary} onClick={() => handleApprove(item._id)}>✓ Approve</button>
                <button
                  style={{ ...btn.muted, color: tok.rose, borderColor: tok.roseBorder }}
                  onClick={() => openReject(item._id)}
                >
                  ✕ Reject
                </button>
              </div>
            )}

            {/* Reject form */}
            {rejectingId === item._id && (
              <div style={{ padding: 16, background: tok.roseLight, border: `1px solid ${tok.roseBorder}`, borderRadius: 14, marginTop: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: tok.rose, marginBottom: 10 }}>Reason for rejection</p>
                <textarea
                  style={{ ...fieldStyle, minHeight: 72, resize: "vertical", background: "#fff", borderColor: tok.roseBorder }}
                  placeholder="e.g. Documents unclear, flat number mismatch…"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                {rejectError && <p style={{ fontSize: 12, color: tok.rose, marginTop: 6 }}>{rejectError}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button style={btn.danger} onClick={() => handleReject(item._id)}>Confirm Rejection</button>
                  <button style={btn.muted} onClick={cancelReject}>Cancel</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
