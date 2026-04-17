/**
 * FeaturesSection — vertical carousel for AptHive.
 *
 * Each feature slide enters from the TOP and exits DOWNWARD,
 * like pages being dealt from the top of a deck.
 *
 * LEFT  : badge | giant faded number | headline | desc | progress dots
 * RIGHT : live UI animation panel specific to each feature
 *
 * Auto-advances every 4 s; clicking a dot resets the timer.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, X, Shield, BarChart3, Calendar, Clock,
} from "lucide-react";

/* ── Shared tiny helpers ────────────────────────────────────── */
const Pill = ({ children, color, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 13px", borderRadius: 100,
    background: bg, color, fontSize: 11, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    border: `1px solid ${color}30`,
  }}>{children}</span>
);

const LiveDot = ({ color = "#22C55E" }) => (
  <span style={{
    width: 6, height: 6, borderRadius: "50%", background: color,
    display: "inline-block", flexShrink: 0,
    animation: "fs-pulse 1.6s ease-in-out infinite",
  }}/>
);

/* ── CSS injected once ──────────────────────────────────────── */
const FS_CSS = `
@keyframes fs-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.5)} }
@media (max-width:900px) {
  .fs-split { flex-direction:column !important; }
  .fs-right { min-height:380px !important; }
  .fs-left  { width:100% !important; padding:48px 32px !important; border-right:none !important; border-bottom:1px solid #E2E8F0 !important; }
  .fs-num   { font-size:140px !important; top:-20px !important; }
}
`;

/* ══════════════════════════════════════════════════════════════
   ANIMATION PANELS
══════════════════════════════════════════════════════════════ */

/* — 1. Guest Approval ─────────────────────────────────────── */
function ApprovalPanel() {
  const [phase, setPhase] = useState(0); // 0=idle, 1=tapping, 2=approved

  useEffect(() => {
    const ts = [];
    const loop = () => {
      setPhase(0);
      ts.push(setTimeout(() => setPhase(1), 2000));
      ts.push(setTimeout(() => setPhase(2), 2700));
      ts.push(setTimeout(loop, 5500));
    };
    loop();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360, width: "100%" }}>
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          boxShadow: "0 8px 40px rgba(37,99,235,.15), 0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid rgba(37,99,235,.12)",
        }}
      >
        <div style={{ background: "#2563EB", padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={14} color="#fff" />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, flex: 1 }}>AptHive</span>
          <LiveDot /><span style={{ color: "rgba(255,255,255,.75)", fontSize: 11 }}>Live</span>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Visitor at Gate 1 · Just now</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#F8FAFC", borderRadius: 12, marginBottom: 14, border: "1px solid #E2E8F0" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0, border: "2px solid #DBEAFE" }}>RS</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Rahul Sharma</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Flat A-204 · Guest</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#16A34A", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Now
            </div>
          </div>
          <AnimatePresence mode="wait">
            {phase < 2 ? (
              <motion.div key="btns" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: "flex", gap: 10 }}>
                <motion.button
                  animate={phase === 1 ? { scale: [1, 0.92, 1.06, 1] } : {}}
                  transition={{ duration: 0.45 }}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: "#DCFCE7", color: "#16A34A", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <CheckCircle size={14} /> Approve
                </motion.button>
                <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: "#FEE2E2", color: "#DC2626", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <X size={14} /> Deny
                </button>
              </motion.div>
            ) : (
              <motion.div key="ok" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{ background: "#DCFCE7", borderRadius: 12, padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#16A34A", fontWeight: 700, fontSize: 14 }}>
                <CheckCircle size={16} /> Gate Opened — Visitor Approved!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ alignSelf: "flex-end", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,.08)", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
        <span style={{ fontSize: 16 }}>📦</span> Delivery at Gate 2
      </motion.div>
    </div>
  );
}

/* — 2. Live Visitor Queue ──────────────────────────────────── */
const QUEUE_ROWS = [
  { init: "RS", bg: "#EFF6FF", fg: "#2563EB", name: "Rahul Sharma",    flat: "A-204", type: "Guest",         time: "09:42" },
  { init: "PD", bg: "#FEF9C3", fg: "#D97706", name: "Swiggy Delivery", flat: "B-101", type: "Food",          time: "09:38" },
  { init: "PM", bg: "#F5F3FF", fg: "#7C3AED", name: "Priya Mehta",     flat: "C-302", type: "Guest",         time: "09:31" },
  { init: "UK", bg: "#FEE2E2", fg: "#DC2626", name: "Unknown Caller",  flat: "Gate",  type: "Unregistered",  time: "09:25" },
];
const STATUS_CYCLE = [
  { label: "Waiting",  bg: "#FEF9C3", color: "#D97706" },
  { label: "Approved", bg: "#DCFCE7", color: "#16A34A" },
  { label: "Denied",   bg: "#FEE2E2", color: "#DC2626" },
];

function QueuePanel() {
  const [activeRow, setActiveRow] = useState(0);
  const [statuses, setStatuses]   = useState([0, 1, 2, 0]);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveRow(r => {
        const next = (r + 1) % QUEUE_ROWS.length;
        setStatuses(prev => prev.map((s, i) => i === next ? (s + 1) % 3 : s));
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(220,38,38,.12), 0 2px 8px rgba(0,0,0,.05)", border: "1px solid rgba(220,38,38,.1)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>Security Hub</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
            <LiveDot /> Live
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #F1F5F9" }}>
          {[{ l: "Today", v: "127", c: "#DC2626" }, { l: "Pending", v: "4", c: "#D97706" }, { l: "Cleared", v: "123", c: "#16A34A" }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "12px 14px", borderRight: i < 2 ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Visitor Queue</div>
          {QUEUE_ROWS.map((row, i) => {
            const st = STATUS_CYCLE[statuses[i]];
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, background: activeRow === i ? "#F8FAFC" : "transparent" }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, marginBottom: i < 3 ? 4 : 0, border: `1px solid ${activeRow === i ? "#E2E8F0" : "transparent"}`, transition: "all 0.3s" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: row.bg, color: row.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{row.init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>Flat {row.flat} · {row.type}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "#94A3B8", display: "flex", alignItems: "center", gap: 2 }}><Clock size={9} />{row.time}</span>
                  <motion.span animate={{ background: st.bg, color: st.color }} transition={{ duration: 0.35 }}
                    style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 100 }}>{st.label}</motion.span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* — 3. Community Polls ─────────────────────────────────────── */
function PollPanel() {
  const [drawn, setDrawn] = useState(false);
  const [votes, setVotes] = useState(247);
  const [voted, setVoted] = useState(null);
  const OPTS = [
    { label: "Yes — build them",        pct: 68, color: "#059669" },
    { label: "No — other priorities",   pct: 32, color: "#64748B" },
  ];

  useEffect(() => {
    const ts = [];
    const loop = () => {
      setDrawn(false); setVoted(null); setVotes(247);
      ts.push(setTimeout(() => setDrawn(true), 300));
      ts.push(setTimeout(() => { setVoted(0); setVotes(v => v + 1); }, 3200));
      ts.push(setTimeout(loop, 6500));
    };
    loop();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ maxWidth: 380, width: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(5,150,105,.12), 0 2px 8px rgba(0,0,0,.05)", border: "1px solid rgba(5,150,105,.12)", overflow: "hidden" }}>
        <div style={{ background: "#059669", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <BarChart3 size={14} color="#fff" />
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Community Poll · 3 days left</span>
          </div>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>Should we add new benches to the community park?</div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {OPTS.map((opt, i) => (
            <div key={i} style={{ marginBottom: i === 0 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: voted === i ? 700 : 500, color: "#0F172A" }}>{opt.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: opt.color }}>
                  {voted !== null && i === 0 ? opt.pct + 1 : voted !== null && i === 1 ? opt.pct - 1 : opt.pct}%
                </span>
              </div>
              <div style={{ height: 10, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: drawn ? `${voted !== null && i === 0 ? opt.pct + 1 : voted !== null && i === 1 ? opt.pct - 1 : opt.pct}%` : 0 }}
                  transition={{ duration: 0.9, delay: drawn ? i * 0.15 : 0, ease: [0.22, 0.68, 0, 1.1] }}
                  style={{ height: "100%", borderRadius: 6, background: opt.color }}
                />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              <span style={{ fontWeight: 700, color: "#059669" }}>{votes}</span> residents voted
            </div>
            <AnimatePresence>
              {voted !== null && (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#059669", padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle size={11} /> Vote counted!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ marginTop: 12, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 16px rgba(0,0,0,.06)" }}>
        <span style={{ fontSize: 18 }}>🎉</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Society Fest 2026</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>April 20 · Clubhouse · 6:00 PM</div>
        </div>
        <div style={{ marginLeft: "auto", background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>RSVP</div>
      </motion.div>
    </div>
  );
}

/* — 4. Amenity Booking ─────────────────────────────────────── */
const SLOTS   = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm"];
const BOOKED_IDX = [1, 4];

function BookingPanel() {
  const [sel, setSel]        = useState(2);
  const [confirmed, setConf] = useState(false);

  useEffect(() => {
    const ts = [];
    const loop = () => {
      setSel(2); setConf(false);
      ts.push(setTimeout(() => setSel(5), 1800));
      ts.push(setTimeout(() => setConf(true), 3200));
      ts.push(setTimeout(loop, 6200));
    };
    loop();
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ maxWidth: 380, width: "100%" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(124,58,237,.13), 0 2px 8px rgba(0,0,0,.05)", border: "1px solid rgba(124,58,237,.12)", overflow: "hidden" }}>
        <div style={{ background: "#7C3AED", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏊</span>
          <div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>Swimming Pool</div>
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 11 }}>Wed, Apr 16 · Book a slot</div>
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {[{ e: "🏊", l: "Pool", a: true }, { e: "🏋️", l: "Gym", a: false }, { e: "🎾", l: "Tennis", a: false }, { e: "🧘", l: "Yoga", a: false }].map((am, i) => (
              <div key={i} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: am.a ? "#7C3AED" : "#F8FAFC", color: am.a ? "#fff" : "#64748B", border: `1px solid ${am.a ? "#7C3AED" : "#E2E8F0"}` }}>
                {am.e} {am.l}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Pick a time</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {SLOTS.map((s, i) => {
              const isBooked = BOOKED_IDX.includes(i);
              const isSel    = sel === i;
              return (
                <motion.div key={i}
                  animate={{ background: isBooked ? "#F1F5F9" : isSel ? "#7C3AED" : "#fff", color: isBooked ? "#CBD5E1" : isSel ? "#fff" : "#0F172A", borderColor: isBooked ? "#E2E8F0" : isSel ? "#7C3AED" : "#E2E8F0" }}
                  transition={{ duration: 0.25 }}
                  onClick={() => !isBooked && setSel(i)}
                  style={{ padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1.5px solid", cursor: isBooked ? "not-allowed" : "pointer", opacity: isBooked ? 0.5 : 1 }}>
                  {s}
                </motion.div>
              );
            })}
          </div>
          <div style={{ background: "#F5F3FF", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={14} color="#7C3AED" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>🏊 Swimming Pool</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Wed, Apr 16 · {SLOTS[sel]}</div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {!confirmed ? (
              <motion.button key="cta" whileTap={{ scale: 0.97 }} onClick={() => setConf(true)}
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: "#7C3AED", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Calendar size={14} /> Confirm Booking
              </motion.button>
            ) : (
              <motion.div key="done" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{ background: "#DCFCE7", borderRadius: 12, padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#16A34A", fontWeight: 700, fontSize: 13 }}>
                <CheckCircle size={15} /> Booking Confirmed! ✓
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURE DATA
══════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    num: "01", badge: "Residents", accent: "#2563EB", accentBg: "#EFF6FF",
    heading: ["Approve visitors", "with one tap"],
    desc: "Get instant alerts when guests arrive. See their photo, approve or deny — right from your phone, anywhere in the world.",
    Panel: ApprovalPanel,
  },
  {
    num: "02", badge: "Security", accent: "#DC2626", accentBg: "#FEE2E2",
    heading: ["Full gate control", "in real time"],
    desc: "Security sees every visitor in a live queue with timestamps. Zero paperwork, zero delays — just clear decisions.",
    Panel: QueuePanel,
  },
  {
    num: "03", badge: "Committee", accent: "#059669", accentBg: "#DCFCE7",
    heading: ["Run your society,", "beautifully"],
    desc: "Post announcements, run transparent polls, manage events — everything your community needs, unified in one dashboard.",
    Panel: PollPanel,
  },
  {
    num: "04", badge: "Amenities", accent: "#7C3AED", accentBg: "#F5F3FF",
    heading: ["Book club facilities", "in seconds"],
    desc: "Pool, gym, banquet hall — residents book slots instantly. Committees manage capacity with zero double-bookings.",
    Panel: BookingPanel,
  },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function FeaturesSection() {
  const [active, setActive] = useState(0);
  const [dir,    setDir]    = useState(1);
  const intervalRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "fs-sty"; el.textContent = FS_CSS;
    document.head.appendChild(el);
    return () => document.getElementById("fs-sty")?.remove();
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDir(1);
      setActive(prev => (prev + 1) % FEATURES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [startTimer]);

  const goTo = (i) => {
    setDir(i > active ? 1 : -1);
    setActive(i);
    startTimer();
  };

  const feat = FEATURES[active];

  const variants = {
    initial: (d) => ({ y: d > 0 ? "-100%" : "100%", opacity: 0 }),
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 240, damping: 30, mass: 0.9 } },
    exit:    (d) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } }),
  };

  return (
    <section style={{ background: "#F8F9FA", padding: "100px 0", overflow: "hidden", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Section label */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
          Platform Features
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 400, letterSpacing: "1.5px", color: "#0F172A", lineHeight: 1, margin: 0 }}>
          EVERYTHING YOUR<br />COMMUNITY NEEDS
        </h2>
      </div>

      {/* Carousel shell */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 16px 64px rgba(15,23,42,.1)", minHeight: 520 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={active}
              custom={dir}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fs-split"
              style={{ display: "flex", minHeight: 520 }}
            >
              {/* LEFT — text panel */}
              <div className="fs-left" style={{
                width: "45%", flexShrink: 0, background: "#fff",
                padding: "60px 64px", display: "flex", flexDirection: "column",
                justifyContent: "center", position: "relative", overflow: "hidden",
                borderRight: "1px solid #E2E8F0",
              }}>
                {/* Giant faded number */}
                <div className="fs-num" style={{
                  position: "absolute", top: -10, left: -10,
                  fontSize: 200, fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontWeight: 400, color: "#F1F5F9", lineHeight: 1,
                  userSelect: "none", pointerEvents: "none", letterSpacing: "-4px",
                }}>
                  {feat.num}
                </div>

                {/* Badge */}
                <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
                  <Pill color={feat.accent} bg={feat.accentBg}>
                    <LiveDot color={feat.accent} /> {feat.badge}
                  </Pill>
                </div>

                {/* Headline */}
                <h3 style={{
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: "clamp(40px, 4vw, 58px)", fontWeight: 400,
                  lineHeight: 1.0, letterSpacing: "1px", color: "#0F172A",
                  margin: "0 0 24px 0", position: "relative", zIndex: 1,
                }}>
                  {feat.heading[0]}<br />{feat.heading[1]}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#64748B", maxWidth: 380, margin: "0 0 44px 0", position: "relative", zIndex: 1 }}>
                  {feat.desc}
                </p>

                {/* Progress dots */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", position: "relative", zIndex: 1 }}>
                  {FEATURES.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} style={{
                      width: i === active ? 28 : 8, height: 8, borderRadius: 100,
                      border: "none", cursor: "pointer", padding: 0,
                      background: i === active ? feat.accent : "#CBD5E1",
                      transition: "all 0.35s ease",
                    }} />
                  ))}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                    {active + 1} / {FEATURES.length}
                  </span>
                </div>
              </div>

              {/* RIGHT — animation panel */}
              <div className="fs-right" style={{
                flex: 1, background: "#F8F9FA",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "48px 40px", position: "relative", overflow: "hidden",
              }}>
                {/* Dot grid texture */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.4, pointerEvents: "none" }} />
                {/* Accent blob */}
                <div style={{ position: "absolute", top: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${feat.accent}12 0%, transparent 70%)`, pointerEvents: "none", transition: "background 0.6s" }} />
                <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
                  <feat.Panel />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
