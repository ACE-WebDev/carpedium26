'use client';

import { useEffect } from 'react';

/**
 * Adds `opening-done` to <body> so globals.css switches
 * overflow from `hidden` → `visible`, enabling page scroll.
 * Cleans up on unmount (e.g. navigating away).
 */
export default function BodyScrollUnlock() {
  useEffect(() => {
    document.body.classList.add('opening-done');
    return () => document.body.classList.remove('opening-done');
  }, []);

  return null; // renders nothing
}

