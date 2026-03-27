import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdminSignup, setIsSuperAdminSignup] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    tenantSlug: "",
    tenantName: "",
    tenantCity: "Bangalore",
    superAdminSignupKey: ""
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await register({
        ...form,
        desiredRole: isSuperAdminSignup ? "super_admin" : "resident"
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mx-auto max-w-lg panel">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Register</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isSuperAdminSignup
            ? "Create society + super admin account (one per tenant)."
            : "Create a resident account under your tenant slug."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          <input
            checked={isSuperAdminSignup}
            onChange={(e) => setIsSuperAdminSignup(e.target.checked)}
            type="checkbox"
          />
          Register as society super admin
        </label>

        <input
          className="field"
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
        />
        <input
          className="field"
          placeholder="Tenant slug (example: green-heights)"
          value={form.tenantSlug}
          onChange={(e) => setForm((prev) => ({ ...prev, tenantSlug: e.target.value }))}
        />
        {isSuperAdminSignup ? (
          <>
            <input
              className="field"
              placeholder="Society name (example: Green Heights)"
              value={form.tenantName}
              onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))}
            />
            <input
              className="field"
              placeholder="City"
              value={form.tenantCity}
              onChange={(e) => setForm((prev) => ({ ...prev, tenantCity: e.target.value }))}
            />
            <input
              className="field"
              placeholder="Super admin signup key"
              type="password"
              value={form.superAdminSignupKey}
              onChange={(e) => setForm((prev) => ({ ...prev, superAdminSignupKey: e.target.value }))}
            />
          </>
        ) : null}
        <input
          className="field"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          className="field"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        <button className="btn-primary w-full" type="submit">Create account</button>
      </form>
      {error ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
    </section>
  );
}
