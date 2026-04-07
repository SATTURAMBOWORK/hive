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

  const [roleStep, setRoleStep]                 = useState(true);
  const [selectedRole, setSelectedRole]         = useState(null);
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
    shift: "",
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
    if (selectedRole === "security" && !form.shift) {
      setError("Please select a shift.");
      return;
    }
    setError(""); setSuccess("");
    try {
      const roleMap = { resident: "resident", staff: "staff", security: "security", admin: "super_admin" };
      const data = await register({ ...form, desiredRole: roleMap[selectedRole] });
      if (selectedRole === "admin" && data?.token) { navigate("/"); return; }
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

          {roleStep && !selectedRole ? (
            <>
              <div className="hidden md:block mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900">Choose your role</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select the role that best describes you
                </p>
              </div>

              {/* ROLE SELECTOR CARDS */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* RESIDENT */}
                <button
                  onClick={() => { setSelectedRole("resident"); setRoleStep(false); }}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition text-left"
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Resident</h3>
                  <p className="text-xs text-slate-500 mt-1">I own/rent a flat</p>
                </button>

                {/* STAFF */}
                <button
                  onClick={() => { setSelectedRole("staff"); setRoleStep(false); }}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition text-left"
                >
                  <div className="text-3xl mb-2">🔧</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Maintenance Staff</h3>
                  <p className="text-xs text-slate-500 mt-1">Maintenance work</p>
                </button>

                {/* SECURITY */}
                <button
                  onClick={() => { setSelectedRole("security"); setRoleStep(false); }}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition text-left"
                >
                  <div className="text-3xl mb-2">🛡️</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Security Guard</h3>
                  <p className="text-xs text-slate-500 mt-1">Gate security</p>
                </button>

                {/* ADMIN */}
                <button
                  onClick={() => { setSelectedRole("admin"); setRoleStep(false); }}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition text-left"
                >
                  <div className="text-3xl mb-2">⚙️</div>
                  <h3 className="font-semibold text-slate-900 text-sm">Society Admin</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage society</p>
                </button>
              </div>

              <div className="mt-7 border-t border-slate-100 pt-5 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : !verificationStep ? (
            <>
              <div className="hidden md:block mb-6 flex items-center gap-2">
                <button onClick={() => { setSelectedRole(null); setRoleStep(true); }} className="text-emerald-700 hover:text-emerald-800 text-sm">← Change role</button>
                <h3 className="text-2xl font-extrabold text-slate-900 ml-2">Create account</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200/50">{error}</div>}

                <input className={inputCls} placeholder="Full name" value={form.fullName} onChange={field("fullName")} required />
                <input className={inputCls} placeholder={selectedRole === "admin" ? "Choose a society code  (e.g. green-heights)" : "Society code  (e.g. green-heights)"} value={form.tenantSlug} onChange={field("tenantSlug")} required />

                {selectedRole !== "admin" && selectedRole !== null && (
                  <input className={inputCls} placeholder="Phone" value={form.phone} onChange={field("phone")} />
                )}

                {selectedRole === "security" && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Shift <span className="text-rose-500">*</span></p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "morning", label: "Morning", time: "6am – 2pm", emoji: "🌅" },
                        { value: "evening", label: "Evening", time: "2pm – 10pm", emoji: "🌆" },
                        { value: "night",   label: "Night",   time: "10pm – 6am", emoji: "🌙" },
                      ].map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, shift: s.value }))}
                          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition
                            ${form.shift === s.value
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-orange-50"
                            }`}
                        >
                          <span className="text-xl">{s.emoji}</span>
                          <span className="text-xs font-semibold">{s.label}</span>
                          <span className="text-[10px] text-slate-400">{s.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRole === "admin" && (
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

          {!roleStep && !verificationStep && (
            <div className="mt-7 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
