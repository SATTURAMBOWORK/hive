import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff, ArrowRight, Shield, Mail, ShieldCheck } from "lucide-react";

/* ─── Injected styles ───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .rp-root *, .rp-root *::before, .rp-root *::after { box-sizing: border-box; }
  .rp-root { font-family: 'DM Sans', sans-serif; }
  .rp-display { font-family: 'Cormorant Garamond', serif !important; }

  /* Input */
  .rp-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(245,240,232,0.1);
    border-radius: 12px;
    padding: 13px 16px;
    color: #f5f0e8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .rp-input::placeholder { color: rgba(245,240,232,0.28); }
  .rp-input:focus {
    border-color: #c8914a;
    box-shadow: 0 0 0 3px rgba(200,145,74,0.15), 0 0 16px rgba(200,145,74,0.08);
  }
  .rp-input.error-field { border-color: rgba(244,63,94,0.6); }
  .rp-input.error-field:focus {
    border-color: rgba(244,63,94,0.8);
    box-shadow: 0 0 0 3px rgba(244,63,94,0.1);
  }

  /* Staggered field entrance */
  @keyframes fieldSlideIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rp-field {
    opacity: 0;
    animation: fieldSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Gold button */
  .rp-btn {
    background: linear-gradient(135deg, #c8914a 0%, #e8c47a 100%);
    color: #0a0907;
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    font-weight: 600;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 24px rgba(200,145,74,0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }
  .rp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(200,145,74,0.5);
  }
  .rp-btn:active:not(:disabled) { transform: translateY(0); }
  .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Ghost button */
  .rp-btn-ghost {
    background: rgba(245,240,232,0.05);
    color: rgba(245,240,232,0.7);
    border: 1px solid rgba(245,240,232,0.1);
    border-radius: 12px;
    padding: 13px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s, border-color 0.2s;
  }
  .rp-btn-ghost:hover {
    background: rgba(245,240,232,0.09);
    border-color: rgba(245,240,232,0.18);
  }

  /* Role card */
  .rp-role-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(245,240,232,0.08);
    border-radius: 14px;
    padding: 18px 16px;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    width: 100%;
  }
  .rp-role-card:hover {
    background: rgba(200,145,74,0.07);
    border-color: rgba(200,145,74,0.25);
    transform: translateY(-2px);
  }

  /* Shift card */
  .rp-shift-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(245,240,232,0.08);
    border-radius: 12px;
    padding: 14px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    transition: background 0.2s, border-color 0.2s;
    flex: 1;
  }
  .rp-shift-card:hover {
    background: rgba(200,145,74,0.07);
    border-color: rgba(200,145,74,0.25);
  }
  .rp-shift-active {
    background: rgba(200,145,74,0.12) !important;
    border-color: #c8914a !important;
  }

  /* Right panel shimmer */
  @keyframes shimmerSweep {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(300%) skewX(-15deg); }
  }
  .rp-shimmer-sweep {
    position: absolute; top: 0; bottom: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgba(200,145,74,0.06), transparent);
    animation: shimmerSweep 6s ease-in-out infinite;
    pointer-events: none;
    z-index: 3;
  }

  @keyframes pFloat1 {
    0%,100% { transform: translate(0,0);    opacity: 0.18; }
    50%      { transform: translate(14px,-20px); opacity: 0.42; }
  }
  @keyframes pFloat2 {
    0%,100% { transform: translate(0,0);    opacity: 0.12; }
    50%      { transform: translate(-18px,12px); opacity: 0.3; }
  }
  @keyframes pFloat3 {
    0%,100% { transform: translate(0,0);    opacity: 0.22; }
    50%      { transform: translate(10px,18px);  opacity: 0.5; }
  }
  .rp-p1 { animation: pFloat1 7s ease-in-out infinite; }
  .rp-p2 { animation: pFloat2 9s ease-in-out infinite 1.5s; }
  .rp-p3 { animation: pFloat3 6s ease-in-out infinite 3s; }

  @keyframes shimmerText {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .rp-shimmer-text {
    background: linear-gradient(90deg, #c8914a 0%, #f0d49a 40%, #c8914a 60%, #e8c47a 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerText 4s linear infinite;
  }

  @keyframes goldLine {
    from { width: 0; }
    to   { width: 48px; }
  }
  .rp-goldline {
    height: 2px;
    background: linear-gradient(90deg, #c8914a, #e8c47a);
    animation: goldLine 0.8s 0.3s ease forwards;
    width: 0;
    margin-bottom: 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* OTP input */
  .rp-otp {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(245,240,232,0.1);
    border-radius: 12px;
    padding: 16px;
    color: #f5f0e8;
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.6em;
    outline: none;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .rp-otp::placeholder { color: rgba(245,240,232,0.15); font-size: 1.2rem; letter-spacing: 0.4em; }
  .rp-otp:focus {
    border-color: #c8914a;
    box-shadow: 0 0 0 3px rgba(200,145,74,0.15);
  }

  @media (max-width: 767px) {
    .rp-right-visual { display: none !important; }
    .rp-left-form { width: 100% !important; }
  }
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Password strength scoring */
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)             s++;
  if (pwd.length >= 12)            s++;
  if (/[A-Z]/.test(pwd))           s++;
  if (/[0-9]/.test(pwd))           s++;
  if (/[^A-Za-z0-9]/.test(pwd))    s++;
  return s; // 0–5
}
function strengthMeta(score) {
  if (score <= 1) return { label: "Weak",   color: "#f87171", pct: "20%" };
  if (score <= 2) return { label: "Fair",   color: "#fb923c", pct: "40%" };
  if (score <= 3) return { label: "Good",   color: "#fbbf24", pct: "65%" };
  if (score <= 4) return { label: "Strong", color: "#4ade80", pct: "85%" };
  return             { label: "Excellent", color: "#22c55e", pct: "100%" };
}

/* Stagger delay helper */
const delay = (n) => `${n * 70}ms`;

export function RegisterPage() {
  const { register, verifyRegistration, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();

  const [roleStep, setRoleStep]               = useState(true);
  const [selectedRole, setSelectedRole]       = useState(null);
  const [verificationStep, setVerification]   = useState(false);
  const [otpCode, setOtpCode]                 = useState("");
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [emailError, setEmailErr]             = useState("");
  const [confirmPassword, setConfirmPw]       = useState("");
  const [confirmError, setConfirmErr]         = useState("");
  const [showPassword, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setLoading]               = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    tenantSlug: "", flatNumber: "", phone: "",
    tenantName: "", tenantCity: "Bangalore", superAdminSignupKey: "",
    shift: "",
  });

  function field(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }
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
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const roleMap = { resident: "resident", security: "security", admin: "super_admin" };
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
    setError(""); setSuccess("");
    setLoading(true);
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

  /* ── Shared styles ── */
  const labelStyle = {
    display: "block",
    color: "rgba(245,240,232,0.55)",
    fontSize: "0.78rem",
    marginBottom: "6px",
    letterSpacing: "0.04em",
    fontWeight: 500,
  };
  const errorMsg = (msg) => msg ? (
    <p style={{ color: "#fca5a5", fontSize: "0.75rem", marginTop: "5px" }}>{msg}</p>
  ) : null;

  const errBox = (msg) => msg ? (
    <div
      style={{
        background: "rgba(244,63,94,0.08)",
        border: "1px solid rgba(244,63,94,0.25)",
        borderRadius: "10px",
        padding: "12px 16px",
        color: "#fca5a5",
        fontSize: "0.86rem",
        lineHeight: 1.5,
      }}
    >
      {msg}
    </div>
  ) : null;

  const successBox = (msg) => msg ? (
    <div
      style={{
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: "10px",
        padding: "12px 16px",
        color: "#86efac",
        fontSize: "0.86rem",
        lineHeight: 1.5,
      }}
    >
      {msg}
    </div>
  ) : null;

  /* Strength bar */
  const pwStrength = strengthMeta(getStrength(form.password));

  /* Spinner element */
  const spinner = (
    <span
      style={{
        width: 14, height: 14,
        border: "2px solid rgba(10,9,7,0.3)",
        borderTopColor: "#0a0907",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );

  /* ── Right visual panel particles ── */
  const PARTICLES = [
    { cls: "rp-p1", style: { top: "18%", left: "20%",  width: 6, height: 6 } },
    { cls: "rp-p2", style: { top: "45%", left: "75%",  width: 4, height: 4 } },
    { cls: "rp-p3", style: { top: "72%", left: "32%",  width: 7, height: 7 } },
    { cls: "rp-p1", style: { top: "28%", left: "60%",  width: 5, height: 5 } },
    { cls: "rp-p2", style: { top: "85%", left: "65%",  width: 4, height: 4 } },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div
        className="rp-root"
        style={{
          minHeight: "100vh",
          background: "#0a0907",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            display: "flex",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,145,74,0.12)",
          }}
        >
          {/* ══════════ LEFT PANEL — Form ══════════ */}
          <div
            className="rp-left-form"
            style={{
              width: "55%",
              background: "#0d0b09",
              padding: "48px 44px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: "600px",
            }}
          >
            {/* ─── STEP 1: Role selection ─── */}
            {roleStep && !selectedRole && (
              <>
                <div style={{ marginBottom: "28px" }}>
                  <p style={{ color: "#c8914a", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 500 }}>
                    Get started
                  </p>
                  <h1 className="rp-display" style={{ color: "#f5f0e8", fontSize: "2.2rem", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
                    Join AptHive
                  </h1>
                  <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "0.88rem", marginTop: "6px", fontWeight: 300 }}>
                    Select the role that best describes you
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { role: "resident", emoji: "🏠", title: "Resident",       sub: "I own or rent a flat" },
                    { role: "security", emoji: "🛡️", title: "Security Guard", sub: "Gate security staff" },
                    { role: "admin",    emoji: "⚙️", title: "Society Admin",  sub: "Manage the society" },
                  ].map(({ role, emoji, title, sub }) => (
                    <button
                      key={role}
                      className="rp-role-card"
                      onClick={() => { setSelectedRole(role); setRoleStep(false); }}
                    >
                      <span style={{ fontSize: "1.6rem", display: "block", marginBottom: "8px" }}>{emoji}</span>
                      <p style={{ color: "#f5f0e8", fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>{title}</p>
                      <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "0.75rem", marginTop: "3px" }}>{sub}</p>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid rgba(245,240,232,0.06)", textAlign: "center" }}>
                  <p style={{ color: "rgba(245,240,232,0.38)", fontSize: "0.86rem" }}>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      style={{ color: "#c8914a", fontWeight: 600, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.target.style.color = "#e8c47a")}
                      onMouseLeave={(e) => (e.target.style.color = "#c8914a")}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ─── STEP 2: Registration form ─── */}
            {!roleStep && !verificationStep && (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <button
                    onClick={() => { setSelectedRole(null); setRoleStep(true); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(200,145,74,0.7)", fontSize: "0.8rem",
                      padding: 0, marginBottom: "12px",
                      display: "flex", alignItems: "center", gap: "4px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c8914a")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,145,74,0.7)")}
                  >
                    ← Change role
                  </button>
                  <p style={{ color: "#c8914a", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 500 }}>
                    {{resident:"Resident", security:"Security Guard", admin:"Society Admin"}[selectedRole]}
                  </p>
                  <h1 className="rp-display" style={{ color: "#f5f0e8", fontSize: "2rem", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
                    Create Account
                  </h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {errBox(error)}

                  {/* Full Name */}
                  <div className="rp-field" style={{ animationDelay: delay(0) }}>
                    <label style={labelStyle}>Full Name</label>
                    <input className="rp-input" placeholder="Your full name" value={form.fullName} onChange={field("fullName")} required />
                  </div>

                  {/* Society Code */}
                  <div className="rp-field" style={{ animationDelay: delay(1) }}>
                    <label style={labelStyle}>
                      {selectedRole === "admin" ? "Choose a society code" : "Society Code"}
                    </label>
                    <input
                      className="rp-input"
                      placeholder="e.g. green-heights"
                      value={form.tenantSlug}
                      onChange={field("tenantSlug")}
                      required
                    />
                  </div>

                  {/* Phone — for non-admin */}
                  {selectedRole !== "admin" && (
                    <div className="rp-field" style={{ animationDelay: delay(2) }}>
                      <label style={labelStyle}>Phone Number</label>
                      <input className="rp-input" placeholder="+91 98765 43210" value={form.phone} onChange={field("phone")} />
                    </div>
                  )}

                  {/* Shift selector — security only */}
                  {selectedRole === "security" && (
                    <div className="rp-field" style={{ animationDelay: delay(3) }}>
                      <label style={labelStyle}>
                        Shift <span style={{ color: "#fca5a5" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[
                          { value: "morning", label: "Morning", time: "6am – 2pm",   emoji: "🌅" },
                          { value: "evening", label: "Evening", time: "2pm – 10pm",  emoji: "🌆" },
                          { value: "night",   label: "Night",   time: "10pm – 6am",  emoji: "🌙" },
                        ].map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, shift: s.value }))}
                            className={`rp-shift-card${form.shift === s.value ? " rp-shift-active" : ""}`}
                          >
                            <span style={{ fontSize: "1.3rem" }}>{s.emoji}</span>
                            <span style={{ color: form.shift === s.value ? "#e8c47a" : "#f5f0e8", fontSize: "0.78rem", fontWeight: 600 }}>{s.label}</span>
                            <span style={{ color: "rgba(245,240,232,0.35)", fontSize: "0.65rem" }}>{s.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin-specific fields */}
                  {selectedRole === "admin" && (
                    <div className="rp-field" style={{ animationDelay: delay(3), display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={labelStyle}>Society Name</label>
                          <input className="rp-input" placeholder="Green Heights" value={form.tenantName} onChange={field("tenantName")} required />
                        </div>
                        <div>
                          <label style={labelStyle}>City</label>
                          <input className="rp-input" placeholder="Bangalore" value={form.tenantCity} onChange={field("tenantCity")} required />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Admin Signup Key</label>
                        <input className="rp-input" placeholder="••••••••" type="password" value={form.superAdminSignupKey} onChange={field("superAdminSignupKey")} required />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="rp-field" style={{ animationDelay: delay(4) }}>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      className={`rp-input${emailError ? " error-field" : ""}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleEmailChange}
                      required
                    />
                    {errorMsg(emailError)}
                  </div>

                  {/* Password + strength bar */}
                  <div className="rp-field" style={{ animationDelay: delay(5) }}>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="rp-input"
                        style={{ paddingRight: "44px" }}
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
                          color: "rgba(245,240,232,0.35)", padding: "4px",
                          display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#c8914a")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Strength bar — only shown when typing */}
                    {form.password.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <div
                          style={{
                            height: "3px",
                            borderRadius: "4px",
                            background: "rgba(245,240,232,0.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: pwStrength.pct,
                              background: pwStrength.color,
                              borderRadius: "4px",
                              transition: "width 0.4s ease, background 0.4s ease",
                              boxShadow: `0 0 8px ${pwStrength.color}55`,
                            }}
                          />
                        </div>
                        <p style={{ color: pwStrength.color, fontSize: "0.7rem", marginTop: "4px", fontWeight: 500 }}>
                          {pwStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="rp-field" style={{ animationDelay: delay(6) }}>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        className={`rp-input${confirmError ? " error-field" : ""}`}
                        style={{ paddingRight: "44px" }}
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
                          color: "rgba(245,240,232,0.35)", padding: "4px",
                          display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#c8914a")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errorMsg(confirmError)}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="rp-btn"
                    disabled={isLoading}
                    style={{ marginTop: "4px" }}
                  >
                    {isLoading ? <>{spinner} Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
                  </button>
                </form>

                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(245,240,232,0.06)", textAlign: "center" }}>
                  <p style={{ color: "rgba(245,240,232,0.38)", fontSize: "0.86rem" }}>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      style={{ color: "#c8914a", fontWeight: 600, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.target.style.color = "#e8c47a")}
                      onMouseLeave={(e) => (e.target.style.color = "#c8914a")}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ─── STEP 3: OTP Verification ─── */}
            {verificationStep && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                {/* Icon */}
                <div
                  style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: "rgba(200,145,74,0.1)",
                    border: "1px solid rgba(200,145,74,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  <Mail size={26} style={{ color: "#c8914a" }} />
                </div>
                <p style={{ color: "#c8914a", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 500 }}>
                  Verify your email
                </p>
                <h1 className="rp-display" style={{ color: "#f5f0e8", fontSize: "1.9rem", fontWeight: 600, margin: 0, marginBottom: "8px" }}>
                  Check your inbox
                </h1>
                <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "0.88rem", marginBottom: "28px", maxWidth: "280px" }}>
                  We sent a 6-digit code to{" "}
                  <span style={{ color: "#e8c47a", fontWeight: 500 }}>{form.email}</span>
                </p>

                <form onSubmit={handleVerify} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {errBox(error)}
                  {successBox(success)}

                  <input
                    className="rp-otp"
                    placeholder="· · · · · ·"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />

                  <button type="submit" className="rp-btn" disabled={isLoading}>
                    {isLoading ? <>{spinner} Verifying…</> : <><ShieldCheck size={16} /> Verify Account</>}
                  </button>

                  <button type="button" className="rp-btn-ghost" onClick={handleResend}>
                    Resend code
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ══════════ RIGHT PANEL — Decorative ══════════ */}
          <div
            className="rp-right-visual"
            style={{
              width: "45%",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* BG image */}
            <div
              style={{
                position: "absolute", inset: 0,
                backgroundImage: "url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Dark overlay */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(200deg, rgba(10,9,7,0.6) 0%, rgba(10,9,7,0.45) 40%, rgba(10,9,7,0.9) 100%)",
              }}
            />
            {/* Gold radial */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 70% 50% at 60% 40%, rgba(200,145,74,0.1) 0%, transparent 70%)",
              }}
            />

            {/* Shimmer sweep */}
            <div className="rp-shimmer-sweep" />

            {/* Particles */}
            {PARTICLES.map((p, i) => (
              <div
                key={i}
                className={p.cls}
                style={{
                  position: "absolute",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(200,145,74,0.8) 0%, rgba(200,145,74,0.2) 100%)",
                  zIndex: 4,
                  ...p.style,
                }}
              />
            ))}

            {/* Content */}
            <div
              style={{
                position: "absolute", inset: 0, zIndex: 5,
                display: "flex", flexDirection: "column",
                justifyContent: "space-between",
                padding: "40px",
              }}
            >
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg,#c8914a,#e8c47a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(200,145,74,0.4)", flexShrink: 0,
                  }}
                >
                  <Shield size={16} color="#0a0907" strokeWidth={2.5} />
                </div>
                <span className="rp-display" style={{ color: "#f5f0e8", fontSize: "1.15rem", fontWeight: 600, letterSpacing: "0.04em" }}>
                  AptHive
                </span>
              </div>

              {/* Quote */}
              <div>
                <div className="rp-goldline" />
                <blockquote
                  className="rp-display"
                  style={{
                    color: "#f5f0e8",
                    fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
                    fontWeight: 600,
                    lineHeight: 1.25,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  "A community
                  <br />
                  <span className="rp-shimmer-text">worth belonging to."</span>
                </blockquote>
                <p
                  style={{
                    color: "rgba(245,240,232,0.42)",
                    fontSize: "0.85rem",
                    marginTop: "14px",
                    lineHeight: 1.65,
                    maxWidth: "240px",
                    fontWeight: 300,
                  }}
                >
                  Join 500+ residents already living smarter — announcements, bookings, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
