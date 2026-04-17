/**
 * HeroShowcase — Brutalist split-panel hero for AptHive.
 *
 * Exact recreation of the OUTFIT™ hero layout:
 *   LEFT  : white bg | Bebas Neue headline | black CTA | sliding dot tabs
 *   RIGHT : full-bleed image that cross-fades on tab change
 *
 * Tabs auto-advance every 4 s; clicking a tab resets the timer.
 * Dot indicator slides on the divider line to the active tab (spring animation).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/* ── Fonts ─────────────────────────────────────────────────────── */
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

.hs-cta:hover  { opacity: 0.82; }
.hs-tab-btn    { transition: color 0.25s ease; }
.hs-tab-btn:hover { color: #000 !important; }

@media (max-width: 768px) {
  .hs-split { grid-template-columns: 1fr !important; }
  .hs-right { display: none !important; }
  .hs-left  { padding: 48px 28px !important; }
  .hs-h1    { font-size: 72px !important; }
}
`;

/* ── Tab data ──────────────────────────────────────────────────── */
const TABS = [
  {
    num:   "01",
    label: "Residents",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1400",
    desc:  "Approve guests with one tap, book amenities, and stay informed — all from a single beautiful app.",
  },
  {
    num:   "02",
    label: "Security",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1400",
    desc:  "Live visitor queue, instant gate alerts, and full access control in real time.",
  },
  {
    num:   "03",
    label: "Committee",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400",
    desc:  "Run polls, post announcements, manage events — everything your society needs, unified.",
  },
];

/* ── Component ─────────────────────────────────────────────────── */
export default function HeroShowcase() {
  const [active,  setActive]  = useState(0);
  const [dotLeft, setDotLeft] = useState(null); // px from left of tabs container

  const tabRefs      = useRef([]);   // ref for each tab <button>
  const tabRowRef    = useRef(null); // ref for the tabs row container
  const intervalRef  = useRef(null);

  /* ── inject fonts once ── */
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "hs-fonts";
    el.textContent = FONT_CSS;
    document.head.appendChild(el);
    return () => document.getElementById("hs-fonts")?.remove();
  }, []);

  /* ── measure dot position whenever active tab changes ── */
  useEffect(() => {
    const btn = tabRefs.current[active];
    const row = tabRowRef.current;
    if (!btn || !row) return;

    /*
     * getBoundingClientRect gives viewport-relative coords.
     * Subtracting the row's left gives the offset within the row,
     * then we add half the button width to land at its center.
     */
    const btnRect = btn.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setDotLeft(btnRect.left - rowRect.left + btnRect.width / 2);
  }, [active]);

  /* ── auto-advance every 4 s ── */
  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(
      () => setActive(prev => (prev + 1) % TABS.length),
      4000,
    );
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [startTimer]);

  const handleTab = (i) => {
    setActive(i);
    startTimer(); // reset countdown on manual click
  };

  /* ── render ── */
  return (
    <div
      className="hs-split"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "calc(100vh - 64px)",
        marginTop: 64,          // offset fixed navbar
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
      <div
        className="hs-left"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 72px",
          background: "#fff",
        }}
      >
        {/* ── Giant headline ── */}
        <motion.h1
          className="hs-h1"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: "clamp(68px, 8vw, 108px)",
            fontWeight: 400,      // Bebas Neue is inherently heavy
            lineHeight: 0.95,
            letterSpacing: "1.5px",
            color: "#000",
            margin: "0 0 36px 0",
          }}
        >
          YOUR GATE.<br />
          YOUR PEOPLE.<br />
          YOUR PLATFORM.
        </motion.h1>

        {/* ── CTA button — black rectangle, no border-radius ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
        >
          <Link
            to="/register"
            className="hs-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              background: "#000",
              color: "#fff",
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13.5,
              fontWeight: 500,
              letterSpacing: "0.2px",
              borderRadius: 0,        // sharp corners — matches screenshot exactly
              marginBottom: 44,
              transition: "opacity 0.2s",
            }}
          >
            See how it works <ArrowRight size={13} />
          </Link>
        </motion.div>

        {/* ── Divider line + sliding dot indicator ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          style={{ position: "relative", marginBottom: 0 }}
        >
          {/* The line */}
          <div style={{ width: "100%", height: 1, background: "#ddd" }} />

          {/* Dot — slides along the line to the active tab center */}
          {dotLeft !== null && (
            <motion.div
              animate={{ left: dotLeft }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{
                position: "absolute",
                top: -4,              // vertically centers the 8 px dot on the 1 px line
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#000",
                marginLeft: -4,       // shift left by half so it's centered on dotLeft
              }}
            />
          )}
        </motion.div>

        {/* ── Tab buttons ── */}
        <motion.div
          ref={tabRowRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "14px 0 18px",
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={i}
              ref={el => (tabRefs.current[i] = el)}
              onClick={() => handleTab(i)}
              className="hs-tab-btn"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: i === active ? 600 : 400,
                color: i === active ? "#000" : "#aaa",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                marginRight: 36,
                letterSpacing: "0.1px",
                lineHeight: 1,
              }}
            >
              {tab.num}. {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ── Tab description — cross-fades on change ── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.75,
              color: "#666",
              maxWidth: 380,
              margin: 0,
            }}
          >
            {TABS[active].desc}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ═══════════════════ RIGHT PANEL — full-bleed image ═══════════════════ */}
      <div
        className="hs-right"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={TABS[active].image}
            src={TABS[active].image}
            alt={TABS[active].label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </AnimatePresence>

        {/*
         * Progress bar at the bottom of the image —
         * thin black line that fills over 4 s then resets,
         * giving a visual cue that the slide is about to advance.
         */}
        <motion.div
          key={active}                       // remounts on every tab change → restarts animation
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 4, ease: "linear" }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(255,255,255,0.85)",
            transformOrigin: "left center",
          }}
        />
      </div>
    </div>
  );
}
