import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    tenantSlug: ""
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
        />
        <input
          placeholder="Tenant slug (example: green-heights)"
          value={form.tenantSlug}
          onChange={(e) => setForm((prev) => ({ ...prev, tenantSlug: e.target.value }))}
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        <button type="submit">Create account</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
