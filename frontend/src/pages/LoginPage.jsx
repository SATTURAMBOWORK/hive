import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", tenantSlug: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mx-auto max-w-lg panel">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Login</h2>
        <p className="mt-1 text-sm text-slate-600">Sign in with your tenant slug and account credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="field"
          placeholder="Tenant slug (example: green-heights)"
          value={form.tenantSlug}
          onChange={(e) => setForm((prev) => ({ ...prev, tenantSlug: e.target.value }))}
        />
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
        <button className="btn-primary w-full" type="submit">Login</button>
      </form>
      {error ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
    </section>
  );
}
