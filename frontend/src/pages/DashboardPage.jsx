import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, ArrowRight, CheckCircle, XCircle,
  Clock, MapPin, ChevronRight, Bell, Calendar, Users,
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../components/api";
import { getSocket } from "../components/socket";
import { EventChainTimeline } from "../components/EventChainTimeline";

/* ─── Design tokens ────────────────────────────────────── */
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

/* ─── CSS ──────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&display=swap');

  .dp-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
    background: ${C.bg};
    min-height: 100%;
    padding: 32px 32px 80px;
    box-sizing: border-box;
    max-width: 1320px;
    margin: 0 auto;
  }
  .dp-root * { box-sizing: border-box; }

  /* ═══════════════════════════════════════
     GREETING
  ═══════════════════════════════════════ */
  .dp-greeting {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .dp-greeting-date {
    font-size: 0.8rem;
    font-weight: 500;
    color: ${C.muted};
    margin: 0 0 6px;
  }

  .dp-greeting-title {
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 800;
    color: ${C.ink};
    margin: 0;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }

  .dp-greeting-title em {
    font-style: italic;
    color: ${C.indigo};
  }

  .dp-greeting-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dp-flat-pill {
    font-size: 0.74rem;
    font-weight: 600;
    color: ${C.ink2};
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 100px;
    padding: 5px 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .dp-indigo-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.73rem;
    font-weight: 700;
    color: ${C.surface};
    background: ${C.indigo};
    border-radius: 100px;
    padding: 6px 14px;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(79,70,229,0.28);
  }
  .dp-indigo-pill:hover {
    background: ${C.indigoD};
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(79,70,229,0.35);
  }

  .dp-refresh {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: ${C.surface};
    border: 1px solid ${C.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: ${C.muted};
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: border-color 0.18s, color 0.18s, box-shadow 0.18s;
  }
  .dp-refresh:hover { border-color: ${C.indigo}; color: ${C.indigo}; box-shadow: 0 2px 8px rgba(79,70,229,0.15); }
  .dp-refresh:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ═══════════════════════════════════════
     LIVE DASHBOARD PANEL
  ═══════════════════════════════════════ */
  .dp-live-panel {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 18px;
    margin-bottom: 32px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02);
  }

  .dp-live-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 20px;
    border-bottom: 1px solid ${C.borderL};
    background: ${C.bg};
  }

  .dp-live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dp-live-dot {
    position: relative;
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dp-live-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid currentColor;
    opacity: 0;
    animation: dp-live-ripple 2.2s ease-out infinite;
  }

  @keyframes dp-live-ripple {
    0%   { transform: scale(0.5); opacity: 0.55; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .dp-live-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .dp-live-count {
    font-size: 0.7rem;
    font-weight: 600;
    color: ${C.faint};
  }

  /* ── Live rows ── */
  .dp-live-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px 14px 23px;
    border-bottom: 1px solid ${C.borderL};
    position: relative;
    overflow: hidden;
  }
  .dp-live-row:last-child { border-bottom: none; }

  /* Left accent strip — 3 px colored bar */
  .dp-live-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
  }

  .dp-live-row-visitor    { background: ${C.amberL}; }
  .dp-live-row-event-soon { background: #F5F3FF; }
  .dp-live-row-notice     { background: ${C.orangeL}; }
  .dp-live-row-approval   { background: ${C.indigoL}; }

  .dp-live-row-visitor::before    { background: ${C.amber}; }
  .dp-live-row-event-soon::before { background: ${C.indigo}; }
  .dp-live-row-notice::before     { background: ${C.orange}; }
  .dp-live-row-approval::before   { background: ${C.indigo}; }

  /* Icon box */
  .dp-live-icon {
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }

  /* Type tag pill */
  .dp-live-type {
    display: inline-block;
    font-size: 0.57rem;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 100px;
    margin-bottom: 4px;
  }

  /* Content */
  .dp-live-content { flex: 1; min-width: 0; }
  .dp-live-title {
    font-size: 0.87rem; font-weight: 700; color: ${C.ink};
    margin: 0 0 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .dp-live-sub {
    font-size: 0.71rem; color: ${C.muted}; font-weight: 500;
    display: flex; align-items: center; gap: 4px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Actions */
  .dp-live-actions {
    display: flex; gap: 8px; flex-shrink: 0; align-items: center;
  }

  /* Approve button */
  .dp-live-btn-approve {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 17px; border-radius: 9px;
    font-size: 0.8rem; font-weight: 700;
    background: ${C.ink}; color: #FFFFFF;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.14);
    white-space: nowrap;
  }
  .dp-live-btn-approve:hover:not(:disabled) {
    background: ${C.indigo};
    box-shadow: 0 4px 14px rgba(79,70,229,0.32);
  }
  .dp-live-btn-approve:active:not(:disabled) { transform: scale(0.97); }
  .dp-live-btn-approve:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Reject button */
  .dp-live-btn-reject {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 17px; border-radius: 9px;
    font-size: 0.8rem; font-weight: 700;
    background: ${C.surface}; color: ${C.ink2};
    border: 1.5px solid ${C.border};
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.1s;
    white-space: nowrap;
  }
  .dp-live-btn-reject:hover:not(:disabled) {
    background: ${C.redL}; color: ${C.red}; border-color: ${C.redBr};
  }
  .dp-live-btn-reject:active:not(:disabled) { transform: scale(0.97); }
  .dp-live-btn-reject:disabled { opacity: 0.45; cursor: not-allowed; }

  /* CTA link button */
  .dp-live-btn-cta {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px;
    font-size: 0.77rem; font-weight: 700;
    background: rgba(79,70,229,0.08); color: ${C.indigo};
    border: 1px solid ${C.indigoBr};
    text-decoration: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s, transform 0.15s;
    white-space: nowrap;
  }
  .dp-live-btn-cta:hover { background: ${C.indigoL}; transform: translateY(-1px); }

  /* Empty state */
  .dp-live-empty {
    padding: 22px 20px;
    display: flex; align-items: center; gap: 10px;
    color: ${C.muted}; font-size: 0.8rem; font-weight: 600;
  }

  @keyframes dp-spin { to { transform: rotate(360deg); } }

  /* ═══════════════════════════════════════
     SECTION LABELS
  ═══════════════════════════════════════ */
  .dp-section-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: ${C.indigo};
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin: 0 0 6px;
  }

  .dp-section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: ${C.ink};
    margin: 0;
    line-height: 1;
    letter-spacing: -0.3px;
  }

  .dp-section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .dp-view-all {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.71rem;
    font-weight: 700;
    color: ${C.indigo};
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: gap 0.18s;
    flex-shrink: 0;
  }
  .dp-view-all:hover { gap: 7px; }

  /* ═══════════════════════════════════════
     FEATURE CARDS  (slightly smaller)
  ═══════════════════════════════════════ */
  .dp-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }

  .dp-card {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    display: block;
    text-decoration: none;
    aspect-ratio: 5 / 3;
    background: #1C1C1E;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
  }
  .dp-card:hover {
    transform: translateY(-4px) scale(1.012);
    box-shadow: 0 12px 20px -4px rgba(79,70,229,0.18), 0 4px 8px -2px rgba(79,70,229,0.1), 0 0 0 2px ${C.indigo};
  }

  .dp-card-img {
    position: absolute;
    inset: 0; width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.55s ease;
  }
  .dp-card:hover .dp-card-img { transform: scale(1.08); }

  .dp-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.14) 28%, rgba(0,0,0,0.82) 100%);
  }

  .dp-card-body {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 11px 13px;
  }

  .dp-card-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 2px;
    line-height: 1.2;
    letter-spacing: -0.15px;
  }

  .dp-card-desc {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.6);
    font-weight: 500;
    margin: 0;
    line-height: 1.4;
  }

  .dp-card-arrow {
    position: absolute;
    top: 10px; right: 10px;
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    color: #FFFFFF;
    transition: background 0.22s, border-color 0.22s, transform 0.22s;
  }
  .dp-card:hover .dp-card-arrow {
    background: ${C.indigo};
    border-color: ${C.indigo};
    transform: translate(2px,-2px) rotate(-45deg);
  }

  /* ═══════════════════════════════════════
     LOWER GRID
  ═══════════════════════════════════════ */
  .dp-lower-grid {
    display: grid;
    grid-template-columns: 1fr 292px;
    gap: 18px;
    align-items: start;
  }

  .dp-arrivals-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dp-arrivals-compact {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dp-arrival-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid ${C.borderL};
    border-radius: 14px;
    background: linear-gradient(180deg, #FFFFFF 0%, ${C.bg} 100%);
  }

  .dp-arrival-line-main {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 0;
  }

  .dp-arrival-line-label {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${C.muted};
  }

  .dp-arrival-line strong {
    font-size: 1rem;
    line-height: 1;
    color: ${C.ink};
  }

  .dp-arrival-line-note {
    min-width: 0;
    text-align: right;
    font-size: 0.8rem;
    color: ${C.inkSoft};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dp-arrivals-footnote {
    margin: 0;
    font-size: 0.72rem;
    color: ${C.faint};
    text-align: right;
    padding-right: 2px;
  }

  .dp-arrivals-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .dp-arrivals-date-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${C.bg};
    border: 1px solid ${C.border};
    border-radius: 12px;
    padding: 8px 10px;
    min-width: 220px;
  }

  .dp-arrivals-date-wrap span {
    font-size: 0.68rem;
    font-weight: 800;
    color: ${C.indigo};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .dp-arrivals-date {
    border: none;
    background: transparent;
    color: ${C.ink};
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    outline: none;
    width: 100%;
  }

  .dp-arrivals-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dp-arrivals-stat {
    border: 1px solid ${C.borderL};
    background: ${C.bg};
    border-radius: 14px;
    padding: 11px 12px;
  }

  .dp-arrivals-stat-label {
    margin: 0 0 5px;
    font-size: 0.67rem;
    font-weight: 800;
    color: ${C.muted};
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .dp-arrivals-stat-value {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: ${C.ink};
    line-height: 1;
  }

  .dp-arrivals-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .dp-arrivals-column {
    border: 1px solid ${C.border};
    border-radius: 14px;
    background: ${C.surface};
    padding: 14px;
    min-width: 0;
  }

  .dp-arrivals-column-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .dp-arrivals-column-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 800;
    color: ${C.ink};
  }

  .dp-arrivals-column-sub {
    margin: 3px 0 0;
    font-size: 0.71rem;
    color: ${C.muted};
    font-weight: 500;
  }

  .dp-arrivals-count {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .dp-arrivals-count.delivery { background: ${C.indigoL}; color: ${C.indigo}; }
  .dp-arrivals-count.visitor { background: ${C.amberL}; color: ${C.amberD}; }

  .dp-arrivals-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dp-arrival-item {
    border: 1px solid ${C.borderL};
    background: #FCFCFE;
    border-radius: 12px;
    padding: 10px 11px;
  }

  .dp-arrival-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .dp-arrival-title {
    margin: 0;
    font-size: 0.84rem;
    font-weight: 700;
    color: ${C.ink};
  }

  .dp-arrival-sub {
    margin: 3px 0 0;
    font-size: 0.7rem;
    color: ${C.muted};
    font-weight: 500;
    line-height: 1.45;
  }

  .dp-arrival-meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .dp-arrival-pill {
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .dp-arrival-pill.delivery { background: ${C.indigoL}; color: ${C.indigoD}; }
  .dp-arrival-pill.visitor { background: ${C.amberL}; color: ${C.amberD}; }

  .dp-arrival-empty {
    border-radius: 12px;
    border: 1px dashed ${C.border};
    background: ${C.bg};
    padding: 18px 14px;
    text-align: center;
    color: ${C.faint};
    font-size: 0.78rem;
    font-weight: 600;
  }

  .dp-panel {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02);
  }

  /* Feed */
  .dp-feed-item {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 11px 0; border-bottom: 1px solid ${C.borderL};
  }
  .dp-feed-item:first-child { padding-top: 0; }
  .dp-feed-item:last-child { border-bottom: none; padding-bottom: 0; }

  .dp-feed-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 7px; }

  .dp-feed-title {
    font-size: 0.83rem; font-weight: 600; color: ${C.ink};
    margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .dp-feed-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

  .dp-feed-badge {
    padding: 2px 8px; border-radius: 100px;
    font-size: 0.59rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .dp-feed-sub {
    font-size: 0.7rem; color: ${C.muted}; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;
  }

  .dp-feed-time {
    margin-left: auto; font-size: 0.65rem; color: ${C.faint};
    font-weight: 600; white-space: nowrap; flex-shrink: 0;
  }

  /* Empty */
  .dp-empty {
    border: 1.5px dashed ${C.border};
    border-radius: 12px; padding: 28px 16px;
    text-align: center; color: ${C.faint};
    font-size: 0.8rem; font-weight: 600;
  }

  /* Events */
  .dp-event-item {
    display: flex; gap: 11px; padding: 10px 0;
    border-bottom: 1px solid ${C.borderL};
  }
  .dp-event-item:first-child { padding-top: 0; }
  .dp-event-item:last-child { border-bottom: none; padding-bottom: 0; }

  .dp-event-date {
    width: 38px; flex-shrink: 0; background: ${C.indigo};
    border-radius: 9px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 6px 4px;
    box-shadow: 0 2px 8px rgba(79,70,229,0.28);
  }
  .dp-event-day { font-size: 1rem; font-weight: 800; color: #FFFFFF; line-height: 1; }
  .dp-event-month { font-size: 0.48rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
  .dp-event-name { font-size: 0.81rem; font-weight: 600; color: ${C.ink}; margin: 0 0 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dp-event-sub { font-size: 0.68rem; color: ${C.muted}; font-weight: 500; display: flex; align-items: center; gap: 4px; }

  /* Admin */
  .dp-admin-link {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px;
    background: ${C.bg}; border: 1px solid ${C.border};
    text-decoration: none; font-size: 0.8rem; font-weight: 600;
    color: ${C.ink}; margin-bottom: 8px;
    transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .dp-admin-link:last-child { margin-bottom: 0; }
  .dp-admin-link:hover { background: ${C.indigoL}; border-color: ${C.indigoBr}; transform: translateX(3px); box-shadow: 0 2px 8px rgba(79,70,229,0.1); }

  /* Skeleton */
  .dp-sk {
    background: linear-gradient(90deg, #F0F0F5 25%, #E8E8F0 50%, #F0F0F5 75%);
    background-size: 200% 100%;
    animation: dp-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  @keyframes dp-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }

  /* Error */
  .dp-error {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
    background: ${C.redL}; border: 1px solid ${C.redBr};
    border-radius: 12px; padding: 12px 16px;
    font-size: 0.83rem; color: ${C.red}; font-weight: 600;
  }

  /* Responsive */
  @media (max-width: 1100px) { .dp-cards-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 860px)  { .dp-lower-grid { grid-template-columns: 1fr; } }
  @media (max-width: 700px)  { .dp-live-actions { flex-wrap: wrap; } }
  @media (max-width: 600px)  { .dp-cards-grid { grid-template-columns: 1fr; } .dp-root { padding: 20px 16px 60px; } }
`;

/* ─── Dashboard data cache ─────────────────────────────────────────────────
   Stored outside the component so it survives page navigation.
   When you switch away and come back, we reuse this instead of re-fetching.
   TTL = 60 seconds. After that, we silently refresh in the background.
─────────────────────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 60_000;
let _cache = null; // { data, fetchedAt, forToken }

function getCached(token) {
  if (!_cache) return null;
  if (_cache.forToken !== token) return null;  // different user logged in
  if (Date.now() - _cache.fetchedAt > CACHE_TTL_MS) return null; // stale
  return _cache.data;
}

function setCache(token, data) {
  _cache = { data, fetchedAt: Date.now(), forToken: token };
}

/* ─── Feature cards ────────────────────────── */
const PX = id =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;

const AMENITIES_ROTATING_IMAGES = [
  "/images/dashboard/amenities-gym.jpg",
  "/images/dashboard/amenities-pool.jpg",
];

const FEATURES = [
  // ── All roles ──────────────────────────────────────────────────────────────
  { title: "Announcements", desc: "Society notices & updates",           to: "/announcements",   img: PX(8846035),  roles: null },
  { title: "Events",        desc: "Community gatherings & programmes",   to: "/events",          img: PX(30388543), roles: null },

  // ── Residents & admins only ─────────────────────────────────────────────
  { title: "Amenities",     desc: "Book gym, pool & shared spaces",      to: "/amenities",       img: PX(6012017),  roles: ["resident","committee","super_admin"] },
  { title: "My Tickets",    desc: "Track maintenance & requests",        to: "/tickets",         img: "/images/dashboard/tickets-maintenance.jpg", roles: ["resident","committee","super_admin"] },
  { title: "Polls",         desc: "Vote on community decisions",         to: "/polls",           img: PX(8846076),  roles: ["resident","committee","super_admin"] },
  { title: "Visitors",      desc: "Manage & pre-register guests",        to: "/visitors/prereg", img: PX(22940794), roles: ["resident","committee","super_admin"] },
  { title: "My Deliveries", desc: "Track parcels & couriers",            to: "/deliveries/my",   img: PX(7362965),  roles: ["resident","committee","super_admin"] },
  { title: "Lost & Found",  desc: "Report lost or claim found items",    to: "/lost-found",      img: PX(5598028),  roles: ["resident","committee","super_admin"] },

  // ── Security & admins only ─────────────────────────────────────────────
  { title: "Visitor Log",   desc: "Monitor & manage gate visitors",      to: "/visitors",        img: PX(1464227),  roles: ["security","super_admin"] },
  { title: "Staff Gate",    desc: "Record staff entries & exits",        to: "/staff/gate",      img: PX(3184360),  roles: ["security","super_admin"] },
  { title: "Delivery Gate", desc: "Log & approve delivery agents",       to: "/deliveries/gate", img: PX(4481326),  roles: ["security","super_admin"] },
];

/* ─── Feed config ──────────────────────────── */
const FEED_CFG = {
  announcement: { label: "Notice", dot: C.orange, badgeBg: C.orangeL, badgeColor: C.orange },
  ticket:       { label: "Ticket", dot: C.red,    badgeBg: C.redL,    badgeColor: C.red    },
  event:        { label: "Event",  dot: C.green,  badgeBg: C.greenL,  badgeColor: C.green  },
};

/* ─── Helpers ──────────────────────────────── */
function greeting(name) {
  const h = new Date().getHours();
  const w = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return { word: w, first: name?.split(" ")[0] || "there" };
}
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function toInputDate(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function fmtTime(d)  { if (!d) return ""; return new Date(d).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }); }
function fmtDay(d)   { return new Date(d).toLocaleDateString("en-IN", { day:"numeric" }); }
function fmtMonth(d) { return new Date(d).toLocaleDateString("en-IN", { month:"short" }); }
function fmtFullDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function startsIn(startAt) {
  const mins = Math.round((new Date(startAt) - Date.now()) / 60000);
  if (mins <= 0) return "starting now";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
}

function buildFeed(announcements, tickets, events) {
  const items = [];
  announcements.slice(0,5).forEach(a => items.push({ type:"announcement", date:a.createdAt, data:a }));
  tickets.filter(t => !["resolved","closed"].includes(t.status)).slice(0,4)
    .forEach(t => items.push({ type:"ticket", date:t.createdAt, data:t }));
  events.filter(e => new Date(e.startAt) >= new Date()).slice(0,3)
    .forEach(e => items.push({ type:"event", date:e.startAt, data:e }));
  return items.sort((a,b) => new Date(b.date) - new Date(a.date));
}

function Sk({ style }) { return <div className="dp-sk" style={style} />; }

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export function DashboardPage() {
  const { token, user, membership } = useAuth();

  const isAdmin    = ["committee","super_admin"].includes(user?.role);
  const isResident = user?.role === "resident";

  const [announcements,    setAnnouncements]    = useState([]);
  const [tickets,          setTickets]          = useState([]);
  const [events,           setEvents]           = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [visitorRequests,  setVisitorRequests]  = useState([]);
  const [deliveryPreRegs,  setDeliveryPreRegs]  = useState([]);
  const [visitorPreRegs,   setVisitorPreRegs]   = useState([]);
  const [amenityImageIdx,  setAmenityImageIdx]  = useState(0);
  const [respondingId,     setRespondingId]     = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [selectedArrivalDate, setSelectedArrivalDate] = useState(() => toInputDate());

  const canSeeArrivals = isResident || isAdmin;

  const load = useCallback(async (forceRefresh = false) => {
    if (!token) return;

    // Use cache on revisit (unless the user clicked the refresh button)
    if (!forceRefresh) {
      const cached = getCached(token);
      if (cached) {
        setAnnouncements(cached.announcements);
        setTickets(cached.tickets);
        setEvents(cached.events);
        setPendingApprovals(cached.pendingApprovals);
        setVisitorRequests(cached.visitorRequests);
          setDeliveryPreRegs(cached.deliveryPreRegs || []);
          setVisitorPreRegs(cached.visitorPreRegs || []);
        setLoading(false);
        return;
      }
    }

    setLoading(true); setError("");
    try {
      const calls = [
        apiRequest("/announcements", { token }),
        apiRequest("/tickets",       { token }),
        apiRequest("/events",        { token }),
      ];
      if (isAdmin)    calls.push(apiRequest("/admin/pending-approvals", { token }));
      if (isResident) calls.push(apiRequest("/visitors/my-requests",   { token }));
      if (canSeeArrivals) {
        calls.push(apiRequest("/delivery-prereg", { token }));
        calls.push(apiRequest("/visitor-prereg",  { token }));
      }
      const results = await Promise.allSettled(calls);
      const get = r => r.status === "fulfilled" ? r.value : null;
      let cursor = 0;
      const fresh = {
        announcements:    get(results[cursor++])?.items || [],
        tickets:          get(results[cursor++])?.items || [],
        events:           get(results[cursor++])?.items || [],
        pendingApprovals: 0,
        visitorRequests:  [],
        deliveryPreRegs:  [],
        visitorPreRegs:   [],
      };
      if (isAdmin) {
        fresh.pendingApprovals = (get(results[cursor++])?.items || []).length;
      }
      if (isResident) {
        fresh.visitorRequests = get(results[cursor++])?.items || [];
      }
      if (canSeeArrivals) {
        fresh.deliveryPreRegs = get(results[cursor++])?.items || [];
        fresh.visitorPreRegs = get(results[cursor++])?.items || [];
      }
      setCache(token, fresh);
      setAnnouncements(fresh.announcements);
      setTickets(fresh.tickets);
      setEvents(fresh.events);
      setPendingApprovals(fresh.pendingApprovals);
      setVisitorRequests(fresh.visitorRequests);
      setDeliveryPreRegs(fresh.deliveryPreRegs);
      setVisitorPreRegs(fresh.visitorPreRegs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isResident, canSeeArrivals]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isResident) return;
    const socket = getSocket();
    const onIncoming = ({ visitor }) => {
      _cache = null; // visitor arrived — invalidate so next visit re-fetches
      setVisitorRequests(prev => [visitor, ...prev.filter(v => v._id !== visitor._id)]);
    };
    socket.on("visitor:request_incoming", onIncoming);
    return () => socket.off("visitor:request_incoming", onIncoming);
  }, [isResident]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setAmenityImageIdx(prev => (prev + 1) % AMENITIES_ROTATING_IMAGES.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  async function respondToVisitor(visitorId, decision) {
    setRespondingId(visitorId);
    try {
      await apiRequest(`/visitors/${visitorId}/respond`, { token, method:"PATCH", body:{ decision } });
      setVisitorRequests(prev => prev.filter(v => v._id !== visitorId));
    } catch (err) { setError(err.message); }
    finally { setRespondingId(null); }
  }

  /* ── Build priority-sorted live feed ── */
  const liveItems = useMemo(() => {
    const items = [];
    const now = Date.now();

    /* Visitor requests — highest priority, need immediate action */
    visitorRequests.forEach(v => items.push({
      id: `v-${v._id}`, type: "visitor", pri: 1, data: v,
    }));

    /* Admin approvals pending — needs action */
    if (isAdmin && pendingApprovals > 0) {
      items.push({ id: "approvals", type: "approval", pri: 2, data: { count: pendingApprovals } });
    }

    /* Events starting within the next 2 hours — time-sensitive info */
    events
      .filter(e => {
        const start = new Date(e.startAt).getTime();
        return start > now && start < now + 2 * 3600 * 1000;
      })
      .forEach(e => items.push({ id: `ev-${e._id}`, type: "event_soon", pri: 3, data: e }));

    /* Announcements posted today — fresh notice */
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    announcements
      .filter(a => new Date(a.createdAt) >= todayStart)
      .slice(0, 2)
      .forEach(a => items.push({ id: `an-${a._id}`, type: "notice", pri: 4, data: a }));

    return items.sort((a, b) => a.pri - b.pri);
  }, [visitorRequests, events, announcements, isAdmin, pendingApprovals]);

  const hasActionable = liveItems.some(i => i.type === "visitor" || i.type === "approval");
  const dotColor = liveItems.length > 0 ? (hasActionable ? C.amber : C.green) : C.green;
  const liveCountLabel = liveItems.length === 0
    ? "All quiet"
    : `${liveItems.length} update${liveItems.length > 1 ? "s" : ""}`;

  /* ── Row class map ── */
  const rowClass = { visitor: "dp-live-row-visitor", event_soon: "dp-live-row-event-soon", notice: "dp-live-row-notice", approval: "dp-live-row-approval" };

  const { word, first } = greeting(user?.fullName);
  const today = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });
  const flatLabel = membership?.wingId?.name && membership?.unitId?.unitNumber
    ? `${membership.wingId.name}-${membership.unitId.unitNumber}` : null;

  const arrivalBuckets = useMemo(() => {
    const matchesSelectedDate = (value) => toInputDate(value) === selectedArrivalDate;

    const deliveries = deliveryPreRegs
      .filter((item) => matchesSelectedDate(item.expectedDate) && item.status === "active")
      .sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate));

    const visitors = visitorPreRegs
      .filter((item) => matchesSelectedDate(item.expectedDate) && item.status === "active")
      .sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate));

    return { deliveries, visitors };
  }, [deliveryPreRegs, visitorPreRegs, selectedArrivalDate]);

  const deliveryPreview = arrivalBuckets.deliveries[0] || null;
  const visitorPreview = arrivalBuckets.visitors[0] || null;

  const feed = useMemo(() => buildFeed(announcements, tickets, events), [announcements, tickets, events]);

  const role = user?.role;
  const visibleFeatures = FEATURES.filter(f => !f.roles || f.roles.includes(role));

  const Spinner = (
    <span style={{ width:11, height:11, display:"inline-block", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", animation:"dp-spin .7s linear infinite" }} />
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-root">

        {/* ══════════════════════════════════════════
            1. GREETING ROW
        ══════════════════════════════════════════ */}
        <div className="dp-greeting">
          <div>
            <p className="dp-greeting-date">{today}</p>
            <h1 className="dp-greeting-title">
              Good {word}, <em>{first}</em>
            </h1>
          </div>
          <div className="dp-greeting-right">
            {flatLabel && <span className="dp-flat-pill">Flat {flatLabel}</span>}
            {isAdmin && pendingApprovals > 0 && (
              <Link to="/admin/approvals" className="dp-indigo-pill">
                {pendingApprovals} pending {pendingApprovals === 1 ? "approval" : "approvals"}
                <ArrowRight size={12}/>
              </Link>
            )}
            <button className="dp-refresh" onClick={() => load(true)} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? "dp-spin 1s linear infinite" : "none" }}/>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="dp-error">
            <XCircle size={15}/> {error}
            <button onClick={() => setError("")} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:C.red, display:"flex" }}>
              <XCircle size={14}/>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            2. LIVE DASHBOARD  — smart real-time feed
        ══════════════════════════════════════════ */}
        <motion.div
          className="dp-live-panel"
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.36, ease:[0.22,1,0.36,1] }}
        >
          {/* Panel header */}
          <div className="dp-live-head">
            <div className="dp-live-indicator">
              <div
                className="dp-live-dot"
                style={{ background: dotColor, color: dotColor }}
              />
              <span className="dp-live-label" style={{ color: dotColor }}>Live Dashboard</span>
            </div>
            <span className="dp-live-count">{liveCountLabel}</span>
          </div>

          {/* Items */}
          <AnimatePresence initial={false}>
            {liveItems.length === 0 ? (
              <motion.div
                key="live-empty"
                className="dp-live-empty"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
              >
                <CheckCircle size={15} color={C.green}/>
                All quiet · Live monitoring active. Events, visitor arrivals & notices will appear here.
              </motion.div>
            ) : (
              liveItems.map(item => (
                <motion.div
                  key={item.id}
                  className={`dp-live-row ${rowClass[item.type]}`}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:10, height:0, padding:0 }}
                  transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
                >

                  {/* ── VISITOR ── */}
                  {item.type === "visitor" && (
                    <>
                      <div className="dp-live-icon" style={{ background:"rgba(245,158,11,0.10)", border:"1px solid rgba(245,158,11,0.25)" }}>
                        👤
                      </div>
                      <div className="dp-live-content">
                        <span className="dp-live-type" style={{ background:"rgba(245,158,11,0.14)", color:C.amberD }}>Visitor at Gate</span>
                        <p className="dp-live-title">{item.data.visitorName}</p>
                        <p className="dp-live-sub">
                          {item.data.purpose}
                          {item.data.visitorPhone ? ` · ${item.data.visitorPhone}` : ""}
                        </p>
                      </div>
                      <div className="dp-live-actions">
                        <button
                          className="dp-live-btn-reject"
                          onClick={() => respondToVisitor(item.data._id, "rejected")}
                          disabled={respondingId === item.data._id}
                        >
                          <XCircle size={13}/> Reject
                        </button>
                        <button
                          className="dp-live-btn-approve"
                          onClick={() => respondToVisitor(item.data._id, "approved")}
                          disabled={respondingId === item.data._id}
                        >
                          {respondingId === item.data._id ? Spinner : <><CheckCircle size={13}/> Approve</>}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── EVENT STARTING SOON ── */}
                  {item.type === "event_soon" && (
                    <>
                      <div className="dp-live-icon" style={{ background:"rgba(79,70,229,0.08)", border:`1px solid ${C.indigoBr}` }}>
                        <Calendar size={14} color={C.indigo}/>
                      </div>
                      <div className="dp-live-content">
                        <span className="dp-live-type" style={{ background:C.indigoL, color:C.indigo }}>Starting Soon</span>
                        <p className="dp-live-title">{item.data.title}</p>
                        <p className="dp-live-sub">
                          <Clock size={10}/> {startsIn(item.data.startAt)}
                          {item.data.location && <><MapPin size={10} style={{ marginLeft:3 }}/>{item.data.location}</>}
                        </p>
                      </div>
                      <div className="dp-live-actions">
                        <Link to="/events" className="dp-live-btn-cta">View <ArrowRight size={11}/></Link>
                      </div>
                    </>
                  )}

                  {/* ── TODAY'S NOTICE ── */}
                  {item.type === "notice" && (
                    <>
                      <div className="dp-live-icon" style={{ background:"rgba(232,137,12,0.08)", border:"1px solid rgba(232,137,12,0.2)" }}>
                        <Bell size={14} color={C.orange}/>
                      </div>
                      <div className="dp-live-content">
                        <span className="dp-live-type" style={{ background:C.orangeL, color:C.orange }}>New Notice</span>
                        <p className="dp-live-title">{item.data.title}</p>
                        {item.data.body && (
                          <p className="dp-live-sub">{item.data.body.replace(/<[^>]+>/g,"").slice(0,90)}</p>
                        )}
                      </div>
                      <div className="dp-live-actions">
                        <Link to="/announcements" className="dp-live-btn-cta">Read <ArrowRight size={11}/></Link>
                      </div>
                    </>
                  )}

                  {/* ── PENDING APPROVALS (admin) ── */}
                  {item.type === "approval" && (
                    <>
                      <div className="dp-live-icon" style={{ background:C.indigoL, border:`1px solid ${C.indigoBr}` }}>
                        <Users size={14} color={C.indigo}/>
                      </div>
                      <div className="dp-live-content">
                        <span className="dp-live-type" style={{ background:C.indigoL, color:C.indigo }}>Action Required</span>
                        <p className="dp-live-title">
                          {item.data.count} Pending Approval{item.data.count !== 1 ? "s" : ""}
                        </p>
                        <p className="dp-live-sub">New member requests awaiting your review</p>
                      </div>
                      <div className="dp-live-actions">
                        <Link to="/admin/approvals" className="dp-live-btn-cta">Review <ArrowRight size={11}/></Link>
                      </div>
                    </>
                  )}

                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* ══════════════════════════════════════════
            3. FEATURE CARDS
        ══════════════════════════════════════════ */}
        <div style={{ marginBottom:12 }}>
          <p className="dp-section-label">Your Community</p>
          <div className="dp-section-head">
            <h2 className="dp-section-title">Explore Features</h2>
          </div>
        </div>

        <div className="dp-cards-grid">
          {visibleFeatures.map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity:0, y:18 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05, duration:0.4, ease:[0.22,1,0.36,1] }}
            >
              <Link to={f.to} className="dp-card">
                <img
                  className="dp-card-img"
                  src={f.title === "Amenities" ? AMENITIES_ROTATING_IMAGES[amenityImageIdx] : f.img}
                  alt={f.title}
                  loading="lazy"
                />
                <div className="dp-card-overlay"/>
                <div className="dp-card-arrow"><ArrowRight size={11}/></div>
                <div className="dp-card-body">
                  <p className="dp-card-title">{f.title}</p>
                  <p className="dp-card-desc">{f.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            4. EVENT CHAIN TIMELINE
        ══════════════════════════════════════════ */}
        <div style={{ marginBottom: 24 }}>
          <EventChainTimeline events={events} />
        </div>

        {/* ══════════════════════════════════════════
            5. ACTIVITY + EVENTS LOWER GRID
        ══════════════════════════════════════════ */}
        <div className="dp-lower-grid">

          {/* Activity feed */}
          <motion.div
            className="dp-panel"
            initial={{ opacity:0, y:14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.18, duration:0.42, ease:[0.22,1,0.36,1] }}
          >
            <div className="dp-section-head" style={{ marginBottom:16 }}>
              <div>
                <p className="dp-section-label">Updates</p>
                <h2 className="dp-section-title">Recent Activity</h2>
              </div>
              <Link to="/announcements" className="dp-view-all">View all <ChevronRight size={10}/></Link>
            </div>

            {loading ? (
              [...Array(4)].map((_,i) => (
                <div key={i} style={{ padding:"11px 0", borderBottom:`1px solid ${C.borderL}` }}>
                  <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                    <Sk style={{ width:52, height:17, borderRadius:100 }}/>
                    <Sk style={{ width:68, height:17, borderRadius:100 }}/>
                  </div>
                  <Sk style={{ height:13, width:"62%", marginBottom:6 }}/>
                  <Sk style={{ height:11, width:"40%" }}/>
                </div>
              ))
            ) : feed.length === 0 ? (
              <div className="dp-empty">No activity yet in your community.</div>
            ) : (
              feed.map((item) => {
                const cfg = FEED_CFG[item.type];
                const d = item.data;
                return (
                  <div key={`${item.type}-${d._id}`} className="dp-feed-item">
                    <div className="dp-feed-dot" style={{ background:cfg.dot }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p className="dp-feed-title">{d.title || "Untitled"}</p>
                      <div className="dp-feed-row">
                        <span className="dp-feed-badge" style={{ background:cfg.badgeBg, color:cfg.badgeColor }}>{cfg.label}</span>
                        {(d.body || d.description || d.location) && (
                          <span className="dp-feed-sub">{(d.body || d.description || d.location || "").replace(/<[^>]+>/g,"")}</span>
                        )}
                      </div>
                    </div>
                    <span className="dp-feed-time">{timeAgo(item.date)}</span>
                  </div>
                );
              })
            )}
          </motion.div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Expected arrivals for a selected day */}
            <motion.div
              className="dp-panel dp-arrivals-panel"
              initial={{ opacity:0, x:12 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:0.22, duration:0.4, ease:[0.22,1,0.36,1] }}
            >
              <div className="dp-section-head" style={{ marginBottom:10 }}>
                <div>
                  <p className="dp-section-label">Expected Arrivals</p>
                  <h2 className="dp-section-title">Arrivals on one date</h2>
                </div>
                <Link to="/visitors/prereg" className="dp-view-all">Manage <ChevronRight size={10}/></Link>
              </div>

              <div className="dp-arrivals-toolbar">
                <div className="dp-arrivals-date-wrap">
                  <Calendar size={14} color={C.indigo} />
                  <span>Date</span>
                  <input
                    type="date"
                    className="dp-arrivals-date"
                    value={selectedArrivalDate}
                    onChange={(event) => setSelectedArrivalDate(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <>
                  <Sk style={{ height:54, marginBottom:10 }}/>
                  <Sk style={{ height:54 }}/>
                </>
              ) : (
                <div className="dp-arrivals-compact">
                  <div className="dp-arrival-line">
                    <div className="dp-arrival-line-main">
                      <span className="dp-arrival-line-label">Deliveries</span>
                      <strong>{arrivalBuckets.deliveries.length}</strong>
                    </div>
                    <span className="dp-arrival-line-note">
                      {deliveryPreview
                        ? `${deliveryPreview.expectedCourier || "Any courier"} · ${deliveryPreview.packageType || "Package"}`
                        : "None expected"}
                    </span>
                  </div>

                  <div className="dp-arrival-line">
                    <div className="dp-arrival-line-main">
                      <span className="dp-arrival-line-label">Visitors</span>
                      <strong>{arrivalBuckets.visitors.length}</strong>
                    </div>
                    <span className="dp-arrival-line-note">
                      {visitorPreview
                        ? `${visitorPreview.visitorName || "Guest"} · ${visitorPreview.purpose || "visit"}`
                        : "None expected"}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Admin workspace */}
            {isAdmin && (
              <motion.div
                className="dp-panel"
                initial={{ opacity:0, x:12 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.28, duration:0.4, ease:[0.22,1,0.36,1] }}
                style={{ borderTop:`3px solid ${C.indigo}` }}
              >
                <p className="dp-section-label">Management</p>
                <h2 className="dp-section-title" style={{ marginBottom:14 }}>Admin</h2>
                {[
                  { to:"/admin/approvals",     emoji:"👥", label:"Pending Approvals", badge:pendingApprovals||null },
                  { to:"/admin/society-setup", emoji:"⚙️", label:"Society Setup" },
                ].map(({ to, emoji, label, badge }) => (
                  <Link key={to} to={to} className="dp-admin-link">
                    <span style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <span>{emoji}</span>{label}
                    </span>
                    {badge
                      ? <span style={{ background:C.indigo, color:"#fff", padding:"2px 10px", borderRadius:100, fontSize:"0.64rem", fontWeight:800 }}>{badge}</span>
                      : <ChevronRight size={13} style={{ color:C.faint }}/>
                    }
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
