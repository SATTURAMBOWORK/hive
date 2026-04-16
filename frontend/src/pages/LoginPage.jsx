import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff, Shield } from "lucide-react";
import Lottie from "lottie-react";

/*
 ╔══════════════════════════════════════════════════════════════════╗
 ║  HOW TO ADD YOUR LOTTIE ANIMATIONS                               ║
 ║                                                                  ║
 ║  1. Go to https://lottiefiles.com                                ║
 ║  2. Search the keyword listed next to each layer below           ║
 ║  3. Download the .json file (free tier works)                    ║
 ║  4. Save it to: frontend/src/assets/lottie/                      ║
 ║  5. Uncomment the matching import line below                     ║
 ║  6. Set the `data:` field in LOTTIE_LAYERS to the import         ║
 ╚══════════════════════════════════════════════════════════════════╝

  RECOMMENDED SEARCHES ON LOTTIEFILES.COM:
  ─────────────────────────────────────────────────────────────────
  LAYER 1 – building.json        →  "apartment building night loop"
  LAYER 2 – balcony.json         →  "people balcony happy reading"
  LAYER 3 – worker.json          →  "janitor sweeping cleaning floor"
  LAYER 4 – party.json           →  "party lights window confetti"
  LAYER 5 – van.json             →  "delivery scooter driving loop"
  LAYER 6 – barrier.json         →  "boom barrier gate lifting" (must be one-shot, not loop)
  ─────────────────────────────────────────────────────────────────
*/

// ── Step 5: Uncomment these as you download each file ────────────
// import buildingData from "./assets/lottie/building.json";
// import balconyData  from "./assets/lottie/balcony.json";
// import workerData   from "./assets/lottie/worker.json";
// import partyData    from "./assets/lottie/party.json";
// import vanData      from "./assets/lottie/van.json";
// import barrierData  from "./assets/lottie/barrier.json";

/*
 ┌──────────────────────────────────────────────────────────────────┐
 │  LOTTIE_LAYERS — your single source of truth.                    │
 │  When you download a file, set data: yourImport here.            │
 │  Everything else (position, speed, loop) is already configured.  │
 └──────────────────────────────────────────────────────────────────┘
*/
const LOTTIE_LAYERS = {

  /* ── LAYER 1: The building ──────────────────────────────────── */
  building: {
    data:    null,           // ← swap: buildingData
    loop:    true,
    autoplay:true,
    speed:   0.5,            // slow, ambient
    label:   "🏢 building.json",
    hint:    "apartment building exterior night",
    style: {
      position: "absolute",
      bottom: "12%", left: "50%",
      transform: "translateX(-50%)",
      width: "90%", height: "75%",
      zIndex: 2,
    },
  },

  /* ── LAYER 2: People on balconies ───────────────────────────── */
  balcony: {
    data:    null,           // ← swap: balconyData
    loop:    true,
    autoplay:true,
    speed:   0.8,
    label:   "🧑‍🤝‍🧑 balcony.json",
    hint:    "people balcony happy reading eating",
    style: {
      position: "absolute",
      bottom: "28%", left: "50%",
      transform: "translateX(-50%)",
      width: "85%", height: "55%",
      zIndex: 3,
    },
  },

  /* ── LAYER 3: Ground-floor worker ───────────────────────────── */
  worker: {
    data:    null,           // ← swap: workerData
    loop:    true,
    autoplay:true,
    speed:   1,
    label:   "🧹 worker.json",
    hint:    "janitor sweeping cleaning floor",
    style: {
      position: "absolute",
      bottom: "11%", left: "4%",
      width: "28%", height: "22%",
      zIndex: 4,
    },
  },

  /* ── LAYER 4: Party lights in a window ──────────────────────── */
  party: {
    data:    null,           // ← swap: partyData
    loop:    true,
    autoplay:true,
    speed:   1.3,
    label:   "🎉 party.json",
    hint:    "party lights window disco confetti",
    style: {
      position: "absolute",
      top: "18%", right: "6%",
      width: "26%", height: "20%",
      zIndex: 3,
    },
  },

  /* ── LAYER 5: Delivery van / scooter ────────────────────────── */
  van: {
    data:    null,           // ← swap: vanData
    loop:    true,
    autoplay:true,
    speed:   1,
    label:   "🛵 van.json",
    hint:    "delivery scooter driving happy loop",
    style: {
      position: "absolute",
      bottom: "11%", right: "2%",
      width: "36%", height: "16%",
      zIndex: 4,
    },
  },

  /* ── LAYER 6: Boom barrier (INTERACTIVE) ────────────────────── */
  barrier: {
    data:    null,           // ← swap: barrierData
    loop:    false,          // plays ONCE per sign-in click
    autoplay:false,          // controlled via ref — DO NOT set true
    speed:   1.8,
    label:   "🚧 barrier.json",
    hint:    "boom barrier gate lifting opening (non-loop, one-shot)",
    interactive: true,       // flag — LoginPage uses the ref
    style: {
      position: "absolute",
      bottom: "10%", left: "50%",
      transform: "translateX(-50%)",
      width: "44%", height: "20%",
      zIndex: 5,
    },
  },
};

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
.lgi-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
.lgi-root * { box-sizing: border-box; margin: 0; padding: 0; }
@keyframes lgi-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 70%{box-shadow:0 0 0 10px rgba(37,99,235,0)} }
@keyframes lgi-spin   { to { transform: rotate(360deg); } }
@keyframes lgi-twinkle{ 0%,100%{opacity:.9} 50%{opacity:.15} }
@keyframes lgi-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes lgi-live   { 0%,100%{opacity:1} 50%{opacity:.25} }
.lgi-input {
  width:100%; background:#fff; border:1.5px solid #E2E8F0; border-radius:12px;
  padding:12px 16px; color:#0F172A; font-family:'Plus Jakarta Sans',sans-serif;
  font-size:0.9rem; outline:none; transition:border-color .2s, box-shadow .2s;
}
.lgi-input::placeholder { color: #94A3B8; }
.lgi-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.lgi-input.err { border-color: #DC2626; }
.lgi-input.err:focus { box-shadow: 0 0 0 3px rgba(220,38,38,.1); }
.lgi-label { display:block; font-size:.78rem; font-weight:600; color:#64748B; margin-bottom:6px; letter-spacing:.02em; }
.lgi-btn {
  width:100%; background:#2563EB; color:#fff; border:none; border-radius:12px;
  padding:13px 24px; font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  box-shadow:0 4px 14px rgba(37,99,235,.32); animation:lgi-pulse 2.8s ease-in-out infinite;
  transition:transform .2s, box-shadow .2s, background .2s;
}
.lgi-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,99,235,.42); background:#1D4ED8; }
.lgi-btn:active:not(:disabled) { transform:translateY(0); }
.lgi-btn:disabled { opacity:.65; cursor:not-allowed; animation:none; }
@media(max-width:768px) { .lgi-right-visual{display:none!important;} .lgi-form-side{width:100%!important;} }
`;

/* ─── Time / sky helpers (unchanged) ──────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 8)  return "dawn";
  if (h >= 8  && h < 18) return "day";
  if (h >= 18 && h < 21) return "dusk";
  return "night";
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
const SKY = {
  dawn:  { top:"#0B1120", mid:"#7C3AED", bot:"#F97316" },
  day:   { top:"#1E3A8A", mid:"#2563EB", bot:"#93C5FD" },
  dusk:  { top:"#0B1120", mid:"#9333EA", bot:"#EA580C" },
  night: { top:"#020617", mid:"#0B1120", bot:"#1E2E5C" },
};

/* ─── LottieLayer ──────────────────────────────────────────────── */
/*
  This wrapper renders a real Lottie animation when data is provided,
  or a visible placeholder box when data is still null.
  The placeholder shows you exactly where the animation will sit.
*/
function LottieLayer({ layerKey, lottieRef }) {
  const cfg = LOTTIE_LAYERS[layerKey];

  /* ── Placeholder (shown while data is null) ── */
  if (!cfg.data) {
    return (
      <div
        style={{
          ...cfg.style,
          border: cfg.interactive
            ? "1.5px dashed rgba(251,191,36,0.5)"
            : "1px dashed rgba(255,255,255,0.14)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          background: cfg.interactive
            ? "rgba(251,191,36,0.05)"
            : "rgba(255,255,255,0.03)",
          backdropFilter: "blur(2px)",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>
          {cfg.label.split(" ")[0]}
        </span>
        <span style={{
          color: cfg.interactive ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.3)",
          fontSize: "0.58rem",
          fontFamily: "monospace",
          textAlign: "center",
          lineHeight: 1.65,
          padding: "0 6px",
        }}>
          {cfg.label.slice(cfg.label.indexOf(" ") + 1)}
          {cfg.interactive ? "\n▶ plays on Sign In" : ""}
        </span>
      </div>
    );
  }

  /* ── Live Lottie animation ── */
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={cfg.data}
      loop={cfg.loop}
      autoplay={cfg.autoplay}
      style={cfg.style}
      onDOMLoaded={() => {
        if (cfg.speed !== 1 && lottieRef?.current) {
          lottieRef.current.setSpeed(cfg.speed);
        }
      }}
    />
  );
}

/* ─── Stars (reused across time modes) ────────────────────────── */
const STARS = Array.from({ length: 30 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  s: Math.random() * 1.4 + 0.7,
  d: (Math.random() * 3 + 1.5).toFixed(1),
  delay: (Math.random() * 3).toFixed(1),
}));

/* ─── LoginVisual ──────────────────────────────────────────────── */
function LoginVisual({ barrierRef }) {
  const tod     = getTimeOfDay();
  const sky     = SKY[tod];
  const isNight = tod === "night" || tod === "dusk";

  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 55%, ${sky.bot} 100%)`,
    }}>

      {/* ── LAYER 0: Sky atmosphere — stars, moon, sun ── */}

      {isNight && STARS.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s,
          borderRadius: "50%", background: "#fff",
          animation: `lgi-twinkle ${s.d}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }}/>
      ))}

      {tod === "night" && (
        <div style={{
          position:"absolute", top:"8%", right:"14%",
          width:28, height:28, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%, #FEF9C3, #FDE68A)",
          boxShadow:"0 0 20px rgba(253,230,138,0.4), 0 0 60px rgba(253,230,138,0.15)",
          zIndex: 1,
        }}/>
      )}

      {tod !== "night" && (
        <div style={{
          position: "absolute",
          top: tod === "day" ? "10%" : "34%",
          right: tod === "dusk" ? "11%" : "17%",
          width: tod === "day" ? 34 : 42,
          height: tod === "day" ? 34 : 42,
          borderRadius: "50%",
          background: tod === "day"
            ? "radial-gradient(circle, #FEF9C3, #FDE68A)"
            : "radial-gradient(circle, #FDE68A, #F97316)",
          boxShadow: tod === "day"
            ? "0 0 24px rgba(253,230,138,0.5), 0 0 80px rgba(253,230,138,0.2)"
            : "0 0 32px rgba(249,115,22,0.6), 0 0 90px rgba(249,115,22,0.25)",
          zIndex: 1,
        }}/>
      )}

      {/* ── LAYER 1: Building ── */}
      <LottieLayer layerKey="building" />

      {/* ── LAYER 2: Balcony people ── */}
      <LottieLayer layerKey="balcony" />

      {/* ── LAYER 3: Worker ── */}
      <LottieLayer layerKey="worker" />

      {/* ── LAYER 4: Party lights ── */}
      <LottieLayer layerKey="party" />

      {/* ── LAYER 5: Delivery van ── */}
      <LottieLayer layerKey="van" />

      {/* ── LAYER 6: Boom barrier (interactive, uses ref from LoginPage) ── */}
      <LottieLayer layerKey="barrier" lottieRef={barrierRef} />

      {/* ── Ground strip ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:50,
        background:"linear-gradient(180deg, #0B1626 0%, #07101E 100%)",
        borderTop:"1px solid rgba(255,255,255,0.04)",
        zIndex: 6,
      }}>
        {/* Floating status chips */}
        <div style={{
          position:"absolute", bottom:12, right:14,
          display:"flex", alignItems:"center", gap:5,
          background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.28)",
          borderRadius:20, padding:"3px 10px",
          animation:"lgi-float 3s ease-in-out infinite",
          zIndex: 7,
        }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", animation:"lgi-live 1.6s ease-in-out infinite" }}/>
          <span style={{ color:"#4ADE80", fontSize:"0.62rem", fontWeight:700 }}>Gate Secured</span>
        </div>
        <div style={{
          position:"absolute", bottom:12, left:14,
          display:"flex", alignItems:"center", gap:5,
          background:"rgba(253,230,138,0.1)", border:"1px solid rgba(253,230,138,0.22)",
          borderRadius:20, padding:"3px 10px",
          animation:"lgi-float 4s ease-in-out infinite 1s",
          zIndex: 7,
        }}>
          <span style={{ color:"#FDE68A", fontSize:"0.62rem", fontWeight:700 }}>248 residents</span>
        </div>
      </div>

      {/* ── Top greeting overlay ── */}
      <div style={{
        position:"absolute", top:"6%", left:0, right:0,
        textAlign:"center", zIndex:10, pointerEvents:"none",
      }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.7rem", fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:5 }}>
          {getGreeting()}
        </p>
        <p style={{ color:"#fff", fontSize:"1.15rem", fontWeight:800, letterSpacing:"-0.3px", textShadow:"0 2px 14px rgba(0,0,0,0.5)" }}>
          Green Heights Society
        </p>
      </div>

    </div>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Main Component ───────────────────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  // Ref to the boom barrier Lottie instance
  // When the user clicks Sign In, we call barrierRef.current.play()
  // — the barrier lifts up as they're authenticated
  const barrierRef = useRef(null);

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
    setError(""); setLoading(true);

    // 🚧 Lift the boom barrier as the user signs in
    if (barrierRef.current && LOTTIE_LAYERS.barrier.data) {
      barrierRef.current.goToAndPlay(0, true);
    }

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
      // Lower barrier again on failure
      if (barrierRef.current && LOTTIE_LAYERS.barrier.data) {
        barrierRef.current.goToAndStop(0, true);
      }
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
      <div
        className="lgi-root"
        style={{
          minHeight:"100vh", background:"#F7F9FF",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"24px 16px",
          backgroundImage:"radial-gradient(circle, #E2E8F0 1px, transparent 1px)",
          backgroundSize:"26px 26px",
        }}
      >
        {/* Ambient orb */}
        <div style={{ position:"fixed", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.06) 0%,transparent 65%)", top:-200, right:-100, pointerEvents:"none" }}/>

        <div style={{
          width:"100%", maxWidth:1000,
          display:"flex", borderRadius:24, overflow:"hidden",
          boxShadow:"0 8px 40px rgba(15,23,42,.12), 0 32px 80px rgba(15,23,42,.10)",
          border:"1px solid #E2E8F0",
        }}>

          {/* ── Left: Login Form ── */}
          <div
            className="lgi-form-side"
            style={{ width:"48%", background:"#fff", padding:"52px 48px", display:"flex", flexDirection:"column", justifyContent:"center", minHeight:600 }}
          >
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:40 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(37,99,235,.32)" }}>
                <Shield size={17} color="#fff"/>
              </div>
              <span style={{ fontWeight:800, fontSize:17, color:"#0F172A", letterSpacing:"-.3px" }}>AptHive</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom:32 }}>
              <h1 style={{ fontSize:"1.85rem", fontWeight:800, color:"#0F172A", letterSpacing:"-1px", lineHeight:1.1, marginBottom:8 }}>Welcome back</h1>
              <p style={{ fontSize:".9rem", color:"#64748B" }}>Sign in to your society dashboard</p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid rgba(220,38,38,.2)", borderRadius:10, padding:"11px 14px", color:"#DC2626", fontSize:".84rem", marginBottom:16, lineHeight:1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label className="lgi-label">Society Code</label>
                <input className="lgi-input" placeholder="e.g. green-heights" value={form.tenantSlug} onChange={e => setForm(p => ({...p, tenantSlug: e.target.value}))} required/>
              </div>
              <div>
                <label className="lgi-label">Email Address</label>
                <input type="email" className={`lgi-input${emailError ? " err" : ""}`} placeholder="you@example.com" value={form.email} onChange={handleEmailChange} required/>
                {emailError && <p style={{ color:"#DC2626", fontSize:".74rem", marginTop:4 }}>{emailError}</p>}
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label className="lgi-label" style={{ margin:0 }}>Password</label>
                  <a href="#" style={{ fontSize:".75rem", color:"#2563EB", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
                </div>
                <div style={{ position:"relative" }}>
                  <input type={showPassword ? "text" : "password"} className="lgi-input" style={{ paddingRight:44 }} placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required/>
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex", alignItems:"center", transition:"color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#2563EB"}
                    onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" className="lgi-btn" disabled={isLoading} style={{ marginTop:4 }}>
                {isLoading ? spinner : "Sign in →"}
              </button>
            </form>

            <div style={{ marginTop:28, paddingTop:24, borderTop:"1px solid #F1F5F9", textAlign:"center" }}>
              <p style={{ color:"#94A3B8", fontSize:".86rem" }}>
                Don't have an account?{" "}
                <Link to="/register" style={{ color:"#2563EB", fontWeight:700, textDecoration:"none" }}>Create one free</Link>
              </p>
            </div>
          </div>

          {/* ── Right: Lottie apartment scene ── */}
          {/* barrierRef is passed down so handleSubmit can trigger the barrier animation */}
          <div className="lgi-right-visual" style={{ flex:1, position:"relative", minHeight:600 }}>
            <LoginVisual barrierRef={barrierRef}/>
          </div>

        </div>
      </div>
    </>
  );
}

export default LoginPage;
