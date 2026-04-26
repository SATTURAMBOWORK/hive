import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin } from "lucide-react";

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtFullDate(d) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

/* ─── CSS ───────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .ect-panel {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #FFFFFF;
    border-radius: 20px;
    padding: 24px 28px 22px;
    border: 1px solid #EAEAF0;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    position: relative;
  }

  /* ── Header ── */
  .ect-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 22px;
  }

  .ect-section-lbl {
    display: block;
    font-size: 0.63rem;
    font-weight: 700;
    color: #4F46E5;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin: 0 0 4px;
  }

  .ect-section-title {
    font-size: 1.08rem;
    font-weight: 700;
    color: #1C1C1E;
    letter-spacing: -0.3px;
    margin: 0;
    line-height: 1;
  }

  .ect-month-badge {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: #A0A0B0;
    margin-top: 4px;
    letter-spacing: 0.03em;
  }

  .ect-view-all {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.67rem;
    font-weight: 700;
    color: #4F46E5;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: gap 0.2s;
    flex-shrink: 0;
  }
  .ect-view-all:hover { gap: 7px; }

  /* ── Day labels ── */
  .ect-labels {
    display: flex;
    margin-bottom: 10px;
  }

  .ect-label-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ect-today-tag {
    font-size: 0.49rem;
    font-weight: 800;
    color: #4F46E5;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    line-height: 1;
  }

  .ect-tag-spacer { display: block; height: 8px; }

  .ect-day-abbr {
    font-size: 0.58rem;
    font-weight: 700;
    color: #BEBEC8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  /* ── Timeline track ── */
  .ect-circles-row {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 18px; /* breathing room for overflowing count badges */
  }

  /*
   * Chain line endpoints: calc(100%/14) = center of first/last column
   * because each of 7 columns is flex:1, so center of column 1 = (1/7)/2 of row width = 1/14
   */
  .ect-chain {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: calc(100% / 14);
    right: calc(100% / 14);
    height: 2px;
    background: linear-gradient(90deg, #F4F4F9 0%, #E4E4EC 18%, #E4E4EC 82%, #F4F4F9 100%);
    border-radius: 2px;
    z-index: 0;
  }

  .ect-circle-col {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  /* ── Base node (STANDARD / empty) ── */
  .ect-node {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    border: 1.5px solid #EBEBF2;
    position: relative;
    transition:
      transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
      box-shadow 0.22s ease,
      border-color 0.18s,
      background 0.18s;
    cursor: default;
  }
  .ect-node:not(.ect-node-has):not(.ect-node-today):hover {
    transform: scale(1.08);
    box-shadow: 0 3px 10px rgba(0,0,0,0.07);
  }

  /* ── TODAY node ── */
  .ect-node-today {
    width: 50px;
    height: 50px;
    background: #4F46E5;
    border: none;
    animation: ect-pulse 2.2s ease-out infinite;
  }
  .ect-node-today:hover { transform: scale(1.06); }

  @keyframes ect-pulse {
    0%   { box-shadow: 0 4px 18px rgba(79,70,229,0.34), 0 0 0 0px  rgba(79,70,229,0.44); }
    65%  { box-shadow: 0 4px 18px rgba(79,70,229,0.34), 0 0 0 10px rgba(79,70,229,0.00); }
    100% { box-shadow: 0 4px 18px rgba(79,70,229,0.34), 0 0 0 0px  rgba(79,70,229,0.00); }
  }

  /* ── HAS EVENTS node — significantly improved indicator ── */
  .ect-node-has {
    border: 2px solid #4F46E5;
    background: #F5F3FF;
    cursor: pointer;
  }
  .ect-node-has:hover {
    transform: scale(1.1);
    background: #EEF2FF;
    box-shadow: 0 4px 16px rgba(79,70,229,0.18);
  }

  /* Active state when popover is open */
  .ect-node-open {
    transform: scale(1.1) !important;
    background: #EEF2FF !important;
    box-shadow: 0 6px 20px rgba(79,70,229,0.22) !important;
    border-color: #4338CA !important;
  }

  /* Today + has events: keep today style, add pointer */
  .ect-node-today.ect-node-clickable { cursor: pointer; }

  /* ── Date numbers ── */
  .ect-num {
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    position: relative;
    z-index: 1;
  }
  .ect-num-today  { color: #FFFFFF; font-size: 1rem; font-weight: 800; }
  .ect-num-has    { color: #4338CA; font-weight: 800; }
  .ect-num-empty  { color: #D0D0DA; font-weight: 400; }

  /*
   * ── Event count badge ──
   * Replaces the old 7px dot. Shows the exact count ("1", "2", "3"…)
   * as a pill sitting at the absolute bottom of the node.
   * position: absolute inside .ect-node (which has position: relative).
   * bottom: -9px centers the 16px badge's midpoint on the node's south edge.
   */
  .ect-count-badge {
    position: absolute;
    bottom: -9px;
    left: 50%;
    transform: translateX(-50%);
    background: #4F46E5;
    color: #FFFFFF;
    font-size: 0.5rem;
    font-weight: 800;
    min-width: 18px;
    height: 16px;
    padding: 0 5px;
    border-radius: 100px;
    border: 2px solid #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.03em;
    box-shadow: 0 2px 6px rgba(79,70,229,0.40);
    pointer-events: none;
    white-space: nowrap;
  }

  /* Today-variant: inverted badge (white bg, indigo text) */
  .ect-count-badge-today {
    background: #FFFFFF;
    color: #4338CA;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    border-color: rgba(79,70,229,0.15);
  }

  /* ── Popover ── */
  .ect-popover {
    position: absolute;
    bottom: calc(100% + 16px);
    width: 218px;
    background: #FFFFFF;
    border: 1px solid #E4E4EC;
    border-top: 2.5px solid #4F46E5;
    border-radius: 0 0 16px 16px;
    box-shadow:
      0 14px 36px rgba(0,0,0,0.12),
      0 4px 10px rgba(0,0,0,0.06);
    z-index: 50;
    overflow: hidden;
  }

  /* Edge-aware positions + their entry animations */
  .ect-popover-center {
    left: 50%;
    transform: translateX(-50%);
    animation: ect-pop-center 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .ect-popover-left {
    left: 0;
    animation: ect-pop-edge 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .ect-popover-right {
    right: 0;
    left: auto;
    animation: ect-pop-edge 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes ect-pop-center {
    from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.94); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
  }
  @keyframes ect-pop-edge {
    from { opacity: 0; transform: translateY(8px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  /* Downward caret — only for center-aligned popover */
  .ect-popover-center::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px; height: 8px;
    background: #FFFFFF;
    border-right: 1px solid #E4E4EC;
    border-bottom: 1px solid #E4E4EC;
  }

  .ect-pop-head {
    padding: 11px 14px 9px;
    border-bottom: 1px solid #F3F3F8;
    background: #FAFAFD;
  }

  .ect-pop-date-text {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1C1C1E;
    letter-spacing: -0.1px;
    line-height: 1.25;
  }

  .ect-pop-count-text {
    font-size: 0.6rem;
    font-weight: 600;
    color: #4F46E5;
    margin-top: 2px;
  }

  .ect-pop-list {
    padding: 6px;
    max-height: 200px;
    overflow-y: auto;
  }
  .ect-pop-list::-webkit-scrollbar { width: 3px; }
  .ect-pop-list::-webkit-scrollbar-thumb { background: #E0E0EA; border-radius: 99px; }

  .ect-pop-event {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 7px 9px;
    border-radius: 10px;
    transition: background 0.14s;
  }
  .ect-pop-event + .ect-pop-event { margin-top: 1px; }
  .ect-pop-event:hover { background: #F5F3FF; }

  .ect-pop-event-name {
    font-size: 0.79rem;
    font-weight: 700;
    color: #1C1C1E;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .ect-pop-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.64rem;
    font-weight: 500;
    color: #9CA3AF;
    flex-wrap: wrap;
  }

  .ect-pop-meta-item {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .ect-pop-footer {
    padding: 8px 14px 10px;
    border-top: 1px solid #F3F3F8;
    display: flex;
    justify-content: center;
  }

  .ect-pop-footer-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #4F46E5;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: gap 0.16s;
  }
  .ect-pop-footer-link:hover { gap: 8px; }

  /* ── Legend ── */
  .ect-legend {
    display: flex;
    align-items: center;
    gap: 18px;
    padding-top: 14px;
    border-top: 1px solid #F3F3F8;
    flex-wrap: wrap;
  }

  .ect-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.6rem;
    font-weight: 600;
    color: #A8A8BC;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .ect-lgd-today {
    width: 9px; height: 9px; border-radius: 50%;
    background: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.18);
    flex-shrink: 0;
  }

  /* Legend: has-events shows the indigo-outline + mini count pill */
  .ect-lgd-has-wrap {
    position: relative;
    width: 9px; height: 9px; flex-shrink: 0;
  }
  .ect-lgd-has {
    width: 9px; height: 9px; border-radius: 50%;
    border: 2px solid #4F46E5; background: #F5F3FF;
    display: block;
  }
  .ect-lgd-pill {
    position: absolute;
    bottom: -5px; left: 50%;
    transform: translateX(-50%);
    background: #4F46E5;
    border: 1px solid #FFFFFF;
    border-radius: 100px;
    width: 8px; height: 6px;
    font-size: 4px;
    font-weight: 800;
    color: #FFFFFF;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: 0;
    pointer-events: none;
  }

  .ect-lgd-empty {
    width: 9px; height: 9px; border-radius: 50%;
    border: 1.5px solid #E0E0EA; background: transparent;
    flex-shrink: 0;
  }
`;

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export function EventChainTimeline({ events = [] }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const panelRef = useRef(null);

  /* Close popover on outside click or Escape */
  useEffect(() => {
    function onDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setActiveIdx(null);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setActiveIdx(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Build 7-day window; group events by day */
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd   = dayStart + 86_400_000 - 1;

      const dayEvents = events
        .filter(e => {
          const t = new Date(e.startAt).getTime();
          return t >= dayStart && t <= dayEnd;
        })
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

      return {
        key:      d.toISOString(),
        date:     d,
        dayAbbr:  DAY_ABBR[d.getDay()],
        dateNum:  d.getDate(),
        fullDate: fmtFullDate(d),
        isToday:  i === 0,
        dayEvents,
      };
    });
  }, [events]);

  /* "APR" or "APR – MAY" when window spans two months */
  const monthLabel = useMemo(() => {
    const months = [...new Set(days.map(d =>
      d.date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
    ))];
    return months.join(" – ");
  }, [days]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ect-panel" ref={panelRef}>

        {/* ── Header ── */}
        <div className="ect-header">
          <div>
            <span className="ect-section-lbl">Schedule</span>
            <span className="ect-month-badge">{monthLabel}</span>
          </div>
          <Link to="/events" className="ect-view-all">
            All Events <ArrowRight size={10}/>
          </Link>
        </div>

        {/* ── Day-name labels ── */}
        <div className="ect-labels">
          {days.map(day => (
            <div key={day.key} className="ect-label-col">
              {day.isToday
                ? <span className="ect-today-tag">Today</span>
                : <span className="ect-tag-spacer" aria-hidden="true"/>
              }
              <span className="ect-day-abbr">{day.dayAbbr}</span>
            </div>
          ))}
        </div>

        {/* ── Timeline circles + chain ── */}
        <div className="ect-circles-row">
          <div className="ect-chain" aria-hidden="true"/>

          {days.map((day, idx) => {
            const hasEvents = day.dayEvents.length > 0;
            const isOpen    = activeIdx === idx;

            /* Node class composition */
            const nodeClass = [
              "ect-node",
              day.isToday              ? "ect-node-today"   : "",
              !day.isToday && hasEvents ? "ect-node-has"    : "",
              !day.isToday && isOpen    ? "ect-node-open"   : "",
              day.isToday && hasEvents  ? "ect-node-clickable" : "",
            ].filter(Boolean).join(" ");

            const numClass = `ect-num ${
              day.isToday   ? "ect-num-today"
              : hasEvents   ? "ect-num-has"
              : "ect-num-empty"
            }`;

            /*
             * Edge-aware popover alignment:
             *   idx 0 → left-anchored  (prevents left overflow)
             *   idx 6 → right-anchored (prevents right overflow)
             *   others → centered on node
             */
            const popClass = `ect-popover ${
              idx === 0 ? "ect-popover-left"
              : idx === 6 ? "ect-popover-right"
              : "ect-popover-center"
            }`;

            return (
              <div key={day.key} className="ect-circle-col">

                {/* ── Node ── */}
                <div
                  className={nodeClass}
                  onClick={() => hasEvents && setActiveIdx(isOpen ? null : idx)}
                  role={hasEvents ? "button" : undefined}
                  tabIndex={hasEvents ? 0 : undefined}
                  onKeyDown={e => e.key === "Enter" && hasEvents && setActiveIdx(isOpen ? null : idx)}
                  aria-expanded={hasEvents ? isOpen : undefined}
                  aria-label={
                    day.isToday   ? `Today, ${day.dateNum}${hasEvents ? `, ${day.dayEvents.length} event${day.dayEvents.length > 1 ? "s" : ""} — press Enter to preview` : ""}`
                    : hasEvents   ? `${day.dayAbbr} ${day.dateNum}, ${day.dayEvents.length} event${day.dayEvents.length > 1 ? "s" : ""} — press Enter to preview`
                    : `${day.dayAbbr} ${day.dateNum}, no events`
                  }
                >
                  <span className={numClass}>{day.dateNum}</span>

                  {/* Count badge — the new event indicator */}
                  {hasEvents && (
                    <div className={`ect-count-badge${day.isToday ? " ect-count-badge-today" : ""}`}>
                      {day.dayEvents.length}
                    </div>
                  )}
                </div>

                {/* ── Popover ── */}
                {isOpen && hasEvents && (
                  <div className={popClass} role="dialog" aria-label={`Events on ${day.fullDate}`}>

                    {/* Popover header */}
                    <div className="ect-pop-head">
                      <div className="ect-pop-date-text">{day.fullDate}</div>
                      <div className="ect-pop-count-text">
                        {day.dayEvents.length} event{day.dayEvents.length > 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Event list */}
                    <div className="ect-pop-list">
                      {day.dayEvents.map((e, ei) => (
                        <div key={`${e._id ?? ei}`} className="ect-pop-event">
                          <div className="ect-pop-event-name" title={e.title}>
                            {e.title}
                          </div>
                          <div className="ect-pop-meta">
                            <span className="ect-pop-meta-item">
                              <Clock size={9}/> {fmtTime(e.startAt)}
                            </span>
                            {e.location && (
                              <span className="ect-pop-meta-item">
                                <MapPin size={9}/> {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer link */}
                    <div className="ect-pop-footer">
                      <Link
                        to="/events"
                        className="ect-pop-footer-link"
                        onClick={() => setActiveIdx(null)}
                      >
                        View full schedule <ArrowRight size={10}/>
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div className="ect-legend">
          <span className="ect-legend-item">
            <span className="ect-lgd-today" aria-hidden="true"/>
            Today
          </span>
          <span className="ect-legend-item">
            <span className="ect-lgd-has-wrap" aria-hidden="true">
              <span className="ect-lgd-has"/>
              <span className="ect-lgd-pill">2</span>
            </span>
            Has events — click to preview
          </span>
          <span className="ect-legend-item">
            <span className="ect-lgd-empty" aria-hidden="true"/>
            No events
          </span>
        </div>

      </div>
    </>
  );
}
