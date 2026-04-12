import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Shield, ChevronLeft, ChevronRight, Star,
  Wifi, Calendar, HeadphonesIcon, Sparkles,
  ArrowRight, ChevronDown,
} from "lucide-react";

/* ─── Google Fonts + keyframes ──────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body { background: #0a0907; }

  .font-display { font-family: 'Cormorant Garamond', serif !important; }
  .font-body    { font-family: 'DM Sans', sans-serif !important; }

  @keyframes floatBadge {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%       { transform: translateY(-10px) rotate(1deg); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes shimmerLine {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes scrollPulse {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50%       { transform: translateY(6px); opacity: 0.4; }
  }

  .badge-float   { animation: floatBadge 4s ease-in-out infinite; }
  .shimmer-text  {
    background: linear-gradient(90deg, #c8914a 0%, #f0d49a 40%, #c8914a 60%, #e8c47a 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerLine 3.5s linear infinite;
  }
  .scroll-arrow { animation: scrollPulse 1.6s ease-in-out infinite; }

  /* carousel track */
  .carousel-track {
    display: flex;
    transition: transform 0.7s cubic-bezier(0.77, 0, 0.175, 1);
  }

  /* card hover tilt — done via JS so no class needed */

  /* flip card */
  .flip-container { perspective: 1000px; }
  .flip-inner {
    position: relative;
    transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }
  .flip-container:hover .flip-inner { transform: rotateY(180deg); }
  .flip-front, .flip-back {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 16px;
  }
  .flip-back { transform: rotateY(180deg); }

  /* scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0907; }
  ::-webkit-scrollbar-thumb { background: #3a3028; border-radius: 3px; }

  /* noise overlay on hero */
  .noise::after {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }
`;

/* ─── Apartment photos (Unsplash placeholder URLs) ──────────── */
const SLIDES = [
  { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80", label: "Grand Living Room" },
  { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80", label: "Chef's Kitchen" },
  { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80", label: "Master Bedroom" },
  { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80", label: "Penthouse Exterior" },
  { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80", label: "Rooftop Terrace" },
  { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80", label: "Premium Bath" },
];

/* ─── Feature cards data ──────────────────────────────────────── */
const FEATURES = [
  {
    icon: Wifi,
    title: "Smart Access",
    desc: "QR-code gate entry, visitor pre-registration, and real-time access logs — all from your phone.",
    accent: "#c8914a",
  },
  {
    icon: Calendar,
    title: "Community Events",
    desc: "Book the gym, lounge, or terrace. RSVP to curated resident events and never miss a moment.",
    accent: "#7c9e8c",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    desc: "Raise maintenance tickets, track resolution status, and chat with staff in real time.",
    accent: "#8b7ec8",
  },
  {
    icon: Sparkles,
    title: "Premium Amenities",
    desc: "Concierge services, curated move-in packages, and exclusive resident perks — built in.",
    accent: "#c87a7a",
  },
];

/* ─── Testimonials data ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    unit: "Tower B · Floor 14",
    avatar: "https://i.pravatar.cc/80?img=47",
    stars: 5,
    quote: "AptHive turned our building from a place to sleep into a community I actually love being part of. The app is effortless.",
    back: "The smart access feature alone saved me from the embarrassing 'forgot my key' situation three times last month.",
  },
  {
    name: "Rohan Mehta",
    unit: "Tower A · Floor 8",
    avatar: "https://i.pravatar.cc/80?img=12",
    stars: 5,
    quote: "Booking the gym, paying rent, reporting maintenance — it's all in one place. My building manager is basically superhuman now.",
    back: "I've lived in four buildings. None of them came close to this level of thoughtfulness in the resident experience.",
  },
  {
    name: "Ananya Iyer",
    unit: "Tower C · Penthouse",
    avatar: "https://i.pravatar.cc/80?img=32",
    stars: 5,
    quote: "The notices used to come on paper slips under the door. Now I get them before they're even posted. It's a different world.",
    back: "What I didn't expect was the sense of belonging. The community board feature made me actually know my neighbours.",
  },
];

/* ════════════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 font-body"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        className="mx-auto max-w-6xl mt-4 mx-4 md:mx-auto rounded-2xl flex items-center justify-between px-6 py-3 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(14,11,8,0.88)"
            : "rgba(14,11,8,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(200,145,74,0.14)",
          boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#c8914a,#e8c47a)",
              boxShadow: "0 4px 16px rgba(200,145,74,0.35)",
            }}
          >
            <Shield size={14} color="#0a0907" strokeWidth={2.5} />
          </div>
          <span
            className="font-display text-lg font-semibold tracking-wide"
            style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.05em" }}
          >
            AptHive
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Testimonials"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm font-medium no-underline transition-colors duration-200"
              style={{ color: "rgba(245,240,232,0.5)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.target.style.color = "#c8914a")}
              onMouseLeave={(e) => (e.target.style.color = "rgba(245,240,232,0.5)")}
            >
              {l}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:block text-sm font-medium no-underline transition-colors"
            style={{ color: "rgba(245,240,232,0.55)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.target.style.color = "#f5f0e8")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(245,240,232,0.55)")}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold no-underline px-4 py-2 rounded-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg,#c8914a,#e8c47a)",
              color: "#0a0907",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(200,145,74,0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(200,145,74,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(200,145,74,0.3)")}
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ════════════════════════════════════════════════════════════════
   HERO
════════════════════════════════════════════════════════════════ */
/* ── Hero slide data ─────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    tag: "Premium Living · Reimagined",
    headline: ["Where Every Home", "Becomes a Hive"],
    italicWord: "Becomes a Hive",
    sub: "Smarter access, vibrant community, and seamless living — all in one platform built for modern apartment residents.",
    bg: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80",
    bgPos: "center 30%",
    accent: "#c8914a",
    pill: { value: "500+", label: "Happy Residents" },
  },
  {
    tag: "Community Decisions",
    headline: ["Your Voice,", "Your Community"],
    italicWord: "Your Community",
    sub: "Participate in live polls, vote on society matters, and watch results update in real-time — democracy at your doorstep.",
    bg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80",
    bgPos: "center 40%",
    accent: "#7c6be8",
    pill: { value: "Live", label: "Voting Results" },
  },
  {
    tag: "Events & Announcements",
    headline: ["Stay Connected,", "Stay Informed"],
    italicWord: "Stay Informed",
    sub: "Never miss a society event, maintenance notice, or community update. Everything delivered right to your dashboard.",
    bg: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=80",
    bgPos: "center 50%",
    accent: "#3d9e6e",
    pill: { value: "0", label: "Missed Updates" },
  },
  {
    tag: "Smart Access Control",
    headline: ["Secure Entry,", "Every Time"],
    italicWord: "Every Time",
    sub: "Pre-approve visitors, track guest passes, and manage security staff — all from your phone, anytime, anywhere.",
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    bgPos: "center 35%",
    accent: "#e85d5d",
    pill: { value: "24/7", label: "Security Cover" },
  },
  {
    tag: "Premium Amenities",
    headline: ["World-Class Living,", "Curated for You"],
    italicWord: "Curated for You",
    sub: "Book amenities, manage maintenance requests, and enjoy premium services — all designed around your lifestyle.",
    bg: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
    bgPos: "center 45%",
    accent: "#c8914a",
    pill: { value: "100%", label: "Resident First" },
  },
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const timerRef = useRef(null);

  const goTo = useCallback((idx, dir) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % HERO_SLIDES.length, 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1);
  }, [current, goTo]);

  // Auto-advance every 5s, reset on manual nav
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = HERO_SLIDES[current];

  const variants = {
    enter:  (d) => ({ opacity: 0, x: d > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit:   (d) => ({ opacity: 0, x: d > 0 ? -80 : 80 }),
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background — fades between slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          style={{
            backgroundImage: `url('${slide.bg}')`,
            backgroundSize: "cover",
            backgroundPosition: slide.bgPos,
          }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(to bottom, rgba(10,9,7,0.6) 0%, rgba(10,9,7,0.4) 40%, rgba(10,9,7,0.94) 100%)" }}
      />
      {/* Accent radial glow — changes colour per slide */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`glow-${current}`}
          className="absolute inset-0 z-[2]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 40%, ${slide.accent}18 0%, transparent 70%)`,
          }}
        />
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ paddingTop: "96px" }}>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Headline */}
            <h1
              className="font-display mb-6 leading-none tracking-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(3rem, 8vw, 6.5rem)",
                color: "#f5f0e8",
                fontWeight: 600,
              }}
            >
              {slide.headline[0]}
              <br />
              <span className="shimmer-text italic" style={{
                background: `linear-gradient(90deg, ${slide.accent} 0%, #f0d49a 40%, ${slide.accent} 60%, #e8c47a 100%)`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmerLine 3.5s linear infinite",
              }}>
                {slide.headline[1]}
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="mx-auto mb-10 leading-relaxed"
              style={{
                color: "rgba(245,240,232,0.6)",
                fontSize: "clamp(0.95rem, 2vw, 1.125rem)",
                maxWidth: "520px",
                fontWeight: 300,
              }}
            >
              {slide.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA buttons — static, don't animate per slide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 font-semibold no-underline rounded-xl px-7 py-3.5 transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${slide.accent}, #e8c47a)`,
              color: "#0a0907",
              textDecoration: "none",
              fontSize: "0.95rem",
              boxShadow: `0 6px 28px ${slide.accent}60`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Get Started <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Dot indicators + prev/next */}
        <div className="mt-12 flex items-center justify-center gap-5">
          <button
            onClick={() => { clearInterval(timerRef.current); prev(); }}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: 36, height: 36,
              background: "rgba(245,240,232,0.06)",
              border: "1px solid rgba(245,240,232,0.12)",
              color: "rgba(245,240,232,0.5)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,240,232,0.14)"; e.currentTarget.style.color = "#f5f0e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,240,232,0.06)"; e.currentTarget.style.color = "rgba(245,240,232,0.5)"; }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(timerRef.current); goTo(i, i > current ? 1 : -1); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  background: i === current ? slide.accent : "rgba(245,240,232,0.2)",
                  boxShadow: i === current ? `0 0 8px ${slide.accent}80` : "none",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => { clearInterval(timerRef.current); next(); }}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: 36, height: 36,
              background: "rgba(245,240,232,0.06)",
              border: "1px solid rgba(245,240,232,0.12)",
              color: "rgba(245,240,232,0.5)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,240,232,0.14)"; e.currentTarget.style.color = "#f5f0e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,240,232,0.06)"; e.currentTarget.style.color = "rgba(245,240,232,0.5)"; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <span style={{ color: "rgba(245,240,232,0.3)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Scroll
          </span>
          <ChevronDown size={16} className="scroll-arrow" style={{ color: "rgba(245,240,232,0.3)" }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   FEATURES
   (Carousel removed)
════════════════════════════════════════════════════════════════ */
function _RemovedCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timerRef              = useRef(null);
  const total                 = SLIDES.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  /* 3D tilt on hover */
  function handleMouseMove(e, card) {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
  }
  function handleMouseLeave(card) {
    card.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
  }

  return (
    <section
      id="gallery"
      className="py-20 overflow-hidden"
      style={{ background: "#0d0b09", fontFamily: "'DM Sans', sans-serif" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 px-6"
      >
        <p style={{ color: "#c8914a", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Gallery
        </p>
        <h2
          className="font-display"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#f5f0e8", fontWeight: 600, lineHeight: 1.1 }}
        >
          Spaces Worth Living In
        </h2>
      </motion.div>

      {/* Carousel window */}
      <div className="relative max-w-5xl mx-auto px-12">
        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(200,145,74,0.12)" }}>
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className="min-w-full relative"
                style={{ aspectRatio: "16/7", transition: "transform 0.3s ease" }}
                onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
              >
                <img
                  src={s.url}
                  alt={s.label}
                  className="w-full h-full object-cover"
                  style={{ display: "block" }}
                />
                {/* Label overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-6 py-4"
                  style={{ background: "linear-gradient(to top, rgba(10,9,7,0.8) 0%, transparent 100%)" }}
                >
                  <span
                    className="font-display italic"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "#e8c47a", fontSize: "1.25rem", fontWeight: 500 }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
        {[
          { dir: "prev", action: prev, pos: "left-0" },
          { dir: "next", action: next, pos: "right-0" },
        ].map(({ dir, action, pos }) => (
          <button
            key={dir}
            onClick={action}
            className={`absolute top-1/2 -translate-y-1/2 ${pos} z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200`}
            style={{
              background: "rgba(14,11,8,0.85)",
              border: "1px solid rgba(200,145,74,0.25)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,145,74,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(14,11,8,0.85)")}
          >
            {dir === "prev"
              ? <ChevronLeft  size={18} style={{ color: "#f5f0e8" }} />
              : <ChevronRight size={18} style={{ color: "#f5f0e8" }} />}
          </button>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2.5 mt-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width:        i === current ? "24px" : "8px",
              height:       "8px",
              borderRadius: "4px",
              background:   i === current ? "#c8914a" : "rgba(200,145,74,0.25)",
              border:       "none",
              cursor:       "pointer",
              transition:   "all 0.35s ease",
              padding:      0,
            }}
          />
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   FEATURES
   Cards animate in on scroll (staggered via whileInView)
════════════════════════════════════════════════════════════════ */
function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl p-6 transition-all duration-300"
      style={{
        background:    "rgba(255,255,255,0.03)",
        border:        "1px solid rgba(255,255,255,0.06)",
        backdropFilter:"blur(8px)",
        cursor:        "default",
      }}
      whileHover={{
        y:          -6,
        background: "rgba(255,255,255,0.055)",
        borderColor:"rgba(200,145,74,0.2)",
        transition: { duration: 0.25 },
      }}
    >
      {/* Accent glow */}
      <div
        className="absolute top-0 left-0 w-full h-px rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}55, transparent)` }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
        style={{ background: `${feature.accent}18`, border: `1px solid ${feature.accent}30` }}
      >
        <Icon size={20} style={{ color: feature.accent }} />
      </div>

      <h3
        className="font-display mb-2"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#f5f0e8", fontSize: "1.25rem", fontWeight: 600 }}
      >
        {feature.title}
      </h3>
      <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.9rem", lineHeight: 1.7 }}>
        {feature.desc}
      </p>
    </motion.div>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="py-20 px-6"
      style={{ background: "#0a0907", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p style={{ color: "#c8914a", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Why AptHive
          </p>
          <h2
            className="font-display"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#f5f0e8", fontWeight: 600, lineHeight: 1.15 }}
          >
            Built Around How You Live
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   TESTIMONIALS
   Flip cards + prev/next sliding carousel
════════════════════════════════════════════════════════════════ */
function Stars({ n }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={14} fill="#c8914a" style={{ color: "#c8914a" }} />
      ))}
    </div>
  );
}

function TestimonialFlipCard({ t }) {
  /* glassmorphism dark card — hover reveals back side */
  const glass = {
    background:     "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border:         "1px solid rgba(200,145,74,0.15)",
    boxShadow:      "0 8px 40px rgba(0,0,0,0.35)",
  };

  return (
    <div className="flip-container" style={{ height: "260px" }}>
      <div className="flip-inner" style={{ height: "260px" }}>
        {/* Front */}
        <div className="flip-front p-7" style={glass}>
          <Stars n={t.stars} />
          <p style={{ color: "rgba(245,240,232,0.75)", fontSize: "0.92rem", lineHeight: 1.75, marginBottom: "1.25rem" }}>
            "{t.quote}"
          </p>
          <div className="flex items-center gap-3">
            <img
              src={t.avatar}
              alt={t.name}
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: "2px solid rgba(200,145,74,0.35)" }}
            />
            <div>
              <p style={{ color: "#f5f0e8", fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.2 }}>{t.name}</p>
              <p style={{ color: "rgba(200,145,74,0.7)", fontSize: "0.72rem", marginTop: "2px" }}>{t.unit}</p>
            </div>
          </div>
          {/* Hover hint */}
          <p className="absolute bottom-4 right-5" style={{ color: "rgba(200,145,74,0.35)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
            hover to read more →
          </p>
        </div>

        {/* Back */}
        <div
          className="flip-back p-7 flex flex-col justify-center"
          style={{ ...glass, background: "rgba(200,145,74,0.08)", borderColor: "rgba(200,145,74,0.3)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(200,145,74,0.2)" }}
          >
            <span style={{ color: "#c8914a", fontSize: "1.1rem" }}>"</span>
          </div>
          <p style={{ color: "rgba(245,240,232,0.8)", fontSize: "0.92rem", lineHeight: 1.8, fontStyle: "italic" }}>
            {t.back}
          </p>
          <div className="flex items-center gap-2 mt-5">
            <img src={t.avatar} alt={t.name} className="w-7 h-7 rounded-full object-cover" />
            <span style={{ color: "#c8914a", fontSize: "0.8rem" }}>{t.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const [idx, setIdx] = useState(0);

  return (
    <section
      id="testimonials"
      className="py-20 px-6"
      style={{ background: "#0d0b09", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p style={{ color: "#c8914a", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Residents Love It
          </p>
          <h2
            className="font-display"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#f5f0e8", fontWeight: 600, lineHeight: 1.15 }}
          >
            Heard From the Hive
          </h2>
        </motion.div>

        {/* Flip cards grid — desktop shows all 3, mobile shows one at a time */}
        <div className="hidden md:grid grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
            >
              <TestimonialFlipCard t={t} />
            </motion.div>
          ))}
        </div>

        {/* Mobile: single card with arrows */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <TestimonialFlipCard t={TESTIMONIALS[idx]} />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(200,145,74,0.1)", border: "1px solid rgba(200,145,74,0.25)", cursor: "pointer" }}
            >
              <ChevronLeft size={16} style={{ color: "#c8914a" }} />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <div key={i} style={{ width: i === idx ? "20px" : "6px", height: "6px", borderRadius: "3px", background: i === idx ? "#c8914a" : "rgba(200,145,74,0.25)", transition: "all 0.3s" }} />
              ))}
            </div>
            <button
              onClick={() => setIdx((i) => (i + 1) % TESTIMONIALS.length)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(200,145,74,0.1)", border: "1px solid rgba(200,145,74,0.25)", cursor: "pointer" }}
            >
              <ChevronRight size={16} style={{ color: "#c8914a" }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   CTA FOOTER BANNER
════════════════════════════════════════════════════════════════ */
function CTABanner() {
  return (
    <section
      className="py-16 px-6"
      style={{ background: "#0a0907", fontFamily: "'DM Sans', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="max-w-3xl mx-auto text-center rounded-3xl py-14 px-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(200,145,74,0.12) 0%, rgba(200,145,74,0.04) 100%)",
          border: "1px solid rgba(200,145,74,0.2)",
          boxShadow: "0 0 80px rgba(200,145,74,0.07)",
        }}
      >
        {/* Decorative radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,145,74,0.12) 0%, transparent 70%)" }}
        />

        <p
          className="font-display relative z-10"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   "clamp(2rem, 5vw, 3.25rem)",
            color:      "#f5f0e8",
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}
        >
          Your next chapter starts here.
        </p>
        <p style={{ color: "rgba(245,240,232,0.45)", fontSize: "0.95rem", marginBottom: "2rem" }}>
          Join 500+ residents already living smarter.
        </p>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 font-semibold no-underline rounded-xl px-8 py-4 transition-all duration-200 relative z-10"
          style={{
            background:  "linear-gradient(135deg,#c8914a,#e8c47a)",
            color:       "#0a0907",
            textDecoration: "none",
            fontSize:    "1rem",
            boxShadow:   "0 8px 32px rgba(200,145,74,0.4)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(200,145,74,0.55)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 8px 32px rgba(200,145,74,0.4)"; }}
        >
          Get Started <ArrowRight size={17} />
        </Link>
      </motion.div>

      {/* Footer */}
      <div className="mt-12 text-center" style={{ color: "rgba(245,240,232,0.2)", fontSize: "0.78rem" }}>
        © {new Date().getFullYear()} AptHive · Built for residents who expect more.
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT EXPORT
════════════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <>
      <style>{CSS}</style>
      <div style={{ background: "#0a0907", minHeight: "100vh" }}>
        <Navbar />
        <Hero />
        <Features />
        <Testimonials />
        <CTABanner />
      </div>
    </>
  );
}
