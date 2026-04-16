import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Bell, Users, BarChart3, ArrowRight, Sun, Moon,
  Menu, X, Star, CheckCircle, Package, Calendar, LayoutGrid,
  MapPin, Zap,
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

/* ─── Hero Carousel ───────────────────────────────────────── */
const SLIDES = [
  {
    accent:"#2563EB", accentL:"#EFF6FF",
    tag:"🏠 For Residents",
    headline:["Know who's at your door", "before they ring"],
    sub:"Get a photo notification the moment your guest arrives. Approve or deny with one tap — from anywhere in the world.",
    Visual: SlideVisualResident,
  },
  {
    accent:"#16A34A", accentL:"#DCFCE7",
    tag:"🛡️ For Security Teams",
    headline:["Give your gate", "the tools it deserves"],
    sub:"A live visitor queue, one-tap approvals, and instant alerts — your security team finally has a system that actually works.",
    Visual: SlideVisualSecurity,
  },
  {
    accent:"#7C3AED", accentL:"#F5F3FF",
    tag:"👥 For Committee Members",
    headline:["Run your society", "like a pro"],
    sub:"Post announcements, manage events, run polls, and track everything — all from one beautifully unified platform.",
    Visual: SlideVisualCommittee,
  },
];

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % SLIDES.length), 4800);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[idx];

  return (
    <section style={{position:"relative",overflow:"hidden",minHeight:"100vh"}} className="lp-dot-grid">
      {/* Ambient gradient orb — colour shifts per slide */}
      <motion.div animate={{background:`radial-gradient(circle, ${s.accentL} 0%, transparent 65%)`}}
        transition={{duration:.8}}
        style={{position:"absolute",width:700,height:700,top:-200,right:-100,borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:400,height:400,background:"radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 68%)",bottom:-80,left:-80,borderRadius:"50%",pointerEvents:"none"}}/>

      <div className="lp-section" style={{position:"relative",zIndex:1}}>
        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{opacity:0,y:22}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-22}}
            transition={{duration:.55,ease:[.2,.8,.2,1]}}
            className="lp-car-grid"
            style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center",minHeight:"100vh",padding:"100px 0 80px"}}
          >
            {/* ── Left ── */}
            <div>
              {/* Persona tag */}
              <motion.div
                initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:.1,duration:.4}}
                style={{display:"inline-flex",alignItems:"center",gap:8,background:s.accentL,color:s.accent,padding:"6px 16px",borderRadius:100,fontSize:13,fontWeight:700,border:`1px solid ${s.accent}30`,marginBottom:28}}
              >
                {s.tag}
              </motion.div>

              <h1 style={{fontSize:"clamp(40px,5vw,64px)",fontWeight:800,lineHeight:1.06,letterSpacing:"-2px",marginBottom:22,color:"var(--txt)"}}>
                {s.headline[0]}<br/>
                <span style={{color:s.accent}}>{s.headline[1]}</span>
              </h1>

              <p style={{fontSize:18,lineHeight:1.65,color:"var(--txt2)",maxWidth:460,marginBottom:36}}>
                {s.sub}
              </p>

              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:48}}>
                <Link to="/register" className="lp-btn lp-btn-lg" style={{
                  textDecoration:"none",background:s.accent,color:"#fff",
                  boxShadow:`0 4px 16px ${s.accent}44`,
                }}>
                  Get started free <ArrowRight size={16}/>
                </Link>
                <button className="lp-btn lp-btn-lg lp-btn-outline">See how it works</button>
              </div>

              {/* Social proof */}
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{display:"flex"}}>
                  {["#2563EB","#7C3AED","#16A34A","#D97706","#DC2626"].map((c,i) => (
                    <div key={i} style={{width:32,height:32,borderRadius:"50%",background:c,border:"2.5px solid var(--bg)",marginLeft:i?-10:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",zIndex:5-i,position:"relative"}}>
                      {["AR","VP","RS","KP","SM"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{display:"flex",gap:2,marginBottom:3}}>
                    {[1,2,3,4,5].map(n=><Star key={n} size={12} fill="#F59E0B" color="#F59E0B"/>)}
                  </div>
                  <span style={{fontSize:13,color:"var(--txt2)",fontWeight:500}}>
                    Trusted by <strong style={{color:"var(--txt)"}}>50,000+</strong> residents
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right visual ── */}
            <div className="lp-car-r" style={{display:"flex",alignItems:"center",justifyContent:"center",position:"relative",height:480}}>
              <AnimatePresence mode="wait">
                <motion.div key={idx}
                  initial={{opacity:0,scale:.93,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.93,y:-16}}
                  transition={{duration:.55,ease:[.2,.8,.2,1]}}
                  style={{width:"100%",maxWidth:400}}>
                  <s.Visual/>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide dots */}
        <div style={{display:"flex",justifyContent:"center",gap:8,paddingBottom:36,position:"relative",zIndex:2}}>
          {SLIDES.map((sl,i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              height:8,borderRadius:100,border:"none",cursor:"pointer",padding:0,
              transition:"all .35s ease",
              width: idx===i ? 28 : 8,
              background: idx===i ? s.accent : "var(--bdr)",
            }}/>
          ))}
        </div>
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
      ts.push(setTimeout(() => setPhase(1), 900));
      ts.push(setTimeout(() => setPhase(2), 2100));
      ts.push(setTimeout(() => run(), 4000));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,padding:"8px 4px"}}>
      <motion.div initial={{x:-60,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:.55,ease:"easeOut"}}
        style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"var(--sh)",position:"relative"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>RS</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>Rahul Sharma</div>
          <div style={{fontSize:11,color:"var(--txt2)"}}>Apt A-204 · Guest</div>
        </div>
        {/* QR */}
        <div style={{marginLeft:"auto",width:36,height:36,background:"var(--bg-s2)",borderRadius:6,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,padding:4,position:"relative",overflow:"hidden",flexShrink:0}}>
          {[1,0,1,0,0,1,0,1,1,1,0,0,0,0,1,1].map((on,i) => (
            <div key={i} style={{background:on?"var(--txt)":"transparent",borderRadius:1}}/>
          ))}
          {phase===1 && (
            <motion.div initial={{y:0}} animate={{y:36}} transition={{duration:.5,ease:"linear",repeat:2}}
              style={{position:"absolute",left:0,right:0,height:2,background:"rgba(37,99,235,.8)",boxShadow:"0 0 5px rgba(37,99,235,.9)"}}/>
          )}
        </div>
        <AnimatePresence>
          {phase===2 && (
            <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0}} transition={{type:"spring",stiffness:420,damping:18}}
              style={{position:"absolute",top:-10,right:10,background:"#DCFCE7",border:"1.5px solid #16A34A",borderRadius:100,padding:"4px 10px",display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"#16A34A"}}>
              <CheckCircle size={10}/> Approved
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div style={{display:"flex",gap:8}}>
        {[{l:"Today",v:"127",c:"#2563EB"},{l:"Pending",v:"4",c:"#D97706"},{l:"Cleared",v:"123",c:"#16A34A"}].map(s => (
          <div key={s.l} style={{flex:1,background:"var(--bg-s2)",borderRadius:10,padding:"10px",border:"1px solid var(--bdr)",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:9,color:"var(--txt3)",marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatAlertsAnim() {
  const TOASTS = [
    {id:1,label:"Rahul Sharma arrived",sub:"A-204 · Just now",dot:"#2563EB"},
    {id:2,label:"Delivery at Gate 2",sub:"Amazon · 2 min ago",dot:"#7C3AED"},
    {id:3,label:"Visitor pre-approved",sub:"Tower B · 4 min ago",dot:"#16A34A"},
  ];
  const [shake,setShake] = useState(false);
  const [visible,setVisible] = useState([]);
  useEffect(() => {
    const ts = [];
    const run = () => {
      setVisible([]); setShake(false);
      ts.push(setTimeout(() => setShake(true), 300));
      ts.push(setTimeout(() => setShake(false), 900));
      TOASTS.forEach((t,i) => ts.push(setTimeout(() => setVisible(p=>[...p,t]), 700+i*650)));
      ts.push(setTimeout(() => run(), 5500));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"8px 4px"}}>
      <motion.div animate={shake?{rotate:[0,-14,14,-8,8,-4,0],scale:[1,1.1,1.1,1,1,1,1]}:{rotate:0}} transition={{duration:.5}}
        style={{width:46,height:46,borderRadius:12,background:"#F5F3FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",marginTop:4}}>
        <Bell size={20} color="#7C3AED"/>
        <AnimatePresence>
          {shake && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0,opacity:0}}
              style={{position:"absolute",top:-3,right:-3,width:11,height:11,borderRadius:"50%",background:"#DC2626",border:"2px solid white"}}/>
          )}
        </AnimatePresence>
      </motion.div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:7,overflow:"hidden",minWidth:0}}>
        <AnimatePresence>
          {visible.map(n => (
            <motion.div key={n.id} initial={{x:80,opacity:0}} animate={{x:0,opacity:1}} exit={{x:80,opacity:0}} transition={{type:"spring",stiffness:280,damping:22}}
              style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:10,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,boxShadow:"var(--sh)"}}>
              <motion.div animate={{scale:[1,1.6,1],opacity:[1,.3,1]}} transition={{duration:1.4,repeat:Infinity}}
                style={{width:7,height:7,borderRadius:"50%",background:n.dot,flexShrink:0}}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11.5,fontWeight:700,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</div>
                <div style={{fontSize:10,color:"var(--txt2)"}}>{n.sub}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeatPollsAnim() {
  const BARS = [
    {label:"Swimming Pool",pct:68,color:"#7C3AED"},
    {label:"Gym",pct:52,color:"#2563EB"},
    {label:"Clubhouse",pct:34,color:"#16A34A"},
    {label:"Parking",pct:21,color:"#D97706"},
  ];
  const [drawn,setDrawn] = useState(false);
  useEffect(() => {
    const ts = [];
    const run = () => {
      setDrawn(false);
      ts.push(setTimeout(() => setDrawn(true), 200));
      ts.push(setTimeout(() => run(), 4500));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{padding:"8px 4px"}}>
      <div style={{fontSize:13,fontWeight:700,color:"var(--txt)",marginBottom:14}}>Which amenity needs upgrade?</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {BARS.map((b,i) => (
          <div key={i}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
              <span style={{color:"var(--txt2)",fontWeight:500}}>{b.label}</span>
              <span style={{fontWeight:700,color:b.color}}>{b.pct}%</span>
            </div>
            <div style={{height:8,background:"var(--bg-s2)",borderRadius:6,overflow:"hidden",position:"relative"}}>
              <motion.div initial={{width:0}} animate={{width:drawn?`${b.pct}%`:0}} transition={{duration:.8,delay:drawn?i*.1:0,ease:[.22,.68,0,1.1]}}
                style={{height:"100%",borderRadius:6,background:b.color}}/>
            </div>
            {i===0 && <div style={{fontSize:10,color:"#D97706",fontWeight:700,marginTop:3}}>🏆 Leading</div>}
          </div>
        ))}
      </div>
      <div style={{marginTop:12,fontSize:11,color:"var(--txt3)",textAlign:"center"}}>247 residents voted</div>
    </div>
  );
}

function FeatEventsAnim() {
  const SLOTS = ["6am","8am","10am","12pm","2pm","4pm","6pm"];
  const BOOKED = [1,4];
  const AVAILABLE = SLOTS.map((_,i)=>i).filter(i=>!BOOKED.includes(i));
  const [activeSlot,setActiveSlot] = useState(AVAILABLE[0]);
  useEffect(() => {
    let ai = 0;
    const t = setInterval(() => { ai=(ai+1)%AVAILABLE.length; setActiveSlot(AVAILABLE[ai]); }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{padding:"8px 4px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[{icon:"🏊",label:"Pool"},{icon:"🏋️",label:"Gym"},{icon:"🎾",label:"Tennis"}].map((a,i) => (
          <div key={i} style={{background:i===0?"var(--blue-l)":"var(--bg-s2)",border:`1.5px solid ${i===0?"rgba(37,99,235,.3)":"var(--bdr)"}`,borderRadius:10,padding:"10px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
            <div style={{fontSize:20,marginBottom:4}}>{a.icon}</div>
            <div style={{fontSize:11,fontWeight:600,color:i===0?"var(--blue)":"var(--txt2)"}}>{a.label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",marginBottom:8}}>🏊 Pool — Pick a slot</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {SLOTS.map((s,i) => (
          <div key={i} style={{
            padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:BOOKED.includes(i)?"not-allowed":"pointer",
            background: BOOKED.includes(i)?"var(--bg-s2)": activeSlot===i?"var(--blue)":"var(--bg-c)",
            color: BOOKED.includes(i)?"var(--txt3)": activeSlot===i?"#fff":"var(--txt)",
            border:`1px solid ${BOOKED.includes(i)?"var(--bdr)": activeSlot===i?"var(--blue)":"var(--bdr)"}`,
            opacity: BOOKED.includes(i)?.5:1, transition:"all .3s",
          }}>{s}</div>
        ))}
      </div>
      <motion.button animate={{scale:[1,1.03,1]}} transition={{duration:1.8,repeat:Infinity}}
        style={{width:"100%",padding:"11px",borderRadius:11,border:"none",cursor:"pointer",background:"var(--blue)",color:"#fff",fontWeight:700,fontSize:13}}>
        Confirm Booking
      </motion.button>
    </div>
  );
}

function FeatAnnouncementsAnim() {
  const ALL = [
    {title:"Water Supply Shutdown",desc:"Maintenance on 18th Apr, 9am–1pm",time:"2h ago",border:"#DC2626",bg:"#FEE2E2",dot:"#DC2626"},
    {title:"Society Fest 2026",desc:"Cultural evening on April 20th at 6pm",time:"5h ago",border:"#2563EB",bg:"#EFF6FF",dot:"#2563EB"},
    {title:"Parking Reminder",desc:"Visitor parking rules have been updated",time:"1d ago",border:"#D97706",bg:"#FEF9C3",dot:"#D97706"},
    {title:"New Security Guard",desc:"Ramesh Kumar joining from April 20",time:"2d ago",border:"#16A34A",bg:"#DCFCE7",dot:"#16A34A"},
  ];
  const [top,setTop] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTop(t=>(t+1)%ALL.length), 3000);
    return () => clearInterval(t);
  }, []);

  const visible = [ALL[top%ALL.length], ALL[(top+1)%ALL.length], ALL[(top+2)%ALL.length]];

  return (
    <div style={{padding:"8px 4px",display:"flex",flexDirection:"column",gap:8}}>
      <AnimatePresence mode="popLayout">
        {visible.map((a,i) => (
          <motion.div key={a.title} layout initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
            transition={{duration:.35,ease:[.2,.8,.2,1]}}
            style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"flex-start",gap:10,boxShadow:"var(--sh)",borderLeft:`3px solid ${a.border}`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:a.dot,flexShrink:0,marginTop:4}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,color:"var(--txt)",marginBottom:2}}>{a.title}</div>
              <div style={{fontSize:11,color:"var(--txt2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.desc}</div>
            </div>
            <div style={{fontSize:10,color:"var(--txt3)",flexShrink:0}}>{a.time}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Features Showcase ───────────────────────────────────── */
const FEATURE_LIST = [
  { icon:"🔐", title:"Visitor Management",  desc:"Approve or deny guests with one tap. QR passes, photo capture, and pre-registration built in.",              color:"#2563EB", Panel: FeatVisitorAnim },
  { icon:"🔔", title:"Real-Time Alerts",    desc:"Instant push notifications for arrivals, deliveries, and security events. Never miss a moment.",              color:"#7C3AED", Panel: FeatAlertsAnim },
  { icon:"🗳️", title:"Community Polls",    desc:"Run transparent votes for society decisions. Results update live as residents vote.",                          color:"#16A34A", Panel: FeatPollsAnim },
  { icon:"📅", title:"Events & Amenities", desc:"Book the gym, pool, or clubhouse. RSVP to upcoming events. All from one place.",                              color:"#D97706", Panel: FeatEventsAnim },
  { icon:"📢", title:"Announcements",      desc:"Post urgent notices, maintenance alerts, or community updates. Residents see them instantly.",                 color:"#DC2626", Panel: FeatAnnouncementsAnim },
];

function FeaturesShowcase() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a+1) % FEATURE_LIST.length), 4200);
    return () => clearInterval(t);
  }, []);

  const feat = FEATURE_LIST[active];

  return (
    <section style={{padding:"100px 0",background:"var(--bg-s)"}}>
      <div className="lp-section">
        {/* Heading */}
        <div style={{textAlign:"center",marginBottom:64}}>
          
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:800,letterSpacing:"-1px",marginBottom:14,lineHeight:1.1}}>
            Built for the way<br/>societies actually work
          </h2>
          <p style={{fontSize:17,color:"var(--txt2)",maxWidth:460,margin:"0 auto"}}>
            Every feature designed with residents, security guards, and committee members in mind.
          </p>
        </div>

        <div className="lp-feat-grid" style={{display:"grid",gridTemplateColumns:"1fr 1.1fr",gap:48,alignItems:"start"}}>
          {/* Left — feature list */}
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {FEATURE_LIST.map((f,i) => (
              <motion.div key={i} onClick={() => setActive(i)} style={{cursor:"pointer",padding:"16px 18px",borderRadius:14,border:"1.5px solid",borderColor:active===i?`${f.color}30`:"transparent",background:active===i?"var(--bg-c)":"transparent",transition:"all .3s",boxShadow:active===i?"var(--sh)":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:active===i?10:0}}>
                  <div style={{width:40,height:40,borderRadius:11,background:active===i?`${f.color}15`:"var(--bg-s2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"background .3s",flexShrink:0}}>
                    {f.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:active===i?f.color:"var(--txt)",transition:"color .3s"}}>
                      {f.title}
                    </div>
                    {active===i && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} transition={{duration:.3}}>
                        <div style={{fontSize:13.5,lineHeight:1.6,color:"var(--txt2)",marginTop:4}}>{f.desc}</div>
                      </motion.div>
                    )}
                  </div>
                  {/* Active indicator bar */}
                  {active===i && (
                    <div style={{width:3,height:36,borderRadius:4,background:f.color,flexShrink:0,marginLeft:4}}/>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right — animated panel */}
          <div style={{position:"sticky",top:100}}>
            <motion.div
              key={active}
              initial={{opacity:0,scale:.97,y:12}} animate={{opacity:1,scale:1,y:0}}
              transition={{duration:.45,ease:[.2,.8,.2,1]}}
              style={{background:"var(--bg-c)",borderRadius:20,border:"1px solid var(--bdr)",boxShadow:"var(--sh2)",overflow:"hidden"}}>
              {/* Panel header */}
              <div style={{padding:"16px 20px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg-c)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:9,background:`${feat.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                    {feat.icon}
                  </div>
                  <span style={{fontWeight:700,fontSize:14,color:"var(--txt)"}}>{feat.title}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#16A34A",fontWeight:600}}>
                  <span className="lp-live-dot"/> Live
                </div>
              </div>
              {/* Animated content */}
              <div style={{padding:"16px 20px",minHeight:200}}>
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
                    <feat.Panel/>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Progress bar */}
              <div style={{height:3,background:"var(--bg-s2)"}}>
                <motion.div key={active} initial={{width:0}} animate={{width:"100%"}} transition={{duration:4.2,ease:"linear"}}
                  style={{height:"100%",background:feat.color,borderRadius:2}}/>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────── */
function TestimonialCard({ q, name, role, soc, img }) {
  return (
    <div style={{width:300,flexShrink:0,background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:16,padding:"20px 22px",boxShadow:"var(--sh)",display:"flex",flexDirection:"column",gap:0}}>
      <div style={{display:"flex",gap:2,marginBottom:11}}>
        {[1,2,3,4,5].map(s => <span key={s} style={{fontSize:13,color:"#F59E0B",lineHeight:1}}>★</span>)}
      </div>
      <p style={{fontSize:14,lineHeight:1.72,color:"var(--txt2)",fontStyle:"italic",marginBottom:18,flex:1}}>"{q}"</p>
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        <img src={img} alt={name} width={48} height={48} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--bdr)",flexShrink:0}}/>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--txt)",lineHeight:1.3}}>{name}</div>
          <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{role} · {soc}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const row1 = [...ROW1_TESTIMONIALS, ...ROW1_TESTIMONIALS];
  const row2 = [...ROW2_TESTIMONIALS, ...ROW2_TESTIMONIALS];
  return (
    <section style={{padding:"100px 0",overflow:"hidden",background:"var(--bg)"}}>
      <div style={{textAlign:"center",marginBottom:56}}>
        <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:800,letterSpacing:"-1px",marginBottom:14}}>
          Loved by societies<br/>across India
        </h2>
        <p style={{fontSize:16,color:"var(--txt2)"}}>Real stories from residents, guards, and committee members.</p>
      </div>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:180,zIndex:2,pointerEvents:"none",background:"linear-gradient(to right,var(--bg) 0%,transparent 100%)"}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:180,zIndex:2,pointerEvents:"none",background:"linear-gradient(to left,var(--bg) 0%,transparent 100%)"}}/>
        <div style={{overflow:"hidden",marginBottom:16}}>
          <div className="lp-marquee-track lp-marquee-track-l">
            {row1.map((t,i) => <TestimonialCard key={i} {...t}/>)}
          </div>
        </div>
        <div style={{overflow:"hidden"}}>
          <div className="lp-marquee-track lp-marquee-track-r">
            {row2.map((t,i) => <TestimonialCard key={i} {...t}/>)}
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
      <HeroCarousel/>
      <FeaturesShowcase/>
      <TestimonialsSection/>
    </div>
  );
}

export { LandingPage };
