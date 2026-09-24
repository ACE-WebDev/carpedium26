"use client";

/*
 * components/MazeBackground.jsx
 *
 * Renders the user-provided maze artwork (/maze-events.png) as a
 * full-viewport background using CSS mix-blend-mode: multiply.
 *
 * Why multiply blend?
 *   The source PNG has a white background. In multiply blend:
 *     white (255) × any_color / 255 = that color  → white becomes invisible
 *     cream walls × cream bg → warm cream/golden walls
 *     tan sides  × cream bg → rich golden-tan sides
 *   This exactly replicates how the home page looks: the maze walls
 *   appear as warm 3D shapes while the white gaps disappear into the bg.
 *
 * The page background (#EDD4A3 cream) acts as the "canvas" for the blend.
 */
export default function MazeBackground({ className = "", ...props }) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/maze-events.png"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
