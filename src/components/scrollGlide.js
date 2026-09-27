import config from "@/config/ballAnimation";

/*
 * Eases a scroll-driven progress value (0–1) towards where the scroll says
 * it should be rather than jumping there, so a notched wheel or a flick
 * slides the ball along instead of teleporting it. Time-based, so it glides
 * the same at 60 and at 120 frames a second. Shared by every scroll-driven
 * ball so they all follow the scrollbar the same way
 * (config.scroll.glideMs).
 *
 * `read` returns the progress the scroll currently asks for, or null while
 * that cannot be measured, and `apply` draws a progress.
 */
export function createGlide(read, apply) {
  const ms = Math.max(0, config.scroll.glideMs ?? 0);
  let shown = null;
  let frame = 0;
  let last = 0;

  const tick = (now) => {
    frame = 0;
    const target = read();
    if (target === null) return;
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    shown =
      shown === null || !ms
        ? target
        : shown + (target - shown) * (1 - Math.exp(-dt / ms));
    if (Math.abs(target - shown) < 0.0002) shown = target;
    apply(shown);
    if (shown !== target) frame = requestAnimationFrame(tick);
    else last = 0;
  };

  return {
    // After the page has scrolled: glide to where it now asks.
    update() {
      if (!frame) frame = requestAnimationFrame(tick);
    },
    // After a re-measure (first paint, resize): go straight there.
    jump() {
      const target = read();
      if (target === null) return;
      shown = target;
      apply(target);
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    },
  };
}
