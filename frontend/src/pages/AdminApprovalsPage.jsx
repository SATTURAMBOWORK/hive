import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

export function AdminApprovalsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

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
      await apiRequest(`/admin/approve-resident/${id}`, {
        method: "PATCH",
        token
      });
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (canModerate) {
      loadItems();
    }
  }, [canModerate]);

  if (!canModerate) {
    return <section className="panel"><p className="text-sm text-slate-600">Only committee/super admin can view this page.</p></section>;
  }

  return (
    <section className="panel space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Pending Resident Approvals</h2>
        <button className="btn-muted" onClick={loadItems}>Refresh</button>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-3">
        {!items.length ? <p className="text-sm text-slate-500">No pending requests.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">{item.userId?.fullName || "Resident"}</h3>
            <p className="mt-1 text-sm text-slate-700">
              {item.userId?.email || "-"} • {item.userId?.phone || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Wing: {item.wingId?.name || "-"} • Flat: {item.unitId?.unitNumber || "-"}
            </p>
            <a className="mt-2 block text-sm text-emerald-700 underline" href={item.verificationDocUrl} target="_blank" rel="noreferrer">
              View proof document
            </a>
            <button className="btn-primary mt-3" onClick={() => handleApprove(item._id)}>Approve resident</button>
          </article>
        ))}
      </div>
    </section>
  );
}
