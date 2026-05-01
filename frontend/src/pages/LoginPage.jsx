import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff, Shield } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
.lgi-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
.lgi-root * { box-sizing: border-box; margin: 0; padding: 0; }
.lgi-input {
  width:100%; background:#fff; border:1.5px solid #E2E8F0; border-radius:12px;
  padding:12px 16px; color:#0F172A; font-family:'Plus Jakarta Sans',sans-serif;
  font-size:0.9rem; outline:none; transition:border-color .2s,box-shadow .2s;
}
.lgi-input::placeholder { color:#94A3B8; }
.lgi-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.lgi-input.err { border-color:#DC2626; }
.lgi-input.err:focus { box-shadow:0 0 0 3px rgba(220,38,38,.1); }
.lgi-label { display:block; font-size:.78rem; font-weight:600; color:#64748B; margin-bottom:6px; letter-spacing:.02em; }
.lgi-btn {
  width:100%; color:#fff; border:none; border-radius:12px;
  padding:13px 24px; font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:transform .2s, box-shadow .2s, opacity .2s;
}
.lgi-btn:hover:not(:disabled) { transform:translateY(-1px); }
.lgi-btn:active:not(:disabled) { transform:translateY(0); }
.lgi-btn:disabled { opacity:.65; cursor:not-allowed; }
@media(max-width: 960px) {
  .lgi-shell { grid-template-columns: 1fr !important; }
  .lgi-right-visual { min-height: 420px !important; }
}
`;

/* ─── Main page ─────────────────────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]           = useState({ email:"", password:"", tenantSlug:"" });
  const [showPassword, setShowPw] = useState(false);
  const [emailError, setEmailErr] = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setLoading]   = useState(false);

  function handleEmailChange(e) {
    const v = e.target.value;
    setForm(p => ({ ...p, email: v }));
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

  const spinner = (
    <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"lgi-spin .7s linear infinite", display:"inline-block" }}/>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="lgi-root" style={{
        minHeight:"100vh",
        background:"linear-gradient(180deg,#F7F9FF 0%,#EEF4FF 100%)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:"28px 18px",
        backgroundImage:"radial-gradient(circle,#E2E8F0 1px,transparent 1px)",
        backgroundSize:"26px 26px",
      }}>
        <div style={{ position:"fixed", width:620, height:620, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%)", top:-220, right:-120, pointerEvents:"none" }} />

        <div className="lgi-shell" style={{
          width:"100%",
          maxWidth:1240,
          display:"grid",
          gridTemplateColumns:"minmax(380px, 0.92fr) minmax(420px, 1.08fr)",
          borderRadius:28,
          overflow:"hidden",
          boxShadow:"0 16px 48px rgba(15,23,42,.12),0 40px 96px rgba(15,23,42,.08)",
          border:"1px solid #E2E8F0",
          background:"#fff",
        }}>

          <div className="lgi-form-side" style={{ padding:"44px 44px 38px", display:"flex", flexDirection:"column", justifyContent:"center", minHeight:680, background:"#FFFFFF" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:28 }}>
              <Link to="/login" style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"8px 11px", borderRadius:9999, border:"1px solid #E2E8F0",
                color:"#0F172A", textDecoration:"none", fontSize:14, fontWeight:700,
                background:"#fff", boxShadow:"0 2px 10px rgba(15,23,42,.04)",
              }}>
                <Shield size={15} />
                Login
              </Link>
              <Link to="/register" style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"8px 11px", borderRadius:9999, border:"1px solid #E2E8F0",
                color:"#64748B", textDecoration:"none", fontSize:14, fontWeight:600,
                background:"#fff",
              }}>
                <Shield size={15} />
                Sign Up
              </Link>
            </div>

            <div style={{ marginBottom:24, textAlign:"center" }}>
              <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#0F172A", letterSpacing:"-1px", lineHeight:1.1, marginBottom:8 }}>Wellcome!</h1>
              <p style={{ fontSize:".96rem", color:"#64748B" }}>Please enter your details to login.</p>
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid rgba(220,38,38,.18)", borderRadius:14, padding:"11px 14px", color:"#DC2626", fontSize:".84rem", marginBottom:16, lineHeight:1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label className="lgi-label">Society Code</label>
                <input className="lgi-input" placeholder="e.g. green-heights" value={form.tenantSlug} onChange={e => setForm(p=>({...p,tenantSlug:e.target.value}))} required />
              </div>
              <div>
                <label className="lgi-label">Email Address</label>
                <input type="email" className={`lgi-input${emailError?" err":""}`} placeholder="Enter your email address" value={form.email} onChange={handleEmailChange} required />
                {emailError && <p style={{ color:"#DC2626", fontSize:".74rem", marginTop:4 }}>{emailError}</p>}
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label className="lgi-label" style={{ margin:0 }}>Password</label>
                  <a href="#" style={{ fontSize:".75rem", color:"#64748B", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
                </div>
                <div style={{ position:"relative" }}>
                  <input type={showPassword?"text":"password"} className="lgi-input" style={{ paddingRight:44 }} placeholder="Enter your password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required />
                  <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex", alignItems:"center", transition:"color .2s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#2563EB"}
                    onMouseLeave={e=>e.currentTarget.style.color="#94A3B8"}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" className="lgi-btn" disabled={isLoading} style={{ marginTop:6, borderRadius:12, background:"linear-gradient(180deg,#1F2937 0%,#111827 100%)", boxShadow:"0 10px 24px rgba(15,23,42,.22)" }}>
                {isLoading ? spinner : "Log In"}
              </button>
            </form>

            <div style={{ marginTop:22, paddingTop:18, borderTop:"1px solid #E2E8F0", textAlign:"center" }}>
              <p style={{ color:"#94A3B8", fontSize:".86rem" }}>
                Don't have an account yet?{" "}
                <Link to="/register" style={{ color:"#0F172A", fontWeight:700, textDecoration:"underline" }}>Sign up</Link>
              </p>
            </div>
          </div>

          <div className="lgi-right-visual" style={{ position:"relative", minHeight:680, background:"#0F172A" }}>
            <img
              src="/apartment1.jpg"
              alt="Residential apartment building"
              loading="lazy"
              style={{
                width:"100%",
                height:"100%",
                objectFit:"cover",
                display:"block",
              }}
            />
            <div style={{
              position:"absolute",
              inset:0,
              background:"linear-gradient(180deg, rgba(15,23,42,.06) 0%, rgba(15,23,42,.08) 44%, rgba(15,23,42,.24) 100%)",
            }} />
            <div style={{
              position:"absolute",
              left:24,
              right:24,
              bottom:24,
              padding:"18px 20px",
              borderRadius:22,
              background:"rgba(15,23,42,.22)",
              border:"1px solid rgba(255,255,255,.18)",
              backdropFilter:"blur(16px)",
              WebkitBackdropFilter:"blur(16px)",
              color:"#fff",
              boxShadow:"0 18px 40px rgba(0,0,0,.22)",
            }}>
              <p style={{ fontSize:14, lineHeight:1.6, color:"rgba(255,255,255,.9)", marginBottom:14 }}>
                Secure society access, resident workflows, and daily management in one place.
              </p>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.5px" }}>AptHive</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.74)", marginTop:4 }}>Modern community operations</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, color:"rgba(255,255,255,.8)", fontSize:13, fontWeight:600 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 0 6px rgba(74,222,128,.16)" }} />
                  Live
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default LoginPage;
