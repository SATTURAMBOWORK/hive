import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import {
  Eye, EyeOff, ArrowRight, Shield, Mail, ShieldCheck,
  Home, Users, Building2, Bell, BarChart3, Calendar,
  CheckCircle, Star, Zap,
} from "lucide-react";

/* ─── Injected styles ─────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  .reg-root *, .reg-root *::before, .reg-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .reg-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    --bg:        #F7F9FF;
    --blue:      #2563EB;
    --blue-d:    #1D4ED8;
    --blue-lt:   #EFF6FF;
    --blue-mid:  #BFDBFE;
    --txt:       #0F172A;
    --txt2:      #64748B;
    --txt3:      #94A3B8;
    --border:    #E2E8F0;
    --card:      #FFFFFF;
  }

  /* Dot-grid page background */
  .reg-bg {
    background-color: var(--bg);
    background-image: radial-gradient(circle, #CBD5E1 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ── Inputs ── */
  .reg-input {
    width: 100%;
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--txt);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .reg-input::placeholder { color: var(--txt3); }
  .reg-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .reg-input.err { border-color: #EF4444; }
  .reg-input.err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

  /* ── Blue CTA button ── */
  .reg-btn {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(37,99,235,0.3);
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .reg-btn:hover:not(:disabled) {
    background: var(--blue-d);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37,99,235,0.42);
  }
  .reg-btn:active:not(:disabled) { transform: translateY(0); }
  .reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Ghost button ── */
  .reg-btn-ghost {
    background: #fff;
    color: var(--txt2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 11px 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  .reg-btn-ghost:hover {
    background: var(--blue-lt);
    border-color: var(--blue-mid);
    color: var(--blue);
  }

  /* ── Role card ── */
  .reg-role-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 16px 14px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .reg-role-card:hover {
    border-color: var(--blue);
    box-shadow: 0 4px 16px rgba(37,99,235,0.12);
    transform: translateY(-2px);
  }

  /* ── Shift card ── */
  .reg-shift-card {
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 12px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .reg-shift-card:hover { border-color: var(--blue); box-shadow: 0 2px 8px rgba(37,99,235,0.1); }
  .reg-shift-active { background: var(--blue-lt) !important; border-color: var(--blue) !important; }

  /* ── Field entrance animation ── */
  @keyframes reg-slide-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .reg-field {
    opacity: 0;
    animation: reg-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* ── Right panel animations ── */
  @keyframes reg-float-a {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-9px); }
  }
  @keyframes reg-float-b {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(7px); }
  }
  @keyframes reg-float-c {
    0%,100% { transform: translate(0, 0); }
    50%      { transform: translate(6px, -6px); }
  }
  @keyframes reg-live {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.25; }
  }
  @keyframes reg-pulse-ring {
    0%   { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  @keyframes reg-fade-slide {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .reg-fa { animation: reg-float-a 4s ease-in-out infinite; }
  .reg-fb { animation: reg-float-b 5.5s ease-in-out infinite 0.8s; }
  .reg-fc { animation: reg-float-c 6s ease-in-out infinite 2s; }
  .reg-live-dot { animation: reg-live 1.4s ease-in-out infinite; }
  .reg-fade-in  { animation: reg-fade-slide 0.5s ease forwards; }

  /* ── OTP input ── */
  .reg-otp {
    width: 100%;
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    color: var(--txt);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.55em;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .reg-otp::placeholder { color: var(--txt3); font-size: 1.1rem; letter-spacing: 0.4em; }
  .reg-otp:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  @media (max-width: 767px) {
    .reg-right { display: none !important; }
    .reg-left  { width: 100% !important; border-radius: 16px !important; }
  }
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Password strength ─────────────────────────────────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)           s++;
  if (pwd.length >= 12)          s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^A-Za-z0-9]/.test(pwd))  s++;
  return s;
}
function strengthMeta(score) {
  if (score <= 1) return { label: "Weak",      color: "#EF4444", pct: "20%" };
  if (score <= 2) return { label: "Fair",      color: "#F97316", pct: "40%" };
  if (score <= 3) return { label: "Good",      color: "#F59E0B", pct: "65%" };
  if (score <= 4) return { label: "Strong",    color: "#22C55E", pct: "85%" };
  return             { label: "Excellent", color: "#10B981", pct: "100%" };
}

const delay = (n) => `${n * 65}ms`;

  /* ── Right-panel visual ─────────────────────────────────────────────────────── */
function RegisterVisual() {
  return (
    <div
      className="reg-right"
      style={{
        width: "46%",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        minHeight: 680,
        background: "#0F172A",
      }}
    >
      <img
        src="/register-welcome.svg"
        alt="Welcome to AptHive"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.08) 40%, rgba(15,23,42,0.28) 100%)" }} />

      <div style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 24,
        padding: "18px 20px",
        borderRadius: 22,
        background: "rgba(15,23,42,0.24)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#fff",
        boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
      }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.9)", marginBottom: 14 }}>
          Welcome to a smarter society experience for residents, committees, and security teams.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>AptHive</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.74)", marginTop: 4 }}>Community management, simplified</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 0 6px rgba(74,222,128,0.16)" }} />
            Live
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export function RegisterPage() {
  const { register, verifyRegistration, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();

  const [roleStep,        setRoleStep]       = useState(true);
  const [selectedRole,    setSelectedRole]   = useState(null);
  const [verificationStep, setVerification]  = useState(false);
  const [otpCode,         setOtpCode]        = useState("");
  const [error,           setError]          = useState("");
  const [success,         setSuccess]        = useState("");
  const [emailError,      setEmailErr]       = useState("");
  const [confirmPassword, setConfirmPw]      = useState("");
  const [confirmError,    setConfirmErr]     = useState("");
  const [showPassword,    setShowPw]         = useState(false);
  const [showConfirm,     setShowConfirm]    = useState(false);
  const [isLoading,       setLoading]        = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    tenantSlug: "", flatNumber: "", phone: "",
    tenantName: "", tenantCity: "Bangalore", superAdminSignupKey: "",
    shift: "",
  });

  function field(key) { return (e) => setForm((p) => ({ ...p, [key]: e.target.value })); }

  function handleEmailChange(e) {
    const v = e.target.value;
    setForm((p) => ({ ...p, email: v }));
    setEmailErr(v && !EMAIL_REGEX.test(v) ? "Enter a valid email address." : "");
  }

  function handleConfirmChange(e) {
    const v = e.target.value;
    setConfirmPw(v);
    setConfirmErr(v && v !== form.password ? "Passwords do not match." : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (emailError) return;
    if (form.password !== confirmPassword) { setConfirmErr("Passwords do not match."); return; }
    if (selectedRole === "security" && !form.shift) { setError("Please select a shift."); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const roleMap = { resident: "resident", committee: "committee", security: "security", admin: "super_admin" };
      const data = await register({ ...form, desiredRole: roleMap[selectedRole] });
      if (selectedRole === "admin" && data?.token) { navigate("/"); return; }
      setVerification(true);
      setSuccess(data?.message || "Check your email for the OTP.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await verifyRegistration({ email: form.email, tenantSlug: form.tenantSlug, otp: otpCode });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(""); setSuccess("");
    try {
      const data = await resendRegistrationOtp({ email: form.email, tenantSlug: form.tenantSlug });
      setSuccess(data?.message || "OTP resent.");
    } catch (err) {
      setError(err.message);
    }
  }

  /* ── Shared UI helpers ── */
  const labelStyle = {
    display: "block",
    color: "#475569",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "5px",
    letterSpacing: "0.01em",
  };

  const errMsg = (msg) => msg ? (
    <p style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "4px", fontWeight: 500 }}>{msg}</p>
  ) : null;

  const errBox = (msg) => msg ? (
    <div style={{
      background: "#FEF2F2", border: "1px solid #FECACA",
      borderRadius: 10, padding: "11px 14px",
      color: "#DC2626", fontSize: "0.84rem", lineHeight: 1.5,
    }}>
      {msg}
    </div>
  ) : null;

  const successBox = (msg) => msg ? (
    <div style={{
      background: "#F0FDF4", border: "1px solid #BBF7D0",
      borderRadius: 10, padding: "11px 14px",
      color: "#16A34A", fontSize: "0.84rem", lineHeight: 1.5,
    }}>
      {msg}
    </div>
  ) : null;

  const pwStrength = strengthMeta(getStrength(form.password));

  const spinner = (
    <span style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.35)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );

  /* Determine which "step" we're on for the visual */
  const currentStep = verificationStep ? "otp" : roleStep ? "role" : "form";

  return (
    <>
      <style>{CSS}</style>
      <div
        className="reg-root reg-bg"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(226,232,240,0.8)",
        }}>

          {/* ════════════ LEFT PANEL — Form ════════════ */}
          <div
            className="reg-left"
            style={{
              width: "54%",
              background: "#fff",
              padding: "44px 44px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 620,
            }}
          >

            {/* ─── STEP 1: Role selection ─── */}
            {roleStep && !selectedRole && (
              <>
                {/* Header */}
                <div style={{ marginBottom: "26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={14} color="#2563EB" strokeWidth={2.5} />
                    </div>
                    <span style={{ color: "#2563EB", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.02em" }}>AptHive</span>
                  </div>
                  <h1 style={{ color: "#0F172A", fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                    Join AptHive
                  </h1>
                  <p style={{ color: "#64748B", fontSize: "0.875rem", marginTop: "6px", lineHeight: 1.55 }}>
                    Select the role that best describes you
                  </p>
                </div>

                {/* Role grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { role: "resident",  emoji: "🏠", title: "Resident",         sub: "I own or rent a flat" },
                    { role: "committee", emoji: "👥", title: "Committee Member", sub: "Society management board" },
                    { role: "security",  emoji: "🛡️", title: "Security Guard",   sub: "Gate security staff" },
                    { role: "admin",     emoji: "⚙️", title: "Society Admin",    sub: "Manage the society" },
                  ].map(({ role, emoji, title, sub }) => (
                    <button
                      key={role}
                      className="reg-role-card"
                      onClick={() => { setSelectedRole(role); setRoleStep(false); }}
                    >
                      <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px" }}>{emoji}</span>
                      <p style={{ color: "#0F172A", fontSize: "0.875rem", fontWeight: 700 }}>{title}</p>
                      <p style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: "3px" }}>{sub}</p>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: "26px", paddingTop: "20px", borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ─── STEP 2: Registration form ─── */}
            {!roleStep && !verificationStep && (
              <>
                {/* Header */}
                <div style={{ marginBottom: "22px" }}>
                  <button
                    onClick={() => { setSelectedRole(null); setRoleStep(true); setError(""); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#64748B", fontSize: "0.8rem", fontWeight: 500,
                      padding: 0, marginBottom: "14px",
                      display: "flex", alignItems: "center", gap: "4px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                  >
                    ← Change role
                  </button>

                  {/* Role badge */}
                  <div
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#EFF6FF", borderRadius: 20, padding: "4px 12px 4px 8px",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>
                      {{ resident: "🏠", committee: "👥", security: "🛡️", admin: "⚙️" }[selectedRole]}
                    </span>
                    <span style={{ color: "#2563EB", fontSize: "0.75rem", fontWeight: 700 }}>
                      {{ resident: "Resident", committee: "Committee Member", security: "Security Guard", admin: "Society Admin" }[selectedRole]}
                    </span>
                  </div>

                  <h1 style={{ color: "#0F172A", fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                    Create your account
                  </h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                  {errBox(error)}

                  {/* Full Name */}
                  <div className="reg-field" style={{ animationDelay: delay(0) }}>
                    <label style={labelStyle}>Full Name</label>
                    <input className="reg-input" placeholder="Your full name" value={form.fullName} onChange={field("fullName")} required />
                  </div>

                  {/* Society Code */}
                  <div className="reg-field" style={{ animationDelay: delay(1) }}>
                    <label style={labelStyle}>
                      {selectedRole === "admin" ? "Choose a Society Code" : "Society Code"}
                    </label>
                    <input
                      className="reg-input"
                      placeholder="e.g. green-heights"
                      value={form.tenantSlug}
                      onChange={field("tenantSlug")}
                      required
                    />
                  </div>

                  {/* Phone — non-admin */}
                  {selectedRole !== "admin" && (
                    <div className="reg-field" style={{ animationDelay: delay(2) }}>
                      <label style={labelStyle}>Phone Number</label>
                      <input className="reg-input" placeholder="+91 98765 43210" value={form.phone} onChange={field("phone")} />
                    </div>
                  )}

                  {/* Shift selector — security only */}
                  {selectedRole === "security" && (
                    <div className="reg-field" style={{ animationDelay: delay(3) }}>
                      <label style={labelStyle}>
                        Shift <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[
                          { value: "morning", label: "Morning", time: "6am – 2pm",  emoji: "🌅" },
                          { value: "evening", label: "Evening", time: "2pm – 10pm", emoji: "🌆" },
                          { value: "night",   label: "Night",   time: "10pm – 6am", emoji: "🌙" },
                        ].map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, shift: s.value }))}
                            className={`reg-shift-card${form.shift === s.value ? " reg-shift-active" : ""}`}
                          >
                            <span style={{ fontSize: "1.2rem" }}>{s.emoji}</span>
                            <span style={{ color: form.shift === s.value ? "#2563EB" : "#0F172A", fontSize: "0.78rem", fontWeight: 700 }}>{s.label}</span>
                            <span style={{ color: "#94A3B8", fontSize: "0.65rem" }}>{s.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin-specific fields */}
                  {selectedRole === "admin" && (
                    <div className="reg-field" style={{ animationDelay: delay(3), display: "flex", flexDirection: "column", gap: "13px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={labelStyle}>Society Name</label>
                          <input className="reg-input" placeholder="Green Heights" value={form.tenantName} onChange={field("tenantName")} required />
                        </div>
                        <div>
                          <label style={labelStyle}>City</label>
                          <input className="reg-input" placeholder="Bangalore" value={form.tenantCity} onChange={field("tenantCity")} required />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Admin Signup Key</label>
                        <input className="reg-input" placeholder="••••••••" type="password" value={form.superAdminSignupKey} onChange={field("superAdminSignupKey")} required />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="reg-field" style={{ animationDelay: delay(4) }}>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      className={`reg-input${emailError ? " err" : ""}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleEmailChange}
                      required
                    />
                    {errMsg(emailError)}
                  </div>

                  {/* Password + strength */}
                  <div className="reg-field" style={{ animationDelay: delay(5) }}>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="reg-input"
                        style={{ paddingRight: "42px" }}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={field("password")}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        style={{
                          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: "#94A3B8", padding: "4px", display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {form.password.length > 0 && (
                      <div style={{ marginTop: "7px" }}>
                        <div style={{ height: 3, borderRadius: 4, background: "#F1F5F9", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: pwStrength.pct,
                              background: pwStrength.color,
                              borderRadius: 4,
                              transition: "width 0.4s ease, background 0.4s ease",
                            }}
                          />
                        </div>
                        <p style={{ color: pwStrength.color, fontSize: "0.7rem", marginTop: "4px", fontWeight: 600 }}>
                          {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="reg-field" style={{ animationDelay: delay(6) }}>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        className={`reg-input${confirmError ? " err" : ""}`}
                        style={{ paddingRight: "42px" }}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={handleConfirmChange}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        style={{
                          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: "#94A3B8", padding: "4px", display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errMsg(confirmError)}
                  </div>

                  <button type="submit" className="reg-btn" disabled={isLoading} style={{ marginTop: "4px" }}>
                    {isLoading ? <>{spinner} Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
                  </button>
                </form>

                <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
                  <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ─── STEP 3: OTP Verification ─── */}
            {verificationStep && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                {/* Icon with pulse ring */}
                <div style={{ position: "relative", marginBottom: "22px" }}>
                  <div
                    style={{
                      position: "absolute", inset: -8, borderRadius: "50%",
                      border: "2px solid rgba(37,99,235,0.3)",
                      animation: "reg-pulse-ring 2s ease-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: 60, height: 60, borderRadius: "50%",
                      background: "#EFF6FF", border: "2px solid #BFDBFE",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Mail size={26} color="#2563EB" />
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                    borderRadius: 20, padding: "4px 12px",
                    marginBottom: "14px",
                  }}
                >
                  <CheckCircle size={13} color="#16A34A" />
                  <span style={{ color: "#16A34A", fontSize: "0.75rem", fontWeight: 600 }}>Account created</span>
                </div>

                <h1 style={{ color: "#0F172A", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  Check your inbox
                </h1>
                <p style={{ color: "#64748B", fontSize: "0.875rem", marginBottom: "28px", maxWidth: "280px", lineHeight: 1.6 }}>
                  We sent a 6-digit code to{" "}
                  <span style={{ color: "#2563EB", fontWeight: 600 }}>{form.email}</span>
                </p>

                <form onSubmit={handleVerify} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "13px" }}>
                  {errBox(error)}
                  {successBox(success)}

                  <input
                    className="reg-otp"
                    placeholder="· · · · · ·"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />

                  <button type="submit" className="reg-btn" disabled={isLoading}>
                    {isLoading ? <>{spinner} Verifying…</> : <><ShieldCheck size={16} /> Verify Account</>}
                  </button>

                  <button type="button" className="reg-btn-ghost" onClick={handleResend}>
                    Resend code
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ════════════ RIGHT PANEL — Visual ════════════ */}
          <RegisterVisual />
        </div>
      </div>
    </>
  );
}
