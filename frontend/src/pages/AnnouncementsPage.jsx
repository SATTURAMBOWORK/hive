import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Bell, CalendarDays, Megaphone, Plus, RefreshCw, Search, Users, Wallet, X } from "lucide-react";
import ReactQuill from "react-quill";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import "react-quill/dist/quill.snow.css";

/* ─────────────────────────────────────────────────────────────
   CATEGORY DEFINITIONS
   Brand colors: orange=General, green=Finance, indigo=Event, blue=Social
───────────────────────────────────────────────────────────── */
const CATS = {
  General: { color: "#fff", bg: "#E8890C", accent: "#E8890C", Icon: Bell },
  Finance: { color: "#fff", bg: "#16A34A", accent: "#16A34A", Icon: Wallet },
  Event:   { color: "#fff", bg: "#4F46E5", accent: "#4F46E5", Icon: CalendarDays },
  Social:  { color: "#fff", bg: "#2563EB", accent: "#2563EB", Icon: Users },
};

const CAT_CHIPS = [
  { key: "All",     label: "All",     Icon: null         },
  { key: "General", label: "General", Icon: Bell         },
  { key: "Finance", label: "Finance", Icon: Wallet       },
  { key: "Event",   label: "Event",   Icon: CalendarDays },
  { key: "Social",  label: "Social",  Icon: Users        },
];

const CAT_LIST = ["General", "Finance", "Event", "Social"];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function catOf(item) {
  return item?.category && CATS[item.category] ? item.category : "General";
}

function timeAgo(value) {
  if (!value) return "just now";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "just now";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function htmlToPlain(v) {
  return (v || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/* ─────────────────────────────────────────────────────────────
   REACT-QUILL CONFIG
───────────────────────────────────────────────────────────── */
const editorModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"], ["clean"],
  ],
};
const editorFormats = ["header", "bold", "italic", "underline", "list", "bullet", "link"];

/* ─────────────────────────────────────────────────────────────
   ANIMATION CONFIG
───────────────────────────────────────────────────────────── */
const spring = { type: "spring", stiffness: 300, damping: 24, mass: 0.8 };
const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: spring };

/* ─────────────────────────────────────────────────────────────
   STYLESHEET
   Font: Plus Jakarta Sans (matches Dashboard) + Cormorant Garamond for titles
───────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&display=swap');

  .ann-root *, .ann-root *::before, .ann-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ann-root {
    min-height: calc(100vh - 64px);
    padding: 32px 32px 80px;
    background: #FAFAFC;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1C1C1E;
  }

  .ann-shell {
    max-width: 1320px;
    margin: 0 auto;
  }

  /* ── Keyframes ─────────────────────────────── */
  @keyframes annSpin    { to { transform: rotate(360deg); } }
  @keyframes annShimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  /* ── Page heading ─────────────────────────── */
  .ann-page-head {
    margin-bottom: 24px;
  }
  .ann-page-title {
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #1C1C1E;
    line-height: 1.15;
    margin-bottom: 4px;
  }
  .ann-page-title em { font-style: italic; color: #4F46E5; }
  .ann-page-sub {
    color: #6B7280;
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.5;
  }

  /* ── Controls bar ─────────────────────────── */
  .ann-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  /* ── Segmented chip rail ─────────────────── */
  .ann-chips-rail {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1.5px solid #E8E8ED;
    flex-shrink: 0;
  }

  .ann-cat-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    outline: none;
    padding: 0;
  }

  /* Sliding indigo underline — sits at bottom of active chip */
  .ann-chip-underline {
    position: absolute;
    bottom: -1.5px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: #4F46E5;
    border-radius: 2px 2px 0 0;
  }

  /* Icon + label */
  .ann-chip-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 9px;
  }

  .ann-search-wrap { display: flex; flex-direction: column; gap: 3px; margin-left: auto; }
  .ann-search-label { font-size: 0.68rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.04em; text-transform: uppercase; }
  .ann-search {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    border: 1.5px solid #E8E8ED;
    background: #FFFFFF;
    padding: 8px 12px;
    min-width: 200px;
    transition: border-color 0.18s, box-shadow 0.18s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .ann-search:focus-within {
    border-color: #E8890C;
    box-shadow: 0 0 0 3px rgba(232,137,12,0.12);
  }
  .ann-search input {
    border: none; outline: none; background: transparent; color: #1C1C1E;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600; width: 100%;
  }
  .ann-search input::placeholder { color: #9CA3AF; font-weight: 500; }

  .ann-compose-btn {
    display: inline-flex; align-items: center; gap: 9px; padding: 8px 8px 8px 15px;
    border-radius: 999px; border: 1.5px solid #E8E8ED; background: #FFFFFF;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.78rem; font-weight: 700; color: #374151;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    white-space: nowrap;
  }
  .ann-compose-btn:hover {
    border-color: #E8890C; transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232,137,12,0.18);
    color: #92400E;
  }
  .ann-compose-icon {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, #E8890C, #C97508);
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 6px rgba(232,137,12,0.35);
  }
  .ann-compose-btn:hover .ann-compose-icon { transform: scale(1.12) rotate(12deg); }

  .ann-refresh-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 12px;
    border: 1.5px solid #E8E8ED; background: #FFFFFF;
    cursor: pointer; transition: all 0.2s; color: #6B7280;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .ann-refresh-btn:hover { border-color: #D1D5DB; color: #374151; transform: translateY(-1px); }

  /* ── 3-col card grid ──────────────────────── */
  .ann-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    /* default align-items: stretch — all cards in a row match the tallest */
  }
  @media (max-width: 900px) { .ann-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 580px) { .ann-grid { grid-template-columns: 1fr; } }

  /* ── Card ─────────────────────────────────── */
  .ann-card {
    position: relative;
    background: #FFFFFF;
    border: 1px solid #E8E8ED;
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04);
    overflow: hidden;
    will-change: transform;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .ann-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
    border-color: #D1D5DB;
  }
  .ann-card.unread { border-color: rgba(232,137,12,0.35); }

  /* Thin top colour strip — the only category colour on the card */
  .ann-card-stripe {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }

  /* Card body — all the content */
  .ann-card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 16px 18px 14px;
  }

  /* Meta row: category label + dot + time */
  .ann-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .ann-cat-label {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ann-meta-dot {
    width: 3px; height: 3px; border-radius: 50%;
    background: #D1D5DB; flex-shrink: 0;
  }
  .ann-card-time {
    font-size: 0.68rem; font-weight: 600; color: #9CA3AF;
    margin-left: auto;
  }

  /* Title: bold, clamped to 2 lines */
  .ann-card-title {
    font-size: 0.94rem;
    font-weight: 800;
    line-height: 1.35;
    color: #1C1C1E;
    letter-spacing: -0.2px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }

  /* Preview: muted, clamped to 3 lines, fills remaining space */
  .ann-card-preview {
    font-size: 0.82rem;
    font-weight: 500;
    color: #6B7280;
    line-height: 1.65;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  /* Footer sits at the bottom, separated by a hairline */
  .ann-card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px 12px;
    border-top: 1px solid #F3F4F6;
    margin-top: 14px;
  }
  .ann-card-author { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
  .ann-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: #1C1C1E;
    color: #fff; font-size: 0.58rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ann-author-name {
    font-size: 0.72rem; font-weight: 700; color: #374151;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ann-card-read-cta {
    font-size: 0.68rem; font-weight: 800; color: #9CA3AF;
    letter-spacing: 0.04em; text-transform: uppercase;
    display: flex; align-items: center; gap: 3px; flex-shrink: 0;
    transition: color 0.15s;
  }
  .ann-card:hover .ann-card-read-cta { color: #4F46E5; }
  .ann-new-badge {
    font-size: 0.58rem; font-weight: 800; letter-spacing: 0.06em;
    color: #C97508; background: #FEF3C7; padding: 2px 8px;
    border-radius: 999px; border: 1px solid #FDE68A; flex-shrink: 0;
  }

  /* ── Skeleton ─────────────────────────────── */
  .ann-sk {
    border-radius: 6px;
    background: linear-gradient(90deg, #F3F4F6 25%, #EAECEF 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: annShimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty state ──────────────────────────── */
  .ann-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 64px 24px;
    border: 1.5px dashed #D1D5DB;
    border-radius: 20px;
    background: rgba(255,255,255,0.55);
  }
  .ann-empty-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: #FFF3E0; color: #E8890C;
    display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
    box-shadow: 0 4px 12px rgba(232,137,12,0.18);
  }
  .ann-empty h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .ann-empty p  { font-size: 0.84rem; color: #9CA3AF; font-weight: 500; }

  /* ── Error ────────────────────────────────── */
  .ann-error {
    padding: 10px 14px; border-radius: 12px;
    border: 1px solid #FECACA; background: #FEF2F2;
    color: #B91C1C; font-size: 0.82rem; font-weight: 700;
    margin-bottom: 14px;
  }

  /* ── Compose form wrap ───────────────────── */
  .ann-form-wrap {
    background: #FFFFFF;
    border: 1.5px solid #E8E8ED;
    border-radius: 20px;
    padding: 22px 22px 18px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    overflow: hidden;
  }
  .ann-form-title {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: #1C1C1E;
    margin-bottom: 16px;
  }
  .ann-field-label {
    display: block;
    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em;
    text-transform: uppercase; color: #6B7280; margin-bottom: 6px;
  }
  .ann-field-input {
    width: 100%; border: 1.5px solid #E8E8ED; border-radius: 10px;
    padding: 9px 12px; background: #FAFAFA;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.84rem; font-weight: 600;
    color: #1C1C1E; outline: none; transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-field-input:focus { border-color: #E8890C; box-shadow: 0 0 0 3px rgba(232,137,12,0.11); }
  .ann-field-select {
    width: 100%; border: 1.5px solid #E8E8ED; border-radius: 10px;
    padding: 9px 12px; background: #FAFAFA;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.84rem; font-weight: 600;
    color: #1C1C1E; outline: none; cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-field-select:focus { border-color: #E8890C; box-shadow: 0 0 0 3px rgba(232,137,12,0.11); }

  /* ReactQuill reset & override */
  .ann-editor-wrap .ql-container.ql-snow {
    border: none; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ann-editor-wrap .ql-toolbar.ql-snow {
    border: none; border-bottom: 1.5px solid #E8E8ED;
    padding: 8px 0; background: transparent;
  }
  .ann-editor-wrap {
    border: 1.5px solid #E8E8ED; border-radius: 10px;
    background: #FAFAFA; overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s;
    min-height: 140px;
  }
  .ann-editor-wrap:focus-within {
    border-color: #E8890C; box-shadow: 0 0 0 3px rgba(232,137,12,0.11);
    background: #FFFFFF;
  }
  .ann-editor-wrap .ql-editor {
    min-height: 110px; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.9rem; font-weight: 500; color: #1C1C1E; line-height: 1.7;
  }
  .ann-editor-wrap .ql-editor.ql-blank::before {
    color: #9CA3AF; font-style: normal;
  }

  .ann-form-actions { display: flex; gap: 8px; margin-top: 14px; }

  .ann-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid #E8890C; background: #E8890C;
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 800; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 2px 8px rgba(232,137,12,0.28);
  }
  .ann-btn-primary:hover:not(:disabled) { background: #C97508; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,137,12,0.36); }
  .ann-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .ann-btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid #E8E8ED; background: #FFFFFF;
    color: #6B7280; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .ann-btn-ghost:hover:not(:disabled) { border-color: #D1D5DB; color: #374151; transform: translateY(-1px); }
  .ann-btn-ghost:disabled { opacity: 0.55; cursor: not-allowed; }

  /* ── Load more ────────────────────────────── */
  .ann-load-more { display: flex; justify-content: center; margin-top: 24px; }

  /* ── Smart Modal ──────────────────────────── */
  .ann-backdrop {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ann-backdrop-blur {
    position: absolute; inset: 0;
    background: rgba(17, 24, 39, 0.38);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .ann-modal {
    position: relative; z-index: 201;
    background: #FFFFFF;
    width: 100%; max-width: 680px;
    max-height: 88vh;
    border-radius: 26px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.5) inset,
      0 8px 24px rgba(0,0,0,0.12),
      0 32px 64px rgba(0,0,0,0.18);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  .ann-modal-close {
    position: absolute; top: 18px; right: 18px; z-index: 10;
    width: 34px; height: 34px; border-radius: 50%;
    background: #F3F4F6; color: #4B5563; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .ann-modal-close:hover { background: #E5E7EB; color: #111827; transform: rotate(90deg); }

  .ann-modal-head {
    padding: 30px 30px 22px;
    border-bottom: 1px solid #F3F4F6;
    background: #FAFAFA;
    flex-shrink: 0;
  }
  .ann-modal-head-meta {
    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  }
  .ann-modal-time { font-size: 0.78rem; font-weight: 600; color: #9CA3AF; }
  .ann-modal-title {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.15;
    color: #1C1C1E;
  }

  .ann-modal-body {
    padding: 28px 30px; flex: 1; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: #E5E7EB transparent;
  }
  .ann-modal-body::-webkit-scrollbar { width: 5px; }
  .ann-modal-body::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 999px; }

  /* Rich text content styles */
  .ann-rich { color: #374151; font-size: 0.97rem; line-height: 1.85; font-weight: 500; }
  .ann-rich p  { margin-bottom: 14px; }
  .ann-rich h2, .ann-rich h3 { color: #1C1C1E; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; margin: 22px 0 10px; }
  .ann-rich ul, .ann-rich ol  { margin: 0 0 14px 22px; }
  .ann-rich li { margin-bottom: 4px; }
  .ann-rich a  { color: #4F46E5; text-decoration: underline; font-weight: 700; }
  .ann-rich strong { color: #1C1C1E; }

  .ann-modal-foot {
    padding: 16px 30px;
    border-top: 1px solid #F3F4F6;
    background: #FAFAFA;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    flex-shrink: 0;
  }
`;

/* ─────────────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="ann-card" style={{ cursor: "default" }}>
      <div className="ann-sk ann-card-stripe" />
      <div className="ann-card-body">
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <div className="ann-sk" style={{ width: 52, height: 10 }} />
          <div className="ann-sk" style={{ width: 40, height: 10 }} />
        </div>
        <div className="ann-sk" style={{ width: "80%", height: 14, marginBottom: 6 }} />
        <div className="ann-sk" style={{ width: "55%", height: 14, marginBottom: 12 }} />
        <div className="ann-sk" style={{ width: "95%", height: 11, marginBottom: 5 }} />
        <div className="ann-sk" style={{ width: "75%", height: 11, marginBottom: 5 }} />
        <div className="ann-sk" style={{ width: "60%", height: 11 }} />
      </div>
      <div className="ann-card-footer">
        <div className="ann-sk" style={{ width: 26, height: 26, borderRadius: "50%" }} />
        <div className="ann-sk" style={{ width: 90, height: 10 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CATEGORY PILL
───────────────────────────────────────────────────────────── */
function CategoryPill({ category }) {
  const c = CATS[category] || CATS.General;
  return (
    <span className="ann-cat-label" style={{ color: c.accent }}>
      {category}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANNOUNCEMENT CARD
   Uses layoutId on container, title, preview-wrapper, and footer
   so Framer Motion can morph them into the modal.
───────────────────────────────────────────────────────────── */
function AnnCard({ item, unread, onOpen, index }) {
  const cat   = catOf(item);
  const c     = CATS[cat] || CATS.General;
  const plain = useMemo(() => htmlToPlain(item.body || ""), [item.body]);

  return (
    <motion.article
      layoutId={`ann-card-${item._id}`}
      className={`ann-card${unread ? " unread" : ""}`}
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ ...spring, delay: Math.min(index * 0.04, 0.2) }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thin category colour stripe at the very top */}
      <div className="ann-card-stripe" style={{ background: c.accent }} />

      <div className="ann-card-body">
        {/* Meta: category label · time */}
        <motion.div layoutId={`ann-top-${item._id}`} className="ann-card-meta">
          <CategoryPill category={cat} />
          <span className="ann-meta-dot" />
          <span className="ann-card-time">{timeAgo(item.createdAt)}</span>
          {unread && <span className="ann-new-badge" style={{ marginLeft: "auto" }}>NEW</span>}
        </motion.div>

        {/* Title — 2-line clamp keeps height predictable */}
        <motion.h3 layoutId={`ann-title-${item._id}`} className="ann-card-title">
          {item.title}
        </motion.h3>

        {/* Preview — 3-line clamp fills remaining flex space */}
        <motion.div layoutId={`ann-preview-${item._id}`} className="ann-card-preview">
          {plain || "No content"}
        </motion.div>
      </div>

      {/* Footer — pinned to bottom by border-top + margin-top on body */}
      <motion.div layoutId={`ann-foot-${item._id}`} className="ann-card-footer">
        <div className="ann-card-author">
          <span className="ann-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
          <span className="ann-author-name">{item.createdBy?.fullName || "Committee"}</span>
        </div>
        <span className="ann-card-read-cta">
          Read <span style={{ fontSize: "0.8rem" }}>→</span>
        </span>
      </motion.div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────────────────────────
   SMART MODAL
   The expanding card: layoutId connects it to the card in the grid.
   The card's top/title/footer morph into the modal equivalents.
   The body animates in separately with a slight delay (different content).
───────────────────────────────────────────────────────────── */
function SmartModal({ item, onClose }) {
  const cat = catOf(item);

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ann-backdrop">
      {/* Blurred backdrop — click to close */}
      <motion.div
        className="ann-backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
      />

      {/* Modal container — shares layoutId with the card */}
      <motion.div
        layoutId={`ann-card-${item._id}`}
        className="ann-modal"
        transition={spring}
      >
        <button className="ann-modal-close" onClick={onClose}>
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header — shares layoutId with card-top */}
        <motion.div layoutId={`ann-top-${item._id}`} className="ann-modal-head">
          <div className="ann-modal-head-meta">
            <CategoryPill category={cat} />
            <span className="ann-modal-time">{timeAgo(item.createdAt)}</span>
          </div>
          {/* Title — shares layoutId with card title */}
          <motion.h2 layoutId={`ann-title-${item._id}`} className="ann-modal-title">
            {item.title}
          </motion.h2>
        </motion.div>

        {/* Body — animates in after layout morph settles */}
        <div className="ann-modal-body">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.28 }}
          >
            {/*
              We don't reuse layoutId here because the content changes
              (plain text → rich HTML). Instead we fade the rich body in
              after the morph completes.
            */}
            <div
              className="ann-rich"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.body || "<p>No content available.</p>") }}
            />
          </motion.div>
        </div>

        {/* Footer — shares layoutId with card footer */}
        <motion.div layoutId={`ann-foot-${item._id}`} className="ann-modal-foot">
          <div className="ann-card-author">
            <span className="ann-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
            <div>
              <div className="ann-author-name">{item.createdBy?.fullName || "Committee Member"}</div>
              <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontWeight: 500 }}>Posted by</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSE FORM
───────────────────────────────────────────────────────────── */
function ComposeForm({ onPost, onCancel, submitting, error }) {
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("<p></p>");
  const [category, setCategory] = useState("General");
  const plainBody = useMemo(() => htmlToPlain(body), [body]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !plainBody) return;
    onPost({ title, body, category });
  }

  return (
    <motion.div
      className="ann-form-wrap"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring}
      style={{ overflow: "hidden" }}
    >
      <h2 className="ann-form-title">Post a community notice</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label className="ann-field-label">Category</label>
            <select className="ann-field-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CAT_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="ann-field-label">Title</label>
            <input
              className="ann-field-input"
              placeholder="e.g. Water supply maintenance tomorrow"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <label className="ann-field-label">Message</label>
        <div className="ann-editor-wrap">
          <ReactQuill
            theme="snow"
            modules={editorModules}
            formats={editorFormats}
            value={body}
            onChange={setBody}
            placeholder="Write the announcement body..."
          />
        </div>

        {error && <div className="ann-error" style={{ marginTop: 10 }}>{error}</div>}

        <div className="ann-form-actions">
          <button
            type="submit"
            className="ann-btn-primary"
            disabled={submitting || !title.trim() || !plainBody}
          >
            <Megaphone size={13} />
            {submitting ? "Posting…" : "Post announcement"}
          </button>
          <button type="button" className="ann-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export function AnnouncementsPage() {
  const { token, user } = useAuth();

  /* ── state ── */
  const [items,          setItems]          = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchInput,    setSearchInput]    = useState("");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [error,          setError]          = useState("");
  const [formError,      setFormError]      = useState("");
  const [loading,        setLoading]        = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [selectedItem,   setSelectedItem]   = useState(null);

  const readInFlight = useRef(new Set());
  const canCreate    = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);

  /* ── debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 260);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── fetch ── */
  const loadItems = useCallback(async ({ targetPage = 1, append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({ page: String(targetPage), limit: "15" });
      if (activeCategory !== "All") p.set("category", activeCategory);
      if (searchQuery) p.set("q", searchQuery);
      const data = await apiRequest(`/announcements?${p}`, { token });
      const next = data.items || [];
      setItems(prev => append ? [...prev, ...next] : next);
      setPage(data.page || targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err.message || "Unable to load announcements");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, searchQuery, token]);

  useEffect(() => { loadItems({ targetPage: 1 }); }, [loadItems]);

  /* ── mark read ── */
  const markRead = useCallback(async (id) => {
    if (!id || readInFlight.current.has(id)) return;
    readInFlight.current.add(id);
    setItems(prev => prev.map(it => it._id === id ? { ...it, unread: false } : it));
    try {
      await apiRequest(`/announcements/${id}/read`, { method: "PATCH", token });
    } catch (_) {}
    finally { readInFlight.current.delete(id); }
  }, [token]);

  /* ── open card detail ── */
  function openDetail(item) {
    setSelectedItem(item);
    if (item.unread) markRead(item._id);
  }

  /* ── create announcement ── */
  async function handlePost({ title, body, category }) {
    setSubmitting(true);
    setFormError("");
    try {
      const data = await apiRequest("/announcements", {
        method: "POST",
        token,
        body: { title, body, category },
      });
      setItems(prev => [data.item, ...prev]);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Unable to create announcement");
    } finally {
      setSubmitting(false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>
      <div className="ann-root">
        <div className="ann-shell">

          {/* Page heading */}
          <motion.div className="ann-page-head" {...fadeUp}>
            <h1 className="ann-page-title">
              Community <em>Announcements</em>
            </h1>
            <p className="ann-page-sub">
              Official updates, notices, and events — all in one place.
            </p>
          </motion.div>

          {/* Controls: chips + search + compose */}
          <motion.div
            className="ann-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, ...spring }}
          >
            {/*
              Sliding bubble chip rail.
              Each chip is a motion.button. When a chip becomes active it renders
              a motion.div with layoutId="active-category-bg". Framer Motion sees
              only ONE element with that id at a time and animates it sliding from
              the old active chip to the new one — no JS position math needed.

              whileHover="chip-hover" propagates the gesture name down to any child
              motion element that declares a matching variants key, so the icon
              springs when you hover the whole button, not just the icon itself.
            */}
            <div className="ann-chips-rail">
              {CAT_CHIPS.map(({ key, label, Icon }) => {
                const isActive = activeCategory === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    className="ann-cat-chip"
                    onClick={() => setActiveCategory(key)}
                    animate={{ color: isActive ? "#1C1C1E" : "#6B7280" }}
                    variants={!isActive ? { "chip-hover": { color: "#374151" } } : {}}
                    whileHover="chip-hover"
                    whileTap={{ scale: 0.96 }}
                    transition={{ color: { duration: 0.14 } }}
                  >
                    {/* Sliding indigo underline — same layoutId trick, now a 2px line */}
                    {isActive && (
                      <motion.div
                        layoutId="active-category-bg"
                        className="ann-chip-underline"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}

                    <span className="ann-chip-inner">
                      {Icon && (
                        <motion.span
                          style={{ display: "inline-flex" }}
                          variants={!isActive ? {
                            "chip-hover": { rotate: 10, scale: 1.18 },
                          } : {}}
                          transition={{ type: "spring", stiffness: 420, damping: 16 }}
                        >
                          <Icon size={12} strokeWidth={2.5} />
                        </motion.span>
                      )}
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Search */}
            <div className="ann-search-wrap">
              <span className="ann-search-label">Search</span>
              <div className="ann-search">
                <Search size={13} color="#9CA3AF" />
                <input
                  type="search"
                  placeholder="Search announcements…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            {/* Compose (admins only) */}
            {canCreate && (
              <button type="button" className="ann-compose-btn" onClick={() => setShowForm(v => !v)}>
                {showForm ? "discard draft" : "compose notice"}
                <span className="ann-compose-icon">
                  {showForm ? <X size={14} /> : <Plus size={14} />}
                </span>
              </button>
            )}

            {/* Refresh */}
            <button type="button" className="ann-refresh-btn" onClick={() => loadItems()} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? "annSpin 1s linear infinite" : "none" }} />
            </button>
          </motion.div>

          {/* Compose form (animated in/out) */}
          <AnimatePresence>
            {canCreate && showForm && (
              <ComposeForm
                key="compose"
                onPost={handlePost}
                onCancel={() => setShowForm(false)}
                submitting={submitting}
                error={formError}
              />
            )}
          </AnimatePresence>

          {/* Page-level error */}
          {error && !showForm && <div className="ann-error">{error}</div>}

          {/* Card grid */}
          <motion.div className="ann-grid" layout>
            <AnimatePresence mode="popLayout">
              {loading && [0,1,2,3,4,5].map(i => (
                <motion.div key={`sk-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SkeletonCard />
                </motion.div>
              ))}

              {!loading && items.length === 0 && (
                <motion.div
                  className="ann-empty"
                  key="empty"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="ann-empty-icon"><Megaphone size={22} /></div>
                  <h3>No announcements yet</h3>
                  <p>The first update from your community will appear here.</p>
                </motion.div>
              )}

              {!loading && items.map((item, index) => (
                <AnnCard
                  key={item._id}
                  item={item}
                  unread={Boolean(item.unread)}
                  onOpen={openDetail}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Load more */}
          {!loading && hasMore && (
            <div className="ann-load-more">
              <button
                type="button"
                className="ann-btn-ghost"
                onClick={() => loadItems({ targetPage: page + 1, append: true })}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load older notices"}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Smart Modal (outside ann-root so it's full-screen fixed) */}
      <AnimatePresence>
        {selectedItem && (
          <SmartModal
            key={selectedItem._id}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
