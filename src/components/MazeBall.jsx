"use client";

import { useEffect, useRef } from "react";

/*
 * The ball's motion guide, in maze.png's own pixel space (2344x1731) —
 * the same coordinates as the maze artwork, so one viewBox drives both the
 * image and this path. That shared transform is what keeps it responsive:
 * the ball cannot drift off the artwork as the page resizes.
 *
 * This is the exported Figma trace, translated horizontally by +814.8 and
 * nothing else. Its viewBox was 443x1731 and maze.png is 1731 tall, so the
 * vertical mapping is exactly 1:1 and no scaling or resampling was needed;
 * the curve is the one that was drawn, command for command. The offset is
 * the value that lands it on x=1172, the image's centre line.
 *
 * Only 0.3% of the curve touches the artwork, which is the point: it
 * threads the gaps between the maze's arcs rather than crossing them.
 *
 * Trade-off: the left swing reaches x=827, and on screens narrower than
 * about 430px the hero's `slice` crop starts at x~912, so that part of the
 * arc is off-screen there. Keeping the weave aligned to the gaps was worth
 * more than phone-width coverage.
 *
 * To replace by hand: draw over maze.png at its native 2344x1731 and paste
 * the exported `d` straight in — no conversion needed.
 */
const MAZE_PATH =
  "M1148.98 0.00V311.00C1087.48 292.67 959.88 261.50 941.48 283.50C923.08 305.50 762.78 527.80 856.48 592.00C973.98 672.50 1185.98 498.00 1240.98 785.50C1173.98 770.00 1058.48 782.30 1132.48 955.50C1206.48 1128.70 1189.64 1543.67 1171.98 1729.50";

/* maze.png's intrinsic size — the coordinate system for the maze layer */
const VB_W = 2344;
const VB_H = 1731;

/* Where the traced path ends, in those units. The tail that carries the
   ball on down into About Us is built from here at runtime, because how
   far that is in viewBox units depends on the viewport. */
const PATH_END_X = 1171.98;
const PATH_END_Y = 1729.5;

const BALL_SIZE = 60;

/* How much of the remaining distance the ball closes each frame. Lower is
   smoother but laggier; it only damps the motion, it never stops the ball
   from reaching the end of the path. */
const SCROLL_SMOOTH = 0.15;

/* Where the ball sits before you scroll, as a fraction of the path. The
   path begins at the maze's very top edge, which the fixed navbar overlaps,
   so the ball starts a little way down instead. The path's first segment is
   a straight vertical drop, so this only changes where it rests — not the
   shape of the fall. */
const START_AT = 0.12;

/* One turn per circumference travelled, so the spin reads as true rolling
   contact rather than a sprite spinning in place. */
const ROLL_PER_UNIT = 360 / (Math.PI * BALL_SIZE);

/* Scale/offset the traced path's commands into the overlay's pixel space. */
function transformPath(d, scale, offsetX) {
  const tokens = d.match(/[MVC]|-?\d+\.?\d*/g) || [];
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i];
    if (cmd === "M") {
      out.push(
        `M${(+tokens[i + 1] * scale + offsetX).toFixed(2)} ${(
          +tokens[i + 2] * scale
        ).toFixed(2)}`
      );
      i += 3;
    } else if (cmd === "V") {
      out.push(`V${(+tokens[i + 1] * scale).toFixed(2)}`);
      i += 2;
    } else if (cmd === "C") {
      const v = [];
      for (let k = 0; k < 6; k++) {
        const n = +tokens[i + 1 + k];
        v.push((k % 2 === 0 ? n * scale + offsetX : n * scale).toFixed(2));
      }
      out.push(`C${v.join(" ")}`);
      i += 7;
    } else {
      i += 1;
    }
  }
  return out.join("");
}

export default function MazeBall({
  hero,
  children,
  className = "",
  heroClassName = "",
  ...props
}) {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const guideRef = useRef(null);
  const ballRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    const guide = guideRef.current;
    const ball = ballRef.current;
    const svg = svgRef.current;
    if (!root || !hero || !guide || !ball || !svg) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let total = 0;

    // Rebuild the guide in the overlay's own pixel space. The maze part is
    // the traced curve mapped through the same `slice` transform the maze
    // image gets, so it stays glued to the artwork; the tail is then drawn
    // from where that ends down to the centre of the About Us image, which
    // is measured from the DOM rather than assumed.
    const layout = () => {
      const rootBox = root.getBoundingClientRect();
      const heroBox = hero.getBoundingClientRect();
      if (!rootBox.height || !heroBox.height) return;

      svg.setAttribute("viewBox", `0 0 ${rootBox.width} ${rootBox.height}`);

      // `xMidYMin slice` on the hero: scale to cover, centred horizontally,
      // anchored to the top.
      const scale = Math.max(heroBox.width / VB_W, heroBox.height / VB_H);
      const offsetX = (heroBox.width - VB_W * scale) / 2;

      const target = root.querySelector("[data-ball-target]");
      const targetBox = target?.getBoundingClientRect();
      const endX = targetBox
        ? targetBox.left - rootBox.left + targetBox.width / 2
        : rootBox.width / 2;
      const endY = targetBox
        ? targetBox.top - rootBox.top + targetBox.height / 2
        : rootBox.height;

      const tailX = PATH_END_X * scale + offsetX;
      const tailY = PATH_END_Y * scale;

      // Ease the tail sideways with a cubic so it joins the traced curve
      // smoothly instead of kinking at the handover.
      const dy = endY - tailY;
      guide.setAttribute(
        "d",
        `${transformPath(MAZE_PATH, scale, offsetX)} C${tailX} ${
          tailY + dy * 0.35
        },${endX} ${endY - dy * 0.45},${endX} ${endY}`
      );

      total = guide.getTotalLength();
    };

    // Scroll drives the ball: it starts moving when the hero's top reaches
    // the top of the viewport and finishes once About Us is in view.
    let frame = 0;
    let shown = 0;
    let arrived = false;

    const place = (dist) => {
      const p = guide.getPointAtLength(dist);
      ball.setAttribute("x", p.x - BALL_SIZE / 2);
      ball.setAttribute("y", p.y - BALL_SIZE / 2);
      ball.setAttribute(
        "transform",
        `rotate(${dist * ROLL_PER_UNIT} ${p.x} ${p.y})`
      );
    };

    // How far down the fall we should be, from the hero's top reaching the
    // top of the viewport to About Us being scrolled to.
    const targetProgress = () => {
      const rootBox = root.getBoundingClientRect();
      const span = rootBox.height - window.innerHeight;
      const scrolled =
        span > 0 ? Math.min(1, Math.max(0, -rootBox.top / span)) : 0;
      // Start partway down the path and still finish at the end of it.
      return START_AT + scrolled * (1 - START_AT);
    };

    const update = () => {
      frame = 0;
      if (!total) return;
      const target = targetProgress();
      // Announce the landing once, for whatever wants to react to it, and
      // then stop tracking: the transition that follows pins the body,
      // which moves the page under us. Without this the ball would glide
      // off to a stale position and be seen rolling backwards afterwards.
      if (!arrived && target >= 0.999) {
        arrived = true;
        shown = 1;
        place(total);
        window.dispatchEvent(new CustomEvent("mazeball:arrived"));
        return;
      }
      if (arrived) {
        place(total);
        return;
      }
      // Glide toward the target rather than snapping, so flicks and
      // trackpad jitter do not make the ball twitch.
      shown += (target - shown) * SCROLL_SMOOTH;
      if (Math.abs(target - shown) > 0.0005) {
        frame = requestAnimationFrame(update);
      } else {
        shown = target;
      }
      place(shown * total);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // `snap` puts the ball straight where it belongs instead of gliding to
    // it — right for first paint and for resizes.
    const relayout = (snap) => {
      layout();
      if (!total) return;
      if (snap) {
        shown = targetProgress();
        place(shown * total);
      } else {
        update();
      }
    };

    relayout(true);

    // This can mount while the opening sequence still owns the page, with
    // the body scroll-locked and the layout not yet at its final size. A
    // single measurement then would cache the wrong geometry and leave the
    // ball parked off-screen, so keep re-measuring until the page settles
    // and whenever its height changes afterwards.
    let tries = 0;
    const retry = () => {
      if (total || tries++ > 180) return;
      relayout(true);
      requestAnimationFrame(retry);
    };
    requestAnimationFrame(retry);

    let lastHeight = document.documentElement.scrollHeight;
    const settle = setInterval(() => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        relayout(true);
      }
    }, 250);

    if (reduced.matches) {
      if (total) place(total); // resting at the end, no scroll animation
      clearInterval(settle);
      return;
    }

    const onResize = () => relayout(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(root);

    return () => {
      clearInterval(settle);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full ${className}`} {...props}>
      {/* The maze only covers the hero. `slice` reproduces the old
          `bg-cover bg-top` framing exactly, so the opening sequence still
          crossfades into it without a jump. */}
      <div
        ref={heroRef}
        className={`absolute inset-x-0 top-0 overflow-hidden ${heroClassName}`}
        aria-hidden="true"
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMin slice"
          className="h-full w-full"
        >
          <image href="/maze.png" x="0" y="0" width={VB_W} height={VB_H} />
        </svg>
      </div>

      {/* The ball rides above everything, in its own full-height layer, so
          it can roll out of the hero and into the section below it. */}
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        aria-hidden="true"
      >
        <path ref={guideRef} fill="none" stroke="none" />
        <image
          ref={ballRef}
          href="/ball.png"
          width={BALL_SIZE}
          height={BALL_SIZE}
          x={-BALL_SIZE}
          y={-BALL_SIZE}
        />
      </svg>

      {/* `hero` gets its own box of the same height the old background div
          had, so what follows starts exactly where it always did. */}
      <div className={`relative ${heroClassName}`}>{hero}</div>
      <div className="relative">{children}</div>
    </div>
  );
}
