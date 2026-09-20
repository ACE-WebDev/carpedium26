"use client";

import { useEffect, useRef, useState } from "react";

// How much wheel/touch travel (in px) maps to the full zoom.
const SCROLL_RANGE = 4000;
const MAX_SCALE = 4;
// Fraction of the scroll after which the photo starts being revealed
// through the logo, so the change reads as "arriving at max zoom".
const TINT_START = 0.45;
// The logo finishes growing here, leaving the rest of the scroll for the
// text to fade and the photo to expand and cover the letterforms.
const ZOOM_END = 0.55;
// Text has finished fading by here; the photo then breaks out of the
// letterforms and takes over the page.
const TAKEOVER_START = 0.8;
// The Aranya text fades from the first scroll and is gone by here.
const TEXT_FADE_END = 0.25;
// ---------------------------------------------------------------------
// TUNE THE PHOTO'S FADE-IN HERE. This is the photo appearing inside the
// letterforms, and is separate from the logo's own fade-out.
// FADE_IN_AT   - where the photo starts appearing.
// FADE_IN_SPAN - how long the fade takes; smaller is sharper.
//   0.10 / 0.35 = early and gradual
//   0.20 / 0.20 = balanced
//   0.30 / 0.08 = late and sharp
const FADE_IN_AT = 0.1;
const FADE_IN_SPAN = 0.13;
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// TUNE THE STARTING SIZE HERE.
// How big the photo is inside the letterforms at rest. Smaller = the
// photo starts as a tighter close-up and has further to grow.
//   0.15 = very small
//   0.25 = small
//   0.35 = moderate
const PHOTO_MIN = 0.02;
// ---------------------------------------------------------------------
// How big it has grown by the time the letterforms release it. The
// release now starts from exactly this value rather than snapping to 1,
// so any value animates smoothly; but below 1 the photo does not quite
// fill the letterforms, so the glyphs show their edges just before the
// release. 1 fills them exactly.
const PHOTO_MAX = 0.6;
// ---------------------------------------------------------------------
// TUNE THE FINAL ZOOM-OUT HERE.
// How much the photo swells past its released size before easing back to
// 1, which fills the hero box exactly. This is a multiplier on PHOTO_MAX,
// not an absolute scale, so the motion continues from wherever the photo
// already is instead of jumping.
//   1.0 = no zoom-out at all
//   1.4 = gentle
//   1.8 = pronounced
//   2.5 = dramatic
// Clamped to >= 1 below, so it can only overshoot: the photo always
// covers the box and no empty edges can appear, whatever value you pick.
const ZOOM_OUT_FROM = 0.2;
// ---------------------------------------------------------------------

// How long the opening and what follows crossfade for. Keep in step with
// the duration on the two fading elements below.
const CROSSFADE_MS = 700;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function OpeningStage({ chrome, photo, after }) {
  const stageRef = useRef(null);
  // The handover runs in two steps so the two halves can crossfade:
  //   "playing"  - the opening alone.
  //   "handover" - both mounted; the opening fades out while what follows
  //                fades in underneath it.
  //   "done"     - the opening is unmounted for good.
  const [phase, setPhase] = useState("playing");
  const done = phase === "done";
  const handingOver = phase === "handover";
  // Survives the effect re-running (Strict Mode remounts in dev), so a
  // finished opening can never re-arm itself.
  const finishedRef = useRef(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (finishedRef.current) return;

    // Reduced motion skips the scroll-driven animation entirely. The
    // opening still has to hand over, or the rest of the site would never
    // mount, so settle straight into the finished state. This has to run
    // here rather than in a useState initializer: the server cannot read
    // matchMedia, so deciding it during render would break hydration.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      finishedRef.current = true;
      document.body.classList.add("opening-done");
      // Straight to done, with no crossfade to animate.
      // A one-shot handover, not a render loop: finishedRef stops it re-running.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      return;
    }

    // The page never actually scrolls, so we accumulate scroll intent
    // ourselves and clamp it to the animation range.
    let travel = 0;
    let frame = 0;
    // Pending unmount of the opening once the crossfade has run.
    let fadeTimer = 0;

    // The bounce is only an idle-state effect. Let the real zoom state,
    // rather than raw wheel/touch input, decide when it ends.
    const stopIntroBounce = () => {
      stage.classList.add("opening-has-scrolled");
    };

    // The wordmark is laid out by space-around, so its centre sits above
    // the viewport's. Measure the gap so the freed photo can start there
    // instead of jumping to the middle of the screen.
    const logo = stage.querySelector(".opening-logo");
    const measureOffset = () => {
      if (!logo) return 0;
      // Deliberately offsetTop/offsetHeight rather than
      // getBoundingClientRect: these are layout geometry and ignore every
      // transform on the element and its ancestors. The rect would instead
      // be measured through the live --zoom *and* the entrance animations
      // (.opening-logo-intro starts a viewport above, .opening-logo-bounce
      // adds a further nudge), so on mount it reports the wordmark while it
      // is still off-screen - which put the photo far from the mask until
      // something re-measured and snapped it back.
      let top = 0;
      for (let el = logo; el && el !== stage; el = el.offsetParent) {
        top += el.offsetTop;
      }
      return top + logo.offsetHeight / 2 - stage.clientHeight / 2;
    };
    let logoDy = measureOffset();

    // The webfont changes the text block's height, which moves the
    // wordmark under space-around, so re-measure once fonts settle.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        logoDy = measureOffset();
        render();
      });
    }

    // The wordmark's own box can still settle after that - the inlined SVG
    // sizing, or any late layout shift. Track it directly so --photo-dy
    // follows the layout instead of being fixed by one early reading.
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            logoDy = measureOffset();
            render();
          });
    if (observer && logo) observer.observe(logo);

    const render = () => {
      frame = 0;
      const t = travel / SCROLL_RANGE; // 0 -> 1
      const zoom = clamp01(t / ZOOM_END);
      if (zoom > 0) stopIntroBounce();
      // The photo has filled the letterforms by the time the mask starts
      // releasing, so the growth reads as one continuous expansion.
      const tint = clamp01((t - TINT_START) / (TAKEOVER_START - TINT_START));
      // Fade the solid letterforms out to reveal the photo behind them.
      const cover = 1 - tint;
      // Text starts fading from the very first scroll, and is gone well
      // before the photo takes over.
      const fade = 1 - clamp01(t / TEXT_FADE_END);
      const takeover = clamp01((t - TAKEOVER_START) / (1 - TAKEOVER_START));

      stage.style.setProperty("--zoom", String(1 + zoom * (MAX_SCALE - 1)));
      stage.style.setProperty("--fade", String(fade));
      stage.style.setProperty("--drift", `${(1 - fade) * 60}px`);
      stage.style.setProperty("--cover", String(cover));
      // The photo's own fade-in, independent of the logo's fade-out.
      stage.style.setProperty(
        "--photo-in",
        String(clamp01((t - FADE_IN_AT) / FADE_IN_SPAN)),
      );
      stage.style.setProperty("--takeover", String(takeover));
      // Inside the letterforms the photo grows from small to PHOTO_MAX.
      const inMask = PHOTO_MIN + tint * (PHOTO_MAX - PHOTO_MIN);
      // On release it eases to exactly 1, which fills the clip - and the
      // clip is by then the same box HomePage paints its hero into, so the
      // two match when they cross over.
      //
      // The release starts from wherever the photo actually is (inMask at
      // the moment takeover begins, i.e. PHOTO_MAX), never from a separate
      // constant: starting anywhere else would make the scale jump on the
      // frame takeover starts. ZOOM_OUT_FROM only says how much *bigger*
      // than that it swells first, so the growth carries through the
      // release instead of stopping dead. Clamped to >= 1 so it can only
      // ever overshoot, never shrink and reveal empty edges.
      const overshoot = Math.max(ZOOM_OUT_FROM, 1);
      const from = PHOTO_MAX * overshoot;
      // Ease out, so it decelerates into its final size rather than
      // arriving at full speed.
      const ease = 1 - (1 - takeover) * (1 - takeover);
      stage.style.setProperty(
        "--photo-scale",
        String(
          takeover === 0 ? inMask : from + ease * (1 - from),
        ),
      );
      // The clip box grows to the hero box as the mask releases, so its
      // own scale eases 4x -> 1x to keep the motion continuous. It shares
      // the photo's easing, so the box and the picture inside it settle
      // together rather than one arriving before the other.
      stage.style.setProperty(
        "--clip-zoom",
        String(1 + zoom * (MAX_SCALE - 1) * (1 - ease)),
      );
      // Start on the wordmark's centre, ease to the viewport's, so the
      // photo slides into place as it fills the screen.
      stage.style.setProperty("--photo-dy", `${logoDy * (1 - ease)}px`);
    };

    // Paint the true t=0 state before the first scroll. Without this the
    // opening's first frame uses the CSS defaults, and the measured
    // --photo-dy in particular is not applied until something else calls
    // render(), so the photo shows up briefly in the wrong place.
    render();

    const advance = (delta) => {
      const next = Math.min(SCROLL_RANGE, Math.max(0, travel + delta));
      if (next === travel) return;
      travel = next;
      if (!frame) frame = requestAnimationFrame(render);
    };

    // Finishing is one-way: the body scroll-lock is released, the scroll
    // hijacking stops for good, and the opening crossfades into what comes
    // next before unmounting. There is no going back.
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      detachScrollHandlers();
      // Mount what follows and start both fades on the same frame.
      setPhase("handover");
      // Unmount the opening only once its fade has finished, so the photo
      // is never pulled out from under the crossfade. The body scroll-lock
      // is released at the same moment, not at the start of the fade: the
      // page must not be scrollable while the crossfade is still running,
      // or it would slide under the stage mid-fade.
      fadeTimer = window.setTimeout(() => {
        document.body.classList.add("opening-done");
        setPhase("done");
      }, CROSSFADE_MS);
    };
    const syncDone = () => {
      if (travel >= SCROLL_RANGE) finish();
    };

    const onWheel = (e) => {
      e.preventDefault();
      advance(e.deltaY);
      syncDone();
    };

    let lastTouchY = null;
    const onTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (lastTouchY === null) return;
      const y = e.touches[0].clientY;
      const dy = lastTouchY - y;
      advance(dy);
      lastTouchY = y;
      e.preventDefault();
      syncDone();
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    const onKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        advance(e.key === "ArrowDown" ? 80 : 400);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        advance(e.key === "ArrowUp" ? -80 : -400);
      } else if (e.key === "Home") {
        advance(-SCROLL_RANGE);
      } else if (e.key === "End") {
        advance(SCROLL_RANGE);
      }
      syncDone();
    };

    const onResize = () => {
      logoDy = measureOffset();
      render();
    };

    // Only the scroll hijacking is torn down on finish; the resize
    // listener stays so the layout keeps up afterwards.
    function detachScrollHandlers() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (fadeTimer) clearTimeout(fadeTimer);
      observer?.disconnect();
      // The opening has finished (or was torn down mid-crossfade, which
      // cancels the pending unmount above) - either way it must end up
      // unlocked, or the page would stay scroll-locked for good. Only an
      // unfinished opening still owns the lock.
      if (finishedRef.current) {
        document.body.classList.add("opening-done");
      } else {
        document.body.classList.remove("opening-done");
      }
      window.removeEventListener("resize", onResize);
      detachScrollHandlers();
    };
  }, []);

  // The opening hands over completely: once the crossfade has run the
  // whole stage, photo included, is gone and only what follows is left.
  if (done) return after;

  return (
    <>
      {/* Mounted a crossfade early, underneath the opening, so it is
          already painted and fading up as the opening fades out. */}
      {handingOver && (
        <div
          className="animate-[opening-fade-in_700ms_ease-out_forwards] opacity-0"
          style={{ animationDuration: `${CROSSFADE_MS}ms` }}
        >
          {after}
        </div>
      )}
      {/* `opening` stays as the hook the custom-property defaults and the
          mask geometry attach to; the rest is utilities. On handover it
          sits on top, fades to nothing, and stops taking pointer events. */}
      <div
        className={`opening fixed inset-0 z-30 h-[100dvh] w-full overflow-hidden bg-[#EFD4A3] ${
          handingOver
            ? "pointer-events-none animate-[opening-fade-out_700ms_ease-out_forwards]"
            : ""
        }`}
        style={handingOver ? { animationDuration: `${CROSSFADE_MS}ms` } : undefined}
        ref={stageRef}
      >
        {chrome}
        {photo}
      </div>
    </>
  );
}
