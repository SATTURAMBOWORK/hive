import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export function RegisterPage() {
  const { register, verifyRegistration, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdminSignup, setIsSuperAdminSignup] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [success, setSuccess] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    tenantSlug: "",
    flatNumber: "",
    phone: "",
    tenantName: "",
    tenantCity: "Bangalore",
    superAdminSignupKey: ""
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const data = await register({
        ...form,
        desiredRole: isSuperAdminSignup ? "super_admin" : "resident"
      });

      if (isSuperAdminSignup && data?.token) {
        navigate("/");
        return;
      }

      setVerificationStep(true);
      setSuccess(data?.message || "Registration submitted. Enter OTP to verify your account.");
      setDevOtp(data?.devOtp || "");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const data = await verifyRegistration({
        email: form.email,
        tenantSlug: form.tenantSlug,
        otp: otpCode
      });

      setSuccess(data?.message || "Account verified successfully. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResendOtp() {
    setError("");
    setSuccess("");

    try {
      const data = await resendRegistrationOtp({
        email: form.email,
        tenantSlug: form.tenantSlug
      });
      setSuccess(data?.message || "OTP resent successfully");
      setDevOtp(data?.devOtp || "");
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

      {!verificationStep ? (
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
        {!isSuperAdminSignup ? (
          <>
            <input
              className="field"
              placeholder="Flat number (example: A-402)"
              value={form.flatNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, flatNumber: e.target.value }))}
            />
            <input
              className="field"
              placeholder="Phone (example: 9876543210)"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </>
        ) : null}
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
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Enter the 6-digit OTP sent for {form.email} in tenant {form.tenantSlug}.
          </p>

          <input
            className="field"
            placeholder="6-digit OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />

          <button className="btn-primary w-full" type="submit">Verify account</button>
          <button className="btn-muted w-full" type="button" onClick={handleResendOtp}>Resend OTP</button>

          {devOtp ? (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
              Dev OTP: {devOtp}
            </p>
          ) : null}
        </form>
      )}
      {error ? <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}
    </section>
  );
}
