import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Shield, CreditCard, ArrowRight, Play, Building2,
  Bell, Calendar, QrCode, UserCheck, Users,
  ChevronRight, Zap, CheckCircle2, BadgeCheck, Sparkles,
} from "lucide-react";

/* ─── injected keyframes ──────────────────────────────────── */
const CSS = `
  @keyframes marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes floatA   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
  @keyframes floatB   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(8px)} }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
`;

/* ─── shared motion presets ──────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ════════════════════════════════════════════════════════════
   NAVBAR  — glassmorphism floating pill
════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 ${scrolled ? "pt-2" : "pt-4"}`}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-3"
          style={{
            background: "rgba(255,255,255,0.84)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.92)",
            boxShadow: "0 4px 32px rgba(99,102,241,0.07), 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}
            >
              <Shield size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span
              className="font-extrabold text-slate-800 text-[17px] tracking-tight"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              AptHive
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {["Features", "How It Works", "Pricing"].map((l) => (
              <a
                key={l}
                href="#features"
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                style={{ textDecoration: "none" }}
              >
                {l}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-semibold text-slate-500 px-3 py-2 hover:text-slate-800 transition-colors"
              style={{ textDecoration: "none" }}
            >
              Sign in
            </Link>
            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-xl"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.38)",
                  textDecoration: "none",
                }}
              >
                Book a Demo <ChevronRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

/* ════════════════════════════════════════════════════════════
   SMART HUB VISUAL — mouse-responsive 3D tilt + floating cards
   This is the "product preview" on the hero's right side.
   useMotionValue tracks the mouse, useTransform maps it to
   a rotation angle, useSpring smooths the animation.
════════════════════════════════════════════════════════════ */
const HUB_CARDS = [
  { icon: QrCode,     label: "Gate Access",  value: "247 entries today",  color: "#6366f1", style: { top: "10%",    left: "0%" },  anim: "floatA" },
  { icon: Bell,       label: "New Notice",   value: "Water outage · 2PM", color: "#f59e0b", style: { top: "10%",    right: "0%" }, anim: "floatB" },
  { icon: Calendar,   label: "Gym Booked",   value: "Tomorrow · 7 AM",   color: "#06b6d4", style: { bottom: "10%", left: "0%" },  anim: "floatB" },
  { icon: CreditCard, label: "Payment In",   value: "₹3,200 received",   color: "#10b981", style: { bottom: "10%", right: "0%" }, anim: "floatA" },
];

function SmartHub() {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-220, 220], [7, -7]), { stiffness: 110, damping: 24 });
  const rotY = useSpring(useTransform(mx, [-220, 220], [-7, 7]),  { stiffness: 110, damping: 24 });

  function onMove(e) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(e.clientX - (r.left + r.width / 2));
    my.set(e.clientY - (r.top + r.height / 2));
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      className="relative w-full flex items-center justify-center"
      style={{ height: 500, perspective: "1100px" }}
    >
      {/* Ambient glow blob */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.14, 0.26, 0.14] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 320, height: 320, borderRadius: "50%", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, #818cf8 0%, #a78bfa 40%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />

      {/* Tilting container */}
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, width: "100%", height: "100%", position: "absolute", inset: 0 }}
      >
        {/* ── Central hub card ── */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 210,
            borderRadius: 24,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.96)",
            boxShadow: "0 24px 80px rgba(99,102,241,0.22), 0 0 0 1px rgba(99,102,241,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Card header bar */}
          <div style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", padding: "14px 16px 12px" }}>
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 size={14} color="rgba(255,255,255,0.9)" />
              <span className="text-xs font-bold text-white/90">AptHive Hub</span>
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>Society Command Center</p>
          </div>

          {/* Live stats */}
          <div className="px-4 py-3 space-y-2.5">
            {[
              { dot: "#6366f1", label: "3 visitors awaiting entry" },
              { dot: "#10b981", label: "Gym · 7 of 10 slots filled" },
              { dot: "#f59e0b", label: "2 maintenance requests" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-2"
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Today counter */}
          <div className="mx-4 mb-4 flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <span className="text-[10px] text-slate-400 font-semibold">Today's entries</span>
            <span className="text-sm font-extrabold" style={{ color: "#6366f1" }}>47</span>
          </div>

          {/* Pulse rings */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-[24px] pointer-events-none"
              style={{ border: "1px solid rgba(99,102,241,0.22)" }}
              animate={{ scale: [1, 1.08 + i * 0.05], opacity: [0.55, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {/* ── Floating notification cards ── */}
        {HUB_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.45, ease: "backOut" }}
              className="absolute flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{
                ...card.style,
                animation: `${card.anim} ${3.4 + i * 0.4}s ${i * 0.4}s ease-in-out infinite`,
                background: "rgba(255,255,255,0.93)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.96)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)",
                minWidth: 158,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}18` }}
              >
                <Icon size={15} color={card.color} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">{card.label}</p>
                <p className="text-[10px] font-semibold leading-tight mt-0.5" style={{ color: card.color }}>{card.value}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HERO  — split layout, gradient background
════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section
      className="min-h-screen flex items-center pt-24 pb-16 px-6 overflow-hidden"
      style={{ background: "linear-gradient(145deg, #f8fafc 0%, #eef2ff 55%, #f5f3ff 100%)" }}
    >
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* ── Left: text ── */}
        <div>
          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 text-xs font-bold"
            style={{
              background: "rgba(99,102,241,0.09)",
              border: "1px solid rgba(99,102,241,0.18)",
              color: "#6366f1",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulseDot 2s infinite" }} />
            AI-Powered Apartment Management
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.08)}
            className="text-slate-900 font-extrabold leading-[1.07] mb-6"
            style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,4.5vw,60px)", letterSpacing: "-1.2px" }}
          >
            Manage every{" "}
            <span style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              square foot
            </span>
            <br />smarter than ever.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.16)}
            className="text-slate-500 text-lg leading-relaxed max-w-[440px] mb-10"
          >
            AptHive unifies gate security, resident communication, amenity booking,
            and payment tracking — in one intelligent platform your society will actually use.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.22)} className="flex items-center gap-3 flex-wrap mb-12">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 font-bold text-white text-sm px-6 py-3.5 rounded-xl"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: "0 6px 22px rgba(99,102,241,0.42)",
                  textDecoration: "none",
                }}
              >
                Get Started <ArrowRight size={15} />
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                <Play size={10} color="#fff" fill="#fff" />
              </div>
              Watch Video
            </motion.button>
          </motion.div>

          {/* Trust chips */}
          <motion.div {...fadeUp(0.3)} className="flex items-center gap-5 flex-wrap">
            {["Free 30-day trial", "No credit card needed", "Setup in 5 min"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={13} color="#6366f1" />
                <span className="text-xs text-slate-400 font-semibold">{t}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: interactive visual ── */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <SmartHub />
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SOCIAL PROOF — stats + scrolling marquee
════════════════════════════════════════════════════════════ */
const SOCIETIES = [
  "Prestige Lakeside", "Sobha City", "Brigade Orchards", "Godrej Garden City",
  "DLF The Crest", "Lodha Palava", "Puravankara Purva", "Mahindra Happinest",
  "Shapoorji Pallonji", "Kolte Patil Life", "Embassy Springs", "Casagrand Castle",
];

function SocialProof() {
  const doubled = [...SOCIETIES, ...SOCIETIES];
  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">

        {/* Label */}
        <motion.p
          {...revealUp()}
          className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-12"
        >
          Trusted by housing societies across India
        </motion.p>

        {/* Big stats */}
        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto text-center mb-14">
          {[
            { val: "10,000+", label: "Homes Managed" },
            { val: "500+",    label: "Societies Live"  },
            { val: "₹50Cr+", label: "Payments Processed" },
          ].map(({ val, label }, i) => (
            <motion.div key={label} {...revealUp(0.08 * i)}>
              <p
                className="text-3xl font-extrabold text-slate-800 mb-1"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                {val}
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Marquee */}
        <div
          className="overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right,transparent,black 10%,black 90%,transparent)",
            WebkitMaskImage: "linear-gradient(to right,transparent,black 10%,black 90%,transparent)",
          }}
        >
          <div
            className="flex gap-4"
            style={{ width: "max-content", animation: "marquee 38s linear infinite" }}
          >
            {doubled.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <Building2 size={13} color="#94a3b8" />
                <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   BENTO GRID — 5 value-prop cards in bento layout
   Layout on desktop (3 cols):
     [Security · tall]  [Payments] [Amenities]
     [Security · tall]  [Alerts  ] [Roles    ]
════════════════════════════════════════════════════════════ */
const BENTO_CARDS = [
  {
    icon: Shield,
    label: "Automated Gate Security",
    desc: "Visitor pre-registration, OTP passes, QR scanning, and staff schedule enforcement — all in one guard app.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.13)",
    border: "rgba(99,102,241,0.18)",
    bg: "rgba(99,102,241,0.05)",
    points: ["Visitor OTP & QR passes", "Staff schedule enforcement", "Full entry / exit audit log"],
  },
  {
    icon: CreditCard,
    label: "Zero-Friction Payments",
    desc: "Maintenance fee collection, auto-reminders, and digital receipts with a full transaction history.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.13)",
    border: "rgba(16,185,129,0.18)",
    bg: "rgba(16,185,129,0.05)",
    points: [],
  },
  {
    icon: Calendar,
    label: "Smart Amenity Booking",
    desc: "Real-time availability, instant booking, and automatic conflict detection for any shared space.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.13)",
    border: "rgba(6,182,212,0.18)",
    bg: "rgba(6,182,212,0.05)",
    points: [],
  },
  {
    icon: Bell,
    label: "Real-time Alerts",
    desc: "Socket-powered instant notifications for visitor arrivals, maintenance updates, and announcements.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.13)",
    border: "rgba(245,158,11,0.18)",
    bg: "rgba(245,158,11,0.05)",
    points: [],
  },
  {
    icon: Users,
    label: "Multi-role Access",
    desc: "Residents, guards, committee — each role sees exactly what it needs. Nothing more.",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.13)",
    border: "rgba(168,85,247,0.18)",
    bg: "rgba(168,85,247,0.05)",
    points: [],
  },
];

function BentoCard({ card, delay = 0, tall = false }) {
  const [hot, setHot] = useState(false);
  const Icon = card.icon;
  return (
    <motion.div
      {...revealUp(delay)}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      className={`relative rounded-2xl p-6 overflow-hidden cursor-default transition-all duration-300 ${tall ? "h-full" : ""}`}
      style={{
        background: hot ? card.bg : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1.5px solid ${hot ? card.border : "rgba(226,232,240,0.8)"}`,
        boxShadow: hot
          ? `0 16px 52px ${card.glow}, 0 0 0 1px ${card.border}`
          : "0 2px 12px rgba(0,0,0,0.04)",
        transform: hot ? "translateY(-5px)" : "translateY(0)",
      }}
    >
      {/* Icon with spring animation on hover */}
      <motion.div
        animate={hot ? { scale: 1.12, rotate: 6 } : { scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
        style={{ background: card.bg, border: `1px solid ${card.border}` }}
      >
        <Icon size={20} color={card.color} />
      </motion.div>

      <h3
        className="font-bold text-slate-800 mb-2"
        style={{ fontFamily: "'Syne',sans-serif", fontSize: tall ? "19px" : "15.5px" }}
      >
        {card.label}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>

      {/* Bullet points — shown on tall card */}
      {card.points.length > 0 && (
        <ul className="mt-6 space-y-3">
          {card.points.map((pt, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.25 + i * 0.1 }}
              className="flex items-center gap-2.5 text-sm font-semibold text-slate-600"
            >
              <CheckCircle2 size={14} color={card.color} style={{ flexShrink: 0 }} />
              {pt}
            </motion.li>
          ))}
        </ul>
      )}

      {/* Glowing orb on hover */}
      <motion.div
        animate={{ opacity: hot ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${card.color}28, transparent)` }}
      />
    </motion.div>
  );
}

function BentoGrid() {
  return (
    <section id="features" className="py-24 px-6" style={{ background: "#f8fafc" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.p {...revealUp()} className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6366f1" }}>
            Value Proposition
          </motion.p>
          <motion.h2
            {...revealUp(0.08)}
            className="font-extrabold text-slate-900 leading-tight mb-4"
            style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,3.5vw,46px)", letterSpacing: "-0.8px" }}
          >
            Everything your society needs,{" "}
            <span style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              intelligently connected.
            </span>
          </motion.h2>
          <motion.p {...revealUp(0.14)} className="text-slate-500 text-lg max-w-xl mx-auto">
            One platform that replaces five different tools and a hundred WhatsApp messages.
          </motion.p>
        </div>

        {/* Bento layout */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ gridTemplateRows: "auto auto" }}
        >
          {/* Security — tall (spans 2 rows on md+) */}
          <div className="md:row-span-2 flex flex-col">
            <BentoCard card={BENTO_CARDS[0]} delay={0} tall />
          </div>

          {/* Row 1 */}
          <BentoCard card={BENTO_CARDS[1]} delay={0.1} />
          <BentoCard card={BENTO_CARDS[2]} delay={0.18} />

          {/* Row 2 */}
          <BentoCard card={BENTO_CARDS[3]} delay={0.12} />
          <BentoCard card={BENTO_CARDS[4]} delay={0.22} />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FINAL CTA — deep indigo gradient, rotating conic orbs
════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4c1d95 100%)" }}
    >
      {/* Decorative rotating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/4"
          style={{
            width: 600, height: 600, borderRadius: "50%", opacity: 0.09,
            background: "conic-gradient(from 0deg,#818cf8,#a78bfa,#c084fc,#818cf8)",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/4"
          style={{
            width: 520, height: 520, borderRadius: "50%", opacity: 0.09,
            background: "conic-gradient(from 0deg,#06b6d4,#6366f1,#a855f7,#06b6d4)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 420, height: 420, borderRadius: "50%", opacity: 0.18,
            background: "radial-gradient(circle,#818cf8,transparent)",
            filter: "blur(56px)",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          {...revealUp()}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.88)" }}
        >
          <Zap size={12} color="#fbbf24" fill="#fbbf24" />
          Setup your society in under 5 minutes
        </motion.div>

        {/* Headline */}
        <motion.h2
          {...revealUp(0.08)}
          className="font-extrabold text-white leading-tight mb-5"
          style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(30px,4vw,54px)", letterSpacing: "-1px" }}
        >
          Ready to modernize<br />your society?
        </motion.h2>

        {/* Sub */}
        <motion.p
          {...revealUp(0.16)}
          className="text-lg leading-relaxed mb-12 max-w-xl mx-auto"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Join 500+ housing societies that replaced chaos with AptHive.
          No credit card. No setup fee. Just results.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...revealUp(0.24)}
          className="flex items-center justify-center gap-4 flex-wrap mb-12"
        >
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-slate-900"
              style={{
                background: "linear-gradient(135deg,#ffffff,#f0f4ff)",
                boxShadow: "0 10px 36px rgba(0,0,0,0.28)",
                textDecoration: "none",
              }}
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust row */}
        <motion.div
          {...revealUp(0.32)}
          className="flex items-center justify-center gap-8 flex-wrap"
        >
          {["No credit card", "Cancel anytime", "24 / 7 support"].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} color="#818cf8" />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{t}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <Shield size={13} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="font-extrabold text-slate-800 text-base"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            AptHive
          </span>
        </div>
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} AptHive. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors" style={{ textDecoration: "none" }}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════
   ASSEMBLY
════════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <style>{CSS}</style>
      <Navbar />
      <Hero />
      <SocialProof />
      <BentoGrid />
      <FinalCTA />
      <Footer />
    </div>
  );
}
