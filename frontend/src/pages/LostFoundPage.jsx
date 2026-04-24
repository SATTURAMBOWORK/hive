import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, PackageSearch, CheckCircle,
  Trash2, HandHelping, MapPin, CalendarDays, RefreshCw,
} from "lucide-react";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";

/* ─── C Palette ─────────────────────────────────────────────────── */
const C = {
  bg:       "#FAFAFC",
  surface:  "#FFFFFF",
  ink:      "#1C1C1E",
  ink2:     "#3A3A3C",
  muted:    "#6B7280",
  faint:    "#9CA3AF",
  border:   "#E8E8ED",
  borderL:  "#F0F0F5",
  indigo:   "#4F46E5",
  indigoD:  "#4338CA",
  indigoL:  "#EEF2FF",
  indigoBr: "#C7D2FE",
  red:      "#DC2626",
  redL:     "#FEF2F2",
  redBr:    "#FECACA",
  amber:    "#F59E0B",
  amberD:   "#D97706",
  amberL:   "#FFFBEB",
  amberBr:  "#FCD34D",
  green:    "#16A34A",
  greenL:   "#DCFCE7",
  orange:   "#E8890C",
  orangeL:  "#FFF8F0",
};

/* ─── Category metadata ─────────────────────────────────────────── */
const CATEGORY_META = {
  keys:      { label: "Keys",      color: C.orange,  bg: C.orangeL,  border: "#FDDCAA"  },
  phone:     { label: "Phone",     color: C.indigo,  bg: C.indigoL,  border: C.indigoBr },
  wallet:    { label: "Wallet",    color: C.green,   bg: C.greenL,   border: "#BBF7D0"  },
  pet:       { label: "Pet",       color: "#7C3AED", bg: "#EDE9FE",  border: "#DDD6FE"  },
  documents: { label: "Documents", color: C.red,     bg: C.redL,     border: C.redBr    },
  bag:       { label: "Bag",       color: C.amberD,  bg: C.amberL,   border: C.amberBr  },
  other:     { label: "Other",     color: C.muted,   bg: C.borderL,  border: C.border   },
};

const CATEGORIES = Object.keys(CATEGORY_META);

/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap');

  .lfx-root * { box-sizing: border-box; }

  .lfx-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background:
      radial-gradient(860px 340px at 80% -8%, rgba(79,70,229,0.08), transparent 60%),
      radial-gradient(700px 300px at -5% 5%, rgba(232,137,12,0.07), transparent 65%),
      ${C.bg};
    min-height: calc(100vh - 64px);
    padding: 22px 20px 120px;
    position: relative;
  }

  .lfx-root::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right,  rgba(148,163,184,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 18% 8%, rgba(0,0,0,.7), transparent 62%);
  }

  .lfx-content {
    position: relative;
    z-index: 1;
    max-width: 1120px;
    margin: 0 auto;
  }

  /* ── Hero ─────────────────────────────────────── */
  .lfx-hero {
    border: 1px solid ${C.border};
    border-radius: 24px;
    background: linear-gradient(140deg, rgba(255,255,255,0.98), rgba(247,249,255,0.97));
    box-shadow: 0 20px 44px rgba(28,28,30,0.08);
    padding: 20px 24px;
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
    align-items: center;
  }

  .lfx-hero-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 800;
    color: ${C.ink};
    margin: 0;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .lfx-hero-sub {
    margin-top: 8px;
    color: ${C.muted};
    font-size: 0.88rem;
    line-height: 1.65;
    max-width: 50ch;
  }

  .lfx-search-wrap {
    position: relative;
    width: 250px;
    flex-shrink: 0;
  }

  /* ── Inputs ───────────────────────────────────── */
  .lfx-input {
    width: 100%;
    border: 1px solid ${C.border};
    border-radius: 10px;
    background: ${C.bg};
    color: ${C.ink};
    padding: 10px 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .lfx-input::placeholder { color: ${C.faint}; }
  .lfx-input:focus {
    border-color: #C7C7CC;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  }

  /* ── Category bar ─────────────────────────────── */
  .lfx-cat-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 18px;
    align-items: center;
  }

  .lfx-chip {
    border: 1px solid ${C.border};
    border-radius: 999px;
    padding: 6px 13px;
    background: ${C.surface};
    color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .lfx-chip:hover {
    border-color: #C7C7CC;
    color: ${C.ink};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(28,28,30,0.07);
  }
  .lfx-chip.active {
    background: ${C.indigo};
    border-color: ${C.indigo};
    color: #fff;
    box-shadow: 0 4px 14px rgba(79,70,229,0.28);
  }

  /* ── Form block ───────────────────────────────── */
  .lfx-block {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    padding: 20px 22px;
    box-shadow: 0 8px 24px rgba(28,28,30,0.05);
    margin-bottom: 16px;
  }

  /* ── Masonry grid ─────────────────────────────── */
  .lfx-masonry {
    column-count: 3;
    column-gap: 14px;
  }
  @media (max-width: 1060px) { .lfx-masonry { column-count: 2; } }
  @media (max-width:  620px) { .lfx-masonry { column-count: 1; } }

  /* ── Card ─────────────────────────────────────── */
  .lfx-card {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    box-shadow: 0 4px 16px rgba(28,28,30,0.06);
    break-inside: avoid;
    margin-bottom: 14px;
    cursor: pointer;
    transition: box-shadow 0.26s, border-color 0.26s, transform 0.26s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .lfx-card:hover {
    box-shadow: 0 18px 44px rgba(28,28,30,0.14);
    border-color: #C7C7CC;
    transform: translateY(-3px);
  }

  /* Card media */
  .lfx-card-media { position: relative; width: 100%; overflow: hidden; }
  .lfx-card-media img {
    width: 100%; max-height: 320px;
    display: block; object-fit: cover;
    transition: transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .lfx-card:hover .lfx-card-media img { transform: scale(1.05); }

  .lfx-card-placeholder {
    width: 100%; height: 190px;
    display: flex; align-items: center; justify-content: center;
  }

  /* Always-visible base strip */
  .lfx-card-base {
    padding: 12px 14px 14px;
    background: ${C.surface};
    border-top: 1px solid ${C.borderL};
  }
  .lfx-card-title {
    margin: 5px 0 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: ${C.ink};
    line-height: 1.35;
    letter-spacing: -0.01em;
  }

  /* Hover overlay */
  .lfx-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(28,28,30,0.97) 0%,
      rgba(28,28,30,0.92) 45%,
      rgba(28,28,30,0.72) 75%,
      rgba(28,28,30,0.45) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 18px 16px 16px;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
  }
  .lfx-card:hover .lfx-card-overlay {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .lfx-overlay-title {
    font-size: 1rem; font-weight: 800; color: #FFFFFF;
    margin: 0 0 7px; letter-spacing: -0.015em; line-height: 1.3;
  }
  .lfx-overlay-desc {
    font-size: 0.79rem; color: rgba(255,255,255,0.78);
    line-height: 1.6; margin: 0 0 11px;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .lfx-overlay-meta {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 13px;
  }
  .lfx-overlay-meta-item {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.71rem; color: rgba(255,255,255,0.65); font-weight: 600;
  }
  .lfx-overlay-actions { display: flex; gap: 7px; flex-wrap: wrap; }
  .lfx-overlay-author {
    margin-top: 11px; padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.14);
    display: flex; align-items: center; gap: 8px;
  }
  .lfx-overlay-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255,255,255,0.2); color: #fff;
    font-size: 0.58rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* Badges */
  .lfx-type-badge, .lfx-cat-badge, .lfx-status-badge {
    padding: 3px 9px; border-radius: 999px;
    font-size: 0.64rem; font-weight: 800;
    letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid;
  }

  /* Mini action buttons (in overlay) */
  .lfx-mini-btn {
    display: inline-flex; align-items: center; gap: 5px;
    border-radius: 8px; padding: 7px 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem; font-weight: 700; cursor: pointer; color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.14);
    backdrop-filter: blur(4px);
    transition: background 0.18s, transform 0.18s;
  }
  .lfx-mini-btn:hover { background: rgba(255,255,255,0.24); transform: translateY(-1px); }
  .lfx-mini-btn.claim-lost  { background: rgba(232,137,12,0.55);  border-color: rgba(232,137,12,0.5);  }
  .lfx-mini-btn.claim-found { background: rgba(22,163,74,0.55);   border-color: rgba(22,163,74,0.5);   }
  .lfx-mini-btn.resolve     { background: rgba(22,163,74,0.5);    border-color: rgba(22,163,74,0.45);  }
  .lfx-mini-btn.delete      { background: rgba(220,38,38,0.5);    border-color: rgba(220,38,38,0.45);  }

  /* Skeleton */
  .lfx-sk {
    border-radius: 8px;
    background: linear-gradient(90deg, #F0F0F5 25%, #E8E8ED 50%, #F0F0F5 75%);
    background-size: 200% 100%;
    animation: lfx-shimmer 1.5s ease-in-out infinite;
  }

  /* Buttons */
  .lfx-btn-primary {
    border: none; border-radius: 10px; padding: 10px 18px;
    display: inline-flex; align-items: center; gap: 7px;
    background: linear-gradient(135deg, ${C.indigo}, ${C.indigoD});
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.84rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(79,70,229,0.28);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .lfx-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(79,70,229,0.38);
  }
  .lfx-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .lfx-btn-soft {
    border: 1px solid ${C.border}; border-radius: 10px; padding: 9px 14px;
    display: inline-flex; align-items: center; gap: 6px;
    background: ${C.surface}; color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
  }
  .lfx-btn-soft:hover:not(:disabled) {
    border-color: #C7C7CC; color: ${C.ink};
    transform: translateY(-1px); box-shadow: 0 4px 12px rgba(28,28,30,0.07);
  }
  .lfx-btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Form label */
  .lfx-form-label {
    display: block; margin-bottom: 6px;
    color: ${C.muted}; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* Error banner */
  .lfx-error {
    margin-bottom: 14px; border-radius: 12px;
    border: 1px solid ${C.redBr}; background: ${C.redL};
    color: ${C.red}; font-size: 0.82rem; font-weight: 700;
    padding: 11px 14px; display: flex; align-items: center; gap: 10px;
    overflow: hidden;
  }

  /* ── Floating bottom toolbar ──────────────────── */
  .lfx-float-bar {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 7px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,0.75);
    box-shadow:
      0 8px 32px rgba(28,28,30,0.16),
      0 2px 8px rgba(28,28,30,0.08),
      inset 0 1px 0 rgba(255,255,255,0.9);
    white-space: nowrap;
  }

  .lfx-bar-chip {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 7px 15px;
    background: transparent;
    color: ${C.muted};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem; font-weight: 700;
    cursor: pointer; transition: all 0.18s;
  }
  .lfx-bar-chip:hover { color: ${C.ink}; background: rgba(28,28,30,0.06); }
  .lfx-bar-chip.active {
    background: ${C.ink}; border-color: ${C.ink}; color: #fff;
    box-shadow: 0 2px 8px rgba(28,28,30,0.22);
  }

  .lfx-bar-divider {
    width: 1px; height: 20px;
    background: rgba(28,28,30,0.12);
    margin: 0 3px; flex-shrink: 0;
  }

  .lfx-bar-post {
    border: none; border-radius: 999px;
    padding: 8px 16px; margin-left: 2px;
    display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, ${C.orange}, ${C.amberD});
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem; font-weight: 800; cursor: pointer;
    box-shadow: 0 3px 12px rgba(232,137,12,0.32);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .lfx-bar-post:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232,137,12,0.42);
  }

  /* Resolved ribbon */
  .lfx-resolved-ribbon {
    position: absolute; top: 10px; right: 10px; z-index: 3;
    background: ${C.green}; color: #fff;
    font-size: 0.6rem; font-weight: 800;
    padding: 3px 9px; border-radius: 999px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  @keyframes lfx-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lfx-spin { to { transform: rotate(360deg); } }

  @media (max-width: 760px) {
    .lfx-hero { grid-template-columns: 1fr; }
    .lfx-search-wrap { width: 100%; }
    .lfx-float-bar { max-width: calc(100vw - 32px); flex-wrap: wrap; justify-content: center; bottom: 16px; }
  }
`;

/* ─── Helpers ───────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Skeleton card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", breakInsideAvoid: "avoid", marginBottom: 14 }}>
      <div className="lfx-sk" style={{ width: "100%", height: 180 }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <div className="lfx-sk" style={{ width: 52, height: 18, borderRadius: 999 }} />
          <div className="lfx-sk" style={{ width: 44, height: 18, borderRadius: 999 }} />
        </div>
        <div className="lfx-sk" style={{ width: "76%", height: 15, marginBottom: 6 }} />
        <div className="lfx-sk" style={{ width: "50%", height: 13 }} />
      </div>
    </div>
  );
}

/* ─── Item card ─────────────────────────────────────────────────── */
function ItemCard({ item, userId, onClaim, onResolve, onDelete, index }) {
  const isLost  = item.type === "lost";
  const cat     = CATEGORY_META[item.category] || CATEGORY_META.other;
  const isOwner = item.postedBy?._id === userId || item.postedBy === userId;
  const isClaimed  = Boolean(item.claimedBy);
  const isResolved = item.status === "resolved";

  return (
    <motion.article
      className="lfx-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: Math.min(index * 0.045, 0.36) }}
    >
      {/* Resolved ribbon */}
      {isResolved && <div className="lfx-resolved-ribbon">✓ Resolved</div>}

      {/* Media */}
      <div className="lfx-card-media">
        {item.photo ? (
          <img src={item.photo} alt={item.title} />
        ) : (
          <div
            className="lfx-card-placeholder"
            style={{
              background: isLost
                ? `linear-gradient(145deg, ${C.orangeL}, #FFE4C4)`
                : `linear-gradient(145deg, ${C.greenL}, #C6F6D5)`,
            }}
          >
            <span style={{ fontSize: "3rem" }}>{isLost ? "🔍" : "📦"}</span>
          </div>
        )}
      </div>

      {/* Always-visible base strip */}
      <div className="lfx-card-base">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <span className="lfx-type-badge" style={{
            background: isLost ? C.orangeL : C.greenL,
            color: isLost ? C.orange : C.green,
            border: `1px solid ${isLost ? "#FDDCAA" : "#BBF7D0"}`,
          }}>
            {isLost ? "Lost" : "Found"}
          </span>
          <span className="lfx-cat-badge" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
            {cat.label}
          </span>
        </div>
        <h3 className="lfx-card-title">{item.title}</h3>
      </div>

      {/* Hover overlay — slides up on hover */}
      <div className="lfx-card-overlay">
        {/* Ghost badges */}
        <div style={{ display: "flex", gap: 5, marginBottom: 9 }}>
          {[isLost ? "Lost" : "Found", cat.label].map((lbl) => (
            <span key={lbl} style={{
              padding: "3px 9px", borderRadius: 999,
              fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase",
              background: "rgba(255,255,255,0.16)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.26)",
            }}>
              {lbl}
            </span>
          ))}
        </div>

        <h3 className="lfx-overlay-title">{item.title}</h3>
        <p className="lfx-overlay-desc">{item.description}</p>

        <div className="lfx-overlay-meta">
          {item.location && (
            <span className="lfx-overlay-meta-item"><MapPin size={11} />{item.location}</span>
          )}
          <span className="lfx-overlay-meta-item"><CalendarDays size={11} />{fmtDate(item.date)}</span>
        </div>

        {!isResolved && (
          <div className="lfx-overlay-actions">
            {!isOwner && !isClaimed && (
              <button
                className={`lfx-mini-btn ${isLost ? "claim-lost" : "claim-found"}`}
                onClick={(e) => { e.stopPropagation(); onClaim(item._id); }}
              >
                <HandHelping size={12} />
                {isLost ? "I found this" : "This is mine"}
              </button>
            )}
            {isClaimed && !isOwner && (
              <span style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.58)", fontStyle: "italic", alignSelf: "center" }}>
                Claimed by {item.claimedBy?.fullName || "someone"}
              </span>
            )}
            {isOwner && (
              <>
                <button
                  className="lfx-mini-btn resolve"
                  onClick={(e) => { e.stopPropagation(); onResolve(item._id); }}
                >
                  <CheckCircle size={12} /> Resolve
                </button>
                <button
                  className="lfx-mini-btn delete"
                  onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Author row */}
        <div className="lfx-overlay-author">
          <div className="lfx-overlay-avatar">
            {(item.postedBy?.fullName || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.68)", fontWeight: 600 }}>
            {item.postedBy?.fullName || "Unknown"} · {timeAgo(item.createdAt)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export function LostFoundPage() {
  const { token, user } = useAuth();
  const userId = user?._id || user?.id || "";

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "lost", category: "other",
    title: "", description: "", location: "",
    date: new Date().toISOString().split("T")[0], photo: "",
  });

  /* ── API ─────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/lost-found", { token });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (catFilter !== "all" && item.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hit = item.title?.toLowerCase().includes(q) ||
                  item.description?.toLowerCase().includes(q) ||
                  item.location?.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  }), [items, filter, catFilter, search]);

  function onFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/lost-found", { token, method: "POST", body: form });
      setItems((prev) => [data.item, ...prev]);
      setShowForm(false);
      setForm({ type: "lost", category: "other", title: "", description: "", location: "", date: new Date().toISOString().split("T")[0], photo: "" });
    } catch (err) {
      setError(err.message || "Failed to post item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim(id) {
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/claim`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) { setError(err.message); }
  }

  async function handleResolve(id) {
    if (!window.confirm("Mark this item as resolved?")) return;
    setError("");
    try {
      const data = await apiRequest(`/lost-found/${id}/resolve`, { token, method: "PATCH" });
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post permanently?")) return;
    setError("");
    try {
      await apiRequest(`/lost-found/${id}`, { token, method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) { setError(err.message); }
  }

  const ease = [0.25, 0.46, 0.45, 0.94];

  return (
    <>
      <style>{CSS}</style>
      <div className="lfx-root">
        <div className="lfx-content">

          {/* ── Hero ───────────────────────────── */}
          <motion.section
            className="lfx-hero"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease }}
          >
            <div>
              <h1 className="lfx-hero-title">Lost &amp; Found</h1>
              <p className="lfx-hero-sub">
                Report missing items, post found objects, and help residents reunite quickly through one organized board.
              </p>
            </div>

            <div className="lfx-search-wrap">
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, pointerEvents: "none" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lfx-input"
                placeholder="Search items, location…"
                style={{ paddingLeft: 32, paddingRight: search ? 32 : 12 }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: C.faint, cursor: "pointer", display: "flex" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </motion.section>

          {/* ── Error ──────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="lf-error"
                className="lfx-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                {error}
                <button onClick={() => setError("")} style={{ marginLeft: "auto", border: "none", background: "none", color: C.red, cursor: "pointer", display: "flex" }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Post Item form ──────────────────── */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                key="lf-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                style={{ overflow: "hidden" }}
              >
                <section className="lfx-block" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${C.indigo}, ${C.orange})`,
                  }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
                    Report Lost or Found Item
                  </h2>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label className="lfx-form-label">Type *</label>
                        <select name="type" value={form.type} onChange={onFormChange} className="lfx-input">
                          <option value="lost">Lost — I'm looking for this</option>
                          <option value="found">Found — I found this</option>
                        </select>
                      </div>
                      <div>
                        <label className="lfx-form-label">Category *</label>
                        <select name="category" value={form.category} onChange={onFormChange} className="lfx-input">
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="lfx-form-label">Title *</label>
                      <input name="title" value={form.title} onChange={onFormChange} className="lfx-input" placeholder="e.g. Lost blue umbrella near gym" required />
                    </div>

                    <div>
                      <label className="lfx-form-label">Description *</label>
                      <textarea name="description" value={form.description} onChange={onFormChange} rows={3} className="lfx-input" placeholder="Describe color, brand, size, and key identifiers" required style={{ resize: "vertical", minHeight: 82 }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label className="lfx-form-label">Location</label>
                        <input name="location" value={form.location} onChange={onFormChange} className="lfx-input" placeholder="Near Gate B, Parking Lot…" />
                      </div>
                      <div>
                        <label className="lfx-form-label">Date *</label>
                        <input name="date" type="date" value={form.date} onChange={onFormChange} className="lfx-input" required />
                      </div>
                    </div>

                    <div>
                      <label className="lfx-form-label">Photo URL (optional)</label>
                      <input name="photo" value={form.photo} onChange={onFormChange} className="lfx-input" placeholder="Paste an image URL" />
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="submit" className="lfx-btn-primary" disabled={submitting}>
                        {submitting ? "Posting…" : <><Plus size={13} /> Post Item</>}
                      </button>
                      <button type="button" className="lfx-btn-soft" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                  </form>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Category chips + Refresh ────────── */}
          <motion.div
            className="lfx-cat-bar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.1 }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`lfx-chip${catFilter === c ? " active" : ""}`}
                onClick={() => setCatFilter(catFilter === c ? "all" : c)}
              >
                {CATEGORY_META[c].label}
              </button>
            ))}
            <button className="lfx-btn-soft" style={{ marginLeft: "auto" }} onClick={load} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "lfx-spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </motion.div>

          {/* ── Masonry grid ───────────────────── */}
          {loading ? (
            <div className="lfx-masonry">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <motion.section
              className="lfx-block"
              style={{ textAlign: "center", padding: "60px 28px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={{
                width: 60, height: 60, margin: "0 auto 14px",
                borderRadius: 16, border: `1px solid ${C.indigoBr}`,
                background: C.indigoL, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PackageSearch size={26} color={C.indigo} />
              </div>
              <p style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>
                {search || filter !== "all" || catFilter !== "all" ? "No posts match your filters" : "Nothing posted yet"}
              </p>
              <p style={{ margin: "0 0 18px", color: C.muted, fontSize: "0.84rem" }}>
                {search || filter !== "all" || catFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Be the first to report a lost or found item."}
              </p>
              {!showForm && (
                <button className="lfx-btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={13} /> Post Item
                </button>
              )}
            </motion.section>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filter}-${catFilter}-${search}`}
                className="lfx-masonry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                {visible.map((item, i) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    userId={userId}
                    onClaim={handleClaim}
                    onResolve={handleResolve}
                    onDelete={handleDelete}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Floating bottom toolbar ─────────── */}
        <motion.div
          className="lfx-float-bar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.18 }}
        >
          {[
            { key: "all",   label: "All"   },
            { key: "lost",  label: "Lost"  },
            { key: "found", label: "Found" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`lfx-bar-chip${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}

          <div className="lfx-bar-divider" />

          <button className="lfx-bar-post" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Post Item</>}
          </button>
        </motion.div>
      </div>
    </>
  );
}
