// The one photo in the opening. It is clipped to the wordmark's
// letterforms by a CSS mask, then the mask releases and it zooms out to
// a plain full-screen image as the rest of the opening fades away.
//
// This is the same image HomePage opens with (/maze.png), framed the same
// way it is there - top-anchored and covering - so the handover crossfades
// between two views of one picture rather than swapping in a new one.
export default function OpeningPhoto() {
  return (
    <div
      className="opening-photo-clip absolute top-1/2 left-1/2 z-10 origin-center pointer-events-none"
      style={{
        // Grows from the wordmark's box to exactly the box HomePage paints
        // its hero into: 100vw x 150vh, covered and top-anchored. Matching
        // that box (not just the viewport) is what makes the crossfade
        // land on the same pixels - `cover` scales the image to fill the
        // box, so a box of a different height would show it at a different
        // size and the two halves would jump apart.
        width:
          "calc(var(--logo-w) + (100vw - var(--logo-w)) * var(--takeover))",
        height:
          "calc(var(--logo-w) / 2.0915 + (150vh - var(--logo-w) / 2.0915) * var(--takeover))",
        // The clip hangs off `top: 50%`, so `-50%` keeps it centred on the
        // wordmark. HomePage's hero box instead starts at the top of the
        // page, so as --takeover runs we slide the anchor up to the top of
        // the viewport: at 1 the box's top edge sits at y=0, matching it.
        // --photo-dy is already eased to 0 by the stage, so it is used as
        // given here rather than being scaled by --takeover a second time.
        transform:
          "translate(-50%, calc(-50% + var(--photo-dy) - 50dvh * var(--takeover) + 50% * var(--takeover))) scale(var(--clip-zoom))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="block h-full w-full origin-center object-cover object-top will-change-[transform,opacity]"
        style={{
          opacity: "var(--photo-in)",
          transform: "scale(var(--photo-scale))",
        }}
        src="/maze.png"
        alt="Carpe Diem"
      />
    </div>
  );
}
