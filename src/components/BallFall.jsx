"use client";

import { useEffect, useRef } from "react";
import config from "@/config/ballAnimation";
import { loadFall } from "./mazeBallPhysics";
import {
  HERO_VIEW,
  buildTimeline,
  indexAt,
  pacedWarp,
  sampleTimeline,
  steeredWarp,
  withRollIn,
} from "./mazeBallTimeline";
import { createGlide } from "./scrollGlide";
import { navbarBottom, pageTop, pinOf, setPin } from "./BallPin";

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
 * differently. Inside a BallPin, the scene is held in place while the ball
 * falls, for as long as scroll mode's pace needs.
 */

const MODE = config.mode === "auto" ? "auto" : "scroll";

/* sponsormaze1.png is the same artwork as maze.png at a different size and
   crop: sponsormaze1 px = maze.png px * SPONSORS_SCALE + SPONSORS_OFFSET.
   Found by matching the two images (IoU 0.938). */
const SPONSORS_WIDTH = 2072; // sponsormaze1.png's own width, px
const SPONSORS_SCALE = 0.866;
const SPONSORS_OFFSET = [6, 87];

/* endmaze1.png is the lower right of that maze again:
   endmaze1 px = maze.png px * END_SCALE + END_OFFSET, found the same way
   (97% of it covered). It leaves out some of the maze's pieces and moves
   one, so its walls are in EndMaze.svg rather than Maze.svg. */
const END_WIDTH = 1440; // endmaze1.png's own width, px
const END_SCALE = 0.865;
const END_OFFSET = [-307, -65];

/* How the falls further down the page are paced against scroll, where their
   maze is too tall to be held wholly in view: each starts once the ball has
   been scrolled up to `startAt` of the way down the screen, and lands with
   what it lands on at `endAt`. The run after the Sponsors starts lower, so
   its roll along the bars is not hurried by them reaching the navbar. */
const SPONSORS_LINES = { startAt: 0.3, endAt: 0.6 };
const END_LINES = { startAt: 0.6, endAt: 0.6 };
/* How much further than it must be the fall after another (`after`) waits
   for that one's ball to be out of sight, as a share of the screen height. */
const AFTER_GAP = 0.1;
/* On small screens a whole maze fits in view, which would leave next to no
   scrolling for its fall, so when it cannot be held in place each always
   gets at least this much of a screen height. */
const MIN_SPAN = 0.45;

/* Both runs drop from the same spot at the top of the maze, so they play the
   very same fall (simulated once, see loadFall). */
const START = { x: config.ball.startX, y: config.ball.startY };

/* Scroll pacing for a maze further down the page. `top0` is where the root's
   top is on screen when the fall begins and `span` how much the page then
   scrolls it on by while the ball falls, on top of any time it is held. */
function scrollRangeBelow({
  startY,
  targetY,
  minStartLine,
  navBottom,
  holds,
  sceneHeight,
  sceneOffset,
  earliestTop,
  lines,
}) {
  const vh = window.innerHeight;
  // A scene that fits on screen under the navbar is held there, centred,
  // for its whole fall. Either way the fall begins no earlier than
  // `earliestTop` allows: where the root is when the page is scrolled as
  // little as it can be for the fall to start (right at the top — a blackout
  // can leave the scene high up — or once what plays before it is over), so
  // none of it has been scrolled past before it could be seen.
  const room = vh - navBottom;
  if (holds && sceneHeight <= room) {
    return {
      top0: Math.min(
        navBottom + (room - sceneHeight) / 2 + sceneOffset,
        earliestTop
      ),
      span: 0,
    };
  }
  const travel = targetY - startY;
  let startLine = Math.min(
    Math.max(vh * lines.startAt, minStartLine),
    earliestTop + startY
  );
  let span = travel - (vh * lines.endAt - startLine);
  if (!holds && span < vh * MIN_SPAN) {
    span = vh * MIN_SPAN;
    // Starting sooner to make room — but never before it may.
    startLine = Math.min(vh * lines.endAt - travel + span, earliestTop + startY);
  }
  return { top0: startLine - startY, span: Math.max(0, span) };
}

const VARIANTS = {
  // maze.png framed by HERO_VIEW across the hero's full width (MazeBall);
  // the fall starts at the top of the page and ends in About Us, where the
  // blackout takes over.
  hero: {
    start: START,
    portal: true,
    // HERO_VIEW drawn to fill its box, centred across it and from its top
    // (MazeBall: `xMidYMin slice`) — on a phone the box is narrower than
    // the view, and its sides are cut off.
    mazeTransform(maze, rootBox) {
      const box = maze.getBoundingClientRect();
      const scale = Math.max(
        box.width / HERO_VIEW.width,
        box.height / HERO_VIEW.height
      );
      return {
        scale,
        offsetX:
          box.left -
          rootBox.left +
          (box.width - HERO_VIEW.width * scale) / 2 -
          HERO_VIEW.x * scale,
        offsetY: box.top - rootBox.top - HERO_VIEW.y * scale,
      };
    },
    // From the hero's top at the top of the viewport to the bottom of About
    // Us at its bottom — none at all when it all fits on screen and is held
    // there instead.
    scrollRange: ({ rootBox, holds }) => {
      const below = rootBox.height - window.innerHeight;
      return {
        top0: 0,
        span: holds
          ? Math.max(0, below)
          : Math.max(below, window.innerHeight * MIN_SPAN),
      };
    },
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
    portal: true,
    mazeTransform(maze, rootBox) {
      const box = maze.getBoundingClientRect(); // includes its scale-[1.18]
      const k = box.width / SPONSORS_WIDTH;
      return {
        scale: SPONSORS_SCALE * k,
        offsetX: box.left - rootBox.left + SPONSORS_OFFSET[0] * k,
        offsetY: box.top - rootBox.top + SPONSORS_OFFSET[1] * k,
      };
    },
    scrollRange: (args) => scrollRangeBelow({ ...args, lines: SPONSORS_LINES }),
    // Kept up to a fifth of the screen further below the navbar than it
    // must be, held for at least 60% of its fall, and steered steadily down
    // the screen (see layout).
    comfort: 0.2,
    minHold: 0.6,
    steer: true,
    // Once the ball has been scrolled into the upper part of the screen.
    autoReady: ({ startScreenY }) => startScreenY <= window.innerHeight * 0.6,
    announce: true,
  },

  // endmaze1.png, the last maze on the page, with the two bars above it. The
  // ball rolls in from off the left edge along the lower bar
  // (`data-ball-floor`, next to this one's parent), is launched off its end
  // at config.end.launchSpeed, and falls through the maze onto the logo
  // under it (`data-ball-target`), where it stays. The launch point is
  // measured rather than configured, so it follows the bars wherever the
  // layout puts them.
  end: {
    walls: "/EndMaze.svg",
    simConfig: { ...config, route: config.end.route },
    launch({ root, rootBox, scale, offsetX, offsetY }) {
      const floor = root.parentElement?.querySelector("[data-ball-floor]");
      const box = floor?.getBoundingClientRect();
      if (!box?.width) return null;
      // Whole maze px, so re-measuring a layout that has not moved finds the
      // same start, and the fall already simulated for it.
      return {
        x: Math.round((box.right - rootBox.left - offsetX) / scale),
        y: Math.round(
          (box.top - rootBox.top - offsetY) / scale - config.ball.size / 2
        ),
        vx: config.end.launchSpeed,
      };
    },
    mazeTransform(maze, rootBox) {
      const box = maze.getBoundingClientRect();
      const k = box.width / END_WIDTH;
      return {
        scale: END_SCALE * k,
        offsetX: box.left - rootBox.left + END_OFFSET[0] * k,
        offsetY: box.top - rootBox.top + END_OFFSET[1] * k,
      };
    },
    // The logo is drawn as a CSS mask, so that is where its art is.
    artOf: maskImageOf,
    // Shrinks away to nothing once it has landed on the logo.
    vanishMs: config.end.vanishMs,
    // Not before the ball in the lanes above has run its course and gone
    // (MazeRun marks where that is), so the two never play at once.
    after: "[data-run-end]",
    scrollRange: (args) => scrollRangeBelow({ ...args, lines: END_LINES }),
    comfort: 0.2,
    minHold: 0.6,
    steer: true,
    autoReady: ({ startScreenY }) => startScreenY <= window.innerHeight * 0.6,
    announce: false,
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
  // One that starts from a measured point waits for the page instead.
  for (const variant of Object.values(VARIANTS)) {
    if (!variant.start) continue;
    loadFall(variant.simConfig ?? config, variant.start, variant.walls).catch(
      () => {}
    );
  }
}

/* The image an element is masked with (`mask: url(...)`), loaded into an
   <img> of its own so readAlpha can read it. One per image, shared. */
const maskImages = new Map();
function maskImageOf(el) {
  const style = getComputedStyle(el);
  const mask = style.maskImage || style.webkitMaskImage || "";
  const url = /url\(["']?([^"')]+)["']?\)/.exec(mask)?.[1];
  if (!url) return null;
  if (!maskImages.has(url)) {
    const img = new Image();
    img.src = url;
    maskImages.set(url, img);
  }
  return maskImages.get(url);
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

/* The ring's outer edge is artwork, but its black center is the portal.
   Let the ball travel into that center before starting the page wipe. */
function findPortalEntry(timeline, { scale, offsetX, offsetY }, box) {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const radius = Math.min(box.width, box.height) * 0.09;
  for (let i = 1; i < timeline.count; i++) {
    const p = sampleTimeline(timeline, i);
    const x = p.x * scale + offsetX;
    const y = p.y * scale + offsetY;
    if (y >= cy - radius / 3 && Math.hypot(x - cx, y - cy) <= radius) {
      return i;
    }
  }
  return timeline.count - 1;
}

export default function BallFall({ variant }) {
  const svgRef = useRef(null);
  const shrinkRef = useRef(null);
  const ballRef = useRef(null);

  useEffect(() => {
    const setup = VARIANTS[variant];
    const svg = svgRef.current;
    const shrink = shrinkRef.current;
    const ball = ballRef.current;
    const root = svg?.parentElement;
    if (!setup || !svg || !shrink || !ball || !root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (setup.vanishMs && !reduced.matches) {
      shrink.style.transition = `transform ${setup.vanishMs}ms ease-in`;
    }
    const pin = pinOf(root);
    let disposed = false;
    let sim = null;
    // Where `sim` starts, or the fall being simulated will.
    let simStart = null;

    // Everything that depends on the layout: the maze's transform, the fall
    // with its last leg aimed at the landing art as it currently sits, and
    // how scroll is paced onto it for this viewport.
    let geometry = null;
    // The landing art's pixels, and which image they were read from.
    let art = null;
    let artSrc = "";

    const layout = () => {
      const maze = root.querySelector("[data-ball-maze]");
      const rootBox = root.getBoundingClientRect();
      const mazeBox = maze?.getBoundingClientRect();
      if (!rootBox.height || !mazeBox?.height) return;

      const { scale, offsetX, offsetY } = setup.mazeTransform(maze, rootBox);
      const start = setup.launch
        ? setup.launch({ root, rootBox, scale, offsetX, offsetY })
        : setup.start;
      if (!start) return;
      requestFall(start);
      if (!sim) return;

      svg.setAttribute("viewBox", `0 0 ${rootBox.width} ${rootBox.height}`);
      const size = config.ball.size * scale;
      ball.setAttribute("width", size);
      ball.setAttribute("height", size);

      const target = root.querySelector("[data-ball-target]");
      const targetBox = target?.getBoundingClientRect();
      const endX = targetBox
        ? targetBox.left - rootBox.left + targetBox.width / 2
        : rootBox.width / 2;
      const endY = targetBox
        ? targetBox.top - rootBox.top + targetBox.height / 2
        : rootBox.height;

      // A launched ball first rolls in from just off the left edge.
      const run = setup.launch
        ? withRollIn(
            sim,
            (-size / 2 - offsetX) / scale,
            start.vx,
            config.ball.size / 2
          )
        : sim;
      const timeline = buildTimeline(
        run,
        (endX - offsetX) / scale,
        (endY - offsetY) / scale
      );

      // Where in the fall it first touches the landing art. Read the art's
      // pixels once per image it loads.
      const artImage = target && !setup.portal && (setup.artOf ? setup.artOf(target) : target);
      const artImageSrc = artImage && (artImage.currentSrc || artImage.src);
      if (artImage && artImageSrc !== artSrc) {
        art = readAlpha(artImage);
        if (art) artSrc = artImageSrc;
        else artImage.addEventListener("load", relayout, { once: true });
      }
      const targetRect = targetBox && {
        left: targetBox.left - rootBox.left,
        top: targetBox.top - rootBox.top,
        width: targetBox.width,
        height: targetBox.height,
      };
      const touchIndex = targetRect
        ? setup.portal
          ? findPortalEntry(timeline, { scale, offsetX, offsetY }, targetRect)
          : findTouch(timeline, { scale, offsetX, offsetY, size }, targetRect, art)
        : timeline.count - 1;

      // Scroll pacing. `top0` is where the root's top is on screen when the
      // fall begins. Its scene is then held there for the first `hold` px
      // of scrolling, where it can be, and moves on with the page for the
      // rest of `span`, until the ball touches down.
      const vh = window.innerHeight;
      const navBottom = navbarBottom();
      const clearance = navBottom + config.scroll.navbarMargin;
      const holds =
        MODE === "scroll" &&
        !!pin &&
        !reduced.matches &&
        config.scroll.screensPerSecond > 0;
      const sceneBox = pin ? pin.sticky.getBoundingClientRect() : rootBox;
      const sceneOffset = rootBox.top - sceneBox.top;
      const startY = start.y * scale + offsetY;
      // How far the page must be scrolled before this fall may begin: far
      // enough for what plays before it (`after`) to be over, and a little
      // further, as that ball glides a moment behind the scroll — else not
      // at all.
      const runEnd = setup.after
        ? Number(document.querySelector(setup.after)?.dataset.runEnd)
        : NaN;
      const notBefore = Number.isFinite(runEnd) ? runEnd + vh * AFTER_GAP : 0;
      const range = setup.scrollRange({
        rootBox,
        startY,
        targetY: endY,
        minStartLine: clearance + size / 2,
        navBottom,
        holds,
        sceneHeight: sceneBox.height,
        sceneOffset,
        earliestTop:
          (pin ? pageTop(pin.track) + sceneOffset : pageTop(root)) -
          notBefore,
      });
      // Held for however much longer the configured pace wants than the
      // page gives it — and, where the variant asks (`minHold`), for at
      // least that share of it anyway: without, the page carries the maze
      // off while the ball is still rolling about its upper arcs, and it
      // has to be hurried along after it.
      let hold = 0;
      if (holds) {
        const wanted =
          touchIndex * timeline.dt * config.scroll.screensPerSecond * vh;
        hold = Math.max(0, wanted - range.span, wanted * (setup.minHold ?? 0));
      }
      const span = Math.max(1, range.span + hold);
      // How much further below the navbar than it must be the ball is kept
      // (`comfort`, a share of the screen), so it does not ride along its
      // edge while the page carries the maze up — though never higher than
      // where it sets off, so none of its start is skipped.
      const comfort = setup.comfort
        ? Math.min(
            setup.comfort * vh,
            Math.max(0, range.top0 + startY - size / 2 - clearance)
          )
        : 0;
      const pacing = {
        scale,
        span,
        hold,
        originY: range.top0 + offsetY,
        clearance: clearance + comfort,
        bottom: vh - 8,
        ballSize: config.ball.size,
        endIndex: touchIndex,
      };
      // Steered steadily down the screen, held from the start (`steer`), or
      // paced by buildWarp with the hold wherever it plays most evenly.
      const { warp, holdAt } =
        MODE !== "scroll"
          ? { warp: null, holdAt: 0 }
          : setup.steer
            ? { warp: steeredWarp(timeline, pacing), holdAt: 0 }
            : pacedWarp(timeline, pacing);
      // The hold begins `holdAt` px into the fall, where the scene has been
      // scrolled that much further up (a negative `top` sticks it partly
      // above the screen, for a scene taller than it).
      if (pin) setPin(pin, range.top0 - sceneOffset - holdAt, hold);

      geometry = {
        scale,
        offsetX,
        offsetY,
        timeline,
        warp,
        size,
        target,
        touchIndex,
        top0: range.top0,
        span,
        sceneOffset,
        startY,
        notBefore,
      };
    };

    const lastIndex = () => geometry.timeline.count - 1;
    // Where it comes to rest: where it touched, for a fall that ends there;
    // the very end, for the one the blackout takes over from.
    const restIndex = () => (setup.announce ? lastIndex() : geometry.touchIndex);

    // Puts the ball at a point in the fall, given as a (fractional) sample
    // index into the timeline.
    const placeAt = (index) => {
      const { scale, offsetX, offsetY, timeline, size, target, touchIndex } =
        geometry;
      const s = sampleTimeline(timeline, index);
      const x = s.x * scale + offsetX;
      const y = s.y * scale + offsetY;
      ball.setAttribute("x", x - size / 2);
      ball.setAttribute("y", y - size / 2);
      ball.setAttribute(
        "transform",
        `rotate(${s.angle * config.rotation} ${x} ${y})`
      );
      // The art it lands on carries `data-ball-touched` while the ball is on
      // it, for styling: the logo under the last maze lights up. A ball that
      // vanishes shrinks away there.
      const touched = index >= touchIndex;
      target?.toggleAttribute("data-ball-touched", touched);
      if (setup.vanishMs) shrink.style.transform = touched ? "scale(0)" : "";
    };

    // How far through its scroll range the page is, 0 to 1. Measured from
    // where the root would be if its scene were never held: the track the
    // scene is held in always moves with the page.
    const scrollProgress = () => {
      const { top0, span, sceneOffset } = geometry;
      const top = pin
        ? pin.track.getBoundingClientRect().top + sceneOffset
        : root.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, (top0 - top) / span));
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

    // Glides toward the scroll position rather than snapping, so flicks and
    // trackpad jitter do not make the ball twitch.
    const glide = createGlide(
      () => (geometry && arrivedAt === null ? scrollProgress() : null),
      (progress) => {
        const index = indexAt(geometry.warp, progress);
        // Start the wipe only after the ball itself reaches the landing art.
        // A trackpad can put the page at the end of its range while the
        // gliding ball is still visibly falling toward it.
        if (setup.announce && index >= geometry.touchIndex) {
          arrive();
        }
        // Otherwise it rests on the art, and scrolling back up rewinds it.
        else placeAt(Math.min(index, geometry.touchIndex));
      }
    );

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
      // Nor while what plays before it is still going.
      const scrolled = -document.body.getBoundingClientRect().top;
      if (scrolled < geometry.notBefore) return;
      startTimer = window.setTimeout(() => {
        startedAt = performance.now();
        autoFrame = requestAnimationFrame(autoTick);
      }, config.auto.startDelay);
    };

    /* --------------------------------------------------------- shared */

    const onScroll = () => {
      if (reduced.matches) return; // the ball just rests at the end
      if (MODE === "auto") maybeStartAuto();
      else glide.update();
    };

    // Re-measures, then puts the ball straight where it belongs rather than
    // gliding to it — right for first paint and for resizes.
    const relayout = () => {
      // Once it has landed for a blackout, nothing moves: the blackout pins
      // the body, which would read as the page having scrolled.
      if (arrivedAt !== null) return;
      layout();
      if (!geometry) return;
      if (reduced.matches) {
        placeAt(restIndex());
      } else if (landed) {
        placeAt(geometry.touchIndex);
      } else if (MODE === "auto") {
        placeAt(Math.min(autoIndex(performance.now()), geometry.touchIndex));
        maybeStartAuto();
      } else {
        glide.jump();
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

    // Gets the fall from `start` simulated, unless it already is, then lays
    // it out. Called from layout(), since a launched ball's start is only
    // known once the page can be measured.
    function requestFall(start) {
      if (
        simStart &&
        simStart.x === start.x &&
        simStart.y === start.y &&
        simStart.vx === start.vx
      ) {
        return;
      }
      simStart = start;
      sim = null;
      loadFall(setup.simConfig ?? config, start, setup.walls)
        .then((fall) => {
          if (disposed || simStart !== start) return;
          sim = fall;
          tries = 0;
          relayout();
          requestAnimationFrame(retry);
        })
        .catch((error) => console.error("Ball animation:", error));
    }

    relayout();

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
    // What plays before it has been re-paced: when this may start moves.
    if (setup.after) window.addEventListener("ballrun:paced", relayout);
    const observer = new ResizeObserver(relayout);
    observer.observe(root);

    return () => {
      disposed = true;
      clearInterval(settle);
      clearTimeout(startTimer);
      glide.stop();
      if (autoFrame) cancelAnimationFrame(autoFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", relayout);
      window.removeEventListener("ballrun:paced", relayout);
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
      {/* Scaled about the ball's centre when it vanishes. */}
      <g
        ref={shrinkRef}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <image ref={ballRef} href={config.ball.image} width="0" height="0" />
      </g>
    </svg>
  );
}
