import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import HeroShowcase from "./HeroShowcase";
import FeaturesSection from "../components/FeaturesSection";
import {
  Shield, Bell, Users, BarChart3, ArrowRight, Sun, Moon,
  Menu, X, Star, CheckCircle, Package, Calendar, LayoutGrid,
  MapPin, Zap, Pause, Play, ChevronLeft, ChevronRight,
} from "lucide-react";

/* ─── Scoped CSS ─────────────────────────────────────────────── */
const LP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.lp{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;overflow-x:hidden;}
.lp *{box-sizing:border-box;margin:0;padding:0;}

.lp{
  --bg:#F7F9FF;--bg-c:#FFFFFF;--bg-s:#EEF2FF;--bg-s2:#F1F5F9;
  --txt:#0F172A;--txt2:#64748B;--txt3:#94A3B8;
  --bdr:#E2E8F0;--bdr2:#CBD5E1;
  --blue:#2563EB;--blue-h:#1D4ED8;--blue-l:#EFF6FF;--blue-m:#DBEAFE;
  --grn:#16A34A;--grn-l:#DCFCE7;
  --ylw:#D97706;--ylw-l:#FEF9C3;
  --red:#DC2626;--red-l:#FEE2E2;
  --prp:#7C3AED;--prp-l:#F5F3FF;
  --sh:0 1px 2px rgba(15,23,42,.04),0 4px 16px rgba(15,23,42,.06);
  --sh2:0 4px 20px rgba(15,23,42,.08),0 20px 48px rgba(15,23,42,.08);
  --sh3:0 8px 32px rgba(37,99,235,.14),0 24px 56px rgba(15,23,42,.08);
  --nav-bg:rgba(247,249,255,.9);
  background:var(--bg);color:var(--txt);
}

@keyframes lp-f1{0%,100%{transform:translateY(0) rotate(-.3deg)}50%{transform:translateY(-10px) rotate(.6deg)}}
@keyframes lp-f2{0%,100%{transform:translateY(0) rotate(.3deg)}50%{transform:translateY(-8px) rotate(-.8deg)}}
@keyframes lp-live{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.5)}}
@keyframes lp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}70%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}
@keyframes lp-scroll-l{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes lp-scroll-r{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
@keyframes lp-bar{from{transform-origin:bottom;transform:scaleY(0)}to{transform-origin:bottom;transform:scaleY(1)}}

.lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--bdr);transition:box-shadow .3s;}
.lp-nav.scrolled{box-shadow:0 2px 20px rgba(15,23,42,.07);}
.lp-nav-inner{max-width:1180px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--txt);}
.lp-logo-mark{width:34px;height:34px;background:var(--blue);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,.32);}
.lp-logo-text{font-weight:800;font-size:16.5px;letter-spacing:-.3px;}
.lp-nav-links{display:flex;align-items:center;gap:2px;}
.lp-nl{padding:7px 13px;border-radius:8px;font-size:14px;font-weight:500;color:var(--txt2);text-decoration:none;transition:all .15s;}
.lp-nl:hover{color:var(--txt);background:var(--bg-s);}
.lp-nav-r{display:flex;align-items:center;gap:8px;}
.lp-toggle{width:38px;height:38px;border-radius:9px;background:var(--bg-s2);border:1px solid var(--bdr);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:var(--txt2);flex-shrink:0;}
.lp-toggle:hover{background:var(--blue-l);border-color:rgba(37,99,235,.25);color:var(--blue);}
.lp-ham{display:none;width:38px;height:38px;border-radius:9px;background:var(--bg-s2);border:1px solid var(--bdr);align-items:center;justify-content:center;cursor:pointer;color:var(--txt);flex-shrink:0;}

.lp-btn{padding:10px 20px;border-radius:12px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:7px;border:none;line-height:1;}
.lp-btn-lg{padding:13px 26px;font-size:15px;border-radius:14px;}
.lp-btn-sm{padding:8px 15px;font-size:13px;border-radius:10px;}
.lp-btn-blue{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.32);animation:lp-pulse 2.8s ease-in-out infinite;}
.lp-btn-blue:hover{background:var(--blue-h);transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.42);}
.lp-btn-outline{background:var(--bg-c);color:var(--txt);border:1.5px solid var(--bdr);}
.lp-btn-outline:hover{background:var(--bg-s2);transform:translateY(-1px);box-shadow:var(--sh);}

.lp-card{background:var(--bg-c);border:1px solid var(--bdr);border-radius:16px;box-shadow:var(--sh);}
.lp-section{max-width:1180px;margin:0 auto;padding:0 24px;}
.lp-avatar{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.lp-live-dot{width:7px;height:7px;border-radius:50%;background:#22C55E;display:inline-block;flex-shrink:0;animation:lp-live 1.6s ease-in-out infinite;}
.lp-dot-grid{background-image:radial-gradient(circle,var(--bdr) 1px,transparent 1px);background-size:26px 26px;}
.lp-mob{position:fixed;inset:0;z-index:99;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px;}

.lp-marquee-track{display:flex;gap:16px;width:max-content;will-change:transform;}
.lp-marquee-track-l{animation:lp-scroll-l 55s linear infinite;}
.lp-marquee-track-r{animation:lp-scroll-r 55s linear infinite;}
.lp-marquee-track:hover{animation-play-state:paused;}

@media(max-width:960px){
  .lp-nav-links{display:none!important;}.lp-ham{display:flex!important;}
  .lp-car-grid{grid-template-columns:1fr!important;}.lp-car-r{display:none!important;}
  .lp-feat-grid{grid-template-columns:1fr!important;}
}
@media(max-width:620px){
  .lp-car-grid{padding:80px 0 60px!important;}
}
`;

/* ─── Static data ─────────────────────────────────────────── */
const ROW1_TESTIMONIALS = [
  { name:"Ananya Krishnamurthy", role:"Society Secretary", soc:"Prestige Lakeside Habitat", img:"https://i.pravatar.cc/64?img=5",   q:"Managing visitor approvals used to take three phone calls. Now I approve from my phone in seconds." },
  { name:"Rohan Mehta",          role:"Resident",          soc:"Brigade El Dorado",          img:"https://i.pravatar.cc/64?img=12",  q:"My parents visited and the QR pass meant zero waiting at the gate. Genuinely great experience." },
  { name:"Priya Venkataraman",   role:"Flat Owner",        soc:"Purva Venezia, Yelahanka",   img:"https://i.pravatar.cc/64?img=18",  q:"Every delivery is now logged with a photo and timestamp. Total peace of mind after the incident last year." },
  { name:"Col. Arvind Shenoy",   role:"Head of Security",  soc:"Sobha City, Thanisandra",    img:"https://i.pravatar.cc/64?img=22",  q:"Twenty years in the Army taught me good systems beat good intentions. AptHive is exactly that." },
  { name:"Kavitha Subramaniam",  role:"Committee Member",  soc:"Salarpuria Greenage",        img:"https://i.pravatar.cc/64?img=29",  q:"Our monthly meetings now start with live analytics instead of handwritten logs. Night and day difference." },
];
const ROW2_TESTIMONIALS = [
  { name:"Suresh Narayanan",     role:"Resident",          soc:"Embassy Springs, Devanahalli", img:"https://i.pravatar.cc/64?img=33", q:"I was in a meeting when my guest arrived. One tap and she was cleared — didn't step out at all." },
  { name:"Deepa Rajagopal",      role:"Society Secretary", soc:"Mantri Pinnacle, Jayanagar",   img:"https://i.pravatar.cc/64?img=40", q:"Resident complaints about gate delays dropped to nearly zero. AptHive just works quietly." },
  { name:"Arjun Nambiar",        role:"Flat Owner",        soc:"Godrej Woodsman Estate",       img:"https://i.pravatar.cc/64?img=47", q:"Recurring passes for our cook and driver — set once, works every day. No more morning calls to the desk." },
  { name:"Sunita Reddy",         role:"Committee Member",  soc:"DivyaSree 77 Place",           img:"https://i.pravatar.cc/64?img=54", q:"Guards see what they need, residents get their view, I oversee everything. Brilliantly designed roles." },
  { name:"Manoj Kumar Iyer",     role:"Head of Security",  soc:"Nitesh Napa Valley",           img:"https://i.pravatar.cc/64?img=60", q:"Live dashboard lets me redeploy guards in real time based on actual visitor flow data. Incredible." },
];

/* ─── Navbar ──────────────────────────────────────────────── */
function Navbar({ scrolled, mob, setMob }) {
  return (
    <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
      <div className="lp-nav-inner">
        <a href="#" className="lp-logo">
          <div className="lp-logo-mark"><Shield size={17} color="#fff"/></div>
          <span className="lp-logo-text">AptHive</span>
        </a>
        <div className="lp-nav-links">
          {["Features","Security","Visitors","Pricing"].map(l => (
            <a key={l} href="#" className="lp-nl">{l}</a>
          ))}
        </div>
        <div className="lp-nav-r">
          <Link to="/login" style={{textDecoration:"none",color:"var(--txt2)",fontSize:14,fontWeight:500,padding:"8px 12px"}}>
            Sign in
          </Link>
          <Link to="/register" className="lp-btn lp-btn-sm lp-btn-blue" style={{textDecoration:"none"}}>
            Get started →
          </Link>
          <button className="lp-ham lp-toggle" onClick={() => setMob(o=>!o)}>
            {mob ? <X size={17}/> : <Menu size={17}/>}
          </button>
        </div>
      </div>
    </nav>
  );
}

function MobileMenu({ close }) {
  return (
    <motion.div className="lp-mob" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <button className="lp-toggle" onClick={close} style={{position:"absolute",top:16,right:16}}><X size={17}/></button>
      {["Features","Security","Visitors","Pricing"].map((l,i) => (
        <motion.a key={l} href="#" className="lp-nl" onClick={close}
          style={{fontSize:22,fontWeight:700,color:"var(--txt)"}}
          initial={{opacity:0,y:10}} animate={{opacity:1,y:0,transition:{delay:i*.06}}}>
          {l}
        </motion.a>
      ))}
      <Link to="/register" className="lp-btn lp-btn-lg lp-btn-blue" style={{textDecoration:"none",marginTop:8}}>
        Get started free <ArrowRight size={16}/>
      </Link>
    </motion.div>
  );
}

/* ─── Carousel slide visuals ─────────────────────────────── */
function SlideVisualResident() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [];
    const run = () => {
      setPhase(0);
      ts.push(setTimeout(() => setPhase(1), 2400));
      ts.push(setTimeout(() => run(), 4800));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{position:"relative",maxWidth:380,width:"100%",animation:"lp-f1 5s ease-in-out infinite"}}>
      <div className="lp-card" style={{borderRadius:20,overflow:"hidden",boxShadow:"var(--sh2)"}}>
        <div style={{background:"#2563EB",padding:"18px 20px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <Shield size={15} color="#fff"/>
            <span style={{color:"#fff",fontSize:13,fontWeight:700}}>AptHive</span>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
              <span className="lp-live-dot" style={{background:"#22C55E"}}/>
              <span style={{color:"rgba(255,255,255,.8)",fontSize:11}}>Live</span>
            </div>
          </div>
          <div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginBottom:2}}>Visitor at Gate 1</div>
          <div style={{color:"#fff",fontSize:16,fontWeight:800}}>Someone's here!</div>
        </div>
        <div style={{padding:16}}>
          <div style={{background:"var(--bg-s2)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:44,height:44,borderRadius:11,background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>RS</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--txt)"}}>Rahul Sharma</div>
              <div style={{fontSize:12,color:"var(--txt2)"}}>Flat A-204 · Guest</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#16A34A",fontWeight:600}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#16A34A",display:"inline-block"}}/>Now
            </div>
          </div>
          <AnimatePresence mode="wait">
            {phase === 0 ? (
              <motion.div key="btns" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} style={{display:"flex",gap:10}}>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"none",cursor:"pointer",background:"#DCFCE7",color:"#16A34A",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <CheckCircle size={14}/> Approve
                </button>
                <button style={{flex:1,padding:"11px",borderRadius:11,border:"none",cursor:"pointer",background:"#FEE2E2",color:"#DC2626",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <X size={14}/> Deny
                </button>
              </motion.div>
            ) : (
              <motion.div key="ok" initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.85,opacity:0}} transition={{type:"spring",stiffness:400,damping:20}}
                style={{background:"#DCFCE7",borderRadius:11,padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#16A34A",fontWeight:700,fontSize:14}}>
                <CheckCircle size={16}/> Visitor Approved!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <motion.div animate={{y:[0,-8,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut",delay:1}}
        style={{position:"absolute",bottom:-18,right:-20,background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:12,padding:"8px 14px",boxShadow:"var(--sh2)",display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:600,color:"var(--txt)",whiteSpace:"nowrap"}}>
        <Package size={13} color="#D97706"/> Delivery at Gate 2
      </motion.div>
    </div>
  );
}

function SlideVisualSecurity() {
  const [activeRow, setActiveRow] = useState(0);
  const QUEUE = [
    {i:"RS",bg:"#EFF6FF",fg:"#2563EB",name:"Rahul Sharma",flat:"A-204",type:"Guest"},
    {i:"SW",bg:"#FFFBEB",fg:"#D97706",name:"Swiggy Delivery",flat:"B-101",type:"Food"},
    {i:"PM",bg:"#F5F3FF",fg:"#7C3AED",name:"Priya Mehta",flat:"C-302",type:"Guest"},
  ];
  useEffect(() => {
    const t = setInterval(() => setActiveRow(r => (r+1)%3), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{animation:"lp-f2 5s ease-in-out infinite",maxWidth:380,width:"100%",position:"relative"}}>
      <div className="lp-card" style={{borderRadius:20,overflow:"hidden",boxShadow:"var(--sh2)"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#16A34A",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={14} color="#fff"/>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:"var(--txt)"}}>Security Hub</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#16A34A",fontWeight:600}}>
            <span className="lp-live-dot"/> Live
          </div>
        </div>
        <div style={{display:"flex",gap:8,padding:"12px 14px",borderBottom:"1px solid var(--bdr)"}}>
          {[{l:"Today",v:"127",c:"#2563EB"},{l:"Pending",v:"4",c:"#D97706"},{l:"Online",v:"89",c:"#16A34A"}].map(s => (
            <div key={s.l} style={{flex:1,background:"var(--bg-s2)",borderRadius:10,padding:"10px",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:20,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--txt3)",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 14px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--txt)",textTransform:"uppercase",letterSpacing:".6px",marginBottom:10}}>Visitor Queue</div>
          {QUEUE.map((v,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,marginBottom:i<2?8:0,background:activeRow===i?"var(--blue-l)":"transparent",border:`1px solid ${activeRow===i?"rgba(37,99,235,.2)":"transparent"}`,transition:"all .35s"}}>
              <div className="lp-avatar" style={{background:v.bg,color:v.fg}}>{v.i}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.name}</div>
                <div style={{fontSize:10,color:"var(--txt2)"}}>Flat {v.flat} · {v.type}</div>
              </div>
              {activeRow===i && (
                <div style={{display:"flex",gap:4}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle size={11} color="#16A34A"/></div>
                  <div style={{width:22,height:22,borderRadius:6,background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={11} color="#DC2626"/></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideVisualCommittee() {
  return (
    <div style={{animation:"lp-f1 5.5s ease-in-out infinite",maxWidth:380,width:"100%"}}>
      <div className="lp-card" style={{borderRadius:20,overflow:"hidden",boxShadow:"var(--sh2)"}}>
        <div style={{background:"#7C3AED",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Users size={15} color="#fff"/>
            <span style={{color:"#fff",fontSize:14,fontWeight:700}}>Community Hub</span>
          </div>
          <span style={{color:"rgba(255,255,255,.7)",fontSize:11}}>3 updates</span>
        </div>
        <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Bell size={14} color="#DC2626"/>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"#DC2626",textTransform:"uppercase",letterSpacing:".4px",marginBottom:2}}>Urgent</div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>Water Supply Shutdown</div>
              <div style={{fontSize:11,color:"var(--txt2)"}}>Tomorrow 9am–1pm · Block A & B</div>
            </div>
          </div>
        </div>
        <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bdr)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",marginBottom:10}}>🗳️ Which amenity needs upgrade?</div>
          {[{label:"Swimming Pool",pct:68,color:"#7C3AED"},{label:"Gym",pct:52,color:"#2563EB"}].map((p,i) => (
            <div key={i} style={{marginBottom:i===0?8:0}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--txt2)",marginBottom:4}}>
                <span>{p.label}</span><span style={{fontWeight:700,color:p.color}}>{p.pct}%</span>
              </div>
              <div style={{height:6,background:"var(--bg-s2)",borderRadius:4,overflow:"hidden"}}>
                <motion.div initial={{width:0}} animate={{width:`${p.pct}%`}} transition={{duration:.9,delay:.3+i*.15,ease:[.22,.68,0,1.1]}}
                  style={{height:"100%",borderRadius:4,background:p.color}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#F5F3FF",borderRadius:10,padding:"10px 12px"}}>
            <div style={{width:36,height:36,borderRadius:9,background:"#7C3AED",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{color:"rgba(255,255,255,.75)",fontSize:8,fontWeight:700}}>APR</div>
              <div style={{color:"#fff",fontSize:14,fontWeight:800,lineHeight:1}}>20</div>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>Society Fest 2026</div>
              <div style={{fontSize:11,color:"var(--txt2)"}}>Clubhouse · 6:00 PM</div>
            </div>
            <div style={{marginLeft:"auto",background:"#7C3AED",color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700}}>RSVP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero Section (NEW - Community Focused) ────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }} className="lp-dot-grid">
      {/* Animated background orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)",
          top: -200,
          right: -100,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)",
          bottom: -150,
          left: -80,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div className="lp-section" style={{ position: "relative", zIndex: 1, paddingTop: 100 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}
        >
          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#EFF6FF",
              color: "#2563EB",
              padding: "8px 16px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid rgba(37, 99, 235, 0.2)",
              marginBottom: 28,
            }}
          >
            🏘️ The Future of Apartment Living
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              marginBottom: 24,
              color: "var(--txt)",
            }}
          >
            Your apartment community,
            <br />
            <span style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              finally connected
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "var(--txt2)",
              maxWidth: 600,
              margin: "0 auto 40px",
            }}
          >
            Stop juggling WhatsApp groups, paper registers, and disconnected systems. AptHive brings residents, security, and management together on one beautiful platform.
          </motion.p>

          {/* Call-to-Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}
          >
            <Link
              to="/register"
              className="lp-btn lp-btn-lg"
              style={{
                textDecoration: "none",
                background: "#2563EB",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.32)",
              }}
            >
              Start free trial <ArrowRight size={16} />
            </Link>
            <button
              className="lp-btn lp-btn-lg lp-btn-outline"
              style={{ textDecoration: "none" }}
            >
              Watch 2-min demo
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              padding: "24px",
              borderTop: "1px solid var(--bdr)",
            }}
          >
            {/* Stats */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", lineHeight: 1 }}>
                500+
              </div>
              <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 4 }}>
                Active Societies
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: "var(--bdr)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", lineHeight: 1 }}>
                50K+
              </div>
              <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 4 }}>
                Happy Residents
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: "var(--bdr)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16A34A", lineHeight: 1 }}>
                99%
              </div>
              <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 4 }}>
                Uptime (SLA)
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Animated Community Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {[
            {
              icon: "🏠",
              title: "For Residents",
              desc: "Know who's at your door, book amenities, stay informed",
              color: "#2563EB",
            },
            {
              icon: "🛡️",
              title: "For Security",
              desc: "Live visitor queue, instant alerts, real-time control",
              color: "#16A34A",
            },
            {
              icon: "👥",
              title: "For Committee",
              desc: "Announcements, polling, events, analytics—all unified",
              color: "#7C3AED",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.1 }}
              onHover={{ y: -4 }}
              style={{
                background: "var(--bg-c)",
                border: "1px solid var(--bdr)",
                borderRadius: 16,
                padding: 28,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--txt)", marginBottom: 8 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Feature animated panels ─────────────────────────────── */
function FeatVisitorAnim() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [];
    const run = () => {
      setPhase(0);
      ts.push(setTimeout(() => setPhase(1), 1000));
      ts.push(setTimeout(() => setPhase(2), 2400));
      ts.push(setTimeout(() => run(), 5500));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  /* 2-column layout: left = active visitor, right = stats + log */
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>

      {/* LEFT — active visitor card */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <motion.div initial={{x:-24,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:.45}}
          style={{background:"var(--bg-s2)",border:"1.5px solid rgba(37,99,235,.22)",borderRadius:14,padding:"12px 13px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#2563EB,#7C3AED)"}}/>
          {/* Avatar + info + QR */}
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
            <div style={{width:38,height:38,borderRadius:10,background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,border:"2px solid rgba(37,99,235,.15)"}}>RS</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>Rahul Sharma</div>
              <div style={{fontSize:10,color:"var(--txt2)"}}>Flat A-204 · Gate 1</div>
            </div>
            <div style={{width:30,height:30,background:"var(--bg-c)",borderRadius:6,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,padding:3,position:"relative",overflow:"hidden",flexShrink:0}}>
              {[1,0,1,0,0,1,0,1,1,1,0,0,0,0,1,1].map((on,i)=>(
                <div key={i} style={{background:on?"var(--txt)":"transparent",borderRadius:1}}/>
              ))}
              {phase===1 && (
                <motion.div initial={{y:0}} animate={{y:30}} transition={{duration:.48,ease:"linear",repeat:Infinity}}
                  style={{position:"absolute",left:0,right:0,height:1.5,background:"rgba(37,99,235,.9)",boxShadow:"0 0 4px rgba(37,99,235,1)"}}/>
              )}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:9}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#22C55E",display:"inline-block",flexShrink:0}}/>
            <span style={{fontSize:10,color:"#16A34A",fontWeight:600}}>Arrived just now</span>
          </div>
          <AnimatePresence mode="wait">
            {phase < 2 ? (
              <motion.div key="btns" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:"flex",gap:6}}>
                <button style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",background:"#DCFCE7",color:"#16A34A",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <CheckCircle size={11}/> Approve
                </button>
                <button style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",background:"#FEE2E2",color:"#DC2626",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <X size={11}/> Deny
                </button>
              </motion.div>
            ) : (
              <motion.div key="ok" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:400,damping:20}}
                style={{background:"#DCFCE7",borderRadius:8,padding:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:"#16A34A",fontWeight:700,fontSize:11}}>
                <CheckCircle size={12}/> Approved! Pass sent ✓
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Floating delivery badge */}
        <motion.div animate={{y:[0,-4,0]}} transition={{duration:2.8,repeat:Infinity,ease:"easeInOut"}}
          style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:10,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,boxShadow:"var(--sh)"}}>
          <div style={{width:26,height:26,borderRadius:7,background:"#FEF9C3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>📦</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--txt)"}}>Delivery at Gate 2</div>
            <div style={{fontSize:10,color:"var(--txt2)"}}>Amazon · Flat B-101</div>
          </div>
          <div style={{fontSize:9,fontWeight:700,color:"#D97706",background:"#FEF9C3",padding:"2px 6px",borderRadius:5,flexShrink:0}}>Pending</div>
        </motion.div>
      </div>

      {/* RIGHT — stats grid + recent log */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[{l:"Today",v:"127",c:"#2563EB"},{l:"Pending",v:"4",c:"#D97706"},{l:"Cleared",v:"123",c:"#16A34A"},{l:"Denied",v:"3",c:"#DC2626"}].map(s => (
            <div key={s.l} style={{background:"var(--bg-s2)",borderRadius:9,padding:"9px 8px",border:"1px solid var(--bdr)",textAlign:"center"}}>
              <div style={{fontSize:17,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9,color:"var(--txt3)",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,fontWeight:700,color:"var(--txt)",textTransform:"uppercase",letterSpacing:".6px"}}>Recent</div>
        {[
          {i:"AM",bg:"#F5F3FF",fg:"#7C3AED",name:"Anita Mehta",ago:"8m",ok:true},
          {i:"PD",bg:"#FEF9C3",fg:"#D97706",name:"Swiggy Delivery",ago:"15m",ok:true},
          {i:"UK",bg:"#FEE2E2",fg:"#DC2626",name:"Unknown Person",ago:"22m",ok:false},
        ].map((v,i)=>(
          <motion.div key={i} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{delay:.15+i*.1}}
            style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:8,background:"var(--bg-s2)",border:"1px solid var(--bdr)"}}>
            <div style={{width:24,height:24,borderRadius:6,background:v.bg,color:v.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0}}>{v.i}</div>
            <div style={{flex:1,minWidth:0,fontSize:11,fontWeight:600,color:"var(--txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
            <div style={{fontSize:9,fontWeight:700,color:v.ok?"#16A34A":"#DC2626",flexShrink:0}}>{v.ok?"✓":"✗"} {v.ago}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatAlertsAnim() {
  const TOASTS = [
    {id:1,icon:"🧑",label:"Rahul Sharma arrived",sub:"A-204 · Gate 1 · Now",dot:"#2563EB",bg:"#EFF6FF"},
    {id:2,icon:"📦",label:"Package at Gate 2",sub:"Amazon · B-101 · 2m",dot:"#7C3AED",bg:"#F5F3FF"},
    {id:3,icon:"✅",label:"Visitor pre-approved",sub:"Priya · Tower B · 4m",dot:"#16A34A",bg:"#DCFCE7"},
    {id:4,icon:"⚠️",label:"Suspicious activity",sub:"Parking C · 7m",dot:"#DC2626",bg:"#FEE2E2"},
  ];
  const [shake,setShake] = useState(false);
  const [visible,setVisible] = useState([]);
  const [activeTab,setActiveTab] = useState(0);

  useEffect(() => {
    const ts = [];
    const run = () => {
      setVisible([]); setShake(false);
      ts.push(setTimeout(() => setShake(true), 300));
      ts.push(setTimeout(() => setShake(false), 900));
      TOASTS.forEach((t,i) => ts.push(setTimeout(() => setVisible(p=>[...p,t]), 500+i*650)));
      ts.push(setTimeout(() => run(), 9000));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  /* 2-column: left = bell + vertical tabs, right = notification feed */
  return (
    <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:14,alignItems:"start"}}>

      {/* LEFT — bell + vertical category tabs */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <motion.div animate={shake?{rotate:[0,-16,16,-10,10,-5,0],scale:[1,1.12,1.12,1,1,1,1]}:{}} transition={{duration:.55}}
            style={{width:40,height:40,borderRadius:11,background:"#F5F3FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
            <Bell size={18} color="#7C3AED"/>
            <AnimatePresence>
              {shake && (
                <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0,opacity:0}}
                  style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#DC2626",border:"2px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,color:"#fff"}}>
                  {TOASTS.length}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--txt)"}}>Alerts</div>
            <AnimatePresence>
              {visible.length > 0 && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  style={{fontSize:10,color:"#2563EB",fontWeight:600}}>{visible.length} new</motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Vertical tabs */}
        {["All","Visitors","Delivery","Security"].map((tab,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)}
            style={{padding:"6px 10px",borderRadius:8,border:"1px solid",borderColor:activeTab===i?"rgba(37,99,235,.3)":"var(--bdr)",background:activeTab===i?"var(--blue-l)":"var(--bg-s2)",color:activeTab===i?"#2563EB":"var(--txt2)",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .2s",textAlign:"left",width:"100%"}}>
            {tab}
          </button>
        ))}
      </div>

      {/* RIGHT — notification feed */}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <AnimatePresence>
          {visible.map(n => (
            <motion.div key={n.id} initial={{x:40,opacity:0}} animate={{x:0,opacity:1}} exit={{x:40,opacity:0}} transition={{type:"spring",stiffness:260,damping:22}}
              style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:11,padding:"9px 11px",display:"flex",alignItems:"center",gap:9,boxShadow:"var(--sh)"}}>
              <div style={{width:32,height:32,borderRadius:9,background:n.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{n.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</div>
                <div style={{fontSize:10,color:"var(--txt2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.sub}</div>
              </div>
              <motion.div animate={{scale:[1,1.5,1],opacity:[1,.3,1]}} transition={{duration:1.4,repeat:Infinity}}
                style={{width:7,height:7,borderRadius:"50%",background:n.dot,flexShrink:0}}/>
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.length===0 && (
          <div style={{textAlign:"center",color:"var(--txt3)",fontSize:11,padding:"20px 0"}}>Waiting for activity…</div>
        )}
      </div>
    </div>
  );
}

function FeatPollsAnim() {
  const BARS = [
    {label:"Swimming Pool",pct:68,color:"#7C3AED",emoji:"🏊"},
    {label:"Gym Equipment",pct:52,color:"#2563EB",emoji:"🏋️"},
    {label:"Clubhouse",pct:34,color:"#16A34A",emoji:"🏛️"},
    {label:"Parking Area",pct:21,color:"#D97706",emoji:"🚗"},
  ];
  const [drawn,setDrawn] = useState(false);
  const [voted,setVoted] = useState(null);
  const [totalVotes,setTotalVotes] = useState(247);

  useEffect(() => {
    const ts = [];
    const run = () => {
      setDrawn(false); setVoted(null); setTotalVotes(247);
      ts.push(setTimeout(() => setDrawn(true), 300));
      ts.push(setTimeout(() => run(), 7500));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  /* 2-column: left = poll header + vote count, right = bars */
  return (
    <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:16,alignItems:"start"}}>

      {/* LEFT — poll info */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:"linear-gradient(135deg,#7C3AED,#2563EB)",borderRadius:13,padding:"12px 13px"}}>
          <div style={{fontSize:22,marginBottom:6}}>🗳️</div>
          <div style={{color:"#fff",fontSize:12,fontWeight:800,marginBottom:4,lineHeight:1.3}}>Which amenity needs an upgrade?</div>
          <div style={{color:"rgba(255,255,255,.75)",fontSize:10,fontWeight:500}}>Active Poll · 3 days left</div>
        </div>
        <div style={{background:"var(--bg-s2)",borderRadius:10,padding:"10px 12px",border:"1px solid var(--bdr)"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#7C3AED",lineHeight:1}}>{totalVotes}</div>
          <div style={{fontSize:10,color:"var(--txt3)",marginTop:2}}>residents voted</div>
        </div>
        <AnimatePresence>
          {voted !== null && (
            <motion.div initial={{opacity:0,scale:.85,y:6}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}} transition={{type:"spring",stiffness:400,damping:20}}
              style={{background:"#DCFCE7",borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",gap:6,color:"#16A34A",fontWeight:700,fontSize:11}}>
              <CheckCircle size={12}/> Vote counted!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT — animated bars (interactive) */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--txt2)",marginBottom:2}}>Tap to vote ↓</div>
        {BARS.map((b,i) => (
          <motion.div key={i}
            onClick={()=>{ if(voted===null){ setVoted(i); setTotalVotes(t=>t+1); } }}
            whileHover={voted===null?{x:3}:{}}
            style={{cursor:voted===null?"pointer":"default",padding:"7px 8px",borderRadius:10,border:"1.5px solid",borderColor:voted===i?"rgba(124,58,237,.4)":"transparent",background:voted===i?"#F5F3FF":"transparent",transition:"background .25s,border-color .25s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13}}>{b.emoji}</span>
                <span style={{fontSize:12,fontWeight:voted===i?700:500,color:"var(--txt)"}}>{b.label}</span>
                {i===0 && <span style={{fontSize:8,fontWeight:700,color:"#D97706",background:"#FEF9C3",padding:"1px 5px",borderRadius:100}}>🏆</span>}
              </div>
              <span style={{fontWeight:800,color:b.color,fontSize:12}}>{voted!==null&&i===voted?b.pct+1:b.pct}%</span>
            </div>
            <div style={{height:8,background:"var(--bg-s2)",borderRadius:5,overflow:"hidden"}}>
              <motion.div
                initial={{width:0}}
                animate={{width:drawn?(voted!==null&&i===voted?`${b.pct+1}%`:`${b.pct}%`):0}}
                transition={{duration:.8,delay:drawn?i*.1:0,ease:[.22,.68,0,1.1]}}
                style={{height:"100%",borderRadius:5,background:i===0?`linear-gradient(90deg,${b.color},#2563EB)`:b.color}}/>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatEventsAnim() {
  const SLOTS = ["6am","8am","10am","12pm","2pm","4pm","6pm"];
  const BOOKED = [1,4];
  const AVAILABLE = SLOTS.map((_,i)=>i).filter(i=>!BOOKED.includes(i));
  const [activeSlot,setActiveSlot] = useState(AVAILABLE[0]);
  const [confirmed,setConfirmed] = useState(false);
  const [activeAmenity,setActiveAmenity] = useState(0);
  const AMENITIES = [
    {icon:"🏊",label:"Pool",color:"#2563EB"},
    {icon:"🏋️",label:"Gym",color:"#7C3AED"},
    {icon:"🎾",label:"Tennis",color:"#16A34A"},
    {icon:"🧘",label:"Yoga",color:"#D97706"},
  ];

  useEffect(() => {
    let ai = 0;
    const t1 = setInterval(() => { ai=(ai+1)%AVAILABLE.length; setActiveSlot(AVAILABLE[ai]); }, 1500);
    const ts = [];
    const run = () => {
      setConfirmed(false);
      ts.push(setTimeout(() => setConfirmed(true), 3500));
      ts.push(setTimeout(() => { setConfirmed(false); run(); }, 6500));
    };
    run();
    return () => { clearInterval(t1); ts.forEach(clearTimeout); };
  }, []);

  /* 2-column: left = dates + amenity picker, right = time slots + confirm */
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"start"}}>

      {/* LEFT — date strip + amenity grid */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--txt2)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>April 2026</div>
          <div style={{display:"flex",gap:4}}>
            {[["M","14"],["T","15"],["W","16"],["T","17"],["F","18"]].map(([day,num],i)=>(
              <div key={i} style={{flex:1,padding:"6px 2px",borderRadius:8,border:"1px solid",borderColor:i===2?"rgba(37,99,235,.3)":"var(--bdr)",background:i===2?"var(--blue-l)":"var(--bg-s2)",textAlign:"center"}}>
                <div style={{fontSize:8,color:i===2?"#2563EB":"var(--txt3)",fontWeight:600}}>{day}</div>
                <div style={{fontSize:13,fontWeight:800,color:i===2?"#2563EB":"var(--txt)",lineHeight:1.2}}>{num}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--txt2)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>Amenity</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {AMENITIES.map((a,i)=>(
              <div key={i} onClick={()=>setActiveAmenity(i)}
                style={{background:activeAmenity===i?`${a.color}15`:"var(--bg-s2)",border:`1.5px solid ${activeAmenity===i?a.color+"40":"var(--bdr)"}`,borderRadius:10,padding:"8px 6px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:18,marginBottom:3}}>{a.icon}</div>
                <div style={{fontSize:10,fontWeight:600,color:activeAmenity===i?a.color:"var(--txt2)"}}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — time slots + summary + confirm */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--txt2)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>
            {AMENITIES[activeAmenity].icon} Pick a slot
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {SLOTS.map((s,i)=>(
              <div key={i} onClick={()=>!BOOKED.includes(i)&&setActiveSlot(i)}
                style={{padding:"5px 8px",borderRadius:7,fontSize:11,fontWeight:600,cursor:BOOKED.includes(i)?"not-allowed":"pointer",
                  background:BOOKED.includes(i)?"var(--bg-s2)":activeSlot===i?AMENITIES[activeAmenity].color:"var(--bg-c)",
                  color:BOOKED.includes(i)?"var(--txt3)":activeSlot===i?"#fff":"var(--txt)",
                  border:`1px solid ${BOOKED.includes(i)?"var(--bdr)":activeSlot===i?AMENITIES[activeAmenity].color:"var(--bdr)"}`,
                  opacity:BOOKED.includes(i)?.4:1,transition:"all .25s",
                }}>{s}</div>
            ))}
          </div>
        </div>
        <div style={{background:"var(--bg-s2)",borderRadius:10,padding:"9px 11px",border:"1px solid var(--bdr)"}}>
          <div style={{fontSize:10,color:"var(--txt3)",marginBottom:3}}>Booking summary</div>
          <div style={{fontSize:12,fontWeight:700,color:"var(--txt)"}}>{AMENITIES[activeAmenity].icon} {AMENITIES[activeAmenity].label}</div>
          <div style={{fontSize:11,color:"var(--txt2)"}}>Wed, Apr 16 · {SLOTS[activeSlot]}</div>
        </div>
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.button key="btn" whileTap={{scale:.97}} onClick={()=>setConfirmed(true)}
              style={{width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",background:AMENITIES[activeAmenity].color,color:"#fff",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              <Calendar size={13}/> Confirm Booking
            </motion.button>
          ) : (
            <motion.div key="conf" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:400,damping:20}}
              style={{background:"#DCFCE7",borderRadius:10,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,color:"#16A34A",fontWeight:700,fontSize:12}}>
              <CheckCircle size={13}/> Booked! ✓
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeatAnnouncementsAnim() {
  const ALL = [
    {title:"Water Supply Shutdown",desc:"18th Apr, 9am–1pm · Block A & B",time:"2h ago",border:"#DC2626",bg:"#FEE2E2",dot:"#DC2626",tag:"URGENT",emoji:"⚠️"},
    {title:"Society Fest 2026",desc:"April 20th at 6pm, Clubhouse",time:"5h ago",border:"#2563EB",bg:"#EFF6FF",dot:"#2563EB",tag:"EVENT",emoji:"🎉"},
    {title:"Parking Rules Updated",desc:"Visitor parking to Lot C after 8pm",time:"1d ago",border:"#D97706",bg:"#FEF9C3",dot:"#D97706",tag:"NOTICE",emoji:"🚗"},
    {title:"New Security Guard",desc:"Ramesh Kumar joins Apr 20, Gate 2",time:"2d ago",border:"#16A34A",bg:"#DCFCE7",dot:"#16A34A",tag:"INFO",emoji:"🛡️"},
    {title:"Lift Maintenance",desc:"Tower B lift down Apr 19, 10am–2pm",time:"3d ago",border:"#7C3AED",bg:"#F5F3FF",dot:"#7C3AED",tag:"MAINT.",emoji:"🔧"},
    {title:"AGM Next Weekend",desc:"Annual General Meeting, Apr 26, 11am",time:"4d ago",border:"#2563EB",bg:"#EFF6FF",dot:"#2563EB",tag:"MEETING",emoji:"📋"},
  ];
  const [top,setTop] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTop(t=>(t+1)%ALL.length), 2200);
    return () => clearInterval(t);
  }, []);

  /* 2×2 grid of announcement cards, cycling through 6 items */
  const visible = [ALL[top%ALL.length], ALL[(top+1)%ALL.length], ALL[(top+2)%ALL.length], ALL[(top+3)%ALL.length]];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>Community Board</div>
        <div style={{display:"flex",gap:6}}>
          <div style={{background:"#FEE2E2",borderRadius:100,padding:"3px 9px",fontSize:10,fontWeight:700,color:"#DC2626"}}>2 unread</div>
          <div style={{background:"var(--bg-s2)",borderRadius:100,padding:"3px 9px",fontSize:10,fontWeight:600,color:"var(--txt2)"}}>{ALL.length} total</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <AnimatePresence mode="popLayout">
          {visible.map((a) => (
            <motion.div key={a.title} layout
              initial={{opacity:0,scale:.93,y:-10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.93,y:10}}
              transition={{duration:.32,ease:[.2,.8,.2,1]}}
              style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:12,padding:"10px 11px",boxShadow:"var(--sh)",borderLeft:`3px solid ${a.border}`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,background:a.bg,padding:"2px 7px",borderBottomLeftRadius:7,fontSize:8,fontWeight:800,color:a.dot,letterSpacing:".4px"}}>{a.tag}</div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <div style={{width:26,height:26,borderRadius:7,background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{a.emoji}</div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--txt)",lineHeight:1.25,flex:1,minWidth:0,paddingRight:18,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{a.title}</div>
              </div>
              <div style={{fontSize:10,color:"var(--txt2)",lineHeight:1.4,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{a.desc}</div>
              <div style={{fontSize:9,color:"var(--txt3)"}}>{a.time}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Features Showcase (Carousel) ───────────────────────── */
const CAROUSEL_FEATURES = [
  { id:"visitor",  label:"Visitor Management", Icon:Shield,    image:"https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200", desc:"Approve guests with one tap. QR passes, photo capture, and pre-registration built in." },
  { id:"alerts",   label:"Real-Time Alerts",   Icon:Bell,      image:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=1200", desc:"Instant push notifications for arrivals, deliveries, and security events." },
  { id:"polls",    label:"Community Polls",    Icon:BarChart3, image:"https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200", desc:"Run transparent votes for society decisions. Results update live as residents vote." },
  { id:"events",   label:"Events & Amenities", Icon:Calendar,  image:"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1200", desc:"Book the gym, pool, or clubhouse. RSVP to events. All from one place." },
  { id:"announce", label:"Announcements",      Icon:Zap,       image:"https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=1200", desc:"Post urgent notices and community updates. Residents see them instantly." },
];

const FEAT_ITEM_H = 68;

const featWrap = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

function FeaturesShowcase() {
  const [step, setStep]       = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const len = CAROUSEL_FEATURES.length;
  const currentIndex = ((step % len) + len) % len;

  const nextStep = useCallback(() => setStep(p => p + 1), []);

  const handleChipClick = (index) => {
    const diff = (index - currentIndex + len) % len;
    if (diff > 0) setStep(s => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(nextStep, 3200);
    return () => clearInterval(t);
  }, [nextStep, isPaused]);

  const getCardStatus = (index) => {
    const diff = index - currentIndex;
    let d = diff;
    if (d > len / 2) d -= len;
    if (d < -len / 2) d += len;
    if (d === 0)  return "active";
    if (d === -1) return "prev";
    if (d === 1)  return "next";
    return "hidden";
  };

  return (
    <section style={{padding:"100px 0",background:"var(--bg-s)"}}>
      <div className="lp-section">

        {/* ── Heading ── */}
        <div style={{textAlign:"center",marginBottom:56}}>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:800,letterSpacing:"-1px",marginBottom:14,lineHeight:1.1,color:"var(--txt)"}}>
            Built for the way<br/>societies actually work
          </h2>
          <p style={{fontSize:17,color:"var(--txt2)",maxWidth:460,margin:"0 auto",lineHeight:1.6}}>
            Every feature designed with residents, security guards, and committee members in mind.
          </p>
        </div>

        {/* ── Carousel shell ── */}
        <div style={{position:"relative",overflow:"hidden",borderRadius:36,display:"flex",flexDirection:"row",minHeight:520,border:"1px solid var(--bdr)",boxShadow:"0 8px 48px rgba(15,23,42,.09)"}}>

          {/* ──── LEFT: vertical pill selector ──── */}
          <div style={{width:"38%",flexShrink:0,position:"relative",zIndex:30,display:"flex",alignItems:"center",justifyContent:"flex-start",overflow:"hidden",padding:"0 44px",background:"#2563EB"}}>
            {/* top/bottom fade */}
            <div style={{position:"absolute",left:0,right:0,top:0,height:88,background:"linear-gradient(to bottom,#2563EB 0%,rgba(37,99,235,.88) 55%,transparent 100%)",zIndex:40,pointerEvents:"none"}}/>
            <div style={{position:"absolute",left:0,right:0,bottom:0,height:88,background:"linear-gradient(to top,#2563EB 0%,rgba(37,99,235,.88) 55%,transparent 100%)",zIndex:40,pointerEvents:"none"}}/>

            {/* Decorative radial shine */}
            <div style={{position:"absolute",top:"-20%",right:"-10%",width:320,height:320,background:"radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>

            {/* Pills */}
            <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"flex-start",zIndex:20}}>
              {CAROUSEL_FEATURES.map((feat, index) => {
                const isActive = index === currentIndex;
                const distance = index - currentIndex;
                const wrapped  = featWrap(-(len / 2), len / 2, distance);
                return (
                  <motion.div
                    key={feat.id}
                    style={{height:FEAT_ITEM_H,position:"absolute",display:"flex",alignItems:"center"}}
                    animate={{y:wrapped * FEAT_ITEM_H, opacity: Math.max(0, 1 - Math.abs(wrapped) * 0.28)}}
                    transition={{type:"spring",stiffness:88,damping:22,mass:1}}
                  >
                    <button
                      onClick={() => handleChipClick(index)}
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                      style={{
                        display:"flex",alignItems:"center",gap:10,
                        padding:"12px 26px",borderRadius:9999,
                        border:"1.5px solid",cursor:"pointer",
                        fontFamily:"inherit",transition:"all .5s",whiteSpace:"nowrap",
                        ...(isActive
                          ? {background:"#fff",color:"#2563EB",borderColor:"#fff",boxShadow:"0 4px 20px rgba(0,0,0,.15)"}
                          : {background:"transparent",color:"rgba(255,255,255,.5)",borderColor:"rgba(255,255,255,.18)"}
                        ),
                      }}
                    >
                      <feat.Icon size={15} strokeWidth={2}/>
                      <span style={{fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em"}}>
                        {feat.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ──── RIGHT: image card stack ──── */}
          <div style={{flex:1,position:"relative",background:"var(--bg-s2)",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 40px",overflow:"hidden",borderLeft:"1px solid var(--bdr)"}}>
            {/* Dot-grid texture */}
            <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,var(--bdr2) 1px,transparent 1px)",backgroundSize:"24px 24px",opacity:.45,pointerEvents:"none"}}/>

            {/* Stacked cards */}
            <div style={{position:"relative",width:290,height:360,flexShrink:0}}>
              {CAROUSEL_FEATURES.map((feat, index) => {
                const status   = getCardStatus(index);
                const isActive = status === "active";
                const isPrev   = status === "prev";
                const isNext   = status === "next";

                return (
                  <motion.div
                    key={feat.id}
                    initial={false}
                    animate={{
                      x:       isActive ? 0 : isPrev ? -68 : isNext ? 68 : 0,
                      scale:   isActive ? 1 : (isPrev || isNext) ? 0.87 : 0.72,
                      opacity: isActive ? 1 : (isPrev || isNext) ? 0.32 : 0,
                      rotate:  isPrev ? -5 : isNext ? 5 : 0,
                      zIndex:  isActive ? 20 : (isPrev || isNext) ? 10 : 0,
                    }}
                    style={{
                      position:"absolute",inset:0,
                      borderRadius:24,overflow:"hidden",
                      border:"6px solid var(--bg-c)",
                      background:"var(--bg-c)",
                      transformOrigin:"center",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                    transition={{type:"spring",stiffness:260,damping:26,mass:.8}}
                  >
                    <img
                      src={feat.image}
                      alt={feat.label}
                      style={{
                        width:"100%",height:"100%",objectFit:"cover",
                        transition:"filter .7s",
                        filter: isActive ? "none" : "grayscale(1) blur(2px) brightness(.68)",
                      }}
                    />

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                          style={{position:"absolute",inset:0,padding:24,paddingTop:96,background:"linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.48) 52%,transparent 100%)",display:"flex",flexDirection:"column",justifyContent:"flex-end",pointerEvents:"none"}}
                        >
                          <div style={{background:"var(--bg-c)",color:"var(--txt)",padding:"5px 13px",borderRadius:9999,fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".18em",width:"fit-content",marginBottom:10,border:"1px solid var(--bdr)"}}>
                            {index + 1} · {feat.label}
                          </div>
                          <p style={{color:"#fff",fontSize:16,fontWeight:400,lineHeight:1.45,letterSpacing:"-.02em",margin:0}}>
                            {feat.desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isActive && (
                      <div style={{position:"absolute",top:18,left:18,display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:"#fff",boxShadow:"0 0 9px rgba(255,255,255,.95)"}}/>
                        <span style={{color:"rgba(255,255,255,.75)",fontSize:9,textTransform:"uppercase",letterSpacing:".3em",fontFamily:"monospace"}}>Live</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Dot indicators + counter */}
            <div style={{position:"absolute",bottom:28,left:40,right:40,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {CAROUSEL_FEATURES.map((_,i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(i)}
                    style={{
                      width: i===currentIndex ? 22 : 7,
                      height:7,borderRadius:100,border:"none",cursor:"pointer",padding:0,
                      background: i===currentIndex ? "#2563EB" : "var(--bdr2)",
                      transition:"all .35s ease",
                    }}
                  />
                ))}
              </div>
              <span style={{fontSize:12,color:"var(--txt3)",fontWeight:500,fontVariantNumeric:"tabular-nums"}}>
                {currentIndex + 1} / {len}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [...ROW1_TESTIMONIALS, ...ROW2_TESTIMONIALS];
  const total = testimonials.length;
  const [activeIndex, setActiveIndex] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 4200);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  const active = testimonials[activeIndex];
  const getDistance = (index) => {
    let d = index - activeIndex;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  const waveform = [16, 26, 18, 34, 22, 14, 30, 38, 24, 16, 32, 20, 14, 28, 18, 24];

  return (
    <section
      style={{
        padding: "95px 0",
        background: "radial-gradient(1200px 520px at 0% 0%, rgba(251,113,133,.22) 0%, transparent 45%), radial-gradient(1100px 540px at 100% 100%, rgba(99,102,241,.22) 0%, transparent 50%), #F5F7FC",
      }}
    >
      <div className="lp-section" style={{ maxWidth: 1220 }}>
        <div
          style={{
            borderRadius: 28,
            border: "1px solid #E5E7EB",
            background: "rgba(255,255,255,.82)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 14px 48px rgba(15,23,42,.08)",
            padding: "44px 32px 40px",
            overflow: "hidden",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 940, margin: "0 auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E5E7EB",
                borderRadius: 999,
                background: "#F3F4F6",
                color: "#334155",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".01em",
                padding: "8px 16px",
                marginBottom: 28,
              }}
            >
              Testimonials
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={active.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                style={{
                  fontSize: "clamp(28px,4vw,56px)",
                  lineHeight: 1.32,
                  letterSpacing: "-.035em",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 28,
                }}
              >
                Wow! what an amazing journey, <span style={{ color: "#A78BFA" }}>AptHive</span> made daily life a breeze. <span style={{ color: "#64748B", fontWeight: 600 }}>{active.q}</span>
              </motion.p>
            </AnimatePresence>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 30 }}>
              {waveform.map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: h,
                    borderRadius: 6,
                    background: i % 2 ? "#64748B" : "#94A3B8",
                    opacity: i % 3 === 0 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 18 }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, rgba(255,255,255,.92), transparent)" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to left, rgba(255,255,255,.92), transparent)" }} />

            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, overflow: "hidden", padding: "0 20px" }}>
              {testimonials.map((t, index) => {
                const d = getDistance(index);
                if (Math.abs(d) > 4) return null;

                const isActive = index === activeIndex;
                return (
                  <motion.button
                    key={t.name}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : Math.max(0.35, 1 - Math.abs(d) * 0.19),
                      scale: isActive ? 1 : 0.87,
                      y: isActive ? 0 : 8,
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    style={{
                      width: isActive ? 198 : 154,
                      height: isActive ? 208 : 154,
                      borderRadius: 20,
                      border: isActive ? "3px solid #D8B4FE" : "1px solid #E5E7EB",
                      padding: 0,
                      cursor: "pointer",
                      background: "#fff",
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: isActive ? "0 14px 36px rgba(124,58,237,.18)" : "0 6px 18px rgba(15,23,42,.08)",
                    }}
                  >
                    <img
                      src={t.img.replace("64", "400")}
                      alt={t.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: isActive ? "none" : "grayscale(.18) saturate(.85)" }}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${active.name}-meta`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              style={{ textAlign: "center", marginBottom: 22 }}
            >
              <div style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-.03em", color: "#0F172A", marginBottom: 4 }}>{active.name}</div>
              <div style={{ fontSize: 14, color: "#64748B" }}>{active.role} · {active.soc}</div>
            </motion.div>
          </AnimatePresence>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={goPrev}
              style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid #D1D5DB", background: "#fff", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid #D1D5DB", background: "#fff", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label={isPaused ? "Play testimonial autoplay" : "Pause testimonial autoplay"}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              type="button"
              onClick={goNext}
              style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid #D1D5DB", background: "#fff", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main export ─────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob]           = useState(false);

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "lp-sty"; el.textContent = LP_CSS;
    document.head.appendChild(el);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    document.body.style.backgroundColor = "#F7F9FF";
    return () => {
      document.head.removeChild(el);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="lp">
      <Navbar scrolled={scrolled} mob={mob} setMob={setMob}/>
      <AnimatePresence>
        {mob && <MobileMenu key="mob" close={() => setMob(false)}/>}
      </AnimatePresence>
      <HeroShowcase/>
      <FeaturesSection/>
      <TestimonialsSection/>
    </div>
  );
}

export { 
  LandingPage,
  FeatVisitorAnim,
  FeatAlertsAnim,
  FeatPollsAnim,
  FeatEventsAnim,
  FeatAnnouncementsAnim,
};
