'use client';

import { useState } from 'react';

const CATEGORIES = [
  'Music', 'Dance', 'English', 'Tamil',
  'Telugu', 'Hindi', 'Fun', 'Arts', 'Design',
];

const PAGE_BG     = '#EDD4A3';  // must match page.jsx backgroundColor
const TICKET_DARK = '#1e1508';  // outer dark ticket frame

/* ─── embedded responsive styles ────────────────────────────────────────────
 * Using a <style> tag (same pattern as Merch.jsx) because inline CSS cannot
 * express @media queries. This is NOT an external CSS module.
 * ─────────────────────────────────────────────────────────────────────────── */
const gridStyles = `
  .esf-badge-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: clamp(6px, 0.8vw, 10px);
    width: 100%;
  }

  @media (max-width: 860px) {
    .esf-badge-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .esf-badge-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
  }

  .esf-badge-cell {
    display: flex;
  }
`;

/* ─── TicketBadge ─────────────────────────────────────────────────────────── */
function TicketBadge({ label }) {
  const [hovered, setHovered] = useState(false);

  /*
   * Golden ticket badge:
   * • Directly sits on the background (no dark brown outer frame/borders)
   * • 7px chamfered corners matching the vintage ticket aesthetic
   * • Warm golden gradient matching navbar #C28B5B
   * • Subtle cream inner border
   */
  const badgeStyle = {
    width: '100%',
    padding: '13px 4px',
    boxSizing: 'border-box',
    textAlign: 'center',
    background: hovered
      ? 'linear-gradient(160deg, #e8b87a 0%, #cc9460 35%, #b47844 70%, #9e6432 100%)'
      : 'linear-gradient(160deg, #daa86e 0%, #c28b5b 35%, #a87040 70%, #945e2c 100%)',
    borderRadius: '4px',
    clipPath:
      'polygon(7px 0%, calc(100% - 7px) 0%, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0% calc(100% - 7px), 0% 7px)',
    border: '1.5px solid rgba(255, 248, 215, 0.85)',
    boxShadow: hovered
      ? '0 6px 16px rgba(0, 0, 0, 0.45), 0 0 12px rgba(194, 139, 91, 0.35)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  const innerBorder = {
    position: 'absolute',
    inset: '2.5px',
    borderRadius: '3px',
    clipPath:
      'polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px)',
    border: '1px solid rgba(255, 248, 215, 0.4)',
    pointerEvents: 'none',
  };

  const labelStyle = {
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: '700',
    fontSize: 'clamp(12px, 1.4vw, 16px)',
    letterSpacing: '0.03em',
    color: '#18202e',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div
      style={badgeStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={innerBorder} aria-hidden="true" />
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

/* ─── EventSearchFilter ──────────────────────────────────────────────────── */
export default function EventSearchFilter({ query: controlledQuery, onQueryChange, onShuffle }) {
  const [internalQuery, setInternalQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [shuffleHovered, setShuffleHovered] = useState(false);
  const [shuffleSpinning, setShuffleSpinning] = useState(false);

  const isControlled = controlledQuery !== undefined;
  const query = isControlled ? controlledQuery : internalQuery;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (isControlled) {
      onQueryChange?.(val);
    } else {
      setInternalQuery(val);
    }
  };

  const handleShuffleClick = () => {
    setShuffleSpinning(true);
    setTimeout(() => setShuffleSpinning(false), 500);
    onShuffle?.();
  };

  const contentWrap = {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 clamp(16px, 2.5vw, 36px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  /* Pill: cream bg, bronze circle button sits inside right end */
  const searchPill = {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    height: '48px',
    borderRadius: '999px',
    background: '#fefbee',
    border: focused
      ? '1.5px solid rgba(194, 139, 91, 0.75)'
      : '1.5px solid rgba(194, 139, 91, 0.25)',
    boxShadow: focused ? '0 0 0 3px rgba(194,139,91,0.15)' : 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    padding: '0 6px 0 0',
    boxSizing: 'border-box',
  };

  const inputStyle = {
    flex: 1,
    padding: '0 12px 0 22px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '14px',
    color: '#4a3010',
    letterSpacing: '0.02em',
    minWidth: 0,
    height: '100%',
  };

  const iconBtn = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    flexShrink: 0,
    background: 'linear-gradient(145deg, #d4a46a 0%, #c28b5b 45%, #a06828 100%)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff8ee',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  };

  /* Shuffle button: compact cylindrical rounded pill matching user reference */
  const shuffleBtn = {
    height: '42px',
    width: 'clamp(52px, 5.2vw, 62px)',
    flexShrink: 0,
    boxSizing: 'border-box',
    borderRadius: '10px',
    background: shuffleHovered
      ? 'linear-gradient(180deg, #e4b680 0%, #cc915c 50%, #b87c48 100%)'
      : 'linear-gradient(180deg, #d8ab76 0%, #c18856 50%, #ad7646 100%)',
    border: '1px solid rgba(255, 248, 220, 0.5)',
    boxShadow: shuffleHovered
      ? '0 4px 12px rgba(0, 0, 0, 0.45), 0 0 10px rgba(194, 139, 91, 0.3)'
      : '0 2px 6px rgba(0, 0, 0, 0.25)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    transform: shuffleHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <>
      {/* Embedded responsive grid styles — not an external module */}
      <style>{gridStyles}</style>

      <div style={contentWrap}>

        {/* ── Category Ticket Badges — CSS Grid for equal sizing ── */}
        <div className="esf-badge-grid" role="list" aria-label="Event categories">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="esf-badge-cell" role="listitem">
              <TicketBadge label={cat} />
            </div>
          ))}
        </div>

        {/* ── Search Bar & Shuffle Row ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 1.2vw, 14px)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Search Bar (takes up all remaining width) */}
          <div style={searchPill}>
            <input
              type="search"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search ..."
              aria-label="Search events"
              style={inputStyle}
            />
            <button
              type="button"
              style={iconBtn}
              aria-label="Search"
              onClick={() => { /* wire up search logic here */ }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </button>
          </div>

          {/* Shuffle Button — compact cylindrical rounded */}
          <button
            type="button"
            style={shuffleBtn}
            aria-label="Shuffle events"
            title="Shuffle events"
            onMouseEnter={() => setShuffleHovered(true)}
            onMouseLeave={() => setShuffleHovered(false)}
            onClick={handleShuffleClick}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff9ee"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: shuffleSpinning ? 'rotate(180deg) scale(1.15)' : 'rotate(0deg) scale(1)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              <path d="M16 3h5v5" />
              <path d="M4 20L21 3" />
              <path d="M21 16v5h-5" />
              <path d="M15 15l6 6" />
              <path d="M4 4l5 5" />
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}
