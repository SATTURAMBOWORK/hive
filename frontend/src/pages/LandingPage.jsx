import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Bell, Users, BarChart3, ArrowRight, Sun, Moon,
  Menu, X, Star, CheckCircle, Package, Lock, ChevronRight,
  MapPin, Zap, Globe, Share2, Link as LinkIcon,
} from "lucide-react";

/* ─── Scoped CSS (only active while LandingPage is mounted) ─── */
const LP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.lp{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;overflow-x:hidden;transition:background .35s,color .35s;}
.lp *{box-sizing:border-box;margin:0;padding:0;}

/* ── Tokens ── */
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
  --nav-bg:rgba(247,249,255,.88);
  background:var(--bg);color:var(--txt);
}
.lp.dark{
  --bg:#070E1C;--bg-c:#0D1829;--bg-s:#101F35;--bg-s2:#0A1422;
  --txt:#F1F5F9;--txt2:#94A3B8;--txt3:#475569;
  --bdr:#1A2E4A;--bdr2:#243550;
  --blue:#3B82F6;--blue-h:#2563EB;--blue-l:#172540;--blue-m:#1E3A5F;
  --grn:#22C55E;--grn-l:#052E16;
  --ylw:#F59E0B;--ylw-l:#1C1200;
  --red:#EF4444;--red-l:#2D0A0A;
  --prp:#A78BFA;--prp-l:#1E1040;
  --sh:0 1px 2px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.25);
  --sh2:0 4px 20px rgba(0,0,0,.35),0 20px 48px rgba(0,0,0,.3);
  --sh3:0 8px 32px rgba(59,130,246,.2),0 24px 56px rgba(0,0,0,.35);
  --nav-bg:rgba(7,14,28,.9);
}

/* ── Keyframes ── */
@keyframes lp-f1{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-11px) rotate(1.2deg)}}
@keyframes lp-f2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(-1.8deg)}}
@keyframes lp-f3{0%,100%{transform:translateY(0)}40%{transform:translateY(-13px)}70%{transform:translateY(-5px)}}
@keyframes lp-pulse-blue{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.45)}70%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}
@keyframes lp-live{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
@keyframes lp-bar-grow{from{transform-origin:bottom;transform:scaleY(0)}to{transform-origin:bottom;transform:scaleY(1)}}
@keyframes lp-shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}
@keyframes lp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes lp-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes lp-notif-bounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}}

/* ── Navbar ── */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid var(--bdr);transition:all .3s;}
.lp-nav.scrolled{box-shadow:0 2px 20px rgba(15,23,42,.08);}
.lp-nav-inner{max-width:1180px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--txt);}
.lp-logo-mark{width:34px;height:34px;background:var(--blue);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,.35);}
.lp-logo-text{font-weight:800;font-size:16.5px;letter-spacing:-.3px;}
.lp-nav-links{display:flex;align-items:center;gap:2px;}
.lp-nl{padding:7px 13px;border-radius:8px;font-size:14px;font-weight:500;color:var(--txt2);text-decoration:none;transition:all .15s;}
.lp-nl:hover{color:var(--txt);background:var(--bg-s);}
.lp-nav-r{display:flex;align-items:center;gap:8px;}
.lp-toggle{width:38px;height:38px;border-radius:9px;background:var(--bg-s2);border:1px solid var(--bdr);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:var(--txt2);flex-shrink:0;}
.lp-toggle:hover{background:var(--blue-l);border-color:rgba(37,99,235,.3);color:var(--blue);}
.lp-ham{display:none;width:38px;height:38px;border-radius:9px;background:var(--bg-s2);border:1px solid var(--bdr);align-items:center;justify-content:center;cursor:pointer;color:var(--txt);flex-shrink:0;}

/* ── Buttons ── */
.lp-btn{padding:10px 20px;border-radius:12px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:7px;border:none;line-height:1;text-decoration:none;}
.lp-btn-sm{padding:8px 15px;font-size:13px;border-radius:10px;}
.lp-btn-lg{padding:13px 26px;font-size:15px;border-radius:14px;}
.lp-btn-blue{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);animation:lp-pulse-blue 2.6s ease-in-out infinite;}
.lp-btn-blue:hover{background:var(--blue-h);transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.45);}
.lp-btn-blue:active{transform:scale(.98);}
.lp-btn-outline{background:var(--bg-c);color:var(--txt);border:1.5px solid var(--bdr);}
.lp-btn-outline:hover{background:var(--bg-s2);transform:translateY(-1px);box-shadow:var(--sh);}
.lp-btn-white{background:#fff;color:var(--blue);font-weight:700;}
.lp-btn-white:hover{background:#f0f4ff;transform:translateY(-1px);}
.lp-btn-wghost{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.28);}
.lp-btn-wghost:hover{background:rgba(255,255,255,.22);}

/* ── Cards ── */
.lp-card{background:var(--bg-c);border:1px solid var(--bdr);border-radius:16px;box-shadow:var(--sh);transition:transform .22s,box-shadow .22s,border-color .22s;}
.lp-card-hov:hover{transform:translateY(-3px);box-shadow:var(--sh2);}
.lp-fcard{background:var(--bg-c);border:1px solid var(--bdr);border-radius:20px;padding:26px;box-shadow:var(--sh);transition:transform .25s,box-shadow .25s,border-color .25s;cursor:default;}
.lp-fcard:hover{transform:translateY(-4px);box-shadow:var(--sh3);border-color:rgba(37,99,235,.25);}

/* ── Utilities ── */
.lp-badge{display:inline-flex;align-items:center;gap:6px;background:var(--blue-l);color:var(--blue);padding:5px 13px;border-radius:100px;font-size:12.5px;font-weight:600;border:1px solid rgba(37,99,235,.2);}
.lp-live-dot{width:7px;height:7px;border-radius:50%;background:#22C55E;display:inline-block;flex-shrink:0;animation:lp-live 1.6s ease-in-out infinite;}
.lp-section{max-width:1180px;margin:0 auto;padding:0 24px;}
.lp-avatar{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
.lp-dot-grid{background-image:radial-gradient(circle,var(--bdr) 1px,transparent 1px);background-size:26px 26px;}

/* ── Float animations ── */
.f1{animation:lp-f1 5s ease-in-out infinite;}
.f2{animation:lp-f2 4.2s ease-in-out infinite 1.1s;}
.f3{animation:lp-f3 6.5s ease-in-out infinite .6s;}

/* ── Hero ── */
.lp-hero-grid{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:64px;min-height:100vh;padding:108px 0 88px;}
.lp-orb1{position:absolute;width:720px;height:720px;background:radial-gradient(circle,rgba(37,99,235,.09) 0%,transparent 68%);top:-220px;right:-80px;border-radius:50%;pointer-events:none;}
.lp-orb2{position:absolute;width:420px;height:420px;background:radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 68%);bottom:-60px;left:-80px;border-radius:50%;pointer-events:none;}

/* ── Dashboard mock ── */
.lp-db-stat{background:var(--bg-s2);border:1px solid var(--bdr);border-radius:10px;padding:11px 14px;flex:1;}

/* ── Browser ── */
.lp-browser{background:var(--bg-c);border:1px solid var(--bdr);border-radius:16px;overflow:hidden;box-shadow:var(--sh2);}
.lp-browser-bar{background:var(--bg-s2);padding:10px 14px;display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--bdr);}

/* ── CTA ── */
.lp-cta-wrap{background:linear-gradient(140deg,#1438A8 0%,#2563EB 55%,#3B82F6 100%);border-radius:24px;padding:80px 64px;text-align:center;position:relative;overflow:hidden;}
.lp-cta-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 65% -30%,rgba(255,255,255,.16) 0%,transparent 55%);pointer-events:none;}

/* ── Footer ── */
.lp-footer{background:var(--bg-s2);border-top:1px solid var(--bdr);padding:64px 0 32px;}
.lp-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;}
.lp-fl{color:var(--txt2);text-decoration:none;font-size:14px;transition:color .15s;display:block;margin-bottom:9px;}
.lp-fl:hover{color:var(--blue);}

/* ── Testimonial ── */
.lp-tcard{background:var(--bg-c);border:1px solid var(--bdr);border-radius:20px;padding:28px;box-shadow:var(--sh);transition:transform .22s;}
.lp-tcard:hover{transform:translateY(-3px);}

/* ── Stats strip ── */
.lp-stat-strip{background:var(--bg-s);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);padding:28px 0;}
.lp-stat-strip-inner{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.lp-stat-item{text-align:center;padding:0 20px;border-right:1px solid var(--bdr);}
.lp-stat-item:last-child{border-right:none;}

/* ── Mobile overlay ── */
.lp-mob{position:fixed;inset:0;z-index:99;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px;}

/* ── Visitor section ── */
.lp-vis-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}

/* ── Responsive ── */
@media(max-width:960px){
  .lp-hero-grid{grid-template-columns:1fr;gap:48px;padding:90px 0 60px;}.lp-hero-r{display:none!important;}
  .lp-nav-links{display:none!important;}.lp-ham{display:flex!important;}
  .lp-footer-grid{grid-template-columns:1fr 1fr;gap:32px;}
  .lp-vis-grid{grid-template-columns:1fr;}.lp-vis-r{display:none!important;}
  .lp-stat-strip-inner{grid-template-columns:repeat(2,1fr);}
  .lp-stat-item:nth-child(2){border-right:none;}.lp-stat-item:nth-child(3){border-top:1px solid var(--bdr);}.lp-stat-item:nth-child(4){border-top:1px solid var(--bdr);}
}
@media(max-width:620px){
  .lp-feat-grid{grid-template-columns:1fr!important;}.lp-test-grid{grid-template-columns:1fr!important;}
  .lp-cta-wrap{padding:48px 24px!important;border-radius:16px!important;}
  .lp-footer-grid{grid-template-columns:1fr!important;}
  .lp-stat-strip-inner{grid-template-columns:repeat(2,1fr);}
}

/* ── Scrollbar ── */
.lp::-webkit-scrollbar{width:5px;}
.lp::-webkit-scrollbar-track{background:transparent;}
.lp::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:10px;}

/* ── Testimonial marquee ── */
@keyframes lp-scroll-l{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes lp-scroll-r{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
.lp-marquee-track{display:flex;gap:16px;width:max-content;will-change:transform;}
.lp-marquee-track-l{animation:lp-scroll-l 55s linear infinite;}
.lp-marquee-track-r{animation:lp-scroll-r 55s linear infinite;}
.lp-marquee-track:hover{animation-play-state:paused;}
`;

/* ─── Static data ─────────────────────────────────────────── */
const VISITORS = [
  { id:1, i:"RS", name:"Rahul Sharma",    flat:"A-204", type:"Guest",    bg:"#EFF6FF", fg:"#2563EB" },
  { id:2, i:"SW", name:"Swiggy Delivery", flat:"B-101", type:"Delivery", bg:"#FFFBEB", fg:"#D97706" },
  { id:3, i:"PM", name:"Priya Mehta",     flat:"C-302", type:"Guest",    bg:"#F5F3FF", fg:"#7C3AED" },
  { id:4, i:"AM", name:"Amazon",          flat:"A-105", type:"Delivery", bg:"#FEF2F2", fg:"#DC2626" },
];

const FEATURES = [
  { Icon:Shield,   title:"Smart Visitor Control", desc:"Approve or deny guests with one tap. QR pass generation, photo capture, and pre-registration built in.", color:"#2563EB", bg:"#EFF6FF" },
  { Icon:Bell,     title:"Real-Time Alerts",       desc:"Get push notifications the moment someone arrives. Never miss a guest, delivery, or security event again.", color:"#7C3AED", bg:"#F5F3FF" },
  { Icon:Users,    title:"Multi-Role Access",       desc:"Residents, security guards, staff, and admins each get personalized views and the right permissions.", color:"#16A34A", bg:"#DCFCE7" },
  { Icon:BarChart3,title:"Security Analytics",      desc:"Track visitor patterns, identify peak hours, and generate compliance reports effortlessly.", color:"#D97706", bg:"#FEF9C3" },
];

const STATS = [
  { value:"500+",  label:"Societies" },
  { value:"50K+",  label:"Residents" },
  { value:"2M+",   label:"Visitors managed" },
  { value:"99.9%", label:"Uptime" },
];

const ROW1_TESTIMONIALS = [
  {
    name:"Ananya Krishnamurthy", role:"Society Secretary", soc:"Prestige Lakeside Habitat", img:"https://i.pravatar.cc/64?img=5",
    q:"Managing visitor approvals used to take three phone calls. Now I approve from my phone in seconds and the whole committee gets notified automatically.",
  },
  {
    name:"Rohan Mehta", role:"Resident", soc:"Brigade El Dorado, Marathahalli", img:"https://i.pravatar.cc/64?img=12",
    q:"My parents visited last month and the pre-registration QR pass meant zero waiting at the gate. AptHive made a genuinely great first impression on them.",
  },
  {
    name:"Priya Venkataraman", role:"Flat Owner", soc:"Purva Venezia, Yelahanka", img:"https://i.pravatar.cc/64?img=18",
    q:"We had a package theft incident last year. Since deploying AptHive, every delivery is logged with a photo and timestamp — total peace of mind now.",
  },
  {
    name:"Col. Arvind Shenoy", role:"Head of Security", soc:"Sobha City, Thanisandra", img:"https://i.pravatar.cc/64?img=22",
    q:"Twenty years in the Army taught me that good systems beat good intentions every time. AptHive is exactly that — a proper, reliable system for gate security.",
  },
  {
    name:"Kavitha Subramaniam", role:"Committee Member", soc:"Salarpuria Greenage, Koramangala", img:"https://i.pravatar.cc/64?img=29",
    q:"Our monthly meetings used to start with a stack of handwritten logs. Now we pull up the analytics dashboard and the data tells the story in seconds.",
  },
];

const ROW2_TESTIMONIALS = [
  {
    name:"Suresh Narayanan", role:"Resident", soc:"Embassy Springs, Devanahalli", img:"https://i.pravatar.cc/64?img=33",
    q:"I was in a meeting in Whitefield when my guest arrived at the gate. One tap on my phone and she was cleared — I didn't even have to step out.",
  },
  {
    name:"Deepa Rajagopal", role:"Society Secretary", soc:"Mantri Pinnacle, Jayanagar", img:"https://i.pravatar.cc/64?img=40",
    q:"Resident complaints about gate delays dropped to nearly zero after we switched. AptHive just works quietly in the background — exactly what a 900-unit society needs.",
  },
  {
    name:"Arjun Nambiar", role:"Flat Owner", soc:"Godrej Woodsman Estate, Hebbal", img:"https://i.pravatar.cc/64?img=47",
    q:"Setting up recurring passes for our cook and driver used to mean calling the security desk every morning. Now it's done once and everyone is happy.",
  },
  {
    name:"Sunita Reddy", role:"Committee Member", soc:"DivyaSree 77 Place, Whitefield", img:"https://i.pravatar.cc/64?img=54",
    q:"The multi-role access is brilliantly designed. Guards see what they need, residents get their view, and I can oversee everything from the admin panel.",
  },
  {
    name:"Manoj Kumar Iyer", role:"Head of Security", soc:"Nitesh Napa Valley, Kanakapura Road", img:"https://i.pravatar.cc/64?img=60",
    q:"Peak-hour management at a 2,000-unit complex is no joke. AptHive's live dashboard lets me redeploy guards in real time based on actual visitor flow data.",
  },
];

const VISITOR_FEATURES = [
  { Icon:CheckCircle, color:"#16A34A", text:"One-tap approve or deny from your phone" },
  { Icon:Shield,      color:"#2563EB", text:"QR-code passes with expiry and usage limits" },
  { Icon:Bell,        color:"#7C3AED", text:"Real-time notifications the moment they arrive" },
  { Icon:BarChart3,   color:"#D97706", text:"Complete visitor history and audit trails" },
];

/* ─── Navbar ──────────────────────────────────────────────── */
function Navbar({ dark, setDark, scrolled, mob, setMob }) {
  const links = ["Features","Security","Visitors","Pricing"];
  return (
    <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
      <div className="lp-nav-inner">
        <a href="#" className="lp-logo">
          <div className="lp-logo-mark"><Shield size={17} color="#fff" /></div>
          <span className="lp-logo-text">AptHive</span>
        </a>

        <div className="lp-nav-links">
          {links.map(l => <a key={l} href="#" className="lp-nl">{l}</a>)}
        </div>

        <div className="lp-nav-r">
          <button className="lp-toggle" onClick={() => setDark(d=>!d)} aria-label="Toggle theme">
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <Link to="/login" style={{ textDecoration:"none", color:"var(--txt2)", fontSize:14, fontWeight:500, padding:"8px 12px" }}>
            Sign in
          </Link>
          <Link to="/register" className="lp-btn lp-btn-sm lp-btn-blue" style={{ textDecoration:"none" }}>
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

/* ─── Mobile menu ─────────────────────────────────────────── */
function MobileMenu({ dark, setDark, close }) {
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

/* ─── Hero ────────────────────────────────────────────────── */
function HeroSection({ visIdx }) {
  const vis = VISITORS[visIdx];
  const prev = VISITORS[(visIdx + VISITORS.length - 1) % VISITORS.length];

  return (
    <section style={{position:"relative",overflow:"hidden"}} className="lp-dot-grid">
      <div className="lp-orb1"/><div className="lp-orb2"/>
      <div className="lp-section">
        <div className="lp-hero-grid">

          {/* ── Left ── */}
          <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.75,ease:[.2,.8,.2,1]}}>
            <div className="lp-badge" style={{marginBottom:24}}>
              <span className="lp-live-dot"/>
              Now live in 500+ societies across India
            </div>

            <h1 style={{fontSize:"clamp(38px,5vw,62px)",fontWeight:800,lineHeight:1.08,letterSpacing:"-1.8px",marginBottom:20,color:"var(--txt)"}}>
              Smart Security for<br/>
              <span style={{color:"var(--blue)"}}>Modern Apartment</span><br/>
              Communities
            </h1>

            <p style={{fontSize:18,lineHeight:1.65,color:"var(--txt2)",maxWidth:450,marginBottom:36}}>
              AptHive gives residents, security guards, and society admins one unified platform to manage visitors, deliveries, and community events — in real time.
            </p>

            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:40}}>
              <Link to="/register" className="lp-btn lp-btn-lg lp-btn-blue" style={{textDecoration:"none"}}>
                Get started free <ArrowRight size={16}/>
              </Link>
              <button className="lp-btn lp-btn-lg lp-btn-outline">
                Watch demo
              </button>
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
                  {[1,2,3,4,5].map(s=><Star key={s} size={12} fill="#F59E0B" color="#F59E0B"/>)}
                </div>
                <span style={{fontSize:13,color:"var(--txt2)",fontWeight:500}}>
                  Trusted by <strong style={{color:"var(--txt)"}}>50,000+</strong> residents
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Right (hero visual) ── */}
          <motion.div className="lp-hero-r" style={{position:"relative",height:520}}
            initial={{opacity:0,scale:.94,y:20}} animate={{opacity:1,scale:1,y:0}}
            transition={{duration:.85,delay:.18,ease:[.2,.8,.2,1]}}>

            {/* Floating: approved notification */}
            <div className="lp-card f1" style={{position:"absolute",top:14,right:-18,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderRadius:14,minWidth:218,zIndex:10,boxShadow:"var(--sh2)"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"var(--grn-l)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <CheckCircle size={16} color="var(--grn)"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--txt)"}}>Visitor Approved</div>
                <div style={{fontSize:11,color:"var(--txt2)"}}>{prev.name} · {prev.flat}</div>
              </div>
            </div>

            {/* Floating: delivery alert */}
            <div className="lp-card f2" style={{position:"absolute",bottom:90,left:-32,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderRadius:14,minWidth:210,zIndex:10,boxShadow:"var(--sh2)"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"var(--ylw-l)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Package size={16} color="var(--ylw)"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--txt)"}}>New Delivery</div>
                <div style={{fontSize:11,color:"var(--txt2)"}}>Amazon · Block B · just now</div>
              </div>
            </div>

            {/* Floating: gate status */}
            <div className="lp-card f3" style={{position:"absolute",top:200,left:-38,padding:"10px 14px",display:"flex",alignItems:"center",gap:9,borderRadius:13,zIndex:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:"var(--blue-l)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Lock size={13} color="var(--blue)"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"var(--txt)"}}>Gate 1 Secured</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                  <span className="lp-live-dot"/>
                  <span style={{fontSize:10,color:"var(--txt2)"}}>Live monitoring</span>
                </div>
              </div>
            </div>

            {/* ── Main dashboard card ── */}
            <div className="lp-card" style={{position:"absolute",top:50,left:16,right:16,bottom:20,borderRadius:20,overflow:"hidden",padding:0}}>

              {/* Header */}
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg-c)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:8,background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Shield size={14} color="#fff"/>
                  </div>
                  <span style={{fontWeight:700,fontSize:14,color:"var(--txt)"}}>Security Hub</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--grn)",fontWeight:600}}>
                  <span className="lp-live-dot"/> Live
                </div>
              </div>

              {/* Stats row */}
              <div style={{padding:"12px 14px",display:"flex",gap:8,borderBottom:"1px solid var(--bdr)"}}>
                {[{l:"Today",v:"127",c:"var(--blue)"},{l:"Pending",v:"4",c:"var(--ylw)"},{l:"Online",v:"89",c:"var(--grn)"}].map(s=>(
                  <div key={s.l} className="lp-db-stat">
                    <div style={{fontSize:20,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                    <div style={{fontSize:10,color:"var(--txt2)",marginTop:3}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Visitor queue */}
              <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bdr)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
                  <span style={{fontSize:10.5,fontWeight:700,color:"var(--txt)",textTransform:"uppercase",letterSpacing:".6px"}}>Visitor Queue</span>
                  <span style={{fontSize:10,color:"var(--txt2)"}}>4 waiting</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={visIdx}
                    initial={{x:32,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-32,opacity:0}}
                    transition={{duration:.32,ease:[.2,.8,.2,1]}}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--bg-s2)",borderRadius:12}}>
                    <div className="lp-avatar" style={{background:vis.bg,color:vis.fg}}>{vis.i}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vis.name}</div>
                      <div style={{fontSize:11,color:"var(--txt2)"}}>Flat {vis.flat} · {vis.type}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button style={{width:27,height:27,borderRadius:8,background:"var(--grn-l)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--grn)"}}>
                        <CheckCircle size={13}/>
                      </button>
                      <button style={{width:27,height:27,borderRadius:8,background:"var(--red-l)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--red)"}}>
                        <X size={13}/>
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mini bar chart */}
              <div style={{padding:"12px 14px"}}>
                <div style={{fontSize:10.5,fontWeight:700,color:"var(--txt)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>Visitor Traffic · Today</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:3.5,height:42}}>
                  {[.28,.45,.60,.38,.82,.55,.70,.95,.65,.50,.38,.55,.72,.44].map((h,i)=>(
                    <div key={i} style={{flex:1,background:`rgba(37,99,235,${.18+h*.65})`,borderRadius:"3px 3px 0 0",height:`${h*100}%`,minHeight:4,animation:`lp-bar-grow .55s ${i*.035}s ease-out both`}}/>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  {["6am","9am","12pm","3pm","6pm","9pm"].map(t=>(
                    <span key={t} style={{fontSize:9,color:"var(--txt3)"}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats strip ─────────────────────────────────────────── */
function StatsStrip() {
  return (
    <div className="lp-stat-strip">
      <div className="lp-section">
        <div className="lp-stat-strip-inner">
          {STATS.map((s,i) => (
            <div key={i} className="lp-stat-item">
              <div style={{fontSize:28,fontWeight:800,color:"var(--blue)",letterSpacing:"-1px"}}>{s.value}</div>
              <div style={{fontSize:13,color:"var(--txt2)",marginTop:4,fontWeight:500}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature card animations ─────────────────────────────── */

/* 1. Smart Visitor Control — visitor card slides in → QR scan line → Approved badge */
function VisitorControlAnim() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [];
    const run = () => {
      setPhase(0);
      ts.push(setTimeout(() => setPhase(1), 900));
      ts.push(setTimeout(() => setPhase(2), 2100));
      ts.push(setTimeout(() => run(), 4200));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{height:110,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {/* Visitor card */}
      <motion.div
        initial={{x:-80,opacity:0}}
        animate={{x:0,opacity:1}}
        transition={{duration:.55,ease:"easeOut"}}
        style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:12,padding:"10px 14px",
          display:"flex",alignItems:"center",gap:10,boxShadow:"var(--sh)",position:"relative",zIndex:2}}
      >
        {/* Avatar */}
        <div style={{width:36,height:36,borderRadius:"50%",background:"var(--blue-m)",display:"flex",
          alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"var(--blue)",flexShrink:0}}>R</div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"var(--txt)",lineHeight:1.3}}>Rahul Sharma</div>
          <div style={{fontSize:11,color:"var(--txt2)"}}>Apt A-204 · Guest</div>
        </div>
        {/* QR box */}
        <div style={{width:34,height:34,background:"var(--bg-s)",borderRadius:6,marginLeft:4,
          display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,padding:4,position:"relative",overflow:"hidden",flexShrink:0}}>
          {[1,0,1,0, 0,1,0,1, 1,1,0,0, 0,0,1,1].map((on,i) => (
            <div key={i} style={{background:on?"var(--txt)":"transparent",borderRadius:1}}/>
          ))}
          {/* Scan line */}
          {phase === 1 && (
            <motion.div
              initial={{y:0}} animate={{y:34}}
              transition={{duration:.55,ease:"linear",repeat:2}}
              style={{position:"absolute",left:0,right:0,height:2,
                background:"rgba(37,99,235,.7)",boxShadow:"0 0 6px rgba(37,99,235,.9)"}}
            />
          )}
        </div>
      </motion.div>

      {/* Approved badge */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{scale:0,opacity:0,y:8}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0,opacity:0}}
            transition={{type:"spring",stiffness:420,damping:18}}
            style={{position:"absolute",top:10,right:14,background:"var(--grn-l)",border:"1.5px solid var(--grn)",
              borderRadius:100,padding:"4px 10px",display:"flex",alignItems:"center",gap:5,
              fontSize:11.5,fontWeight:700,color:"var(--grn)",zIndex:3}}
          >
            <CheckCircle size={11}/> Approved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* 2. Real-Time Alerts — bell shakes → toast stack slides in from right */
function AlertsAnim() {
  const TOASTS = [
    {id:1,label:"Rahul Sharma arrived",sub:"A-204 · Just now",dot:"var(--blue)"},
    {id:2,label:"Delivery at Gate 2",sub:"Amazon · 2 min ago",dot:"var(--prp)"},
    {id:3,label:"Visitor pre-approved",sub:"Tower B · 4 min ago",dot:"var(--grn)"},
  ];
  const [shake,setShake] = useState(false);
  const [visible,setVisible] = useState([]);

  useEffect(() => {
    const ts = [];
    const run = () => {
      setVisible([]); setShake(false);
      ts.push(setTimeout(() => setShake(true), 300));
      ts.push(setTimeout(() => setShake(false), 900));
      TOASTS.forEach((t,i) => ts.push(setTimeout(() => setVisible(p => [...p,t]), 700+i*650)));
      ts.push(setTimeout(() => run(), 5200));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{height:110,display:"flex",alignItems:"center",gap:12,overflow:"hidden",padding:"0 4px"}}>
      {/* Bell */}
      <motion.div
        animate={shake ? {rotate:[0,-16,16,-10,10,-5,0],scale:[1,1.12,1.12,1,1,1,1]} : {rotate:0}}
        transition={{duration:.5}}
        style={{width:44,height:44,borderRadius:12,background:"var(--prp-l)",display:"flex",
          alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}
      >
        <Bell size={19} color="var(--prp)"/>
        <AnimatePresence>
          {shake && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0,opacity:0}}
              style={{position:"absolute",top:-3,right:-3,width:11,height:11,borderRadius:"50%",
                background:"var(--red)",border:"2px solid var(--bg-c)"}}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast stack */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,overflow:"hidden",minWidth:0}}>
        <AnimatePresence>
          {visible.map(n => (
            <motion.div key={n.id}
              initial={{x:80,opacity:0}} animate={{x:0,opacity:1}} exit={{x:80,opacity:0}}
              transition={{type:"spring",stiffness:280,damping:22}}
              style={{background:"var(--bg-c)",border:"1px solid var(--bdr)",borderRadius:10,
                padding:"6px 10px",display:"flex",alignItems:"center",gap:8,boxShadow:"var(--sh)"}}
            >
              <motion.div animate={{scale:[1,1.5,1],opacity:[1,.35,1]}}
                transition={{duration:1.3,repeat:Infinity}}
                style={{width:7,height:7,borderRadius:"50%",background:n.dot,flexShrink:0}}/>
              <div style={{overflow:"hidden",minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--txt)",whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</div>
                <div style={{fontSize:10,color:"var(--txt2)"}}>{n.sub}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* 3. Multi-Role Access — role pills spotlight one by one */
function MultiRoleAnim() {
  const ROLES = [
    {label:"Resident", color:"var(--blue)", bg:"var(--blue-l)",  ring:"rgba(37,99,235,.3)"},
    {label:"Guard",    color:"var(--grn)",  bg:"var(--grn-l)",   ring:"rgba(22,163,74,.3)"},
    {label:"Admin",    color:"var(--red)",  bg:"var(--red-l)",   ring:"rgba(220,38,38,.3)"},
    {label:"Staff",    color:"var(--prp)",  bg:"var(--prp-l)",   ring:"rgba(124,58,237,.3)"},
  ];
  const [active,setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a+1)%ROLES.length), 950);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{height:110,display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",padding:"0 4px"}}>
      {ROLES.map((r,i) => (
        <motion.div key={r.label}
          animate={{
            scale:   active===i ? 1.08 : 0.90,
            opacity: active===i ? 1    : 0.35,
            y:       active===i ? -3   : 0,
            boxShadow: active===i ? `0 0 0 2.5px ${r.ring}` : "0 0 0 0px transparent",
          }}
          transition={{duration:.38,ease:"easeOut"}}
          style={{padding:"7px 15px",borderRadius:100,
            background: active===i ? r.bg : "var(--bg-s2)",
            border:`1.5px solid ${active===i ? r.ring : "var(--bdr)"}`,
            fontSize:12.5,fontWeight:700,color:active===i ? r.color : "var(--txt3)",
            display:"flex",alignItems:"center",gap:6,userSelect:"none",cursor:"default"}}
        >
          <motion.div animate={active===i ? {scale:[1,1.5,1]} : {scale:1}} transition={{duration:.4}}
            style={{width:6,height:6,borderRadius:"50%",background:active===i ? r.color : "var(--txt3)"}}/>
          {r.label}
        </motion.div>
      ))}
    </div>
  );
}

/* 4. Security Analytics — staggered bars draw upward, peak bar highlighted */
function AnalyticsAnim() {
  const BARS = [.42,.64,.5,.78,.59,.92,.68,.53];
  const DAYS = ["M","T","W","T","F","S","S","—"];
  const PEAK = 5;
  const [drawn,setDrawn] = useState(false);

  useEffect(() => {
    const ts = [];
    const run = () => {
      setDrawn(false);
      ts.push(setTimeout(() => setDrawn(true), 250));
      ts.push(setTimeout(() => run(), 4000));
    };
    run();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{height:110,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"6px 8px 0"}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:5,flex:1}}>
        {BARS.map((h,i) => (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:0,height:"100%",justifyContent:"flex-end"}}>
            <motion.div
              initial={{scaleY:0}}
              animate={{scaleY: drawn ? h : 0}}
              transition={{duration:.55,delay: drawn ? i*.065 : 0,ease:[.22,.68,0,1.1]}}
              style={{width:"100%",maxHeight:72,height:72,borderRadius:"3px 3px 0 0",
                transformOrigin:"bottom",
                background: i===PEAK
                  ? "linear-gradient(180deg,#F59E0B,#D97706)"
                  : "var(--ylw-l)",
                border: `1px solid ${i===PEAK ? "rgba(217,119,6,.5)" : "rgba(217,119,6,.18)"}`,
                position:"relative",overflow:"hidden"}}
            >
              {i===PEAK && (
                <motion.div animate={{opacity:[0,1,0]}} transition={{duration:1.6,delay:1.1,repeat:Infinity}}
                  style={{position:"absolute",top:3,left:0,right:0,textAlign:"center",
                    fontSize:8,fontWeight:800,color:"#fff",letterSpacing:.3}}>PEAK</motion.div>
              )}
            </motion.div>
          </div>
        ))}
      </div>
      <div style={{height:1,background:"var(--bdr)",margin:"3px 0"}}/>
      <div style={{display:"flex",gap:5,paddingBottom:4}}>
        {DAYS.map((d,i) => (
          <div key={i} style={{flex:1,textAlign:"center",fontSize:9,
            color: i===PEAK ? "var(--ylw)" : "var(--txt3)",fontWeight: i===PEAK ? 800 : 600}}>{d}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Features ────────────────────────────────────────────── */
const FEAT_ANIMS = [VisitorControlAnim, AlertsAnim, MultiRoleAnim, AnalyticsAnim];

function FeaturesSection() {
  return (
    <section style={{padding:"100px 0"}}>
      <div className="lp-section">
        <div style={{textAlign:"center",marginBottom:60}}>
          <div className="lp-badge" style={{marginBottom:16}}>
            <Zap size={12}/> Everything you need
          </div>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:800,letterSpacing:"-1px",marginBottom:16}}>
            Built for the way societies<br/>actually work
          </h2>
          <p style={{fontSize:17,color:"var(--txt2)",maxWidth:480,margin:"0 auto"}}>
            Every feature designed with security guards, residents, and admins in mind.
          </p>
        </div>

        <div className="lp-feat-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
          {FEATURES.map(({Icon,title,desc,color,bg},i) => {
            const AnimComp = FEAT_ANIMS[i];
            return (
              <motion.div key={i} className="lp-fcard"
                initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.09,duration:.5}}>
                {/* Animated illustration zone */}
                <div style={{background:bg,borderRadius:14,marginBottom:20,
                  padding:"0 12px",overflow:"hidden",border:`1px solid ${color}1A`}}>
                  <AnimComp/>
                </div>
                {/* Icon + text row */}
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:bg,display:"flex",
                    alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${color}22`}}>
                    <Icon size={20} color={color}/>
                  </div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:7,letterSpacing:"-.3px",color:"var(--txt)"}}>{title}</h3>
                    <p style={{fontSize:14,lineHeight:1.65,color:"var(--txt2)"}}>{desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard preview ───────────────────────────────────── */
function DashboardPreview() {
  const bars = [.4,.65,.5,.8,.6,.9,.75,.55,.7,.85,.5,.6,.45,.7,.9];
  return (
    <section style={{padding:"0 0 100px",background:"var(--bg-s)"}}>
      <div className="lp-section" style={{paddingTop:80}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div className="lp-badge" style={{marginBottom:16}}>
            <BarChart3 size={12}/> Dashboard
          </div>
          <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:800,letterSpacing:"-1px",marginBottom:14}}>
            A command center for your society
          </h2>
          <p style={{fontSize:17,color:"var(--txt2)",maxWidth:460,margin:"0 auto"}}>
            Every piece of information your security team needs, in one beautiful dashboard.
          </p>
        </div>

        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.65}}>
          <div className="lp-browser">
            {/* Browser chrome */}
            <div className="lp-browser-bar">
              <div style={{width:11,height:11,borderRadius:"50%",background:"#FF5F56"}}/>
              <div style={{width:11,height:11,borderRadius:"50%",background:"#FFBD2E"}}/>
              <div style={{width:11,height:11,borderRadius:"50%",background:"#27C93F"}}/>
              <div style={{flex:1,background:"var(--bg-c)",borderRadius:6,padding:"5px 12px",marginLeft:8,fontSize:12,color:"var(--txt3)",fontWeight:500}}>
                app.apthive.in/dashboard
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--grn)",fontWeight:600}}>
                <span className="lp-live-dot"/> Live
              </div>
            </div>

            {/* Dashboard body */}
            <div style={{padding:"20px 24px",background:"var(--bg-s2)"}}>
              {/* Top stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[
                  {l:"Visitors Today",v:"247",d:"+18 vs yesterday",c:"var(--blue)"},
                  {l:"Pending Approvals",v:"12",d:"4 urgent",c:"var(--ylw)"},
                  {l:"Security Alerts",v:"3",d:"1 resolved",c:"var(--red)"},
                  {l:"Active Residents",v:"1,456",d:"89 online now",c:"var(--grn)"},
                ].map((s,i) => (
                  <div key={i} className="lp-card" style={{padding:"16px 18px",borderRadius:12}}>
                    <div style={{fontSize:10,fontWeight:600,color:"var(--txt2)",textTransform:"uppercase",letterSpacing:".6px",marginBottom:8}}>{s.l}</div>
                    <div style={{fontSize:24,fontWeight:800,color:s.c,letterSpacing:"-1px",marginBottom:4}}>{s.v}</div>
                    <div style={{fontSize:11,color:"var(--txt3)"}}>{s.d}</div>
                  </div>
                ))}
              </div>

              {/* Content row */}
              <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14}}>
                {/* Visitor traffic chart */}
                <div className="lp-card" style={{padding:"18px 20px",borderRadius:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <span style={{fontSize:13,fontWeight:700}}>Visitor Traffic</span>
                    <span style={{fontSize:11,color:"var(--txt3)",background:"var(--bg-s2)",padding:"3px 8px",borderRadius:6}}>Last 7 days</span>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
                    {bars.map((h,i) => (
                      <div key={i} style={{flex:1,borderRadius:"4px 4px 0 0",background:`rgba(37,99,235,${.15+h*.7})`,height:`${h*100}%`,animation:`lp-bar-grow .5s ${i*.03}s ease-out both`}}/>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    {["M","T","W","T","F","S","S","M","T","W","T","F","S","S","T"].map((d,i)=>(
                      <span key={i} style={{fontSize:9,color:"var(--txt3)",flex:1,textAlign:"center"}}>{d}</span>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="lp-card" style={{padding:"18px 20px",borderRadius:14}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Recent Activity</div>
                  {[
                    {i:"RS",bg:"#EFF6FF",fg:"#2563EB",name:"Rahul Sharma",time:"2m ago",action:"Approved",ac:"var(--grn)"},
                    {i:"SW",bg:"#FFFBEB",fg:"#D97706",name:"Swiggy",time:"5m ago",action:"Delivery",ac:"var(--ylw)"},
                    {i:"AL",bg:"#FEF2F2",fg:"#DC2626",name:"Alert: Gate 2",time:"8m ago",action:"Resolved",ac:"var(--red)"},
                    {i:"PM",bg:"#F5F3FF",fg:"#7C3AED",name:"Priya Mehta",time:"12m ago",action:"Denied",ac:"var(--red)"},
                  ].map((r,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:i<3?12:0}}>
                      <div className="lp-avatar" style={{background:r.bg,color:r.fg,width:30,height:30,borderRadius:8,fontSize:10}}>{r.i}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--txt)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                        <div style={{fontSize:10,color:"var(--txt3)"}}>{r.time}</div>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:r.ac}}>{r.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Visitor management section ──────────────────────────── */
function VisitorSection() {
  const [active, setActive] = useState(0);
  const QUEUE = [
    {i:"RS",bg:"#EFF6FF",fg:"#2563EB",name:"Rahul Sharma",flat:"A-204",type:"Guest",time:"arriving in 5 min"},
    {i:"ZO",bg:"#FFFBEB",fg:"#D97706",name:"Zomato Delivery",flat:"B-303",type:"Delivery",time:"at gate now"},
    {i:"AM",bg:"#FEF2F2",fg:"#DC2626",name:"Amazon",flat:"C-101",type:"Courier",time:"1 min ago"},
  ];
  return (
    <section style={{padding:"100px 0"}}>
      <div className="lp-section">
        <div className="lp-vis-grid">
          {/* Left: text */}
          <motion.div initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.6}}>
            <div className="lp-badge" style={{marginBottom:16}}>
              <Users size={12}/> Visitor management
            </div>
            <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:800,letterSpacing:"-1px",marginBottom:18,lineHeight:1.1}}>
              Approve guests<br/>before they arrive
            </h2>
            <p style={{fontSize:16.5,lineHeight:1.7,color:"var(--txt2)",marginBottom:36}}>
              Residents get a notification with photo the moment a visitor arrives. One tap to let them in — no calls to the guard, no delays, no confusion.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:40}}>
              {VISITOR_FEATURES.map(({Icon,color,text},i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:34,height:34,borderRadius:10,background:"var(--bg-s)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon size={16} color={color}/>
                  </div>
                  <span style={{fontSize:15,fontWeight:500,color:"var(--txt)"}}>{text}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="lp-btn lp-btn-lg lp-btn-blue" style={{textDecoration:"none"}}>
              See it in action <ChevronRight size={16}/>
            </Link>
          </motion.div>

          {/* Right: interactive visitor card mock */}
          <motion.div className="lp-vis-r" initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.6,delay:.15}}>
            <div className="lp-card" style={{borderRadius:20,overflow:"hidden",maxWidth:340,margin:"0 auto"}}>
              {/* Phone-style header */}
              <div style={{background:"var(--blue)",padding:"20px 20px 16px",color:"#fff"}}>
                <div style={{fontSize:12,opacity:.75,marginBottom:2}}>AptHive Security</div>
                <div style={{fontSize:15,fontWeight:700}}>Visitor Queue</div>
              </div>

              {/* Queue items */}
              <div style={{padding:"0 12px 12px"}}>
                {QUEUE.map((v,i) => (
                  <motion.div key={i}
                    onClick={() => setActive(i)}
                    style={{padding:"12px",borderRadius:12,cursor:"pointer",marginTop:10,background:active===i?"var(--blue-l)":"var(--bg-c)",border:`1.5px solid ${active===i?"rgba(37,99,235,.3)":"var(--bdr)"}`,transition:"all .2s"}}
                    whileHover={{scale:1.01}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="lp-avatar" style={{background:v.bg,color:v.fg}}>{v.i}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--txt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
                        <div style={{fontSize:11,color:"var(--txt2)"}}>Flat {v.flat} · {v.type}</div>
                      </div>
                      <div style={{fontSize:10,color:"var(--txt3)",whiteSpace:"nowrap"}}>{v.time}</div>
                    </div>

                    <AnimatePresence>
                      {active === i && (
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                          style={{marginTop:12,display:"flex",gap:8,overflow:"hidden"}}>
                          <button className="lp-btn" style={{flex:1,background:"var(--grn-l)",color:"var(--grn)",borderRadius:10,fontSize:13,justifyContent:"center"}}>
                            <CheckCircle size={14}/> Approve
                          </button>
                          <button className="lp-btn" style={{flex:1,background:"var(--red-l)",color:"var(--red)",borderRadius:10,fontSize:13,justifyContent:"center"}}>
                            <X size={14}/> Deny
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Notifications section ───────────────────────────────── */
function NotificationsSection() {
  const notifs = [
    {Icon:Bell,   bg:"var(--blue-l)",ic:"var(--blue)",  title:"Visitor Arrived",     body:"Rahul Sharma is at Gate 1 · A-204",  time:"now",    dot:"#2563EB"},
    {Icon:Package,bg:"var(--ylw-l)", ic:"var(--ylw)",   title:"Delivery Waiting",    body:"Amazon package · Block B entrance",   time:"2m ago", dot:"#D97706"},
    {Icon:Shield, bg:"var(--grn-l)", ic:"var(--grn)",   title:"Gate 2 Secured",      body:"Security patrol completed at 22:30",  time:"8m ago", dot:"#16A34A"},
    {Icon:Users,  bg:"var(--prp-l)", ic:"var(--prp)",   title:"New Pre-Registration", body:"Priya Mehta added a guest for Sat",  time:"15m ago",dot:"#7C3AED"},
  ];

  return (
    <section style={{padding:"0 0 100px",background:"var(--bg-s)"}}>
      <div className="lp-section" style={{paddingTop:80}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
          {/* Left: notification stack */}
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.6}}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {notifs.map(({Icon,bg,ic,title,body,time,dot},i) => (
                <motion.div key={i} className="lp-card lp-card-hov"
                  style={{padding:"14px 16px",borderRadius:14,display:"flex",alignItems:"flex-start",gap:12}}
                  initial={{opacity:0,x:-16}} whileInView={{opacity:1,x:0}}
                  viewport={{once:true}} transition={{delay:i*.1,duration:.4}}>
                  <div style={{width:38,height:38,borderRadius:11,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon size={17} color={ic}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--txt)"}}>{title}</span>
                      <span style={{fontSize:11,color:"var(--txt3)"}}>{time}</span>
                    </div>
                    <div style={{fontSize:12.5,color:"var(--txt2)",lineHeight:1.5}}>{body}</div>
                  </div>
                  <div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,marginTop:4}}/>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: text */}
          <motion.div initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:.6,delay:.15}}>
            <div className="lp-badge" style={{marginBottom:16}}>
              <Bell size={12}/> Smart notifications
            </div>
            <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:800,letterSpacing:"-1px",marginBottom:18,lineHeight:1.1}}>
              Stay informed,<br/>not overwhelmed
            </h2>
            <p style={{fontSize:16.5,lineHeight:1.7,color:"var(--txt2)",marginBottom:28}}>
              AptHive sends you only the alerts that matter — visitors at your door, deliveries waiting, security events — with no spam, no noise.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {["Push, SMS, and in-app notifications","Role-based alert routing","Mute hours and priority settings","Escalation for unanswered requests"].map((f,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <CheckCircle size={16} color="var(--grn)"/>
                  <span style={{fontSize:15,color:"var(--txt)"}}>{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────── */
function TestimonialCard({ q, name, role, soc, img }) {
  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: "var(--bg-c)",
      border: "1px solid var(--bdr)",
      borderRadius: 16,
      padding: "20px 22px",
      boxShadow: "var(--sh)",
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}>
      {/* Stars */}
      <div style={{display:"flex",gap:2,marginBottom:11}}>
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{fontSize:13,color:"#F59E0B",lineHeight:1}}>★</span>
        ))}
      </div>
      {/* Quote */}
      <p style={{
        fontSize:14, lineHeight:1.72, color:"var(--txt2)",
        fontStyle:"italic", marginBottom:18, flex:1,
      }}>"{q}"</p>
      {/* Author */}
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        <img
          src={img} alt={name}
          width={48} height={48}
          style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",
            border:"2px solid var(--bdr)",flexShrink:0}}
        />
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--txt)",lineHeight:1.3}}>{name}</div>
          <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>{role} · {soc}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  /* Duplicate each row so the track is 2× wide — seamless loop */
  const row1 = [...ROW1_TESTIMONIALS, ...ROW1_TESTIMONIALS];
  const row2 = [...ROW2_TESTIMONIALS, ...ROW2_TESTIMONIALS];

  return (
    <section style={{padding:"100px 0",overflow:"hidden"}}>
      {/* Heading */}
      <div style={{textAlign:"center",marginBottom:56}}>
        <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:800,letterSpacing:"-1px",marginBottom:14}}>
          Loved by societies<br/>across India
        </h2>
      </div>

      {/* Marquee wrapper — fade edges via gradient overlay */}
      <div style={{position:"relative"}}>
        {/* Left fade */}
        <div style={{
          position:"absolute",left:0,top:0,bottom:0,width:180,zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to right, var(--bg) 0%, transparent 100%)",
        }}/>
        {/* Right fade */}
        <div style={{
          position:"absolute",right:0,top:0,bottom:0,width:180,zIndex:2,pointerEvents:"none",
          background:"linear-gradient(to left, var(--bg) 0%, transparent 100%)",
        }}/>

        {/* Row 1 — scrolls LEFT (translateX: 0 → -50%) */}
        <div style={{overflow:"hidden",marginBottom:16}}>
          <div className="lp-marquee-track lp-marquee-track-l">
            {row1.map((t,idx) => <TestimonialCard key={idx} {...t}/>)}
          </div>
        </div>

        {/* Row 2 — scrolls RIGHT (translateX: -50% → 0) */}
        <div style={{overflow:"hidden"}}>
          <div className="lp-marquee-track lp-marquee-track-r">
            {row2.map((t,idx) => <TestimonialCard key={idx} {...t}/>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main export ─────────────────────────────────────────── */
export default function LandingPage() {
  const [dark, setDark]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob]       = useState(false);
  const [visIdx, setVisIdx] = useState(0);

  /* Inject scoped styles + set body bg */
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "lp-sty";
    el.textContent = LP_CSS;
    document.head.appendChild(el);

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const intv = setInterval(() => setVisIdx(i => (i + 1) % VISITORS.length), 3200);

    return () => {
      document.head.removeChild(el);
      window.removeEventListener("scroll", onScroll);
      clearInterval(intv);
    };
  }, []);

  /* Sync body background with dark mode */
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = dark ? "#070E1C" : "#F7F9FF";
    return () => { document.body.style.backgroundColor = prev; };
  }, [dark]);

  return (
    <div className={`lp${dark ? " dark" : ""}`}>
      <Navbar dark={dark} setDark={setDark} scrolled={scrolled} mob={mob} setMob={setMob}/>

      <AnimatePresence>
        {mob && <MobileMenu key="mob" dark={dark} setDark={setDark} close={() => setMob(false)}/>}
      </AnimatePresence>

      <HeroSection visIdx={visIdx}/>
      <StatsStrip/>
      <FeaturesSection/>
      <DashboardPreview/>
      <VisitorSection/>
      <NotificationsSection/>
      <TestimonialsSection/>
    </div>
  );
}

export { LandingPage };
