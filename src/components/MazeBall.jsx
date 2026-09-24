"use client";

import BallFall from "./BallFall";
import { VB_H, VB_W } from "./mazeBallTimeline";

/*
 * The hero: the maze with the ball falling through it (BallFall), and what
 * the ball falls on into — About Us, passed as `children`, whose artwork is
 * marked `data-ball-target`.
 */
export default function MazeBall({
  hero,
  children,
  className = "",
  heroClassName = "",
  ...props
}) {
  return (
    <div className={`relative w-full ${className}`} {...props}>
      {/* The maze only covers the hero. `slice` reproduces the old
          `bg-cover bg-top` framing exactly, so the opening sequence still
          crossfades into it without a jump. */}
      <div
        data-ball-maze=""
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

      {/* Over everything here, so the ball can roll out of the hero and into
          the section below it. */}
      <BallFall variant="hero" />

      {/* `hero` gets its own box of the same height the old background div
          had, so what follows starts exactly where it always did. */}
      <div className={`relative ${heroClassName}`}>{hero}</div>
      <div className="relative">{children}</div>
    </div>
  );
}
