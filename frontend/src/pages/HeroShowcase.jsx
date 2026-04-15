/**
 * HeroShowcase — rotating feature showcase for the AptHive landing page.
 * Drop-in replacement for the <motion.div className="lp-hero-r"> block.
 *
 * 5 cards auto-advance every 3.5 s with a 3-D Y-axis flip.
 * Indicator dots below jump to any card on click.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Bell, BarChart2, Calendar, LayoutGrid,
  CheckCircle, X, Package,
} from "lucide-react";

/* ─── Keyframes injected once ─────────────────────────────────── */
const HS_CSS = `
@keyframes hs-float-a{
  0%,100%{transform:translateY(0) rotate(-.4deg)}
  50%{transform:translateY(-9px) rotate(.7deg)}
}
@keyframes hs-float-b{
  0%,100%{transform:translateY(0) rotate(.4deg)}
  50%{transform:translateY(-7px) rotate(-.9deg)}
}
@keyframes hs-live{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.28;transform:scale(1.6)}
}
`;

/* ─── Shared style helpers ─────────────────────────────────────── */
const cardShell = {
  width: "100%", height: "100%",
  background: "#fff", borderRadius: 20,
  boxShadow: "0 4px 20px rgba(15,23,42,.08),0 20px 48px rgba(15,23,42,.08)",
  padding: 20, display: "flex", flexDirection: "column", gap: 14,
  overflow: "hidden",
};

const row = (justify = "flex-start", gap = 8) => ({
  display: "flex", alignItems: "center", justifyContent: justify, gap,
});

const label10 = {
  fontSize: 10.5, fontWeight: 800, color: "#0F172A",
  textTransform: "uppercase", letterSpacing: ".8px",
};

const iconBtn = (bg, color) => ({
  width: 30, height: 30, borderRadius: 9, background: bg, border: "none",
  cursor: "pointer", display: "flex", alignItems: "center",
  justifyContent: "center", color,
});

function IconBox({ color, children }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </div>
  );
}

function LiveBadge({ color, bg, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5, background: bg,
      padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: color,
        animation: "hs-live 1.6s ease-in-out infinite",
      }} />
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 1 — Security Hub
═══════════════════════════════════════════════════════════════ */
const VISITORS = [
  { name: "Rahul Sharma",   flat: "A-204", type: "Guest",    bg: "#EFF6FF", fg: "#2563EB", i: "RS" },
  { name: "Swiggy Delivery", flat: "B-101", type: "Delivery", bg: "#FEF9C3", fg: "#D97706", i: "SW" },
  { name: "Priya Mehta",    flat: "C-302", type: "Guest",    bg: "#F5F3FF", fg: "#7C3AED", i: "PM" },
  { name: "Amazon",         flat: "A-105", type: "Delivery", bg: "#DCFCE7", fg: "#16A34A", i: "AM" },
];

function SecurityCard() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % 4), 2000);
    return () => clearInterval(t);
  }, []);
  const vis = VISITORS[idx];

  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={row("space-between")}>
        <div style={row("flex-start", 9)}>
          <IconBox color="#2563EB"><Shield size={16} color="#fff" /></IconBox>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Security Hub</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Visitor Management</div>
          </div>
        </div>
        <LiveBadge color="#16A34A" bg="#DCFCE7" label="Live" />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { l: "Today",   v: "127", c: "#2563EB", bg: "#EFF6FF" },
          { l: "Pending", v: "4",   c: "#D97706", bg: "#FEF9C3" },
          { l: "Online",  v: "89",  c: "#16A34A", bg: "#DCFCE7" },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "#64748B", marginTop: 3, fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Queue label */}
      <div style={row("space-between")}>
        <span style={label10}>Visitor Queue</span>
        <span style={{ fontSize: 10, background: "#F1F5F9", color: "#64748B", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
          4 waiting
        </span>
      </div>

      {/* Animated visitor row */}
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ x: 28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -28, opacity: 0 }}
          transition={{ duration: .28, ease: [.2, .8, .2, 1] }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: vis.bg, color: vis.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
            {vis.i}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vis.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Flat {vis.flat} · {vis.type}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button style={iconBtn("#DCFCE7", "#16A34A")}><CheckCircle size={13} /></button>
            <button style={iconBtn("#FEE2E2", "#DC2626")}><X size={13} /></button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mini bar chart */}
      <div>
        <div style={{ ...label10, marginBottom: 8 }}>Traffic Today</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
          {[.25,.42,.58,.34,.80,.54,.70,.94,.62,.50,.37,.54,.72,.44].map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: "3px 3px 0 0", minHeight: 3,
              background: `rgba(37,99,235,${.14 + h * .6})`,
              height: `${h * 100}%`,
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["6am","9am","12pm","3pm","6pm","9pm"].map(t => (
            <span key={t} style={{ fontSize: 9, color: "#94A3B8" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 2 — Community Polls
═══════════════════════════════════════════════════════════════ */
const POLL_OPTS = [
  { label: "Swimming Pool", pct: 68, color: "#2563EB", leading: true  },
  { label: "Gym",           pct: 52, color: "#16A34A", leading: false },
  { label: "Clubhouse",     pct: 34, color: "#7C3AED", leading: false },
  { label: "Parking",       pct: 21, color: "#D97706", leading: false },
];

function PollBar({ opt, delay }) {
  return (
    <div>
      <div style={row("space-between", 6)}>
        <div style={row("flex-start", 6)}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>{opt.label}</span>
          {opt.leading && (
            <span style={{ fontSize: 9.5, fontWeight: 700, background: "#FEF9C3", color: "#D97706", padding: "2px 7px", borderRadius: 100 }}>
              🏆 Leading
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: opt.color }}>{opt.pct}%</span>
      </div>
      <div style={{ height: 7, background: "#F1F5F9", borderRadius: 100, overflow: "hidden", marginTop: 5 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${opt.pct}%` }}
          transition={{ duration: .9, delay, ease: [.2, .8, .2, 1] }}
          style={{ height: "100%", background: opt.color, borderRadius: 100 }}
        />
      </div>
    </div>
  );
}

function PollsCard() {
  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={row("space-between")}>
        <div style={row("flex-start", 9)}>
          <IconBox color="#7C3AED"><BarChart2 size={16} color="#fff" /></IconBox>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Community Polls</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Resident voting</div>
          </div>
        </div>
        <LiveBadge color="#7C3AED" bg="#F5F3FF" label="3 Active" />
      </div>

      {/* Question banner */}
      <div style={{ background: "linear-gradient(135deg,#F5F3FF 0%,#EFF6FF 100%)", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 5 }}>
          Active Poll
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", lineHeight: 1.4 }}>
          Which amenity should we upgrade first?
        </div>
      </div>

      {/* Animated bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {POLL_OPTS.map((opt, i) => <PollBar key={opt.label} opt={opt} delay={i * .12} />)}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          <b style={{ color: "#0F172A" }}>247</b> residents voted
        </span>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>Ends in 2 days</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 3 — Announcements
═══════════════════════════════════════════════════════════════ */
const ANN_DATA = [
  { title: "Water Supply Shutdown", desc: "Maintenance on 18th Apr, 9am–1pm", time: "2h ago",  color: "#DC2626", bg: "#FEE2E2", tag: "Urgent"  },
  { title: "Society Fest 2026",     desc: "Cultural evening on April 20th",   time: "5h ago",  color: "#2563EB", bg: "#EFF6FF", tag: "Info"    },
  { title: "Parking Reminder",      desc: "Visitor parking rules update",      time: "1d ago",  color: "#D97706", bg: "#FEF9C3", tag: "Warning" },
  { title: "Lift Maintenance",      desc: "Block C lift out of service Apr 19",time: "3h ago",  color: "#7C3AED", bg: "#F5F3FF", tag: "Notice"  },
];

function AnnouncementsCard() {
  const [offset, setOffset] = useState(0);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setOffset(o => (o + 1) % ANN_DATA.length);
      setCycle(c => c + 1);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const visible = [0, 1, 2].map(i => ANN_DATA[(offset + i) % ANN_DATA.length]);

  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={row("space-between")}>
        <div style={row("flex-start", 9)}>
          <IconBox color="#DC2626"><Bell size={16} color="#fff" /></IconBox>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Announcements</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Society notices</div>
          </div>
        </div>
        <span style={{ background: "#FEE2E2", padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
          3 new
        </span>
      </div>

      {/* Announcement list — item 0 slides in from top each cycle */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, overflow: "hidden" }}>
        {visible.map((ann, i) => (
          <motion.div
            key={`${cycle}-${i}`}
            initial={{ y: i === 0 ? -38 : 4, opacity: i === 0 ? 0 : .55 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: .38, delay: i * .06, ease: [.2, .8, .2, 1] }}
            style={{
              display: "flex", flexDirection: "column", gap: 3,
              padding: "11px 13px", background: "#F8FAFC", borderRadius: 13,
              border: "1px solid #E2E8F0", borderLeft: `3px solid ${ann.color}`,
              flexShrink: 0,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ann.title}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 700, background: ann.bg, color: ann.color, padding: "2px 6px", borderRadius: 5, flexShrink: 0 }}>
                {ann.tag}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B" }}>{ann.desc}</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>{ann.time}</div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
        <span style={{ fontSize: 11, color: "#64748B" }}>Society bulletin board</span>
        <button style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
          View All
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 4 — Events
═══════════════════════════════════════════════════════════════ */
const DATE_STRIP = [
  { d: "15", day: "M" }, { d: "16", day: "T" }, { d: "17", day: "W" },
  { d: "18", day: "T" }, { d: "19", day: "F" }, { d: "20", day: "S" }, { d: "21", day: "S" },
];

function EventsCard() {
  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={row("space-between")}>
        <div style={row("flex-start", 9)}>
          <IconBox color="#0F172A"><Calendar size={16} color="#fff" /></IconBox>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Upcoming Events</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>April 2026</div>
          </div>
        </div>
        <span style={{ background: "#0F172A", padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: ".5px" }}>
          APR
        </span>
      </div>

      {/* Date strip */}
      <div style={{ display: "flex", gap: 4, justifyContent: "space-between", padding: "4px 0" }}>
        {DATE_STRIP.map(({ d, day }) => {
          const active = d === "20";
          return (
            <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>{day}</span>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "#2563EB" : "transparent",
                color: active ? "#fff" : "#0F172A",
                fontSize: 12, fontWeight: active ? 800 : 500,
                boxShadow: active ? "0 4px 12px rgba(37,99,235,.35)" : "none",
              }}>
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Event 1 — pulsing RSVP */}
        <div style={{ padding: "14px 15px", background: "linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)", borderRadius: 16, border: "1px solid rgba(37,99,235,.15)" }}>
          <div style={row("space-between", 8)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 5 }}>Society Annual Meet</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", fontSize: 11, color: "#64748B" }}>
                <span>📅 April 20</span><span>📍 Clubhouse</span><span>🕕 6:00 PM</span>
              </div>
            </div>
            <motion.button
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ padding: "8px 13px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,.35)", fontFamily: "inherit" }}>
              RSVP
            </motion.button>
          </div>
        </div>

        {/* Event 2 */}
        <div style={{ padding: "14px 15px", background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <div style={row("space-between", 8)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 5 }}>Yoga Morning Session</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", fontSize: 11, color: "#64748B" }}>
                <span>📅 April 22</span><span>📍 Terrace Garden</span><span>🕖 7:00 AM</span>
              </div>
            </div>
            <button style={{ padding: "8px 13px", background: "transparent", color: "#2563EB", border: "1.5px solid #2563EB", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
              RSVP
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: 10, borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "#64748B" }}>
          🎉 <b style={{ color: "#0F172A" }}>12 residents</b> already RSVP'd for Annual Meet
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 5 — Amenities Booking
═══════════════════════════════════════════════════════════════ */
const ALL_SLOTS = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm"];
const BOOKED_SET = new Set(["8am", "2pm"]);
const FREE_SLOTS  = ALL_SLOTS.filter(s => !BOOKED_SET.has(s));

function AmenitiesCard() {
  const [hlIdx, setHlIdx]   = useState(0);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (picked !== null) return;
    const t = setInterval(() => setHlIdx(i => (i + 1) % FREE_SLOTS.length), 1500);
    return () => clearInterval(t);
  }, [picked]);

  return (
    <div style={cardShell}>
      {/* Header */}
      <div style={row("space-between")}>
        <div style={row("flex-start", 9)}>
          <IconBox color="#16A34A"><LayoutGrid size={16} color="#fff" /></IconBox>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Amenities</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Book a slot</div>
          </div>
        </div>
        <span style={{ background: "#DCFCE7", padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
          Available
        </span>
      </div>

      {/* Amenity tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { icon: "🏊", label: "Swimming\nPool",  active: true  },
          { icon: "🏋️", label: "Gym",             active: false },
          { icon: "🎾", label: "Tennis\nCourt",   active: false },
        ].map(a => (
          <div key={a.label} style={{
            padding: "12px 8px", borderRadius: 14, textAlign: "center", cursor: "pointer",
            background: a.active ? "#EFF6FF" : "#F8FAFC",
            border: `1.5px solid ${a.active ? "#DBEAFE" : "#E2E8F0"}`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: a.active ? "#2563EB" : "#64748B", lineHeight: 1.3, whiteSpace: "pre-line" }}>
              {a.label}
            </div>
          </div>
        ))}
      </div>

      {/* Time-slot picker */}
      <div>
        <div style={{ ...label10, marginBottom: 10 }}>🏊 Swimming Pool · Apr 20</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ALL_SLOTS.map(slot => {
            const booked      = BOOKED_SET.has(slot);
            const highlighted = !booked && FREE_SLOTS[hlIdx] === slot && picked === null;
            const selected    = picked === slot;
            return (
              <motion.button
                key={slot}
                onClick={() => !booked && setPicked(slot)}
                animate={{
                  backgroundColor: selected  ? "#16A34A"
                                 : highlighted ? "#2563EB"
                                 : booked      ? "#F1F5F9"
                                 : "#F8FAFC",
                  color: selected || highlighted ? "#fff" : booked ? "#CBD5E1" : "#0F172A",
                  scale: highlighted ? 1.06 : 1,
                  boxShadow: selected    ? "0 4px 12px rgba(22,163,74,.4)"
                           : highlighted ? "0 4px 12px rgba(37,99,235,.4)"
                           : "0 0 0 rgba(0,0,0,0)",
                }}
                transition={{ duration: .22 }}
                style={{
                  padding: "7px 11px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                  fontSize: 12, fontWeight: 600, cursor: booked ? "not-allowed" : "pointer",
                  textDecoration: booked ? "line-through" : "none",
                  fontFamily: "inherit",
                }}>
                {slot}
              </motion.button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "#94A3B8" }}>
          <span style={{ width: 10, height: 10, display: "inline-block", borderRadius: 3, background: "#F1F5F9", border: "1px solid #E2E8F0" }} />
          <span>Greyed = already booked</span>
        </div>
      </div>

      {/* Confirm button */}
      <div style={{ marginTop: "auto" }}>
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: "0 6px 20px rgba(37,99,235,.45)" }}
          whileTap={{ scale: .98 }}
          style={{
            width: "100%", padding: "13px", background: "#2563EB", color: "#fff",
            border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,.35)", fontFamily: "inherit",
          }}>
          Confirm Booking
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Card registry + flip variants
═══════════════════════════════════════════════════════════════ */
const CARDS = [
  { id: "security",   component: SecurityCard      },
  { id: "polls",      component: PollsCard         },
  { id: "announce",   component: AnnouncementsCard },
  { id: "events",     component: EventsCard        },
  { id: "amenities",  component: AmenitiesCard     },
];

/* 3-D Y-axis flip: forward → exit right, enter from left */
const flipV = {
  enter: d => ({ rotateY: d > 0 ? -90 : 90, opacity: 0, scale: .96 }),
  center: {
    rotateY: 0, opacity: 1, scale: 1,
    transition: { duration: .52, ease: [.2, .8, .2, 1] },
  },
  exit: d => ({
    rotateY: d > 0 ? 90 : -90, opacity: 0, scale: .96,
    transition: { duration: .42, ease: [.8, .2, .8, 1] },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   HeroShowcase — main export
═══════════════════════════════════════════════════════════════ */
export default function HeroShowcase() {
  const [active, setActive]  = useState(0);
  const [dir, setDir]        = useState(1);
  const intervalRef          = useRef(null);

  /* start (or restart) the 3.5 s auto-advance timer */
  const startCycle = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDir(1);
      setActive(a => (a + 1) % CARDS.length);
    }, 3500);
  };

  useEffect(() => {
    startCycle();
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = idx => {
    if (idx === active) return;
    setDir(idx > active ? 1 : -1);
    setActive(idx);
    startCycle(); /* reset timer so it doesn't fire immediately after a click */
  };

  const ActiveCard = CARDS[active].component;

  return (
    <>
      {/* Inject keyframes needed by this component */}
      <style>{HS_CSS}</style>

      <motion.div
        className="lp-hero-r"
        style={{ position: "relative", height: 530 }}
        initial={{ opacity: 0, scale: .94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: .85, delay: .18, ease: [.2, .8, .2, 1] }}
      >
        {/* ── Floating chip: Visitor Approved (Security Hub only) ── */}
        <AnimatePresence>
          {active === 0 && (
            <motion.div key="chip-approved"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16, transition: { duration: .2 } }}
              transition={{ duration: .35 }}
              style={{ position: "absolute", top: 6, right: -18, zIndex: 20 }}>
              {/* inner div carries the float CSS animation */}
              <div style={{
                animation: "hs-float-a 3.8s ease-in-out infinite",
                background: "#fff", borderRadius: 14,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 9,
                boxShadow: "0 4px 20px rgba(15,23,42,.08),0 16px 40px rgba(15,23,42,.07)",
                border: "1px solid #E2E8F0", minWidth: 196,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle size={14} color="#16A34A" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>Visitor Approved ✓</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>Rahul Sharma · A-204</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Floating chip: New Delivery (Security Hub only) ── */}
        <AnimatePresence>
          {active === 0 && (
            <motion.div key="chip-delivery"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16, transition: { duration: .2 } }}
              transition={{ duration: .35, delay: .1 }}
              style={{ position: "absolute", bottom: 68, left: -26, zIndex: 20 }}>
              <div style={{
                animation: "hs-float-b 4.2s ease-in-out infinite",
                background: "#fff", borderRadius: 14,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 9,
                boxShadow: "0 4px 20px rgba(15,23,42,.08),0 16px 40px rgba(15,23,42,.07)",
                border: "1px solid #E2E8F0", minWidth: 188,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#FEF9C3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={14} color="#D97706" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>New Delivery 📦</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>Amazon · Block A · just now</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3-D card flip area ── */}
        <div style={{
          position: "absolute", top: 10, left: 0, right: 0, height: 462,
          perspective: "1200px",
        }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={active}
              custom={dir}
              variants={flipV}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ width: "100%", height: "100%" }}
            >
              <ActiveCard />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Indicator dots ── */}
        <div style={{
          position: "absolute", bottom: 8, left: 0, right: 0,
          display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
        }}>
          {CARDS.map((_, i) => (
            <motion.div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`View card ${i + 1}`}
              onClick={() => goTo(i)}
              onKeyDown={e => e.key === "Enter" && goTo(i)}
              animate={{
                width: active === i ? 24 : 8,
                backgroundColor: active === i ? "#2563EB" : "#E2E8F0",
              }}
              transition={{ duration: .3, ease: [.2, .8, .2, 1] }}
              style={{ height: 8, borderRadius: 4, cursor: "pointer" }}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}
