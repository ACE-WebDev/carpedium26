'use client';

import { useState, useMemo, useEffect } from 'react';
import EventSearchFilter from './EventSearchFilter';
import EventCards, { formatTime } from './EventCards';

export default function EventsExplorer({ initialEvents = [] }) {
  const [eventsList, setEventsList] = useState(initialEvents);
  const [query, setQuery] = useState('');

  // Sync state if initialEvents updates from server
  useEffect(() => {
    setEventsList(initialEvents);
  }, [initialEvents]);

  // Fisher-Yates random shuffle
  const handleShuffle = () => {
    setEventsList((prev) => {
      if (prev.length <= 1) return prev;
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  // Real-time filtering matching against event Name, Venue, or Time
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eventsList;

    return eventsList.filter((ev) => {
      const name = (ev.Name || '').toLowerCase();
      const venue = (ev.Venue || '').toLowerCase();
      const rawTime = (ev.Time || '').toLowerCase();
      const formatted = formatTime(ev.Time).toLowerCase();

      return (
        name.includes(q) ||
        venue.includes(q) ||
        rawTime.includes(q) ||
        formatted.includes(q)
      );
    });
  }, [eventsList, query]);

  return (
    <>
      {/* ── Ticket Badges, Search Filter & Shuffle Button ── */}
      <div style={{ paddingTop: 'calc(8vh + 48px)' }}>
        <EventSearchFilter
          query={query}
          onQueryChange={setQuery}
          onShuffle={handleShuffle}
        />
      </div>

      {/* ── EXPLORE Heading ── */}
      <div style={{ textAlign: 'center', padding: 'clamp(32px, 4.5vw, 56px) 24px clamp(24px, 3.5vw, 40px)' }}>
        <h1
          style={{
            fontFamily: "'Titan One', cursive",
            fontSize: 'clamp(36px, 8vw, 100px)',
            fontWeight: 400,
            color: '#EFD4A3',
            lineHeight: '100%',
            letterSpacing: '0',
            margin: 0,
            userSelect: 'none',
          }}
        >
          EXPLORE
        </h1>
      </div>

      {/* ── Dynamically Filtered Event Cards ── */}
      <EventCards events={filteredEvents} isSearching={Boolean(query.trim())} />
    </>
  );
}

