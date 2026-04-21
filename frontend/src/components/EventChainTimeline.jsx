import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/* ─── CSS ───────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Panel shell ── */
  .ect-panel {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #FFFFFF;
    border-radius: 20px;
    padding: 24px 28px 22px;
    border: 1px solid #EAEAF0;
    box-shadow:
      0 4px 6px -1px rgba(0,0,0,0.05),
      0 2px 4px -1px rgba(0,0,0,0.03);
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
    transition: gap 0.2s ease;
    flex-shrink: 0;
    padding-bottom: 2px;
  }
  .ect-view-all:hover { gap: 7px; }

  /* ── Day name label row ── */
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

  /* "TODAY" micro-badge above the day abbreviation */
  .ect-today-tag {
    font-size: 0.49rem;
    font-weight: 800;
    color: #4F46E5;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    line-height: 1;
  }

  /* Invisible spacer keeps all day-name labels vertically aligned */
  .ect-tag-spacer {
    display: block;
    height: 8px;
  }

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
    align-items: center;   /* vertically centers all nodes on the same axis */
  }

  /*
   * The chain line.
   * left/right: calc(100% / 14) correctly places each endpoint
   * at the horizontal center of the first and last flex column (flex: 1, n=7 columns).
   * First column center = (1/7)/2 of row width = 1/14 of row width. ✓
   */
  .ect-chain {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: calc(100% / 14);
    right: calc(100% / 14);
    height: 2px;
    background: linear-gradient(
      90deg,
      #F4F4F9 0%,
      #E4E4EC 18%,
      #E4E4EC 82%,
      #F4F4F9 100%
    );
    border-radius: 2px;
    z-index: 0;
  }

  .ect-circle-col {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;            /* sits above the chain line */
  }

  /* ── Node: base (STANDARD — empty day) ── */
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
      transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.22s ease;
    cursor: default;
  }
  .ect-node:hover {
    transform: scale(1.11);
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  }

  /* ── Node: TODAY (State 1) ── */
  .ect-node-today {
    width: 50px;
    height: 50px;
    background: #4F46E5;
    border: none;
    /*
     * Dual box-shadow:
     *   Layer 1 — persistent soft elevation glow (the "halo")
     *   Layer 2 — expanding ripple ring that fades out (the "pulse")
     */
    animation: ect-pulse 2.2s ease-out infinite;
  }
  .ect-node-today:hover { transform: scale(1.06); }

  @keyframes ect-pulse {
    0% {
      box-shadow:
        0 4px 18px rgba(79, 70, 229, 0.34),
        0 0 0 0px  rgba(79, 70, 229, 0.44);
    }
    65% {
      box-shadow:
        0 4px 18px rgba(79, 70, 229, 0.34),
        0 0 0 10px rgba(79, 70, 229, 0.00);
    }
    100% {
      box-shadow:
        0 4px 18px rgba(79, 70, 229, 0.34),
        0 0 0 0px  rgba(79, 70, 229, 0.00);
    }
  }

  /* ── Node: HAS EVENTS (State 2) ── */
  .ect-node-has {
    border: 2px solid #2D3748;  /* stronger outline than standard */
  }

  /* ── Date numbers ── */
  .ect-num {
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .ect-num-today { color: #FFFFFF; font-size: 1rem; font-weight: 800; }
  .ect-num-has   { color: #111827; font-weight: 800; }
  .ect-num-empty { color: #CECEDE; font-weight: 400; }

  /*
   * ── Event dot marker (State 2 only) ──
   * Precisely centered at the absolute bottom of its parent circle.
   * bottom: -4px places the dot's center on the circle's south edge
   * (4px = dot_height / 2 + 1px for the border)
   */
  .ect-dot {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4F46E5;
    border: 2px solid #FFFFFF;
    box-shadow: 0 1px 5px rgba(79, 70, 229, 0.45);
  }

  /* ── Legend ── */
  .ect-legend {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid #F3F3F8;
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

  /* Legend: today indicator */
  .ect-lgd-today {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.18);
    flex-shrink: 0;
  }

  /* Legend: has-events indicator (circle with dot below) */
  .ect-lgd-has {
    width: 9px; height: 9px;
    border-radius: 50%;
    border: 2px solid #2D3748;
    background: transparent;
    position: relative;
    flex-shrink: 0;
  }
  .ect-lgd-has::after {
    content: '';
    position: absolute;
    bottom: -4px; left: 50%;
    transform: translateX(-50%);
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #4F46E5;
  }

  /* Legend: empty indicator */
  .ect-lgd-empty {
    width: 9px; height: 9px;
    border-radius: 50%;
    border: 1.5px solid #E0E0EA;
    background: transparent;
    flex-shrink: 0;
  }
`;

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export function EventChainTimeline({ events = [] }) {
  /*
   * Build the 7-day window starting from today.
   * Each day is compared against the events array (expects { startAt: Date|string }).
   */
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayStart = d.getTime();

      const hasEvents = events.some(e => {
        const ed = new Date(e.startAt);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === dayStart;
      });

      return {
        key:      d.toISOString(),
        date:     d,
        dayAbbr:  DAY_ABBR[d.getDay()],
        dateNum:  d.getDate(),
        isToday:  i === 0,
        hasEvents,
      };
    });
  }, [events]);

  /* Shows "APR" or "APR – MAY" if the 7-day window spans two months */
  const monthLabel = useMemo(() => {
    const months = [...new Set(days.map(d =>
      d.date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
    ))];
    return months.join(" – ");
  }, [days]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ect-panel">

        {/* ── Header ── */}
        <div className="ect-header">
          <div>
            <span className="ect-section-lbl">Schedule</span>
            <h3 className="ect-section-title">7-Day Timeline</h3>
            <span className="ect-month-badge">{monthLabel}</span>
          </div>
          <Link to="/events" className="ect-view-all">
            All Events <ArrowRight size={10}/>
          </Link>
        </div>

        {/* ── Day-name labels ──
            Each column is flex: 1 so they equally share the full width.
            The "TODAY" tag and invisible spacer ensure all day abbreviations
            sit on the same baseline regardless of which column has the badge. */}
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

        {/* ── Timeline: chain + nodes ── */}
        <div className="ect-circles-row">

          {/* The connecting chain line — sits behind all nodes via z-index */}
          <div className="ect-chain" aria-hidden="true"/>

          {days.map(day => {
            /* Derive BEM-style class combinations per node state */
            const nodeClass = [
              "ect-node",
              day.isToday   ? "ect-node-today" : "",
              day.hasEvents && !day.isToday ? "ect-node-has" : "",
            ].filter(Boolean).join(" ");

            const numClass = [
              "ect-num",
              day.isToday   ? "ect-num-today"
              : day.hasEvents ? "ect-num-has"
              : "ect-num-empty",
            ].join(" ");

            return (
              <div key={day.key} className="ect-circle-col">
                <div className={nodeClass} aria-label={
                  day.isToday   ? `Today, ${day.dateNum}`
                  : day.hasEvents ? `${day.dayAbbr} ${day.dateNum}, has events`
                  : `${day.dayAbbr} ${day.dateNum}`
                }>
                  <span className={numClass}>{day.dateNum}</span>

                  {/* State 2 marker: indigo dot at absolute bottom center of circle */}
                  {day.hasEvents && !day.isToday && (
                    <div className="ect-dot" aria-hidden="true"/>
                  )}
                </div>
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
            <span className="ect-lgd-has" aria-hidden="true"/>
            Has events
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
