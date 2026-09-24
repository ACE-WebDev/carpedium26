"use client";

import BallFall from "./BallFall";
import { HERO_VIEW, VB_H, VB_W } from "./mazeBallTimeline";

/* The hero is as tall as the maze drawn across the full width. */
const HERO_ASPECT = `${HERO_VIEW.width} / ${HERO_VIEW.height}`;

/*
 * The hero: the maze with the ball falling through it (BallFall), and what
 * the ball falls on into — About Us, passed as `children`, whose artwork is
 * marked `data-ball-target`.
 */
export default function MazeBall({ hero, children, className = "", ...props }) {
  return (
    <div className={`relative w-full ${className}`} {...props}>
      {/* The maze only covers the hero, framed by HERO_VIEW and scaled with
          the screen's width, like the Sponsors section's maze. */}
      <div
        data-ball-maze=""
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ aspectRatio: HERO_ASPECT }}
        aria-hidden="true"
      >
        <svg
          viewBox={`${HERO_VIEW.x} ${HERO_VIEW.y} ${HERO_VIEW.width} ${HERO_VIEW.height}`}
          preserveAspectRatio="xMidYMin meet"
          className="block h-full w-full"
        >
          <image href="/maze.png" x="0" y="0" width={VB_W} height={VB_H} />
        </svg>
      </div>

      {/* Over everything here, so the ball can roll out of the hero and into
          the section below it. */}
      <BallFall variant="hero" />

      {/* `hero` gets a box the size of the maze, so what follows starts
          right below it. */}
      <div className="relative" style={{ aspectRatio: HERO_ASPECT }}>
        {hero}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
