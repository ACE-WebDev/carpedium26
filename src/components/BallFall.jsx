"use client";

import { useEffect, useRef } from "react";
import config from "@/config/ballAnimation";
import { loadFall } from "./mazeBallPhysics";
import {
  VB_H,
  VB_W,
  buildTimeline,
  buildWarp,
  indexAt,
  sampleTimeline,
} from "./mazeBallTimeline";

/*
 * A ball falling through the maze: a physics simulation (mazeBallPhysics.js)
 * of a rigid ball under gravity, colliding with the real walls from
 * public/Maze.svg and steered along the hand-traced route. Position and spin
 * both come from it, so it lands and bounces, rolls along the arcs spinning
 * as it would, and drops off their ends. It is simulated once when the page
 * loads, from src/config/ballAnimation.js, then scrubbed by scroll or played
 * in real time — see `mode` there.
 *
 * Render it inside the element the ball should move within: it covers that
 * element (its parent), finds the maze image in it by `data-ball-maze` and
 * the artwork it lands on by `data-ball-target`. `variant` picks one of the
 * setups below — the hero and the Sponsors maze show the same maze, drawn
 * differently.
 */

const MODE = config.mode === "auto" ? "auto" : "scroll";

/* sponsormaze1.png is the same artwork as maze.png at a different size and
   crop: sponsormaze1 px = maze.png px * SPONSORS_SCALE + SPONSORS_OFFSET.
   Found by matching the two images (IoU 0.938). */
const SPONSORS_WIDTH = 2072; // sponsormaze1.png's own width, px
const SPONSORS_SCALE = 0.866;
const SPONSORS_OFFSET = [6, 87];

/* How the Sponsors fall is paced against scroll: it starts once the ball
   has been scrolled up to START_AT of the way down the screen, and lands with
   the maze end at END_AT. On small screens the whole maze fits in view, which
   would leave next to no scrolling for it, so it always gets at least
   MIN_SPAN of a screen height. */
const SPONSORS_START_AT = 0.3;
const SPONSORS_END_AT = 0.6;
const SPONSORS_MIN_SPAN = 0.45;

/* Both runs drop from the same spot at the top of the maze, so they play the
   very same fall (simulated once, see loadFall). */
const START = { x: config.ball.startX, y: config.ball.startY };

const VARIANTS = {
  // maze.png drawn `xMidYMin slice` over the hero; the fall starts at the top
  // of the page and ends in About Us, where the blackout takes over.
  hero: {
    start: START,
    mazeTransform(maze, rootBox) {
      const box = maze.getBoundingClientRect();
      const scale = Math.max(box.width / VB_W, box.height / VB_H);
      return {
        scale,
        offsetX: box.left - rootBox.left + (box.width - VB_W * scale) / 2,
        offsetY: box.top - rootBox.top,
      };
    },
    // From the hero's top at the top of the viewport to the bottom of About
    // Us at its bottom.
    scrollRange: ({ rootBox }) => ({
      top0: 0,
      span: rootBox.height - window.innerHeight,
    }),
    // Once the opening sequence has handed over to the page.
    autoReady: () => document.body.classList.contains("opening-done"),
    announce: true,
  },

  // sponsormaze1.png, drawn at its own size and position further down the
  // page: the same fall from the top of the maze, ending on the maze end,
  // where the second blackout takes over and moves on to the Sponsors
  // section.
  sponsors: {
    start: START,
    mazeTransform(maze, rootBox) {
      const box = maze.getBoundingClientRect(); // includes its scale-[1.18]
      const k = box.width / SPONSORS_WIDTH;
      return {
        scale: SPONSORS_SCALE * k,
        offsetX: box.left - rootBox.left + SPONSORS_OFFSET[0] * k,
        offsetY: box.top - rootBox.top + SPONSORS_OFFSET[1] * k,
      };
    },
    scrollRange: ({ startY, targetY, minStartLine }) => {
      const vh = window.innerHeight;
      const travel = targetY - startY;
      let startLine = Math.max(vh * SPONSORS_START_AT, minStartLine);
      let span = travel - (vh * SPONSORS_END_AT - startLine);
      if (span < vh * SPONSORS_MIN_SPAN) {
        span = vh * SPONSORS_MIN_SPAN;
        startLine = vh * SPONSORS_END_AT - travel + span;
      }
      return { top0: startLine - startY, span };
    },
    // Once the ball has been scrolled into the upper part of the screen.
    autoReady: ({ startScreenY }) => startScreenY <= window.innerHeight * 0.6,
    announce: true,
  },
};

if (typeof window !== "undefined") {
  if (config.mode !== "auto" && config.mode !== "scroll") {
    console.warn(
      `Ball animation: mode "${config.mode}" is not "scroll" or "auto"; using "scroll". (src/config/ballAnimation.js)`
    );
  }
  // Start fetching the walls and simulating straight away, so each fall is
  // ready long before its maze is on screen. Errors surface in the effect.
  for (const variant of Object.values(VARIANTS)) {
    loadFall(config, variant.start).catch(() => {});
  }
}

/* Where the fixed navbar ends, plus the configured margin, in px from the
   top of the viewport. Measured rather than assumed: its logo oval hangs
   below the bar, right where the ball falls, and both scale with the
   viewport. 150 is the fallback if it cannot be found. */
function navbarClearance() {
  const nav = document.querySelector("nav");
  if (!nav) return 150;
  let bottom = nav.getBoundingClientRect().bottom;
  for (const el of nav.querySelectorAll("*")) {
    bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
  }
  return bottom + config.scroll.navbarMargin;
}

/* The landing artwork's alpha channel, once it has loaded. Touching it means
   touching what is drawn: the image's box is transparent where the ball
   comes in, and down its centre line the art only starts a third of the way
   down. */
function readAlpha(img) {
  if (!img?.complete || !img.naturalWidth) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, data };
  } catch {
    return null;
  }
}

/* The (fractional) point in the fall at which the ball first overlaps the
   artwork in `art`, drawn `object-contain` in `box` (px, in the same space
   as the ball). The end of the fall if it never does, or the art is not
   readable yet. */
function findTouch(timeline, { scale, offsetX, offsetY, size }, box, art) {
  const last = timeline.count - 1;
  if (!art) return last;

  const fit = Math.min(box.width / art.width, box.height / art.height);
  const left = box.left + (box.width - art.width * fit) / 2;
  const top = box.top + (box.height - art.height * fit) / 2;
  const opaque = (px, py) => {
    const ix = Math.floor((px - left) / fit);
    const iy = Math.floor((py - top) / fit);
    if (ix < 0 || iy < 0 || ix >= art.width || iy >= art.height) return false;
    return art.data[(iy * art.width + ix) * 4 + 3] > 40;
  };

  const radius = size / 2;
  const touches = (index) => {
    const p = sampleTimeline(timeline, index);
    const cx = p.x * scale + offsetX;
    const cy = p.y * scale + offsetY;
    if (cy + radius < top) return false;
    if (opaque(cx, cy)) return true;
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      const r = k % 2 ? radius : radius / 2;
      if (opaque(cx + Math.cos(a) * r, cy + Math.sin(a) * r)) return true;
    }
    return false;
  };

  for (let i = 1; i <= last; i++) {
    if (!touches(i)) continue;
    // It moves fast by now, several px per sample, so pin down the moment
    // of contact between the two samples.
    let lo = i - 1;
    let hi = i;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      if (touches(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }
  return last;
}

export default function BallFall({ variant }) {
  const svgRef = useRef(null);
  const ballRef = useRef(null);

  useEffect(() => {
    const setup = VARIANTS[variant];
    const svg = svgRef.current;
    const ball = ballRef.current;
    const root = svg?.parentElement;
    if (!setup || !svg || !ball || !root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let sim = null;

    // Everything that depends on the layout: the maze's transform, the fall
    // with its last leg aimed at the landing art as it currently sits, and
    // how scroll is paced onto it for this viewport.
    let geometry = null;
    // The landing art's pixels, and which image they were read from.
    let art = null;
    let artSrc = "";

    const layout = () => {
      if (!sim) return;
      const maze = root.querySelector("[data-ball-maze]");
      const rootBox = root.getBoundingClientRect();
      const mazeBox = maze?.getBoundingClientRect();
      if (!rootBox.height || !mazeBox?.height) return;

      svg.setAttribute("viewBox", `0 0 ${rootBox.width} ${rootBox.height}`);
      const { scale, offsetX, offsetY } = setup.mazeTransform(maze, rootBox);

      const target = root.querySelector("[data-ball-target]");
      const targetBox = target?.getBoundingClientRect();
      const endX = targetBox
        ? targetBox.left - rootBox.left + targetBox.width / 2
        : rootBox.width / 2;
      const endY = targetBox
        ? targetBox.top - rootBox.top + targetBox.height / 2
        : rootBox.height;

      const timeline = buildTimeline(
        sim,
        (endX - offsetX) / scale,
        (endY - offsetY) / scale
      );
      const size = config.ball.size * scale;
      ball.setAttribute("width", size);
      ball.setAttribute("height", size);

      // Scroll pacing: `top0` is where the root's top is on screen when the
      // fall begins, `span` how much scrolling it takes.
      const clearance = navbarClearance();
      const startY = setup.start.y * scale + offsetY;
      const { top0, span } = setup.scrollRange({
        rootBox,
        startY,
        targetY: endY,
        minStartLine: clearance + size / 2,
      });
      const warp =
        MODE === "scroll"
          ? buildWarp(timeline, {
              scale,
              span,
              originY: top0 + offsetY,
              clearance,
              ballSize: config.ball.size,
            })
          : null;

      // Where in the fall it first touches the landing art. Read the art's
      // pixels once per image it loads.
      if (target && target.currentSrc !== artSrc) {
        art = readAlpha(target);
        if (art) artSrc = target.currentSrc;
        else target.addEventListener("load", relayout, { once: true });
      }
      const touchIndex = targetBox
        ? findTouch(
            timeline,
            { scale, offsetX, offsetY, size },
            {
              left: targetBox.left - rootBox.left,
              top: targetBox.top - rootBox.top,
              width: targetBox.width,
              height: targetBox.height,
            },
            art
          )
        : timeline.count - 1;

      geometry = {
        scale,
        offsetX,
        offsetY,
        timeline,
        warp,
        size,
        touchIndex,
        top0,
        span,
        startY,
      };
    };

    const lastIndex = () => geometry.timeline.count - 1;
    // Where it comes to rest: where it touched, for a fall that ends there;
    // the very end, for the one the blackout takes over from.
    const restIndex = () => (setup.announce ? lastIndex() : geometry.touchIndex);

    // Puts the ball at a point in the fall, given as a (fractional) sample
    // index into the timeline.
    const placeAt = (index) => {
      const { scale, offsetX, offsetY, timeline, size } = geometry;
      const s = sampleTimeline(timeline, index);
      const x = s.x * scale + offsetX;
      const y = s.y * scale + offsetY;
      ball.setAttribute("x", x - size / 2);
      ball.setAttribute("y", y - size / 2);
      ball.setAttribute(
        "transform",
        `rotate(${s.angle * config.rotation} ${x} ${y})`
      );
    };

    // How far through its scroll range the page is, 0 to 1.
    const scrollProgress = () => {
      const { top0, span } = geometry;
      const top = root.getBoundingClientRect().top;
      return span > 0 ? Math.min(1, Math.max(0, (top0 - top) / span)) : 0;
    };

    // The moment the ball touches its landing art: announced once, with
    // which fall this is and where the ball is on screen, for that fall's
    // blackout to grow out of. After that the ball stays put — the blackout
    // pins the body, which moves the page under us, and a ball still tracking
    // the scroll would be seen rolling backwards afterwards.
    let arrivedAt = null;
    const arrive = () => {
      arrivedAt = geometry.touchIndex;
      placeAt(arrivedAt);
      const box = ball.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("mazeball:arrived", {
          detail: {
            variant,
            x: box.left + box.width / 2,
            y: box.top + box.height / 2,
          },
        })
      );
    };

    /* ---------------------------------------------------- scroll mode */

    let frame = 0;
    let shown = 0;

    const scrollUpdate = () => {
      frame = 0;
      if (!geometry) return;
      if (arrivedAt !== null) {
        placeAt(arrivedAt);
        return;
      }
      // Glide toward the scroll position rather than snapping, so flicks
      // and trackpad jitter do not make the ball twitch.
      const target = scrollProgress();
      shown += (target - shown) * config.scroll.smoothing;
      if (Math.abs(target - shown) > 0.0005) {
        frame = requestAnimationFrame(scrollUpdate);
      } else {
        shown = target;
      }
      const index = indexAt(geometry.warp, shown);
      if (setup.announce && index >= geometry.touchIndex) arrive();
      // Otherwise it rests on the art, and scrolling back up rewinds it.
      else placeAt(Math.min(index, geometry.touchIndex));
    };

    /* ------------------------------------------------------ auto mode */

    // Plays the fall in real time once its maze has appeared, scrolling the
    // page along to keep the ball on screen.
    let startedAt = null;
    let startTimer = 0;
    let autoFrame = 0;
    let landed = false;

    const autoIndex = (now) =>
      startedAt === null
        ? 0
        : (((now - startedAt) / 1000) * config.auto.speed) / geometry.timeline.dt;

    // Keeps the ball on screen for the whole fall, whatever the visitor is
    // doing: whenever it has dropped below the follow line, the page is
    // scrolled down to bring it back up to it. It only ever scrolls down, so
    // scrolling on ahead yourself is never fought; scrolling back up while
    // the ball is still falling gets pulled back down to it.
    const follow = () => {
      if (!config.auto.followBall) return;
      const box = ball.getBoundingClientRect();
      const below =
        box.top + box.height / 2 - window.innerHeight * config.auto.followAt;
      if (below > 0.5) window.scrollTo(0, window.scrollY + below);
    };

    const autoTick = (now) => {
      autoFrame = 0;
      if (!geometry || arrivedAt !== null || landed) return;
      const index = autoIndex(now);
      if (index >= geometry.touchIndex) {
        if (setup.announce) arrive();
        else {
          landed = true;
          placeAt(geometry.touchIndex);
        }
        return;
      }
      placeAt(index);
      follow();
      autoFrame = requestAnimationFrame(autoTick);
    };

    const maybeStartAuto = () => {
      if (startedAt !== null || startTimer || !geometry) return;
      const startScreenY = root.getBoundingClientRect().top + geometry.startY;
      if (!setup.autoReady({ startScreenY })) return;
      startTimer = window.setTimeout(() => {
        startedAt = performance.now();
        autoFrame = requestAnimationFrame(autoTick);
      }, config.auto.startDelay);
    };

    /* --------------------------------------------------------- shared */

    const onScroll = () => {
      if (reduced.matches) return; // the ball just rests at the end
      if (MODE === "auto") maybeStartAuto();
      else if (!frame) frame = requestAnimationFrame(scrollUpdate);
    };

    // Re-measures, then puts the ball straight where it belongs rather than
    // gliding to it — right for first paint and for resizes.
    const relayout = () => {
      layout();
      if (!geometry) return;
      if (reduced.matches) {
        placeAt(restIndex());
      } else if (arrivedAt !== null) {
        placeAt(arrivedAt);
      } else if (landed) {
        placeAt(geometry.touchIndex);
      } else if (MODE === "auto") {
        placeAt(Math.min(autoIndex(performance.now()), geometry.touchIndex));
        maybeStartAuto();
      } else {
        shown = scrollProgress();
        placeAt(Math.min(indexAt(geometry.warp, shown), geometry.touchIndex));
      }
    };

    // This can mount while the opening sequence still owns the page, with
    // the body scroll-locked and the layout not yet at its final size. A
    // single measurement then would cache the wrong geometry and leave the
    // ball parked off-screen, so keep re-measuring until the page settles
    // and whenever its height changes afterwards.
    let tries = 0;
    const retry = () => {
      if (disposed || geometry || tries++ > 180) return;
      relayout();
      requestAnimationFrame(retry);
    };

    loadFall(config, setup.start)
      .then((fall) => {
        if (disposed) return;
        sim = fall;
        relayout();
        requestAnimationFrame(retry);
      })
      .catch((error) => console.error("Ball animation:", error));

    let lastHeight = document.documentElement.scrollHeight;
    const settle = setInterval(() => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        relayout();
      }
      if (MODE === "auto" && !reduced.matches) maybeStartAuto();
    }, 250);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", relayout);
    const observer = new ResizeObserver(relayout);
    observer.observe(root);

    return () => {
      disposed = true;
      clearInterval(settle);
      clearTimeout(startTimer);
      if (frame) cancelAnimationFrame(frame);
      if (autoFrame) cancelAnimationFrame(autoFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", relayout);
      observer.disconnect();
    };
  }, [variant]);

  return (
    // Covers its parent; the ball is sized and placed by the effect above,
    // and stays invisible until its fall is ready.
    <svg
      ref={svgRef}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      aria-hidden="true"
    >
      <image ref={ballRef} href={config.ball.image} width="0" height="0" />
    </svg>
  );
}
