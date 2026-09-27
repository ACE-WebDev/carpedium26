"use client";

import BallFall from "./BallFall";
import BallPin from "./BallPin";
import { HERO_VIEW, VB_H, VB_W } from "./mazeBallTimeline";

/* How much of HERO_VIEW's width the hero shows, in maze.png px: all of it,
   except on a phone, where the whole maze across the screen is too small
   to make out, and it shows the middle — the ball never goes further out
   than x 824–1339 — bigger instead, its sides cut off. The artwork fills
   the box (`slice`), so that is all it takes; BallFall measures the box.
   (Written out in full so Tailwind finds the classes; 2028 is
   HERO_VIEW.width.) */
const VIEW_WIDTH = "[--hero-view-w:2028] max-sm:[--hero-view-w:1250]";
const HERO_ASPECT = `var(--hero-view-w) / ${HERO_VIEW.height}`;

/* HERO_VIEW leaves room above the maze for the navbar, but as a share of
   the width: on a narrow screen that is thinner than the navbar, which
   would hide the top of the maze and the ball as it starts. This makes up
   the difference: the navbar's height (navbar.css) less that room. */
const NAVBAR_ROOM = `max(0px, calc(clamp(54px, 8vh, 72px) - 100vw * ${-HERO_VIEW.y} / var(--hero-view-w)))`;

/*
 * The hero: the maze with the ball falling through it (BallFall), and what
 * the ball falls on into — About Us, passed as `children`, whose artwork is
 * marked `data-ball-target`. In scroll mode it is held on screen while the
 * ball falls, for as long as the pace in src/config/ballAnimation.js needs.
 */
export default function MazeBall({ hero, children, className = "", ...props }) {
  return (
    <BallPin className={`w-full ${VIEW_WIDTH} ${className}`} {...props}>
      {/* Over everything here, so the ball can roll out of the hero and into
          the section below it. */}
      <BallFall variant="hero" />

      <div className="relative" style={{ paddingTop: NAVBAR_ROOM }}>
        {/* The maze only covers the hero, framed by HERO_VIEW and scaled
            with the screen's width, like the Sponsors section's maze. */}
        <div
          data-ball-maze=""
          className="absolute inset-x-0 overflow-hidden"
          style={{ top: NAVBAR_ROOM, aspectRatio: HERO_ASPECT }}
          aria-hidden="true"
        >
          <svg
            viewBox={`${HERO_VIEW.x} ${HERO_VIEW.y} ${HERO_VIEW.width} ${HERO_VIEW.height}`}
            preserveAspectRatio="xMidYMin slice"
            className="block h-full w-full"
          >
            <image href="/maze.png" x="0" y="0" width={VB_W} height={VB_H} />
          </svg>
        </div>

        {/* `hero` gets a box the size of the maze, so what follows starts
            right below it. */}
        <div className="relative" style={{ aspectRatio: HERO_ASPECT }}>
          {hero}
        </div>
        <div className="relative">{children}</div>
      </div>
    </BallPin>
  );
}
