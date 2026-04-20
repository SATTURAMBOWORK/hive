import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Bell, CalendarDays, ChevronRight, Megaphone, Plus, RefreshCw, Search, Users, Wallet, X } from "lucide-react";
import ReactQuill from "react-quill";
import { apiRequest } from "../components/api";
import { useAuth } from "../components/AuthContext";
import "react-quill/dist/quill.snow.css";

const CATS = {
  General:  { color: "#fff", bg: "#E8890C", border: "#E8890C", accent: "#E8890C", Icon: Bell,         sub: "Bell"        },
  Finance:  { color: "#fff", bg: "#16A34A", border: "#16A34A", accent: "#16A34A", Icon: Wallet,       sub: "Wallet"      },
  Event:    { color: "#fff", bg: "#7C3AED", border: "#7C3AED", accent: "#7C3AED", Icon: CalendarDays, sub: "CalendarDays"},
  Social:   { color: "#fff", bg: "#2563EB", border: "#2563EB", accent: "#2563EB", Icon: Users,        sub: "Users"       },
};

const CAT_CHIPS = [
  { key: "All",     label: "All",     Icon: null,         sub: "",            inactiveBg: "#F3F4F6", inactiveColor: "#4B5563", activeBg: "#111827", activeColor: "#fff" },
  { key: "General", label: "General", Icon: Bell,         sub: "Bell",        inactiveBg: "#FEF3C7", inactiveColor: "#92400E", activeBg: "#E8890C", activeColor: "#fff" },
  { key: "Finance", label: "Finance", Icon: Wallet,       sub: "Wallet",      inactiveBg: "#DCFCE7", inactiveColor: "#14532D", activeBg: "#16A34A", activeColor: "#fff" },
  { key: "Event",   label: "Event",   Icon: CalendarDays, sub: "CalendarDays",inactiveBg: "#EDE9FE", inactiveColor: "#4C1D95", activeBg: "#7C3AED", activeColor: "#fff" },
  { key: "Social",  label: "Social",  Icon: Users,        sub: "Users",       inactiveBg: "#DBEAFE", inactiveColor: "#1E3A8A", activeBg: "#2563EB", activeColor: "#fff" },
];

const CAT_LIST = ["General", "Finance", "Event", "Social"];

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

function htmlToPlainText(v) {
  return (v || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const editorModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"], ["clean"],
  ],
};
const editorFormats = ["header", "bold", "italic", "underline", "list", "bullet", "link"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap');

  .ann-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .ann-root {
    min-height: calc(100vh - 64px);
    padding: 40px 24px 80px;
    background: linear-gradient(120deg, #FFE8D4 0%, #FFF5EE 28%, #EEF2FF 60%, #E3EEFF 100%);
    font-family: 'Manrope', sans-serif;
    color: #111827;
    position: relative;
  }

  .ann-shell {
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
  }

  @keyframes annRise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes annSpin { to { transform: rotate(360deg); } }
  @keyframes annSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes annShimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  .ann-enter {
    opacity: 0;
    animation: annRise 0.44s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Page heading ─────────────────────────── */
  .ann-page-head {
    text-align: center;
    margin-bottom: 32px;
    animation: annRise 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ann-page-title {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 400;
    letter-spacing: -0.03em;
    color: #111827;
    line-height: 1.1;
  }
  .ann-page-title strong {
    font-weight: 800;
  }
  .ann-page-sub {
    margin-top: 10px;
    color: #6B7280;
    font-size: 0.92rem;
    font-weight: 500;
    max-width: 540px;
    margin-left: auto;
    margin-right: auto;
  }

  /* ── Controls bar ─────────────────────────── */
  .ann-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    animation: annRise 0.5s 0.06s cubic-bezier(0.22,1,0.36,1) both;
  }

  /* category chip */
  .ann-cat-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    border-radius: 999px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
    font-family: 'Manrope', sans-serif;
  }
  .ann-cat-chip:hover { transform: translateY(-1px); }
  .ann-cat-chip-text { display: flex; flex-direction: column; line-height: 1.2; }
  .ann-cat-chip-label { font-size: 0.78rem; font-weight: 800; }
  .ann-cat-chip-sub   { font-size: 0.62rem; font-weight: 600; opacity: 0.72; }

  /* search */
  .ann-search-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-left: auto;
  }
  .ann-search-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6B7280;
  }
  .ann-search {
    display: flex;
    align-items: center;
    gap: 7px;
    border-radius: 12px;
    border: 1.5px solid #E5E7EB;
    background: #FFFFFF;
    padding: 8px 12px;
    min-width: 220px;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-search:focus-within {
    border-color: #C97508;
    box-shadow: 0 0 0 3px rgba(232,137,12,0.14);
  }
  .ann-search input {
    border: none; outline: none; background: transparent;
    color: #111827; font-family: 'Manrope', sans-serif;
    font-size: 0.81rem; font-weight: 600; width: 100%;
  }
  .ann-search input::placeholder { color: #9CA3AF; font-weight: 500; }

  /* compose button */
  .ann-compose-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 8px 8px 8px 14px;
    border-radius: 999px;
    border: 1.5px solid #E5E7EB;
    background: #FFFFFF;
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
    font-family: 'Manrope', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    color: #374151;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .ann-compose-btn:hover {
    border-color: #E8890C;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(232,137,12,0.16);
  }
  .ann-compose-icon {
    width: 30px; height: 30px; border-radius: 50%;
    background: #E8890C;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ann-compose-btn:hover .ann-compose-icon { transform: scale(1.12) rotate(12deg); }

  /* ── 3-col card grid ──────────────────────── */
  .ann-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (max-width: 900px) { .ann-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 600px) { .ann-grid { grid-template-columns: 1fr; } }

  /* ── Card ─────────────────────────────────── */
  .ann-card {
    position: relative;
    background: #FFFFFF;
    border: 1.5px solid #E5E7EB;
    border-radius: 18px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.22s cubic-bezier(0.22,1,0.36,1),
                border-color 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05);
    overflow: hidden;
  }
  .ann-card::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--cat-accent, #E8890C);
    border-radius: 18px 0 0 18px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .ann-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    border-color: #D1D5DB;
  }
  .ann-card.active, .ann-card.unread {
    border-color: rgba(232,137,12,0.4);
  }
  .ann-card.active::after, .ann-card:hover::after { opacity: 1; }
  .ann-card.unread { background: #FFFBF5; }

  .ann-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 10px;
  }
  .ann-card-top-left { display: flex; align-items: center; gap: 6px; }

  .ann-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.66rem; font-weight: 800;
    letter-spacing: 0.02em;
  }

  .ann-card-time {
    font-size: 0.68rem; font-weight: 600; color: #9CA3AF;
  }
  .ann-card-unread-badge {
    font-size: 0.62rem; font-weight: 800; letter-spacing: 0.05em;
    color: #9CA3AF;
  }

  .ann-card-title-row {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
  }
  .ann-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.3;
    color: #111827;
    transition: color 0.18s;
    flex: 1;
  }
  .ann-card:hover .ann-card-title { color: #E8890C; }
  .ann-card-arrow {
    color: #9CA3AF; flex-shrink: 0; margin-top: 2px;
    transition: color 0.18s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ann-card:hover .ann-card-arrow { color: #E8890C; transform: translateX(3px); }

  .ann-card-preview {
    margin-top: 8px;
    font-size: 0.81rem; font-weight: 500; color: #6B7280;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ann-card-footer {
    margin-top: 14px;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .ann-card-author {
    display: flex; align-items: center; gap: 7px;
  }
  .ann-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #E8890C, #C97508);
    color: #fff; font-size: 0.62rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ann-avatar img {
    width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
  }
  .ann-author-name {
    font-size: 0.74rem; font-weight: 700; color: #374151;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;
  }
  .ann-new-badge {
    font-size: 0.62rem; font-weight: 800; letter-spacing: 0.05em;
    color: #C97508; background: #FEF3C7;
    padding: 2px 8px; border-radius: 999px; border: 1px solid #FDE68A;
  }

  /* ── Skeleton ─────────────────────────────── */
  .ann-sk {
    border-radius: 6px;
    background: linear-gradient(90deg, #F3F4F6 25%, #E9EBEE 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: annShimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty state ──────────────────────────── */
  .ann-empty {
    grid-column: 1/-1;
    text-align: center;
    padding: 60px 24px;
    border: 1.5px dashed #D1D5DB;
    border-radius: 18px;
    background: rgba(255,255,255,0.6);
  }
  .ann-empty-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: #FFF3E0; color: #E8890C;
    display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
  }
  .ann-empty h3 { font-size: 1.05rem; font-weight: 700; color: #111827; }
  .ann-empty p  { margin-top: 6px; font-size: 0.82rem; color: #9CA3AF; font-weight: 500; }

  /* ── Load more ────────────────────────────── */
  .ann-load-more {
    grid-column: 1/-1;
    display: flex; justify-content: center; margin-top: 8px;
  }
  .ann-load-btn {
    padding: 10px 28px;
    border-radius: 999px;
    border: 1.5px solid #E5E7EB;
    background: #FFFFFF;
    font-family: 'Manrope', sans-serif;
    font-size: 0.82rem; font-weight: 700; color: #374151;
    cursor: pointer;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .ann-load-btn:hover:not(:disabled) {
    border-color: #E8890C; color: #E8890C;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(232,137,12,0.14);
  }
  .ann-load-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Error ────────────────────────────────── */
  .ann-error {
    grid-column: 1/-1;
    padding: 10px 14px; border-radius: 12px;
    border: 1px solid #FECACA; background: #FEF2F2;
    color: #B91C1C; font-size: 0.82rem; font-weight: 700;
    margin-bottom: 12px;
  }

  /* ── Detail panel ─────────────────────────── */
  .ann-detail-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.18);
    backdrop-filter: blur(2px);
    animation: annRise 0.2s ease both;
  }
  .ann-detail-panel {
    position: fixed;
    top: 64px; right: 0; bottom: 0;
    width: min(420px, 100vw);
    background: #FFFFFF;
    box-shadow: -8px 0 40px rgba(0,0,0,0.14);
    border-radius: 24px 0 0 0;
    display: flex; flex-direction: column;
    animation: annSlideIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
    overflow: hidden;
    z-index: 101;
  }
  .ann-detail-head {
    padding: 20px 20px 16px;
    border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .ann-detail-close {
    margin-left: auto; flex-shrink: 0;
    width: 32px; height: 32px; border-radius: 50%;
    border: 1.5px solid #E5E7EB; background: #F9FAFB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6B7280;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;
  }
  .ann-detail-close:hover {
    border-color: #E8890C; background: #FEF3C7; color: #E8890C;
    transform: rotate(90deg);
  }
  .ann-detail-body {
    flex: 1; overflow-y: auto; padding: 20px;
  }
  .ann-detail-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.45rem; font-weight: 700; line-height: 1.3;
    color: #111827; margin-bottom: 12px;
  }
  .ann-detail-rich {
    color: #374151; font-size: 0.86rem; line-height: 1.78; font-weight: 500;
  }
  .ann-detail-rich p  { margin-bottom: 10px; }
  .ann-detail-rich ul,
  .ann-detail-rich ol { margin: 0 0 10px 18px; }
  .ann-detail-rich a  { color: #2563EB; text-decoration: underline; }
  .ann-detail-footer {
    padding: 14px 20px 20px;
    border-top: 1px solid #F3F4F6;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }

  /* ── Compose form ─────────────────────────── */
  .ann-form-wrap {
    background: #FFFFFF; border: 1.5px solid #E5E7EB;
    border-radius: 18px; padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    animation: annRise 0.36s cubic-bezier(0.22,1,0.36,1) both;
  }
  .ann-form-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 700; color: #111827; margin-bottom: 14px;
  }
  .ann-form-row {
    display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin-bottom: 12px;
  }
  @media (max-width: 600px) { .ann-form-row { grid-template-columns: 1fr; } }
  .ann-form-label {
    font-size: 0.7rem; font-weight: 800; color: #6B7280;
    letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 5px;
  }
  .ann-form-input, .ann-form-select {
    width: 100%; border: 1.5px solid #E5E7EB; border-radius: 10px;
    padding: 9px 12px; background: #FAFAFA;
    font-family: 'Manrope', sans-serif; font-size: 0.83rem; font-weight: 600;
    color: #111827; outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ann-form-input:focus, .ann-form-select:focus {
    border-color: #E8890C;
    box-shadow: 0 0 0 3px rgba(232,137,12,0.12);
  }
  .ann-form-input::placeholder { color: #9CA3AF; }
  .ann-editor-wrap .ql-toolbar {
    border: 1.5px solid #E5E7EB !important;
    border-radius: 10px 10px 0 0 !important;
    background: #FAFAFA !important;
  }
  .ann-editor-wrap .ql-container {
    border: 1.5px solid #E5E7EB !important;
    border-top: none !important;
    border-radius: 0 0 10px 10px !important;
    min-height: 110px;
    font-family: 'Manrope', sans-serif !important;
    font-size: 0.85rem;
  }
  .ann-form-actions {
    margin-top: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .ann-btn-primary {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid rgba(232,137,12,0.4);
    background: rgba(255,248,240,0.9); color: #C97508;
    font-family: 'Manrope', sans-serif; font-size: 0.8rem; font-weight: 800;
    cursor: pointer; z-index: 0;
    transition: color 0.2s, border-color 0.2s, transform 0.22s cubic-bezier(0.22,1,0.36,1);
  }
  .ann-btn-primary::before {
    content: ''; position: absolute; inset: 0; z-index: -1;
    background: linear-gradient(135deg, #E8890C, #C97508);
    transform: scaleX(0); transform-origin: left center;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .ann-btn-primary:hover:not(:disabled) { color: #fff; border-color: #E8890C; transform: translateY(-1px); }
  .ann-btn-primary:hover:not(:disabled)::before { transform: scaleX(1); }
  .ann-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .ann-btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid #E5E7EB; background: #FFFFFF; color: #6B7280;
    font-family: 'Manrope', sans-serif; font-size: 0.8rem; font-weight: 700;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }
  .ann-btn-ghost:hover:not(:disabled) {
    border-color: #D1D5DB; color: #374151; transform: translateY(-1px);
  }
  .ann-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
`;

function SkeletonCard({ delay }) {
  return (
    <div className="ann-card ann-enter" style={{ animationDelay: `${delay}ms`, cursor: "default" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div className="ann-sk" style={{ width: 72, height: 20, borderRadius: 999 }} />
        <div className="ann-sk" style={{ width: 52, height: 12, marginTop: 4 }} />
      </div>
      <div className="ann-sk" style={{ width: "70%", height: 18, marginBottom: 8 }} />
      <div className="ann-sk" style={{ width: "90%", height: 12, marginBottom: 6 }} />
      <div className="ann-sk" style={{ width: "60%", height: 12 }} />
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <div className="ann-sk" style={{ width: 28, height: 28, borderRadius: "50%" }} />
        <div className="ann-sk" style={{ width: 80, height: 12, marginTop: 8 }} />
      </div>
    </div>
  );
}

function CategoryPill({ category }) {
  const c = CATS[category] || CATS.General;
  const Icon = c.Icon;
  return (
    <span className="ann-pill" style={{ background: c.bg, color: c.color }}>
      <Icon size={10} />
      {category}
    </span>
  );
}

function AnnCard({ item, active, unread, onOpen, delay }) {
  const cat = catOf(item);
  const c   = CATS[cat] || CATS.General;
  const plain = useMemo(() => htmlToPlainText(item.body || ""), [item.body]);

  return (
    <article
      className={`ann-card ann-enter${unread ? " unread" : ""}${active ? " active" : ""}`}
      style={{ animationDelay: `${delay}ms`, "--cat-accent": c.accent }}
      onClick={() => onOpen(item)}
    >
      <div className="ann-card-top">
        <div className="ann-card-top-left">
          <CategoryPill category={cat} />
          <span className="ann-card-time">{timeAgo(item.createdAt)}</span>
        </div>
        {unread && <span className="ann-card-unread-badge">UNREAD</span>}
      </div>

      <div className="ann-card-title-row">
        <h3 className="ann-card-title">{item.title}</h3>
        <ChevronRight size={16} className="ann-card-arrow" />
      </div>

      <p className="ann-card-preview">{plain || "No message content"}</p>

      <div className="ann-card-footer">
        <div className="ann-card-author">
          <span className="ann-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
          <span className="ann-author-name">{item.createdBy?.fullName || "Committee Member"}</span>
        </div>
        {unread && <span className="ann-new-badge">NEW</span>}
      </div>
    </article>
  );
}

function DetailPanel({ item, onClose, onRead }) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(item.body || ""), [item.body]);
  const cat = catOf(item);
  const c   = CATS[cat] || CATS.General;

  useEffect(() => {
    if (item.unread) onRead(item._id);
  }, [item._id, item.unread, onRead]);

  return (
    <>
      <div className="ann-detail-overlay" onClick={onClose} />
      <div className="ann-detail-panel">
        <div className="ann-detail-head">
          <CategoryPill category={cat} />
          <button type="button" className="ann-detail-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="ann-detail-body">
          <h2 className="ann-detail-title">{item.title}</h2>
          <div className="ann-detail-rich" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>
        <div className="ann-detail-footer">
          <div className="ann-card-author">
            <span className="ann-avatar">{(item.createdBy?.fullName || "C")[0].toUpperCase()}</span>
            <span className="ann-author-name">{item.createdBy?.fullName || "Committee Member"}</span>
          </div>
          {item.unread && <span className="ann-new-badge">NEW</span>}
        </div>
      </div>
    </>
  );
}

export function AnnouncementsPage() {
  const { token, user } = useAuth();
  const [items,        setItems]        = useState([]);
  const [title,        setTitle]        = useState("");
  const [body,         setBody]         = useState("<p></p>");
  const [category,     setCategory]     = useState("General");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchInput,  setSearchInput]  = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const readInFlight = useRef(new Set());

  const canCreate  = useMemo(() => ["committee", "super_admin"].includes(user?.role), [user?.role]);
  const plainBody  = useMemo(() => htmlToPlainText(body), [body]);

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

  const markRead = useCallback(async (id) => {
    if (!id || readInFlight.current.has(id)) return;
    readInFlight.current.add(id);
    setItems(prev => prev.map(it => it._id === id ? { ...it, unread: false } : it));
    if (selectedItem?._id === id) setSelectedItem(prev => prev ? { ...prev, unread: false } : prev);
    try {
      await apiRequest(`/announcements/${id}/read`, { method: "PATCH", token });
    } catch (_) {}
    finally { readInFlight.current.delete(id); }
  }, [token, selectedItem]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !plainBody) { setError("Title and body are required"); return; }
    setSubmitting(true); setError("");
    try {
      const data = await apiRequest("/announcements", { method: "POST", token, body: { title, body, category } });
      setItems(prev => [data.item, ...prev]);
      setTitle(""); setBody("<p></p>"); setCategory("General"); setShowForm(false);
    } catch (err) {
      setError(err.message || "Unable to create announcement");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 260);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadItems({ targetPage: 1 }); }, [loadItems]);

  function openDetail(item) {
    setSelectedItem(item);
    if (item.unread) markRead(item._id);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ann-root">
        <div className="ann-shell">

          {/* ── Page heading ──────────────────────────── */}
          <div className="ann-page-head">
            <h1 className="ann-page-title">
              Keep everyone <strong>in the loop.</strong>
            </h1>
            <p className="ann-page-sub">
              Official society updates, important notices, and community events — all in one live feed.
            </p>
          </div>

          {/* ── Controls bar ──────────────────────────── */}
          <div className="ann-controls">
            {CAT_CHIPS.map(({ key, label, Icon, sub, inactiveBg, inactiveColor, activeBg, activeColor }) => {
              const active = activeCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="ann-cat-chip"
                  style={{
                    background:   active ? activeBg   : inactiveBg,
                    color:        active ? activeColor : inactiveColor,
                    borderColor:  active ? activeBg   : "transparent",
                  }}
                  onClick={() => setActiveCategory(key)}
                >
                  {Icon && <Icon size={13} />}
                  <span className="ann-cat-chip-text">
                    <span className="ann-cat-chip-label">{label}</span>
                    {sub && <span className="ann-cat-chip-sub">{sub}</span>}
                  </span>
                </button>
              );
            })}

            <div className="ann-search-wrap">
              <span className="ann-search-label">Search</span>
              <div className="ann-search">
                <Search size={13} color="#9CA3AF" />
                <input
                  type="search"
                  placeholder="Search announcements..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            {canCreate && (
              <button type="button" className="ann-compose-btn" onClick={() => setShowForm(v => !v)}>
                {showForm ? "cancel" : "compose new announcement"}
                <span className="ann-compose-icon">
                  {showForm ? <X size={14} /> : <Plus size={14} />}
                </span>
              </button>
            )}

            <button type="button" className="ann-btn-ghost" onClick={() => loadItems()} disabled={loading} style={{ padding: "8px 12px" }}>
              <RefreshCw size={13} style={{ animation: loading ? "annSpin 1s linear infinite" : "none" }} />
            </button>
          </div>

          {/* ── Compose form ──────────────────────────── */}
          {canCreate && showForm && (
            <div className="ann-form-wrap">
              <h2 className="ann-form-title">Post a community notice</h2>
              <form onSubmit={handleCreate}>
                <div className="ann-form-row">
                  <div>
                    <p className="ann-form-label">Category</p>
                    <select className="ann-form-select" value={category} onChange={e => setCategory(e.target.value)}>
                      {CAT_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="ann-form-label">Title</p>
                    <input
                      className="ann-form-input"
                      placeholder="e.g. Water supply maintenance tomorrow"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="ann-form-label" style={{ marginBottom: 6 }}>Message</p>
                <div className="ann-editor-wrap">
                  <ReactQuill theme="snow" modules={editorModules} formats={editorFormats} value={body} onChange={setBody} placeholder="Write the announcement..." />
                </div>
                {error && <div className="ann-error" style={{ marginTop: 10 }}>{error}</div>}
                <div className="ann-form-actions">
                  <button type="submit" className="ann-btn-primary" disabled={submitting || !title.trim() || !plainBody}>
                    <Megaphone size={13} />
                    {submitting ? "Posting..." : "Post announcement"}
                  </button>
                  <button type="button" className="ann-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {error && !showForm && <div className="ann-error">{error}</div>}

          {/* ── Card grid ─────────────────────────────── */}
          <div className="ann-grid">
            {loading && [0,1,2,3,4,5].map(i => <SkeletonCard key={i} delay={i * 50} />)}

            {!loading && items.length === 0 && (
              <div className="ann-empty ann-enter">
                <div className="ann-empty-icon"><Megaphone size={22} /></div>
                <h3>No announcements yet</h3>
                <p>The first update from your community will appear here.</p>
              </div>
            )}

            {!loading && items.map((item, idx) => (
              <AnnCard
                key={item._id}
                item={item}
                active={selectedItem?._id === item._id}
                unread={Boolean(item.unread)}
                onOpen={openDetail}
                delay={idx * 40}
              />
            ))}

            {!loading && hasMore && (
              <div className="ann-load-more">
                <button type="button" className="ann-load-btn" onClick={() => loadItems({ targetPage: page + 1, append: true })} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ──────────────────────────── */}
        {selectedItem && (
          <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} onRead={markRead} />
        )}
      </div>
    </>
  );
}
