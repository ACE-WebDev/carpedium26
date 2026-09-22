"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/*
 * The scene change between About Us and the Intro section.
 *
 * A black circle grows from where the ball came to rest until it covers the
 * screen; at that point `onCovered` runs, which is where the caller tears
 * down everything above the Intro section; then the circle shrinks away to
 * reveal what is left. The page is held still while it plays — otherwise
 * removing that much of the document would yank the viewport — and released
 * as soon as the circle is gone.
 *
 * The circle is a fixed-size div scaled with `transform`, rather than an
 * animated `clip-path` or a custom property: transforms are interpolable
 * everywhere and composited on the GPU, where a bare `--radius` transition
 * needs @property registration and silently snaps without it.
 */
const GROW_MS = 700;
const HOLD_MS = 180;
const SHRINK_MS = 700;
const EASE = "cubic-bezier(.65,0,.35,1)";

/* The circle's own diameter before scaling. Scaling from a fixed base keeps
   the maths simple; it is sized up to cover the viewport's diagonal. */
const BASE = 100;

/* Locks scrolling without the page jumping: `position: fixed` alone would
   send the document to the top, so the offset is pinned first and restored
   afterwards. Returns the undo, which takes where to land. */
function lockScroll() {
  const { scrollY } = window;
  const { body } = document;
  const previous = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    overflowY: body.style.overflowY,
  };

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.overflowY = "scroll"; // hold the scrollbar's width, no reflow

  return (landAt = scrollY) => {
    Object.assign(body.style, previous);
    window.scrollTo(0, landAt);
  };
}

export default function CircleWipe({ originRef, onCovered }) {
  // `grown` is separate from the phase so the circle can mount at scale 0
  // and be scaled up on a later frame. Setting the final transform on the
  // very first render gives the browser no value to animate from, and the
  // cover would simply appear.
  const [phase, setPhase] = useState("idle"); // idle | grow | shrink | done
  const [grown, setGrown] = useState(false);
  const [origin, setOrigin] = useState(null);
  const timers = useRef([]);
  const played = useRef(false);

  useEffect(
    () => () => timers.current.forEach(clearTimeout),
    []
  );

  const play = useCallback(() => {
    if (played.current) return; // once per page load
    played.current = true;

    // Grow from wherever the ball finished, falling back to the middle.
    const box = originRef?.current?.getBoundingClientRect();
    const point = box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Far enough to cover the most distant corner from that point.
    const reach = Math.hypot(
      Math.max(point.x, window.innerWidth - point.x),
      Math.max(point.y, window.innerHeight - point.y)
    );
    setOrigin({ ...point, scale: (reach * 2.1) / BASE });

    // A forced full-screen blackout is the kind of motion this setting
    // exists to avoid, so switch straight to the Intro with no animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCovered?.();
      window.scrollTo(0, 0);
      setPhase("done");
      return;
    }

    const unlock = lockScroll();
    setPhase("grow");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setGrown(true))
    );

    timers.current.push(
      setTimeout(() => {
        // Fully covered: let the caller tear down what came before. That
        // removes everything above the Intro section, which then becomes
        // the top of the document — so the page lands at 0, not at the old
        // section's offset, which no longer exists.
        // Committed synchronously: React would otherwise batch the removal
        // until after unlock(), so the body would un-fix while the old
        // content was still in the document and the viewport would jump as
        // it disappeared a moment later.
        flushSync(() => onCovered?.());
        unlock(0);
        setPhase("shrink");
        setGrown(false);
        timers.current.push(setTimeout(() => setPhase("done"), SHRINK_MS));
      }, GROW_MS + HOLD_MS)
    );
  }, [originRef, onCovered]);

  // The ball's arrival is announced on the window, so MazeBall does not need
  // to know this component exists.
  useEffect(() => {
    const onArrive = () => play();
    window.addEventListener("mazeball:arrived", onArrive);
    return () => window.removeEventListener("mazeball:arrived", onArrive);
  }, [play]);

  if (!origin || phase === "idle" || phase === "done") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute rounded-full bg-black will-change-transform"
        style={{
          width: BASE,
          height: BASE,
          left: origin.x - BASE / 2,
          top: origin.y - BASE / 2,
          transform: `scale(${grown ? origin.scale : 0})`,
          transition: `transform ${
            phase === "grow" ? GROW_MS : SHRINK_MS
          }ms ${EASE}`,
        }}
      />
    </div>
  );
}
