'use client';

import { useState, useMemo, useEffect } from 'react';
import EventSearchFilter from './EventSearchFilter';
import EventCards, { formatTime } from './EventCards';

export default function EventsExplorer({ initialEvents = [] }) {
  const [eventsList, setEventsList] = useState(initialEvents);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  // Real-time filtering matching against Category, Name, Venue, or Time
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = selectedCategory.trim().toLowerCase();

    return eventsList.filter((ev) => {
      // Category filter match
      if (cat) {
        const evCat = (ev.category || '').toLowerCase();
        const matchesCategory =
          evCat === cat ||
          evCat.split(/[\s,]+/).some((c) => c.trim() === cat) ||
          evCat.includes(cat);
        if (!matchesCategory) return false;
      }

      // Text search query match
      if (q) {
        const name = (ev.Name || '').toLowerCase();
        const venue = (ev.Venue || '').toLowerCase();
        const rawTime = (ev.Time || '').toLowerCase();
        const formatted = formatTime(ev.Time).toLowerCase();
        const evCat = (ev.category || '').toLowerCase();

        return (
          name.includes(q) ||
          venue.includes(q) ||
          rawTime.includes(q) ||
          formatted.includes(q) ||
          evCat.includes(q)
        );
      }

      return true;
    });
  }, [eventsList, query, selectedCategory]);

  return (
    <>
      {/* ── Ticket Badges, Search Filter & Shuffle Button ── */}
      <div style={{ paddingTop: 'calc(8vh + 48px)' }}>
        <EventSearchFilter
          query={query}
          onQueryChange={setQuery}
          onShuffle={handleShuffle}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
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
            textShadow: '0 2px 24px rgba(194,139,91,0.5)',
          }}
        >
          EXPLORE
        </h1>
      </div>

      {/* ── Dynamically Filtered Event Cards ── */}
      <EventCards
        events={filteredEvents}
        isSearching={Boolean(query.trim() || selectedCategory)}
      />
    </>
  );
}

