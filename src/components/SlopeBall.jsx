"use client";

import { useEffect, useRef } from "react";
import config from "@/config/ballAnimation";
import { HERO_VIEW } from "./mazeBallTimeline";

/*
 * The ball in the Flagship section. It rolls in from off the right edge down
 * the slanted bar (`data-ball-slope`), under the one above it
 * (`data-ball-ceiling`), gathering speed, flies off the bar's low end and
 * falls behind the green wave (`data-ball-cover`), where it is gone. Plain
 * physics — rolling down the slope under gravity, then a free fall with the
 * speed it left at — with the same gravity and playback speed as the maze
 * falls, played by time or by scroll per `mode` (src/config/ballAnimation.js).
 *
 * Render it inside the element the ball moves within, stacked under the
 * cover: it covers its parent, and the ball is hidden by being behind it.
 */

const MODE = config.mode === "auto" ? "auto" : "scroll";

/* The bars' edges, in their own image px: the lower bar's top face, which
   the ball rolls on, from its high end to its low end, and the upper bar's
   underside, the corridor's ceiling. */
const SLOPE = { width: 293, height: 211, from: [292, 18], to: [5, 112] };
const CEILING = { width: 355, height: 232, from: [354, 127], to: [40, 227] };

/* How much of the corridor between the bars the ball fills. */
const FILL = 0.72;

/* The cover's curved top edge dips to ~20% of its height (flagship-wave.png),
   so a ball wholly below that is hidden wherever it falls. */
const COVER_TOP = 0.2;

/* Auto mode starts once the bar's low end has been scrolled up to this far
   down the screen. Scroll mode plays from there until it is this much higher
   again, as a fraction of the screen height. */
const START_AT = 0.7;
const SCROLL_SPAN = 0.5;

/* Where a point in an image's own px is, in px within `rootBox`. */
function pointIn(img, [px, py], size, rootBox) {
  const box = img.getBoundingClientRect();
  return [
    box.left - rootBox.left + (px * box.width) / size.width,
    box.top - rootBox.top + (py * box.height) / size.height,
  ];
}

export default function SlopeBall() {
  const svgRef = useRef(null);
  const ballRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    const ball = ballRef.current;
    const root = svg?.parentElement;
    if (!svg || !ball || !root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return; // it would only ever end up hidden anyway

    // The run as laid out now, in px within the root; null until measurable.
    let run = null;

    const measure = () => {
      const slope = root.querySelector("[data-ball-slope]");
      const ceiling = root.querySelector("[data-ball-ceiling]");
      const cover = root.querySelector("[data-ball-cover]");
      const rootBox = root.getBoundingClientRect();
      if (!slope || !ceiling || !cover || !rootBox.width) return;
      if (!slope.getBoundingClientRect().width) return;

      const [ax, ay] = pointIn(slope, SLOPE.from, SLOPE, rootBox);
      const [bx, by] = pointIn(slope, SLOPE.to, SLOPE, rootBox);
      const [cx, cy] = pointIn(ceiling, CEILING.from, CEILING, rootBox);
      const [ex, ey] = pointIn(ceiling, CEILING.to, CEILING, rootBox);

      // Downhill along the bar, and the normal pointing up off it.
      const length = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / length;
      const dy = (by - ay) / length;
      const nx = -dy;
      const ny = dx;

      // Sized to the corridor: the ceiling's distance from the middle of
      // the bar, square to it.
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const cl = Math.hypot(ex - cx, ey - cy);
      const gap = Math.abs((ex - cx) * (my - cy) - (ey - cy) * (mx - cx)) / cl;
      const r = (gap * FILL) / 2;

      // Gravity as in the maze falls: maze px/s², at the hero maze's scale.
      const g = (config.physics.gravity * rootBox.width) / HERO_VIEW.width;
      const accel = g * dy; // down the slope
      const tLeave = Math.sqrt((2 * length) / accel);
      const vLeave = accel * tLeave;

      // It comes into view once its centre is a radius inside the edge.
      const enterAt = Math.max(0, (ax + nx * r - (rootBox.width + r)) / -dx);
      const tEnter = Math.sqrt((2 * enterAt) / accel);

      // Falls until it is wholly behind the cover.
      const coverBox = cover.getBoundingClientRect();
      const hideY =
        coverBox.top - rootBox.top + coverBox.height * COVER_TOP + r;
      const y0 = by + ny * r;
      const vy = vLeave * dy;
      const drop = Math.max(0, hideY - y0);
      const tFall = (-vy + Math.sqrt(vy * vy + 2 * g * drop)) / g;

      svg.setAttribute("viewBox", `0 0 ${rootBox.width} ${rootBox.height}`);
      ball.setAttribute("width", r * 2);
      ball.setAttribute("height", r * 2);

      run = {
        start: [ax + nx * r, ay + ny * r],
        leave: [bx + nx * r, y0],
        dx,
        dy,
        r,
        g,
        accel,
        length,
        vLeave,
        tLeave,
        tEnter,
        tEnd: tLeave + tFall,
        lowEnd: by, // the bar's low end, for when to start
      };
    };

    // Puts the ball where it is `t` seconds after it set off down the bar.
    const placeAt = (t) => {
      const { start, leave, dx, dy, r, g, accel, length, vLeave, tLeave } = run;
      let x;
      let y;
      let rolled;
      if (t <= tLeave) {
        rolled = 0.5 * accel * t * t;
        x = start[0] + dx * rolled;
        y = start[1] + dy * rolled;
      } else {
        const u = t - tLeave;
        rolled = length + vLeave * u; // it keeps spinning as it left the bar
        x = leave[0] + vLeave * dx * u;
        y = leave[1] + vLeave * dy * u + 0.5 * g * u * u;
      }
      // Rolling downhill to the left turns it anticlockwise.
      const angle = ((-rolled / r) * 180 * config.rotation) / Math.PI;
      ball.setAttribute("x", x - r);
      ball.setAttribute("y", y - r);
      ball.setAttribute("transform", `rotate(${angle} ${x} ${y})`);
      ball.style.visibility = t >= run.tEnd ? "hidden" : "visible";
    };

    // Where the bar's low end is on screen.
    const lowEndOnScreen = () => root.getBoundingClientRect().top + run.lowEnd;

    /* ------------------------------------------------------ auto mode */

    let startedAt = null;
    let startTimer = 0;
    let frame = 0;

    const tick = (now) => {
      frame = 0;
      const t =
        run.tEnter + ((now - startedAt) / 1000) * config.auto.speed;
      placeAt(Math.min(t, run.tEnd));
      if (t < run.tEnd) frame = requestAnimationFrame(tick);
    };

    const maybeStart = () => {
      if (!run || startedAt !== null || startTimer) return;
      if (lowEndOnScreen() > window.innerHeight * START_AT) return;
      startTimer = window.setTimeout(() => {
        startedAt = performance.now();
        frame = requestAnimationFrame(tick);
      }, config.auto.startDelay);
    };

    /* ---------------------------------------------------- scroll mode */

    const scrollUpdate = () => {
      frame = 0;
      if (!run) return;
      const vh = window.innerHeight;
      const p = Math.min(
        1,
        Math.max(0, (vh * START_AT - lowEndOnScreen()) / (vh * SCROLL_SPAN))
      );
      placeAt(run.tEnter + p * (run.tEnd - run.tEnter));
    };

    /* --------------------------------------------------------- shared */

    const update = () => {
      if (MODE === "auto") maybeStart();
      else if (!frame) frame = requestAnimationFrame(scrollUpdate);
    };

    // Re-measures, and puts the ball back where it was in its run.
    const relayout = () => {
      measure();
      if (!run) return;
      if (MODE === "scroll") scrollUpdate();
      else if (startedAt === null) ball.style.visibility = "hidden";
      update();
    };

    relayout();
    // The bars and the wave can load, and the page above change, after this
    // mounts; keep measuring whenever the page's height changes.
    let lastHeight = document.documentElement.scrollHeight;
    const settle = setInterval(() => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        relayout();
      }
      update();
    }, 250);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", relayout);
    const observer = new ResizeObserver(relayout);
    observer.observe(root);

    return () => {
      clearInterval(settle);
      clearTimeout(startTimer);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", relayout);
      observer.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden="true"
    >
      <image
        ref={ballRef}
        href={config.ball.image}
        width="0"
        height="0"
        style={{ visibility: "hidden" }}
      />
    </svg>
  );
}
