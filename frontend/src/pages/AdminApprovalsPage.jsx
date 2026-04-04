import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

export function AdminApprovalsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  // rejectingId = membership _id currently showing the reason input
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const canModerate = useMemo(
    () => ["committee", "super_admin"].includes(user?.role),
    [user?.role]
  );

  async function loadItems() {
    setError("");
    try {
      const data = await apiRequest("/admin/pending-approvals", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprove(id) {
    setError("");
    try {
      await apiRequest(`/admin/approve-resident/${id}`, { method: "PATCH", token });
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function openReject(id) {
    setRejectingId(id);
    setRejectReason("");
    setRejectError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
    setRejectError("");
  }

  async function handleReject(id) {
    if (!rejectReason.trim()) {
      setRejectError("Please enter a reason for rejection.");
      return;
    }
    setRejectError("");
    try {
      await apiRequest(`/admin/reject-resident/${id}`, {
        method: "PATCH",
        token,
        body: { reason: rejectReason.trim() }
      });
      setItems((prev) => prev.filter((item) => item._id !== id));
      setRejectingId(null);
    } catch (err) {
      setRejectError(err.message);
    }
  }

  useEffect(() => {
    if (canModerate) loadItems();
  }, [canModerate]);

  if (!canModerate) {
    return (
      <section className="panel">
        <p className="text-sm text-slate-600">Only committee/super admin can view this page.</p>
      </section>
    );
  }

  return (
    <section className="panel space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Pending Resident Approvals</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <div className="space-y-3">
        {!items.length && <p className="text-sm text-slate-500">No pending requests.</p>}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">{item.userId?.fullName || "Resident"}</h3>
            <p className="mt-1 text-sm text-slate-700">
              {item.userId?.email || "-"} • {item.userId?.phone || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Flat: {item.wingId?.name || "-"}-{item.unitId?.unitNumber || "-"}
            </p>
            <a
              className="mt-2 block text-sm text-emerald-700 underline"
              href={item.verificationDocUrl}
              target="_blank"
              rel="noreferrer"
            >
              View proof document
            </a>

            {/* Action buttons */}
            {rejectingId !== item._id && (
              <div className="mt-3 flex gap-2">
                <button className="btn-primary" onClick={() => handleApprove(item._id)}>
                  Approve
                </button>
                <button
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  onClick={() => openReject(item._id)}
                >
                  Reject
                </button>
              </div>
            )}

            {/* Inline rejection reason form */}
            {rejectingId === item._id && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-rose-800">Reason for rejection</p>
                <textarea
                  className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                  rows={2}
                  placeholder="e.g. Documents unclear, flat number mismatch..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                {rejectError && <p className="text-xs text-rose-700">{rejectError}</p>}
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                    onClick={() => handleReject(item._id)}
                  >
                    Confirm rejection
                  </button>
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    onClick={cancelReject}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
