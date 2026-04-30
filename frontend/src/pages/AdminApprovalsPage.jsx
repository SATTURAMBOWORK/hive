import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, FileText, Phone, Mail } from "lucide-react";
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

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      {[80, 48, 32].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 10, background: `${T.gold}10`, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export function AdminApprovalsPage() {
  const { token, user } = useAuth();
  const [items, setItems]               = useState([]);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [rejectingId, setRejectingId]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError]   = useState("");
  const [approvingId, setApprovingId]   = useState(null);

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
    setApprovingId(id); setError("");
    try {
      await apiRequest(`/admin/approve-resident/${id}`, { method: "PATCH", token });
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) { setError(err.message); }
    finally { setApprovingId(null); }
  }

  function openReject(id)  { setRejectingId(id); setRejectReason(""); setRejectError(""); }
  function cancelReject()  { setRejectingId(null); setRejectReason(""); setRejectError(""); }

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
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 24 }}>
        <p style={{ color: T.textMuted, fontSize: 14 }}>Only committee admins can view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 64px", fontFamily: "'DM Sans', sans-serif", background: `radial-gradient(circle at 8% -10%, #fde68a66 0%, transparent 36%), ${T.page}`, borderRadius: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap", borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, padding: "18px 20px" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Approvals</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
            {items.length > 0
              ? `${items.length} resident${items.length > 1 ? "s" : ""} waiting for approval`
              : "Resident membership requests"}
          </p>
        </div>
        <button onClick={loadItems}
          style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, border: `1px solid ${T.border}`, padding: "8px 16px", background: T.surfaceHi, cursor: "pointer", color: T.textSub, fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 20, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3", padding: "12px 16px", fontSize: 13, color: T.red, display: "flex", alignItems: "center", gap: 8 }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div style={{ borderRadius: 20, border: `1px solid ${T.border}`, background: T.surface, padding: "56px 24px", textAlign: "center", boxShadow: "0 18px 38px rgba(15, 23, 42, 0.08)" }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>All clear!</p>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>No pending requests.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map(item => (
            <article key={item._id}
              style={{ borderRadius: 18, border: `1px solid ${T.border}`, background: T.surface, overflow: "hidden", borderLeft: `3px solid ${T.amber}`, transition: "border-color 0.2s", boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>

              <div style={{ padding: 24 }}>
                {/* Resident info */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `${T.amber}22`, border: `1px solid ${T.amber}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: T.amber }}>
                    {item.userId?.fullName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>
                      {item.userId?.fullName || "Resident"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {item.userId?.email && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textSub }}>
                          <Mail size={12} color={T.textMuted} /> {item.userId.email}
                        </span>
                      )}
                      {item.userId?.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textSub }}>
                          <Phone size={12} color={T.textMuted} /> {item.userId.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  <span style={{ padding: "5px 12px", borderRadius: 100, background: "#fffbeb", border: `1px solid ${T.border}`, fontSize: 12, color: T.textSub }}>
                    🏠 {item.wingId?.name || "—"}-{item.unitId?.unitNumber || "—"}
                  </span>
                  {item.residentRole && (
                    <span style={{ padding: "5px 12px", borderRadius: 100, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12, color: T.blue, textTransform: "capitalize" }}>
                      {item.residentRole}
                    </span>
                  )}
                  {item.verificationDocUrl && (
                    <a href={item.verificationDocUrl} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 100, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 12, color: T.green, textDecoration: "none", fontWeight: 600 }}>
                      <FileText size={11} /> View Document
                    </a>
                  )}
                </div>

                {/* Action buttons */}
                {rejectingId !== item._id && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => handleApprove(item._id)} disabled={approvingId === item._id}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, background: approvingId === item._id ? "#86efac" : "linear-gradient(135deg, #16a34a, #22c55e)", padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#ffffff", border: "none", cursor: approvingId === item._id ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => { if (approvingId !== item._id) e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                      <CheckCircle size={14} /> {approvingId === item._id ? "Approving…" : "Approve"}
                    </button>
                    <button onClick={() => openReject(item._id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, background: "transparent", padding: "9px 18px", fontSize: 13, fontWeight: 700, color: T.red, border: "1px solid #fecaca", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {/* Reject form */}
                {rejectingId === item._id && (
                  <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, marginTop: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 10 }}>Reason for rejection</p>
                    <textarea
                      style={{ width: "100%", minHeight: 72, resize: "vertical", borderRadius: 10, border: "1px solid #fda4af", background: "#ffffff", padding: "10px 14px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                      placeholder="e.g. Documents unclear, flat number mismatch…"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                    {rejectError && <p style={{ fontSize: 12, color: T.red, marginTop: 6 }}>{rejectError}</p>}
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      <button onClick={() => handleReject(item._id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, background: T.red, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                        Confirm Rejection
                      </button>
                      <button onClick={cancelReject}
                        style={{ borderRadius: 10, background: "#ffffff", padding: "9px 18px", fontSize: 13, fontWeight: 600, color: T.textSub, border: `1px solid ${T.border}`, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.color = T.text}
                        onMouseLeave={e => e.currentTarget.style.color = T.textSub}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
