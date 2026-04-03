import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Building2, UserPlus, ShieldCheck, Mail, Eye, EyeOff } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-colors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const { register, verifyRegistration, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();

  const [isSuperAdmin, setIsSuperAdmin]         = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [otpCode, setOtpCode]                   = useState("");
  const [error, setError]                       = useState("");
  const [success, setSuccess]                   = useState("");
  const [emailError, setEmailError]             = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [confirmError, setConfirmError]         = useState("");
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    tenantSlug: "", flatNumber: "", phone: "",
    tenantName: "", tenantCity: "Bangalore", superAdminSignupKey: "",
  });

  function field(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleEmailChange(e) {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, email: val }));
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  function handleConfirmChange(e) {
    const val = e.target.value;
    setConfirmPassword(val);
    setConfirmError(val && val !== form.password ? "Passwords do not match." : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (emailError) return;
    if (form.password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setError(""); setSuccess("");
    try {
      const data = await register({ ...form, desiredRole: isSuperAdmin ? "super_admin" : "resident" });
      if (isSuperAdmin && data?.token) { navigate("/"); return; }
      setVerificationStep(true);
      setSuccess(data?.message || "Check your email for the OTP.");
    } catch (err) { setError(err.message); }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await verifyRegistration({ email: form.email, tenantSlug: form.tenantSlug, otp: otpCode });
      navigate("/");
    } catch (err) { setError(err.message); }
  }

  async function handleResend() {
    setError(""); setSuccess("");
    try {
      const data = await resendRegistrationOtp({ email: form.email, tenantSlug: form.tenantSlug });
      setSuccess(data?.message || "OTP resent.");
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">

        {/* ── Left decorative panel ── */}
        <div className="relative hidden w-5/12 overflow-hidden bg-slate-50 md:block lg:w-1/2">
          <div className="absolute inset-0 bg-[url('/apartment.png')] bg-cover bg-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-50/60 to-transparent" />
          <div className="absolute bottom-12 left-10 right-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Join your community.
            </h2>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-600">
              Register in minutes and connect with your housing society — announcements, events, amenities and more.
            </p>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="w-full p-8 sm:p-10 md:w-7/12 lg:w-1/2 flex flex-col justify-center">

          {/* Mobile logo */}
          <div className="md:hidden mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Create account</h2>
          </div>

          {!verificationStep ? (
            <>
              <div className="hidden md:block mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900">Create account</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isSuperAdmin ? "Set up a new society on SocietyHub." : "Join your housing society portal."}
                </p>
              </div>

              {/* Role toggle */}
              <div
                className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                onClick={() => setIsSuperAdmin((v) => !v)}
              >
                <div
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isSuperAdmin ? "bg-emerald-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isSuperAdmin ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
                <span>
                  <span className="font-semibold text-slate-800">Register as Society Admin</span>
                  <span className="ml-1 text-slate-400">(creates a new society)</span>
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200/50">{error}</div>}

                <input className={inputCls} placeholder="Full name" value={form.fullName} onChange={field("fullName")} required />
                <input className={inputCls} placeholder={isSuperAdmin ? "Choose a society code  (e.g. green-heights)" : "Society code  (e.g. green-heights)"} value={form.tenantSlug} onChange={field("tenantSlug")} required />

                {!isSuperAdmin && (
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} placeholder="Flat no.  (e.g. A-402)" value={form.flatNumber} onChange={field("flatNumber")} />
                    <input className={inputCls} placeholder="Phone" value={form.phone} onChange={field("phone")} />
                  </div>
                )}

                {isSuperAdmin && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputCls} placeholder="Society name" value={form.tenantName} onChange={field("tenantName")} required />
                      <input className={inputCls} placeholder="City" value={form.tenantCity} onChange={field("tenantCity")} required />
                    </div>
                    <input className={inputCls} placeholder="Admin signup key" type="password" value={form.superAdminSignupKey} onChange={field("superAdminSignupKey")} required />
                  </>
                )}

                <div>
                  <input
                    className={`${inputCls} ${emailError ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400" : ""}`}
                    placeholder="Email address"
                    type="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    required
                  />
                  {emailError && <p className="mt-1.5 text-xs text-rose-600">{emailError}</p>}
                </div>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-11`}
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={field("password")}
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div>
                  <div className="relative">
                    <input
                      className={`${inputCls} pr-11 ${confirmError ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400" : ""}`}
                      placeholder="Confirm password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmChange}
                      required
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmError && <p className="mt-1.5 text-xs text-rose-600">{confirmError}</p>}
                </div>

                <button
                  type="submit"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </button>
              </form>
            </>
          ) : (
            /* ── OTP verification step ── */
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Check your email</h3>
                <p className="mt-2 text-sm text-slate-500">
                  We sent a 6-digit code to <span className="font-semibold text-slate-700">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-3.5">
                {error   && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200/50">{error}</div>}
                {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200/50">{success}</div>}

                <input
                  className={`${inputCls} text-center text-xl tracking-[0.5em] font-bold`}
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />

                <button type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                  Verify account
                </button>
                <button type="button" onClick={handleResend}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  Resend code
                </button>
              </form>
            </>
          )}

          <div className="mt-7 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
