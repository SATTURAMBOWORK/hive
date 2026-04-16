import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff, Shield } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── CSS ──────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
.lgi-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
.lgi-root * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Form ── */
@keyframes lgi-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 70%{box-shadow:0 0 0 10px rgba(37,99,235,0)} }
@keyframes lgi-spin  { to { transform: rotate(360deg); } }
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
  width:100%; background:#2563EB; color:#fff; border:none; border-radius:12px;
  padding:13px 24px; font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  box-shadow:0 4px 14px rgba(37,99,235,.32); animation:lgi-pulse 2.8s ease-in-out infinite;
  transition:transform .2s,box-shadow .2s,background .2s;
}
.lgi-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,99,235,.42); background:#1D4ED8; }
.lgi-btn:active:not(:disabled) { transform:translateY(0); }
.lgi-btn:disabled { opacity:.65; cursor:not-allowed; animation:none; }
@media(max-width:768px) { .lgi-right-visual{display:none!important;} .lgi-form-side{width:100%!important;} }

/* ── Scene ── */
@keyframes lgi-twinkle { 0%,100%{opacity:.9} 50%{opacity:.1} }
@keyframes lgi-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes lgi-live    { 0%,100%{opacity:1} 50%{opacity:.25} }
@keyframes lgi-wave    { 0%,100%{transform:rotate(5deg)} 50%{transform:rotate(-35deg)} }
@keyframes lgi-bob     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
@keyframes lgi-dance   { 0%,100%{transform:rotate(-12deg) translateX(0)} 50%{transform:rotate(12deg) translateX(2px)} }
@keyframes lgi-eat     { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
@keyframes lgi-sweep   { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(18deg)} }
@keyframes lgi-drive   { 0%{transform:translateX(620px)} 100%{transform:translateX(-220px)} }
@keyframes lgi-party   { 0%{fill:#EF4444} 20%{fill:#A855F7} 40%{fill:#3B82F6} 60%{fill:#10B981} 80%{fill:#F59E0B} 100%{fill:#EF4444} }
@keyframes lgi-clothe  { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes lgi-read-page { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(-1)} }
`;

/* ─── Time helpers ─────────────────────────────────────────── */
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
  dawn:  ["#0B1120","#7C3AED","#F97316"],
  day:   ["#1E3A8A","#2563EB","#93C5FD"],
  dusk:  ["#0B1120","#9333EA","#EA580C"],
  night: ["#020617","#0B1120","#1E2E5C"],
};

/* ─── Star data (stable, generated once) ───────────────────── */
const STARS = Array.from({ length: 32 }, (_, i) => ({
  x: ((i * 137.5) % 100).toFixed(1),
  y: ((i * 91.3)  % 52).toFixed(1),
  s: ((i % 3) * 0.4 + 0.8).toFixed(1),
  d: ((i % 4) * 0.7 + 1.4).toFixed(1),
  delay: ((i % 5) * 0.6).toFixed(1),
}));

/* ─── SVG scene sub-components ─────────────────────────────── */

/* Single window with frame + optional balcony rail */
function Win({ x, y, w = 22, h = 15, lit = true, party = false, balcony = false }) {
  return (
    <g>
      <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx="2.5" fill="#243447" />
      <rect
        x={x} y={y} width={w} height={h} rx="2"
        fill={party ? "#EF4444" : lit ? "#FDE68A" : "#0C1524"}
        style={{
          animation: party ? "lgi-party 1.7s linear infinite" : undefined,
          filter: lit && !party ? "drop-shadow(0 0 4px rgba(253,230,138,0.75))" : undefined,
        }}
      />
      {/* pane dividers */}
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#243447" strokeWidth="1" opacity="0.6" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#243447" strokeWidth="1" opacity="0.6" />
      {balcony && (
        <g>
          <rect x={x - 4} y={y + h} width={w + 8} height={7} rx="1" fill="#1E3148" />
          <rect x={x - 4} y={y + h - 8} width={w + 8} height={2} rx="1" fill="#2D4060" />
          {[0, Math.floor((w + 8) / 2), w + 4].map((px, i) => (
            <rect key={i} x={x - 4 + px} y={y + h - 8} width="2" height="8" fill="#2D4060" />
          ))}
        </g>
      )}
    </g>
  );
}

/* Rounded tree */
function Tree({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-4" y="0" width="8" height="22" rx="2" fill="#713F12" />
      <ellipse cx="0" cy="-14" rx="18" ry="16" fill="#166534" />
      <ellipse cx="-7" cy="-6" rx="12" ry="11" fill="#15803D" />
      <ellipse cx="9"  cy="-6" rx="11" ry="10" fill="#15803D" />
      <ellipse cx="0"  cy="-22" rx="9"  ry="8"  fill="#16A34A" />
    </g>
  );
}

/* Person reading on balcony — bobbing gently */
function PersonReading({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}
       style={{ animation: "lgi-bob 2.8s ease-in-out infinite", transformOrigin: "6px 10px", transformBox: "fill-box" }}>
      <circle cx="6" cy="0" r="5.5" fill="#FBBF24" />
      <rect x="1" y="5.5" width="10" height="11" rx="2" fill="#3B82F6" />
      {/* book */}
      <rect x="-5" y="7" width="10" height="8" rx="1.5" fill="white" opacity="0.92" />
      <line x1="-0.5" y1="7" x2="-0.5" y2="15" stroke="#CBD5E1" strokeWidth="0.8" />
      {/* left arm holding book */}
      <line x1="1" y1="10" x2="-4" y2="12" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/* Person waving — arm animates */
function PersonWaving({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="6" cy="0" r="5.5" fill="#F472B6" />
      {/* hair */}
      <path d="M1,-4 Q6,-10 11,-4" fill="#92400E" />
      <rect x="1" y="5.5" width="10" height="13" rx="2" fill="#EC4899" />
      {/* static left arm */}
      <line x1="1" y1="9" x2="-4" y2="14" stroke="#F472B6" strokeWidth="2.2" strokeLinecap="round" />
      {/* waving right arm */}
      <g transform="translate(11, 7)"
         style={{ animation: "lgi-wave 1.9s ease-in-out infinite", transformOrigin: "0px 0px", transformBox: "fill-box" }}>
        <line x1="0" y1="0" x2="7" y2="-6" stroke="#F472B6" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="7" cy="-6" r="2.2" fill="#FBBF24" />
      </g>
    </g>
  );
}

/* Person eating — arm moves fork to mouth */
function PersonEating({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}
       style={{ animation: "lgi-bob 3.2s ease-in-out infinite 0.5s", transformOrigin: "6px 10px", transformBox: "fill-box" }}>
      <circle cx="6" cy="0" r="5.5" fill="#A78BFA" />
      <rect x="1" y="5.5" width="10" height="11" rx="2" fill="#34D399" />
      {/* table */}
      <rect x="-5" y="14" width="20" height="3" rx="1" fill="#92400E" />
      {/* plate */}
      <ellipse cx="6" cy="14.5" rx="6" ry="2" fill="#FDE68A" opacity="0.7" />
      {/* eating arm */}
      <g transform="translate(11, 8)"
         style={{ animation: "lgi-eat 1.4s ease-in-out infinite", transformOrigin: "0px 0px", transformBox: "fill-box" }}>
        <line x1="0" y1="0" x2="4" y2="-5" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* Dancing silhouette — party window */
function PersonDancing({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}
       style={{ animation: "lgi-dance 0.6s ease-in-out infinite", transformOrigin: "6px 10px", transformBox: "fill-box" }}>
      <circle cx="6" cy="0" r="5" fill="#C084FC" opacity="0.9" />
      <rect x="2" y="5" width="9" height="12" rx="2" fill="#C084FC" opacity="0.9" />
      <line x1="2" y1="9" x2="-3" y2="5" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="9" x2="16" y2="5" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/* Leaning person — relaxed on railing */
function PersonLeaning({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}
       style={{ animation: "lgi-bob 4s ease-in-out infinite 1s", transformOrigin: "6px 8px", transformBox: "fill-box" }}>
      <circle cx="6" cy="0" r="5.5" fill="#FCD34D" />
      <rect x="1" y="5.5" width="10" height="11" rx="2" fill="#F97316" />
      {/* leaning arm on rail */}
      <line x1="1" y1="9" x2="-6" y2="14" stroke="#FCD34D" strokeWidth="2.2" strokeLinecap="round" />
      {/* phone in other hand */}
      <line x1="11" y1="9" x2="15" y2="6" stroke="#FCD34D" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="14" y="3" width="5" height="7" rx="1" fill="#334155" />
      <rect x="15" y="4" width="3" height="5" rx="0.5" fill="#60A5FA" opacity="0.8" />
    </g>
  );
}

/* Ground worker sweeping */
function Worker({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* head */}
      <circle cx="8" cy="0" r="7.5" fill="#F59E0B" />
      {/* helmet */}
      <ellipse cx="8" cy="-4" rx="9" ry="5.5" fill="#1D4ED8" />
      <rect x="-1" y="-0.5" width="18" height="2.5" rx="1" fill="#1D4ED8" />
      {/* body */}
      <rect x="3" y="7" width="11" height="16" rx="2.5" fill="#0EA5E9" />
      {/* static left arm */}
      <line x1="3" y1="11" x2="-4" y2="18" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      {/* sweeping right arm + broom */}
      <g style={{ animation: "lgi-sweep 1.1s ease-in-out infinite", transformOrigin: "14px 11px", transformBox: "fill-box" }}>
        <line x1="14" y1="11" x2="32" y2="26" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="25" x2="38" y2="22" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
        {[0,3,6,9,12].map(i => (
          <line key={i} x1={25+i} y1="26" x2={23+i} y2="32" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
        ))}
      </g>
      {/* legs */}
      <line x1="7"  y1="23" x2="5"  y2="34" stroke="#0369A1" strokeWidth="3" strokeLinecap="round" />
      <line x1="11" y1="23" x2="13" y2="34" stroke="#0369A1" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/* Clothesline detail */
function Clothesline({ x, y, w = 60 }) {
  const clothes = [
    { color:"#EF4444", dx:4  },
    { color:"#60A5FA", dx:16 },
    { color:"#FDE68A", dx:28 },
    { color:"#A78BFA", dx:40 },
    { color:"#34D399", dx:52 },
  ];
  return (
    <g>
      <line x1={x} y1={y} x2={x + w} y2={y + 2} stroke="#64748B" strokeWidth="1" />
      {clothes.map((c, i) => (
        <g key={i} style={{ animation: `lgi-clothe ${1.8 + i * 0.3}s ease-in-out infinite`, transformOrigin: `${x + c.dx + 4}px ${y - 1}px`, transformBox: "view-box" }}>
          <rect x={x + c.dx} y={y - 1} width="8" height="10" rx="1.5" fill={c.color} opacity="0.88" />
          <circle cx={x + c.dx + 4} cy={y - 1} r="1.5" fill="#94A3B8" />
        </g>
      ))}
    </g>
  );
}

/* ─── Main SVG apartment scene ──────────────────────────────── */
function ApartmentScene({ barrierLifted }) {

  /* ── B1 windows (left building): 3 cols × 4 rows ── */
  // col x: 25,55,85   row y: 194,233,272,311
  const B1_W = [
    [1,0,1], [0,1,0], [1,1,0], [0,1,1]
  ];

  /* ── B2 windows (center): 4 cols × 6 rows ── */
  // col x: 172,210,248,286   row y: 99,140,181,222,263,304
  // 'p' = party window
  const B2_W = [
    [1,1,0,1],
    [1,0,1,1],
    [0,1,0,1],
    [1,0,1,0],
    ["p",1,1,0],
    [1,0,1,1],
  ];

  /* ── B3 windows (right): 3 cols × 5 rows ── */
  // col x: 375,405,435   row y: 169,208,247,286,325
  const B3_W = [
    [1,0,1], [0,1,0], [1,0,1], [1,1,0], [0,1,1]
  ];

  const b1Cols = [25, 55, 85];
  const b1Rows = [194, 233, 272, 311];
  const b2Cols = [172, 210, 248, 286];
  const b2Rows = [99, 140, 181, 222, 263, 304];
  const b3Cols = [375, 405, 435];
  const b3Rows = [169, 208, 247, 286, 325];

  return (
    <svg
      viewBox="0 0 480 500"
      width="100%" height="100%"
      preserveAspectRatio="xMidYMax meet"
      style={{ position: "absolute", inset: 0 }}
    >
      {/* ── B1: left building ── */}
      <rect x="10" y="180" width="110" height="180" rx="3" fill="#1B2D42"
        style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))" }} />
      {/* roof ledge */}
      <rect x="8"  y="177" width="114" height="6" rx="2" fill="#243447" />
      <rect x="20" y="170" width="90"  height="9" rx="2" fill="#1E3148" />
      {/* water tank */}
      <rect x="30" y="160" width="22" height="13" rx="2" fill="#162030" />
      <rect x="28" y="171" width="26" height="3"  rx="1" fill="#243447" />
      <rect x="38" y="157" width="4"  height="5"  rx="1" fill="#243447" />

      {/* B1 windows + balconies */}
      {b1Rows.map((wy, r) =>
        b1Cols.map((wx, c) => (
          <Win key={`b1-${r}-${c}`} x={wx} y={wy} w={20} h={14}
            lit={B1_W[r][c] === 1} party={B1_W[r][c] === "p"}
            balcony={r === 1 && c === 0} /* Person leaning: row1, col0 */
          />
        ))
      )}

      {/* Clothesline on B1, between floor 2 & 3 */}
      <Clothesline x={13} y={264} w={55} />

      {/* Person leaning on B1 balcony (row 1, col 0) */}
      {/* balcony is at y=233+14=247. person sits at y=244 */}
      <PersonLeaning x={18} y={244} />

      {/* B1 ground floor lobby */}
      <rect x="10" y="346" width="110" height="14" rx="0" fill="#162030" />
      <rect x="45" y="342" width="25" height="18" rx="2" fill="#0C1826" /> {/* door */}
      <rect x="50" y="343" width="14" height="16" rx="1" fill="#1E3148" opacity="0.5" />

      {/* ── B2: center tall building ── */}
      <rect x="155" y="85" width="170" height="275" rx="3" fill="#1C2E44"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }} />
      {/* roof */}
      <rect x="153" y="82"  width="174" height="6"  rx="2" fill="#243447" />
      <rect x="168" y="72"  width="144" height="12" rx="2" fill="#1E3148" />
      <rect x="200" y="60"  width="80"  height="14" rx="2" fill="#162030" />
      {/* satellite dish on roof */}
      <ellipse cx="295" cy="72" rx="10" ry="4" fill="#334155" />
      <line x1="295" y1="72" x2="295" y2="60" stroke="#475569" strokeWidth="2" />
      <circle cx="295" cy="60" r="2" fill="#60A5FA" opacity="0.8" />
      {/* rooftop water tank */}
      <rect x="163" y="63" width="28" height="20" rx="3" fill="#0F1E2E" />
      <rect x="161" y="81" width="32" height="3"  rx="1" fill="#243447" />
      <rect x="174" y="59" width="4"  height="6"  rx="1" fill="#243447" />

      {/* B2 windows + balconies */}
      {b2Rows.map((wy, r) =>
        b2Cols.map((wx, c) => {
          const state = B2_W[r][c];
          const isParty = state === "p";
          // balconies: row3 col1 (eating), row1 col2 (waving), row4 col1 (reading)
          const hasBal = (r === 3 && c === 1) || (r === 1 && c === 2) || (r === 4 && c === 1);
          return (
            <Win key={`b2-${r}-${c}`} x={wx} y={wy} w={22} h={15}
              lit={state === 1 || isParty} party={isParty} balcony={hasBal}
            />
          );
        })
      )}

      {/* People on B2 balconies */}
      {/* Eating: row3 col1 → balcony y=222+15=237 → person at (203,234) */}
      <PersonEating x={203} y={234} />
      {/* Waving: row1 col2 → balcony y=140+15=155 → person at (241,152) */}
      <PersonWaving x={241} y={152} />
      {/* Reading: row4 col1 → balcony y=263+15=278 → person at (203,275) */}
      <PersonReading x={203} y={275} />
      {/* Dancing in party window: row4 col0 → inside window at (174,265) */}
      <PersonDancing x={174} y={266} />

      {/* B2 lobby */}
      <rect x="155" y="333" width="170" height="27" rx="0" fill="#142030" />
      {/* main entrance door (double) */}
      <rect x="213" y="328" width="54" height="32" rx="2" fill="#0A1520" />
      <rect x="215" y="329" width="23" height="30" rx="1" fill="#1E3A5C" opacity="0.6" />
      <rect x="241" y="329" width="23" height="30" rx="1" fill="#1E3A5C" opacity="0.6" />
      <circle cx="237" cy="345" r="2" fill="#FDE68A" opacity="0.6" />
      <circle cx="243" cy="345" r="2" fill="#FDE68A" opacity="0.6" />
      {/* lobby light */}
      <rect x="226" y="325" width="28" height="4" rx="2" fill="#FDE68A" opacity="0.35"
        style={{ filter: "drop-shadow(0 0 8px rgba(253,230,138,0.5))" }} />

      {/* ── B3: right building ── */}
      <rect x="360" y="155" width="110" height="205" rx="3" fill="#1A2B3F"
        style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))" }} />
      <rect x="358" y="152" width="114" height="6"  rx="2" fill="#243447" />
      <rect x="368" y="143" width="94"  height="11" rx="2" fill="#1E3148" />

      {/* B3 windows + balconies */}
      {b3Rows.map((wy, r) =>
        b3Cols.map((wx, c) => (
          <Win key={`b3-${r}-${c}`} x={wx} y={wy} w={20} h={14}
            lit={B3_W[r][c] === 1} party={false}
            balcony={r === 2 && c === 2} /* balcony on row2 col2 */
          />
        ))
      )}
      {/* B3 lobby */}
      <rect x="360" y="339" width="110" height="21" rx="0" fill="#111E2C" />
      <rect x="398" y="334" width="30" height="26" rx="1" fill="#0A1520" />
      <rect x="400" y="335" width="27" height="24" rx="1" fill="#162840" opacity="0.5" />

      {/* ── Ground / road ── */}
      <rect x="0" y="358" width="480" height="80" fill="#070F1A" />
      <rect x="0" y="358" width="480" height="4"  fill="#0B1626" />
      {/* pavement */}
      <rect x="0" y="358" width="480" height="18" fill="#0D1929" />
      {/* road dashes */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <rect key={i} x={i * 55 + 8} y="382" width="34" height="3" rx="1.5" fill="rgba(255,255,255,0.07)" />
      ))}

      {/* ── Trees ── */}
      <Tree x={118} y={340} scale={0.9} />
      <Tree x={340} y={338} scale={0.85} />
      {/* small bush */}
      <ellipse cx="65"  cy="360" rx="18" ry="9" fill="#14532D" opacity="0.8" />
      <ellipse cx="415" cy="360" rx="15" ry="8" fill="#14532D" opacity="0.8" />

      {/* ── Gate pillars ── */}
      <rect x="200" y="332" width="9"  height="32" rx="2" fill="#334155" />
      <rect x="271" y="332" width="9"  height="32" rx="2" fill="#334155" />
      {/* gate light on pillars */}
      <rect x="200" y="330" width="9" height="4" rx="1" fill="#FDE68A" opacity="0.6"
        style={{ filter:"drop-shadow(0 0 5px rgba(253,230,138,0.7))" }} />
      <rect x="271" y="330" width="9" height="4" rx="1" fill="#FDE68A" opacity="0.6"
        style={{ filter:"drop-shadow(0 0 5px rgba(253,230,138,0.7))" }} />
      {/* AptHive gate sign */}
      <rect x="210" y="330" width="60" height="14" rx="2" fill="#162030" />
      <text x="240" y="340" textAnchor="middle" fill="#60A5FA" fontSize="6" fontWeight="700"
        style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>AptHive</text>

      {/* ── Boom Barrier ── */}
      {/* Post */}
      <rect x="209" y="348" width="8" height="22" rx="2" fill="#475569" />
      <rect x="207" y="368" width="12" height="4" rx="1" fill="#334155" />
      {/* Barrier arm — rotates on sign-in */}
      <g style={{
        transformOrigin: "217px 352px",
        transform: barrierLifted ? "rotate(-82deg)" : "rotate(0deg)",
        transition: "transform 0.85s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Striped arm */}
        <rect x="217" y="349" width="58" height="6" rx="2"
          fill="url(#barrierStripe)" />
        {/* Counterweight */}
        <rect x="202" y="349" width="7" height="6" rx="1" fill="#64748B" />
      </g>
      {/* Stripe pattern def */}
      <defs>
        <pattern id="barrierStripe" x="0" y="0" width="14" height="6" patternUnits="userSpaceOnUse">
          <rect width="14" height="6" fill="#EF4444" />
          <rect x="7" width="7" height="6" fill="#FFF" opacity="0.9" />
        </pattern>
      </defs>

      {/* ── Worker ── */}
      <Worker x={52} y={372} />

      {/* ── Ambient ground glow under buildings ── */}
      <ellipse cx="240" cy="360" rx="160" ry="12" fill="rgba(253,230,138,0.04)" />
    </svg>
  );
}

/* ─── Delivery scooter (CSS animated div overlay) ───────────── */
function Scooter() {
  return (
    <div style={{
      position: "absolute",
      bottom: "10.5%",
      left: 0,
      zIndex: 8,
      animation: "lgi-drive 11s linear infinite",
      animationDelay: "1.5s",
    }}>
      <svg viewBox="0 0 96 50" width="96" style={{ display: "block" }}>
        {/* body */}
        <ellipse cx="52" cy="33" rx="22" ry="8" fill="#EF4444" />
        <polygon points="42,25 60,25 67,33 38,33" fill="#DC2626" />
        {/* headlight */}
        <rect x="72" y="27" width="7" height="5" rx="2" fill="#FDE68A" opacity="0.9"
          style={{ filter:"drop-shadow(0 0 4px rgba(253,230,138,0.8))" }} />
        {/* wheels */}
        <circle cx="28" cy="37" r="9" fill="#0F172A" />
        <circle cx="28" cy="37" r="5" fill="#1E293B" />
        <circle cx="28" cy="37" r="2" fill="#64748B" />
        <circle cx="70" cy="37" r="9" fill="#0F172A" />
        <circle cx="70" cy="37" r="5" fill="#1E293B" />
        <circle cx="70" cy="37" r="2" fill="#64748B" />
        {/* handlebar */}
        <rect x="35" y="22" width="3" height="11" rx="1.5" fill="#475569" />
        <rect x="30" y="22" width="11" height="2.5" rx="1" fill="#475569" />
        {/* rider - body */}
        <rect x="44" y="18" width="13" height="12" rx="3" fill="#2563EB" />
        {/* rider - head + helmet */}
        <circle cx="50" cy="13" r="7.5" fill="#FBBF24" />
        <ellipse cx="50" cy="10" rx="9" ry="6" fill="#1D4ED8" />
        <rect x="41" y="14" width="18" height="3" rx="1.5" fill="#1D4ED8" />
        {/* visor */}
        <rect x="44" y="11" width="12" height="5" rx="2" fill="#93C5FD" opacity="0.5" />
        {/* delivery box */}
        <rect x="57" y="19" width="18" height="14" rx="2.5" fill="#FDE68A" />
        <line x1="57" y1="26" x2="75" y2="26" stroke="#D97706" strokeWidth="1" />
        <text x="66" y="23" textAnchor="middle" fontSize="4.5" fill="#92400E" fontWeight="800">AH</text>
        <text x="66" y="30" textAnchor="middle" fontSize="3.5" fill="#92400E">EXPRESS</text>
      </svg>
    </div>
  );
}

/* ─── Full right-panel scene ────────────────────────────────── */
function LoginVisual({ barrierLifted }) {
  const tod     = getTimeOfDay();
  const [c0, c1, c2] = SKY[tod];
  const isNight = tod === "night" || tod === "dusk";

  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: `linear-gradient(180deg, ${c0} 0%, ${c1} 55%, ${c2} 100%)`,
    }}>

      {/* Stars */}
      {isNight && STARS.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.s}px`, height: `${s.s}px`,
          borderRadius: "50%", background: "#fff",
          animation: `lgi-twinkle ${s.d}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}

      {/* Moon */}
      {tod === "night" && (
        <div style={{
          position:"absolute", top:"8%", right:"13%",
          width:26, height:26, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%, #FEF9C3, #FDE68A)",
          boxShadow:"0 0 18px rgba(253,230,138,0.45), 0 0 55px rgba(253,230,138,0.15)",
        }}/>
      )}

      {/* Sun */}
      {tod !== "night" && (
        <div style={{
          position:"absolute",
          top: tod === "day" ? "9%" : "33%",
          right: tod === "dusk" ? "10%" : "16%",
          width: tod === "day" ? 32 : 40,
          height: tod === "day" ? 32 : 40,
          borderRadius:"50%",
          background: tod === "day"
            ? "radial-gradient(circle,#FEF9C3,#FDE68A)"
            : "radial-gradient(circle,#FDE68A,#F97316)",
          boxShadow: tod === "day"
            ? "0 0 22px rgba(253,230,138,0.5),0 0 70px rgba(253,230,138,0.18)"
            : "0 0 30px rgba(249,115,22,0.6),0 0 80px rgba(249,115,22,0.22)",
        }}/>
      )}

      {/* SVG scene */}
      <ApartmentScene barrierLifted={barrierLifted} />

      {/* Scooter overlay */}
      <Scooter />

      {/* Bottom status chips */}
      <div style={{
        position:"absolute", bottom:"1%", left:0, right:0,
        display:"flex", justifyContent:"space-between", padding:"0 14px", zIndex:12,
      }}>
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          background:"rgba(253,230,138,0.1)", border:"1px solid rgba(253,230,138,0.22)",
          borderRadius:20, padding:"3px 10px",
          animation:"lgi-float 4s ease-in-out infinite 1s",
        }}>
          <span style={{ color:"#FDE68A", fontSize:"0.62rem", fontWeight:700 }}>248 residents</span>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.28)",
          borderRadius:20, padding:"3px 10px",
          animation:"lgi-float 3s ease-in-out infinite",
        }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ADE80", animation:"lgi-live 1.6s ease-in-out infinite" }}/>
          <span style={{ color:"#4ADE80", fontSize:"0.62rem", fontWeight:700 }}>Gate Secured</span>
        </div>
      </div>

      {/* Greeting overlay */}
      <div style={{
        position:"absolute", top:"5%", left:0, right:0,
        textAlign:"center", zIndex:10, pointerEvents:"none",
      }}>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.68rem", fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
          {getGreeting()}
        </p>
        <p style={{ color:"#fff", fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.2px", textShadow:"0 2px 14px rgba(0,0,0,0.6)" }}>
          Green Heights Society
        </p>
      </div>

    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]           = useState({ email:"", password:"", tenantSlug:"" });
  const [showPassword, setShowPw] = useState(false);
  const [emailError, setEmailErr] = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setLoading]   = useState(false);
  const [barrierLifted, setBarrier] = useState(false);

  function handleEmailChange(e) {
    const v = e.target.value;
    setForm(p => ({ ...p, email: v }));
    setEmailErr(v && !EMAIL_REGEX.test(v) ? "Enter a valid email address." : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (emailError) return;
    setError(""); setLoading(true);
    setBarrier(true); // 🚧 lift the boom barrier
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBarrier(false); // lower it back on failure
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
        minHeight:"100vh", background:"#F7F9FF",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px",
        backgroundImage:"radial-gradient(circle,#E2E8F0 1px,transparent 1px)",
        backgroundSize:"26px 26px",
      }}>
        <div style={{ position:"fixed", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.06) 0%,transparent 65%)", top:-200, right:-100, pointerEvents:"none" }}/>

        <div style={{
          width:"100%", maxWidth:1000, display:"flex", borderRadius:24, overflow:"hidden",
          boxShadow:"0 8px 40px rgba(15,23,42,.12),0 32px 80px rgba(15,23,42,.10)",
          border:"1px solid #E2E8F0",
        }}>

          {/* ── Left: Form ── */}
          <div className="lgi-form-side" style={{ width:"48%", background:"#fff", padding:"52px 48px", display:"flex", flexDirection:"column", justifyContent:"center", minHeight:600 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:40 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(37,99,235,.32)" }}>
                <Shield size={17} color="#fff"/>
              </div>
              <span style={{ fontWeight:800, fontSize:17, color:"#0F172A", letterSpacing:"-.3px" }}>AptHive</span>
            </div>

            <div style={{ marginBottom:32 }}>
              <h1 style={{ fontSize:"1.85rem", fontWeight:800, color:"#0F172A", letterSpacing:"-1px", lineHeight:1.1, marginBottom:8 }}>Welcome back</h1>
              <p style={{ fontSize:".9rem", color:"#64748B" }}>Sign in to your society dashboard</p>
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid rgba(220,38,38,.2)", borderRadius:10, padding:"11px 14px", color:"#DC2626", fontSize:".84rem", marginBottom:16, lineHeight:1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label className="lgi-label">Society Code</label>
                <input className="lgi-input" placeholder="e.g. green-heights" value={form.tenantSlug} onChange={e => setForm(p=>({...p,tenantSlug:e.target.value}))} required/>
              </div>
              <div>
                <label className="lgi-label">Email Address</label>
                <input type="email" className={`lgi-input${emailError?" err":""}`} placeholder="you@example.com" value={form.email} onChange={handleEmailChange} required/>
                {emailError && <p style={{ color:"#DC2626", fontSize:".74rem", marginTop:4 }}>{emailError}</p>}
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label className="lgi-label" style={{ margin:0 }}>Password</label>
                  <a href="#" style={{ fontSize:".75rem", color:"#2563EB", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
                </div>
                <div style={{ position:"relative" }}>
                  <input type={showPassword?"text":"password"} className="lgi-input" style={{ paddingRight:44 }} placeholder="••••••••" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4, display:"flex", alignItems:"center", transition:"color .2s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#2563EB"}
                    onMouseLeave={e=>e.currentTarget.style.color="#94A3B8"}>
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

          {/* ── Right: Apartment scene ── */}
          <div className="lgi-right-visual" style={{ flex:1, position:"relative", minHeight:600 }}>
            <LoginVisual barrierLifted={barrierLifted}/>
          </div>

        </div>
      </div>
    </>
  );
}

export default LoginPage;
