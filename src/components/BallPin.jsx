/*
 * A scene a scroll-driven ball can hold still while it plays, so the ball
 * can be paced slower than the page scrolls
 * (config.scroll.screensPerSecond): the scene sticks where it is on screen
 * when its ball sets off, for as much scrolling as the spacer after it
 * adds. The animation inside finds it with pinOf() and sizes both; until
 * then, and in auto mode, it is laid out like any other block.
 *
 * Nothing above it may clip with `overflow: hidden` (use `overflow-x-clip`),
 * or it has nothing to stick to.
 */
export default function BallPin({ className = "", children, ...props }) {
  return (
    <div className="flow-root">
      <div
        data-ball-pin=""
        className={`sticky flow-root ${className}`}
        {...props}
      >
        {children}
      </div>
      <div data-ball-pin-spacer="" aria-hidden="true" />
    </div>
  );
}

/* The BallPin around `el`, if there is one: the part that sticks, the track
   it sticks within (which always moves with the page) and the spacer that
   sets how long it sticks for. */
export function pinOf(el) {
  const sticky = el.closest("[data-ball-pin]");
  const track = sticky?.parentElement;
  const spacer = track?.querySelector(":scope > [data-ball-pin-spacer]");
  return sticky && spacer ? { sticky, track, spacer } : null;
}

/* Holds the pin's scene with its top `top` px down the screen for `hold` px
   of scrolling, or lets it go (hold 0). */
export function setPin(pin, top, hold) {
  pin.sticky.style.top = hold > 0 ? `${top}px` : "";
  pin.spacer.style.height = hold > 0 ? `${hold}px` : "";
}

/* Where `el`'s top is on screen when the page is scrolled right to the top.
   Measured against the body rather than with scrollY, which reads 0 while a
   blackout has the body pinned. */
export function pageTop(el) {
  return (
    el.getBoundingClientRect().top - document.body.getBoundingClientRect().top
  );
}

/* Where the fixed navbar ends, in px from the top of the viewport. Measured
   rather than assumed: its logo oval hangs below the bar, right where the
   balls fall, and both scale with the viewport. 110 is the fallback if it
   cannot be found. */
export function navbarBottom() {
  const nav = document.querySelector("nav");
  if (!nav) return 110;
  let bottom = nav.getBoundingClientRect().bottom;
  for (const el of nav.querySelectorAll("*")) {
    bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
  }
  return bottom;
}
