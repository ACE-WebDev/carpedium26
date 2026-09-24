'use client';

import { useRef, useEffect } from 'react';

/*
 * components/events/EventCards.jsx
 *
 * Receives `events` array from Supabase via page.jsx (server-side).
 * One card per event — automatically expands as rows are added to the DB.
 *
 * Hover effect (pure CSS via embedded <style>):
 *   • Card blooms up  → scale(1.07) + golden glow
 *   • Poster dims     → brightness(0.45)
 *   • Info overlay    → slides up from bottom (Name, Venue, Time)
 */

/* ── Helper: format timetz string "14:30:00+05:30" → "2:30 PM" ──────────── */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    // timetz is "HH:MM:SS±HH:MM" — parse hours/minutes
    const [hh, mm] = timeStr.split(':');
    const h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${mm} ${ampm}`;
  } catch {
    return timeStr;
  }
}

const styles = `
  /* ── Responsive grid ─────────────────────────────────────────────────── */
  .ec-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(14px, 1.8vw, 24px);
    width: 100%;
  }
  @media (max-width: 960px)  { .ec-grid { grid-template-columns: repeat(3, 1fr); gap: clamp(12px, 1.5vw, 20px); } }
  @media (max-width: 600px)  { .ec-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
  @media (max-width: 380px)  { .ec-grid { grid-template-columns: repeat(1, 1fr); gap: 12px; } }

  /* ── Card base ───────────────────────────────────────────────────────── */
  .ec-card {
    position: relative;
    border-radius: clamp(12px, 1.4vw, 18px);
    overflow: hidden;
    aspect-ratio: 3 / 4;
    cursor: pointer;
    z-index: 1;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);

    /* smooth bloom */
    transition:
      transform  0.4s cubic-bezier(0.23, 1, 0.32, 1),
      box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1),
      z-index    0s   0.4s;
    will-change: transform;
  }

  /* ── Bloom on hover ──────────────────────────────────────────────────── */
  .ec-card:hover {
    transform: scale(1.06);
    box-shadow:
      0 16px 44px rgba(0, 0, 0, 0.75),
      0 0 0 1.5px rgba(194, 139, 91, 0.6),
      0 0 30px rgba(194, 139, 91, 0.25);
    z-index: 20;
    transition:
      transform  0.4s cubic-bezier(0.23, 1, 0.32, 1),
      box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }

  /* ── Poster image — dims on hover ───────────────────────────────────── */
  .ec-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .ec-card:hover .ec-poster {
    filter: brightness(0.38);
  }

  /* ── Info overlay — slides up from bottom on hover ───────────────────── */
  .ec-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: clamp(10px, 2vw, 18px) clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 20px);

    /* gradient so text is always readable */
    background: linear-gradient(
      to top,
      rgba(10, 6, 2, 0.96) 0%,
      rgba(10, 6, 2, 0.75) 55%,
      transparent 100%
    );

    transform: translateY(100%);
    opacity: 0;
    transition:
      transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
      opacity   0.4s cubic-bezier(0.23, 1, 0.32, 1);
    display: flex;
    flex-direction: column;
    gap: clamp(3px, 0.5vw, 6px);
  }
  .ec-card:hover .ec-overlay {
    transform: translateY(0);
    opacity: 1;
  }

  /* ── Text inside overlay ─────────────────────────────────────────────── */
  .ec-name {
    font-family: 'Georgia', serif;
    font-weight: 700;
    font-size: clamp(12px, 1.2vw, 16px);
    color: #EFD4A3;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }
  .ec-meta {
    font-family: 'Georgia', serif;
    font-size: clamp(10px, 0.9vw, 13px);
    color: rgba(239, 212, 163, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  /* ── Placeholder (no image) ──────────────────────────────────────────── */
  .ec-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    background: linear-gradient(160deg, #2a1e10 0%, #1a1208 60%, #0e0c08 100%);
    color: rgba(194, 139, 91, 0.55);
    font-family: 'Georgia', serif;
    font-size: clamp(10px, 1vw, 13px);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    user-select: none;
  }
`;

function resolveImageUrl(url) {
  if (!url) return '';
  let clean = url.trim().replace(/^["']+|["']+$/g, '');

  // Automatically convert Supabase dashboard preview URLs into direct public storage URLs
  const dashboardMatch = clean.match(
    /supabase\.com\/dashboard\/project\/([^/]+)\/storage\/files\/buckets\/([^/?]+)\?preview=([^&]+)/
  );
  if (dashboardMatch) {
    const [, project, bucket, filename] = dashboardMatch;
    return `https://${project}.supabase.co/storage/v1/object/public/${bucket}/${decodeURIComponent(filename)}`;
  }
  return clean;
}

/* ── EventCard ───────────────────────────────────────────────────────────── */
function EventCard({ event }) {
  const { Name, Venue, Time, img_url } = event;
  const posterSrc = resolveImageUrl(img_url);

  return (
    <div className="ec-card">

      {/* Poster image — falls back to styled placeholder or fallback image */}
      {posterSrc ? (
        <img
          className="ec-poster"
          src={posterSrc}
          alt={Name || 'Event poster'}
          loading="lazy"
          onError={(e) => {
            // If the URL fails to load (e.g. private bucket), fallback to local sample
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/events/sample.png';
          }}
        />
      ) : (
        <div className="ec-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M2 9a3 3 0 1 1 0-6v6zM2 9v6a3 3 0 1 0 0 6V9zM22 9a3 3 0 1 0 0-6v6zM22 9v6a3 3 0 1 1 0 6V9zM2 9h20M2 15h20" />
          </svg>
          No poster
        </div>
      )}

      {/* Info overlay — visible on hover */}
      <div className="ec-overlay">
        <p className="ec-name">{Name || '—'}</p>
        {Venue && <p className="ec-meta">📍 {Venue}</p>}
        {Time  && <p className="ec-meta">🕐 {formatTime(Time)}</p>}
      </div>

    </div>
  );
}

/* ── EventCards (default export) ─────────────────────────────────────────── */
export default function EventCards({ events = [], isSearching = false }) {
  const cardElementsRef = useRef(new Map());
  const prevRectsRef = useRef(new Map());

  // FLIP (First, Last, Invert, Play) smooth glide animation on reordering
  useEffect(() => {
    const prevRects = prevRectsRef.current;
    const currentRects = new Map();

    events.forEach((ev, idx) => {
      const el = cardElementsRef.current.get(ev.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        currentRects.set(ev.id, rect);

        const prev = prevRects.get(ev.id);
        if (prev) {
          const deltaX = prev.left - rect.left;
          const deltaY = prev.top - rect.top;

          if (deltaX !== 0 || deltaY !== 0) {
            // Subtle card tilt and scale for a tangible card deck shuffle sensation
            const tilt = (idx % 2 === 0 ? 1 : -1) * 3;
            el.animate(
              [
                {
                  transform: `translate(${deltaX}px, ${deltaY}px) scale(0.92) rotate(${tilt}deg)`,
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
                  zIndex: 15,
                  opacity: 0.85,
                },
                {
                  transform: 'translate(0, 0) scale(1) rotate(0deg)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                  zIndex: 1,
                  opacity: 1,
                },
              ],
              {
                duration: 650,
                easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
                fill: 'none',
              }
            );
          }
        }
      }
    });

    prevRectsRef.current = currentRects;
  }, [events]);

  return (
    <>
      <style>{styles}</style>

      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 clamp(16px, 2.5vw, 36px) clamp(32px, 5vw, 64px)',
        boxSizing: 'border-box',
      }}>

        {events.length === 0 ? (
          <p style={{
            color: 'rgba(239, 212, 163, 0.45)',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            padding: '48px 0',
            letterSpacing: '0.04em',
          }}>
            {isSearching ? 'No events found matching your search.' : 'No events found. Add rows in Supabase to see them here.'}
          </p>
        ) : (
          <div className="ec-grid" role="list" aria-label="Event cards">
            {events.map((ev) => (
              <div
                key={ev.id}
                role="listitem"
                ref={(node) => {
                  if (node) {
                    cardElementsRef.current.set(ev.id, node);
                  } else {
                    cardElementsRef.current.delete(ev.id);
                  }
                }}
                style={{ willChange: 'transform' }}
              >
                <EventCard event={ev} />
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
