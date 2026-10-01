"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import config from "@/config/ballAnimation";

/*
 * A scene change, played when a maze ball lands: `trigger` names which one
 * (the BallFall variant — "hero" lands in About Us, "sponsors" on the maze
 * end above the Sponsors section).
 *
 * A black circle grows from where the ball came to rest until it covers the
 * screen; at that point `onCovered` runs, which is where the caller tears
 * down everything above the Intro section; then the circle shrinks away to
 * reveal what is left. `onDone` runs once the shrink has finished and the
 * circle is gone. The page is held still while it plays — otherwise
 * removing that much of the document would yank the viewport — and released
 * as soon as the circle is gone.
 *
 * The circle is a fixed-size div scaled with `transform`, rather than an
 * animated `clip-path` or a custom property: transforms are interpolable
 * everywhere and composited on the GPU, where a bare `--radius` transition
 * needs @property registration and silently snaps without it.
 */
// Timings and colour live in src/config/ballAnimation.js, under `blackout`.
const {
  growMs: GROW_MS,
  holdMs: HOLD_MS,
  shrinkMs: SHRINK_MS,
  easing: EASE,
  color: COLOR,
} = config.blackout;

/* The circle's own diameter before scaling. Scaling from a fixed base keeps
   the maths simple; it is sized past the viewport's farthest corner. */
const BASE = 100;

/* Locks scrolling without the page jumping: `position: fixed` alone would
   send the document to the top, so the offset is pinned first and restored
   afterwards. Returns the undo, which takes where to land. Shared by every
   blackout and counted, so two that overlap (both balls landing within a
   moment of each other) cannot restore each other's lock and leave the page
   pinned for good. */
let locks = 0;
let restoreScroll = null;

function lockScroll() {
  if (locks++ === 0) {
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

    restoreScroll = (landAt = scrollY) => {
      Object.assign(body.style, previous);
      window.scrollTo(0, landAt);
    };
  }

  let released = false;
  return (landAt) => {
    if (released) return;
    released = true;
    if (--locks === 0) restoreScroll(landAt);
  };
}

export default function CircleWipe({ trigger = "hero", originRef, onCovered, onDone }) {
  // `grown` is separate from the phase so the circle can mount at scale 0
  // and be scaled up on a later frame. Setting the final transform on the
  // very first render gives the browser no value to animate from, and the
  // cover would simply appear.
  const [phase, setPhase] = useState("idle"); // idle | grow | shrink | done
  const [grown, setGrown] = useState(false);
  const [origin, setOrigin] = useState(null);
  const timers = useRef([]);
  const played = useRef(false);
  // Releases the page if it is still held when this goes away mid-play (a
  // navbar link restarting the page).
  const unlockRef = useRef(null);

  // Always call the latest onDone without making `play` depend on it.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      unlockRef.current?.(0);
    },
    []
  );

  const play = useCallback((at) => {
    if (played.current) return; // once per page load
    played.current = true;

    // Grow out of the ball itself, which reports where it is on screen as it
    // lands; failing that, from `originRef` (the About Us image, for the
    // hero), and failing that, from the middle of the screen.
    const box = originRef?.current?.getBoundingClientRect();
    const point = at
      ? { x: at.x, y: at.y }
      : box
        ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Use the largest viewport measurement so mobile browser chrome or a
    // visual viewport resize cannot leave a corner uncovered. The 25% margin
    // gives the expanding circle enough overlap to cover the full screen.
    const viewportWidth = Math.max(
      window.innerWidth,
      document.documentElement.clientWidth,
      window.visualViewport?.width ?? 0
    );
    const viewportHeight = Math.max(
      window.innerHeight,
      document.documentElement.clientHeight,
      window.visualViewport?.height ?? 0
    );
    const reach = Math.hypot(
      Math.max(Math.abs(point.x), Math.abs(viewportWidth - point.x)),
      Math.max(Math.abs(point.y), Math.abs(viewportHeight - point.y))
    );
    setOrigin({ ...point, scale: (reach * 2.5) / BASE });

    // A forced full-screen blackout is the kind of motion this setting
    // exists to avoid, so switch straight to the next section, unanimated.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCovered?.();
      window.scrollTo(0, 0);
      setPhase("done");
      onDoneRef.current?.();
      return;
    }

    const unlock = lockScroll();
    unlockRef.current = unlock;
    setPhase("grow");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setGrown(true))
    );

    timers.current.push(
      setTimeout(() => {
        // Fully covered: let the caller tear down what came before. That
        // removes everything above the section being revealed, which then
        // becomes the top of the document — so the page lands at 0, not at
        // the old section's offset, which no longer exists.
        // Committed synchronously: React would otherwise batch the removal
        // until after unlock(), so the body would un-fix while the old
        // content was still in the document and the viewport would jump as
        // it disappeared a moment later.
        flushSync(() => onCovered?.());
        unlock(0);
        setPhase("shrink");
        setGrown(false);
        timers.current.push(
          setTimeout(() => {
            setPhase("done");
            onDoneRef.current?.(); // the circle is gone: the wipe is complete
          }, SHRINK_MS)
        );
      }, GROW_MS + HOLD_MS)
    );
  }, [originRef, onCovered]);

  // The balls' arrivals are announced on the window, so BallFall does not
  // need to know this component exists; each blackout plays for its own.
  useEffect(() => {
    const onArrive = (event) => {
      if (event.detail?.variant === trigger) play(event.detail);
    };
    window.addEventListener("mazeball:arrived", onArrive);
    return () => window.removeEventListener("mazeball:arrived", onArrive);
  }, [trigger, play]);

  if (!origin || phase === "idle" || phase === "done") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute rounded-full will-change-transform"
        style={{
          background: COLOR,
          width: BASE,
          height: BASE,
          left: origin.x - BASE / 2,
          top: origin.y - BASE / 2,
          transform: `scale(${grown ? origin.scale : 0})`,
          transformOrigin: "center",
          transition: `transform ${
            phase === "grow" ? GROW_MS : SHRINK_MS
          }ms ${EASE}`,
        }}
      />
    </div>
  );
}
