"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The opening: a cover over the site with the CARPEDIEM wordmark cut out of
 * it, so the site — mounted underneath from the start — shows through the
 * letters like a window. Scrolling flies you through that window: the
 * wordmark zooms in on one letter and slides it to the middle of the screen,
 * the rest of the letters sweeping past and off the edges, until that letter
 * fills the screen and there is nothing left of the cover. The page itself
 * is held at the top meanwhile (opening.css), so you land on the hero.
 *
 * The cover is one SVG path — a sheet far bigger than the screen with the
 * wordmark in it — filled `evenodd`, so the letters are holes, and stroked,
 * which draws the letters' borders. Zooming only changes that path's
 * transform, so the letters stay sharp at any size.
 */

// carpediem.svg's artwork box inside its 1095-square canvas (x, y, width,
// height). The svg below is cropped to it; --logo-ratio in opening.css is
// the same box's width / height.
const LOGO_BOX = [51.3, 391.5, 1037.2, 333.38];

// The point the zoom flies through, in carpediem.svg units: the thickest
// spot in the wordmark, in the top-left of the D, and how far it is from the
// letter's nearest edge (measured at 38.8; kept a little under). Found with
// a distance map of the letters — re-measure if the artwork changes.
const FLY_THROUGH = { x: 649.3, y: 432.5, radius: 36 };

// Far enough out in every direction to cover any screen, even at rest.
const SHEET = "M-20000 -20000H20000V20000H-20000Z";

// ---------------------------------------------------------------------
// TUNE THE FLY-THROUGH HERE.
// How much scrolling it takes, in wheel/trackpad px.
const SCROLL_RANGE = 2400;
// A swipe travels less than a wheel does; this scales swipes up to match.
const TOUCH_BOOST = 2.5;
// How long the zoom takes to catch up with the scrolling, in ms. Higher
// glides more; lower follows the wheel more tightly.
const SMOOTHING_MS = 120;
// How far through (0–1) the Aranya text has faded out by.
const TEXT_FADE_END = 0.2;
// How far through (0–1) the letter has slid to the middle of the screen.
const SLIDE_END = 0.7;
// From here to the end (0–1) the cover also fades out, in case a sliver of
// it is still in view on an unusually shaped screen.
const FADE_FROM = 0.93;
// Once through, the page stays held this much longer (ms), so trackpad
// momentum does not carry it straight on past the hero.
const SETTLE_MS = 500;
// ---------------------------------------------------------------------

const KEY_STEPS = {
  ArrowDown: 100,
  ArrowUp: -100,
  PageDown: 600,
  PageUp: -600,
  " ": 600,
  End: SCROLL_RANGE,
  Home: -SCROLL_RANGE,
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (v) => v * v * (3 - 2 * v);

export default function OpeningStage({ logoPath, text, children }) {
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const coverRef = useRef(null);
  // Once through, `opening-done` goes on <body> for anything waiting on the
  // opening (the hero's ball), and the cover is removed for good a moment
  // later.
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const cover = coverRef.current;
    if (!stage || !svg || !cover) return;

    // Reduced motion skips the fly-through; the cover is already hidden by
    // opening.css, this takes it away. A one-shot handover on mount, not a
    // render loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("opening-done");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      return;
    }

    // The fly-through always lands on the hero, so start from the top, even
    // on a reload that would restore an earlier scroll position.
    document.body.classList.remove("opening-done");
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    // Where the fly-through point is at rest and how far it slides to the
    // middle of the screen (both in svg units), and how far it zooms: until
    // the letter around it covers the screen corner to corner.
    let geometry = null;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      const view = stage.getBoundingClientRect();
      const k = box.width / LOGO_BOX[2]; // screen px per svg unit, at rest
      geometry = {
        slideX:
          (view.left + view.width / 2 - box.left) / k -
          (FLY_THROUGH.x - LOGO_BOX[0]),
        slideY:
          (view.top + view.height / 2 - box.top) / k -
          (FLY_THROUGH.y - LOGO_BOX[1]),
        maxScale:
          (1.1 * Math.hypot(view.width, view.height)) /
          2 /
          (FLY_THROUGH.radius * k),
      };
    };

    let shown = 0; // how far through, 0–1, as drawn
    let target = 0; // …and as scrolled to

    const render = () => {
      const { slideX, slideY, maxScale } = geometry;
      const { x, y } = FLY_THROUGH;
      const slide = smoothstep(clamp01(shown / SLIDE_END));
      // Zooming by a constant factor per step of scrolling reads as moving
      // towards it at a steady speed.
      const scale = maxScale ** shown;
      cover.setAttribute(
        "transform",
        `translate(${x + slideX * slide} ${y + slideY * slide}) scale(${scale}) translate(${-x} ${-y})`,
      );
      stage.style.setProperty(
        "--text-fade",
        String(1 - clamp01(shown / TEXT_FADE_END)),
      );
      stage.style.opacity = String(
        1 - clamp01((shown - FADE_FROM) / (1 - FADE_FROM)),
      );
    };

    let frame = 0;
    let lastTime = 0;
    let finished = false;
    let settleTimer = 0;

    // Glides `shown` towards `target`, so a notched wheel still zooms
    // smoothly rather than in jumps.
    const tick = (now) => {
      frame = 0;
      const dt = lastTime ? Math.min(now - lastTime, 50) : 16;
      lastTime = now;
      shown += (target - shown) * (1 - Math.exp(-dt / SMOOTHING_MS));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      render();
      if (shown >= 1) finish();
      else if (shown !== target) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    };

    const advance = (px) => {
      if (finished) return;
      target = clamp01(target + px / SCROLL_RANGE);
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // One-way: what was waiting on the opening starts, and the cover (fully
    // faded by now) goes a moment later, releasing the page. Scrolling back
    // up after that just scrolls the page.
    const finish = () => {
      finished = true;
      document.body.classList.add("opening-done");
      // Staying mounted meanwhile keeps the page held (opening.css), which
      // swallows trackpad momentum, and keeps a swipe that is still going on
      // targeted at the cover: removed mid-swipe, the rest of the swipe would
      // go straight to the page and scroll it.
      settleTimer = window.setTimeout(() => {
        detach();
        setDone(true);
      }, SETTLE_MS);
    };

    const onWheel = (e) => {
      e.preventDefault();
      // Wheel deltas come in px, lines or pages depending on the device.
      const unit =
        e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      advance(e.deltaY * unit);
    };

    let touchY = null;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      advance((touchY - y) * TOUCH_BOOST);
      touchY = y;
    };
    const onTouchEnd = () => {
      touchY = null;
    };

    const onKeyDown = (e) => {
      if (finished || e.altKey || e.ctrlKey || e.metaKey) return;
      const step = KEY_STEPS[e.key];
      if (step === undefined) return;
      e.preventDefault();
      advance(e.key === " " && e.shiftKey ? -step : step);
    };

    const onResize = () => {
      if (finished) return;
      measure();
      render();
    };

    function detach() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    }

    measure();
    render();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      detach();
    };
  }, []);

  return (
    <>
      {children}
      {!done && (
        // Above the navbar (z-50) and the blackout (z-60), so everything is
        // covered apart from what shows through the letters. It also takes
        // the pointer, so nothing behind the letters can be clicked yet.
        <div
          ref={stageRef}
          aria-hidden="true"
          className="opening fixed inset-0 z-[70] h-[100dvh] w-full overflow-hidden"
        >
          <svg
            ref={svgRef}
            viewBox={LOGO_BOX.join(" ")}
            className="opening-logo absolute overflow-visible"
          >
            <path
              ref={coverRef}
              className="opening-cover"
              d={SHEET + logoPath}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            className="opening-text absolute inset-x-0 flex flex-col items-center"
            style={{ opacity: "var(--text-fade, 1)" }}
          >
            {text}
          </div>
        </div>
      )}
    </>
  );
}
