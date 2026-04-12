import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

/* ─── Injected styles ───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
  .lp-root { font-family: 'DM Sans', sans-serif; }
  .lp-display { font-family: 'Cormorant Garamond', serif !important; }

  /* Field focus glow */
  .lp-input {
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
  .lp-input::placeholder { color: rgba(245,240,232,0.28); }
  .lp-input:focus {
    border-color: #c8914a;
    box-shadow: 0 0 0 3px rgba(200,145,74,0.15), 0 0 16px rgba(200,145,74,0.08);
  }
  .lp-input.error-field {
    border-color: rgba(244,63,94,0.6);
  }
  .lp-input.error-field:focus {
    border-color: rgba(244,63,94,0.8);
    box-shadow: 0 0 0 3px rgba(244,63,94,0.1);
  }

  /* Shimmer sweep on left panel */
  @keyframes shimmerSweep {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(300%) skewX(-15deg); }
  }
  .lp-shimmer {
    position: absolute;
    top: 0; bottom: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgba(200,145,74,0.07), transparent);
    animation: shimmerSweep 5s ease-in-out infinite;
    pointer-events: none;
    z-index: 3;
  }

  /* Floating particles */
  @keyframes pFloat1 {
    0%,100% { transform: translate(0,0) scale(1);   opacity: 0.18; }
    50%      { transform: translate(14px,-20px) scale(1.3); opacity: 0.42; }
  }
  @keyframes pFloat2 {
    0%,100% { transform: translate(0,0) scale(1);   opacity: 0.12; }
    50%      { transform: translate(-18px,12px) scale(0.8); opacity: 0.3; }
  }
  @keyframes pFloat3 {
    0%,100% { transform: translate(0,0) scale(1);   opacity: 0.22; }
    50%      { transform: translate(10px,18px) scale(1.2); opacity: 0.5; }
  }
  .lp-p1 { animation: pFloat1 7s ease-in-out infinite; }
  .lp-p2 { animation: pFloat2 9s ease-in-out infinite 1.5s; }
  .lp-p3 { animation: pFloat3 6s ease-in-out infinite 3s; }
  .lp-p4 { animation: pFloat1 11s ease-in-out infinite 2s; }
  .lp-p5 { animation: pFloat2 8s ease-in-out infinite 0.5s; }

  /* Gold gradient line */
  @keyframes lineGrow {
    from { width: 0; }
    to   { width: 48px; }
  }
  .lp-goldline {
    height: 2px;
    background: linear-gradient(90deg, #c8914a, #e8c47a);
    animation: lineGrow 0.8s 0.5s ease forwards;
    width: 0;
  }

  /* Button hover */
  .lp-btn {
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
  .lp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(200,145,74,0.5);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Shimmer text */
  @keyframes shimmerText {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .lp-shimmer-text {
    background: linear-gradient(90deg, #c8914a 0%, #f0d49a 40%, #c8914a 60%, #e8c47a 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerText 4s linear infinite;
  }

  /* Scroll for small screens */
  @media (max-width: 767px) {
    .lp-left-panel { display: none !important; }
    .lp-right-panel { width: 100% !important; }
  }
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]           = useState({ email: "", password: "", tenantSlug: "" });
  const [showPassword, setShowPw] = useState(false);
  const [emailError, setEmailErr] = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setLoading]   = useState(false);

  function handleEmailChange(e) {
    const v = e.target.value;
    setForm((p) => ({ ...p, email: v }));
    setEmailErr(v && !EMAIL_REGEX.test(v) ? "Enter a valid email address." : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (emailError) return;
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── Particles config ── */
  const PARTICLES = [
    { cls: "lp-p1", style: { top: "18%",  left: "15%",  width: 6,  height: 6 } },
    { cls: "lp-p2", style: { top: "42%",  left: "72%",  width: 4,  height: 4 } },
    { cls: "lp-p3", style: { top: "70%",  left: "28%",  width: 8,  height: 8 } },
    { cls: "lp-p4", style: { top: "30%",  left: "55%",  width: 5,  height: 5 } },
    { cls: "lp-p5", style: { top: "82%",  left: "60%",  width: 4,  height: 4 } },
    { cls: "lp-p1", style: { top: "58%",  left: "88%",  width: 6,  height: 6 } },
    { cls: "lp-p3", style: { top: "12%",  left: "80%",  width: 3,  height: 3 } },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div
        className="lp-root"
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
          {/* ══════════ LEFT PANEL — Decorative ══════════ */}
          <div
            className="lp-left-panel"
            style={{
              width: "50%",
              position: "relative",
              minHeight: "600px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* BG image */}
            <div
              style={{
                position: "absolute", inset: 0,
                backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Dark overlay */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(160deg, rgba(10,9,7,0.72) 0%, rgba(10,9,7,0.5) 50%, rgba(10,9,7,0.88) 100%)",
              }}
            />
            {/* Gold radial glow */}
            <div
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 70% 50% at 40% 40%, rgba(200,145,74,0.1) 0%, transparent 70%)",
              }}
            />

            {/* Shimmer sweep */}
            <div className="lp-shimmer" />

            {/* Floating particles */}
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
                position: "absolute", inset: 0,
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "40px",
              }}
            >
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#c8914a,#e8c47a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(200,145,74,0.4)",
                    flexShrink: 0,
                  }}
                >
                  <Shield size={16} color="#0a0907" strokeWidth={2.5} />
                </div>
                <span
                  className="lp-display"
                  style={{ color: "#f5f0e8", fontSize: "1.15rem", fontWeight: 600, letterSpacing: "0.04em" }}
                >
                  AptHive
                </span>
              </div>

              {/* Quote block */}
              <div>
                <div className="lp-goldline" style={{ marginBottom: "20px" }} />
                <blockquote
                  className="lp-display"
                  style={{
                    color: "#f5f0e8",
                    fontSize: "clamp(1.9rem, 3.2vw, 2.6rem)",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  "Where every home
                  <br />
                  <span className="lp-shimmer-text">becomes a hive."</span>
                </blockquote>
                <p
                  style={{
                    color: "rgba(245,240,232,0.48)",
                    fontSize: "0.88rem",
                    marginTop: "16px",
                    lineHeight: 1.65,
                    maxWidth: "280px",
                    fontWeight: 300,
                  }}
                >
                  Smart access, community events, and seamless living — all in one platform.
                </p>

                {/* Stat pills */}
                <div style={{ display: "flex", gap: "10px", marginTop: "28px", flexWrap: "wrap" }}>
                  {[
                    { n: "500+", label: "Residents" },
                    { n: "40+",  label: "Societies" },
                    { n: "4.9★", label: "Rating" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "20px",
                        background: "rgba(200,145,74,0.1)",
                        border: "1px solid rgba(200,145,74,0.22)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span style={{ color: "#e8c47a", fontSize: "0.92rem", fontWeight: 600 }}>{s.n}</span>
                      <span style={{ color: "rgba(245,240,232,0.45)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT PANEL — Form ══════════ */}
          <div
            className="lp-right-panel"
            style={{
              width: "50%",
              background: "#0d0b09",
              padding: "48px 44px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Mobile logo */}
            <div style={{ display: "none" }} className="lp-mobile-logo">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg,#c8914a,#e8c47a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Shield size={16} color="#0a0907" strokeWidth={2.5} />
                </div>
                <span className="lp-display" style={{ color: "#f5f0e8", fontSize: "1.15rem", fontWeight: 600 }}>AptHive</span>
              </div>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: "32px" }}>
              <p
                style={{
                  color: "#c8914a",
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Welcome back
              </p>
              <h1
                className="lp-display"
                style={{
                  color: "#f5f0e8",
                  fontSize: "2.2rem",
                  fontWeight: 600,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Sign In
              </h1>
              <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "0.88rem", marginTop: "6px", fontWeight: 300 }}>
                Secure access to your society portal
              </p>
            </div>

            {/* Error box */}
            {error && (
              <div
                style={{
                  background: "rgba(244,63,94,0.08)",
                  border: "1px solid rgba(244,63,94,0.25)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  color: "#fca5a5",
                  fontSize: "0.86rem",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Society Code */}
              <div>
                <label
                  htmlFor="tenantSlug"
                  style={{ display: "block", color: "rgba(245,240,232,0.55)", fontSize: "0.78rem", marginBottom: "6px", letterSpacing: "0.04em", fontWeight: 500 }}
                >
                  Society Code
                </label>
                <input
                  id="tenantSlug"
                  className="lp-input"
                  placeholder="e.g. green-heights"
                  value={form.tenantSlug}
                  onChange={(e) => setForm((p) => ({ ...p, tenantSlug: e.target.value }))}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  style={{ display: "block", color: "rgba(245,240,232,0.55)", fontSize: "0.78rem", marginBottom: "6px", letterSpacing: "0.04em", fontWeight: 500 }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className={`lp-input${emailError ? " error-field" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleEmailChange}
                  required
                />
                {emailError && (
                  <p style={{ color: "#fca5a5", fontSize: "0.75rem", marginTop: "5px" }}>{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  style={{ display: "block", color: "rgba(245,240,232,0.55)", fontSize: "0.78rem", marginBottom: "6px", letterSpacing: "0.04em", fontWeight: 500 }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="lp-input"
                    placeholder="••••••••"
                    style={{ paddingRight: "44px" }}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(245,240,232,0.35)", padding: "4px",
                      transition: "color 0.2s",
                      display: "flex", alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c8914a")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="lp-btn"
                disabled={isLoading}
                style={{ marginTop: "8px" }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: 14, height: 14, border: "2px solid rgba(10,9,7,0.3)",
                        borderTopColor: "#0a0907", borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <div
              style={{
                marginTop: "28px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(245,240,232,0.06)",
                textAlign: "center",
              }}
            >
              <p style={{ color: "rgba(245,240,232,0.38)", fontSize: "0.86rem" }}>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#c8914a",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#e8c47a")}
                  onMouseLeave={(e) => (e.target.style.color = "#c8914a")}
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Spin keyframe for loading indicator */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
