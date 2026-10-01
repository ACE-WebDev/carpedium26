"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Navbar from "./navbar";
import MazeBall from "./MazeBall";
import BallFall from "./BallFall";
import BallPin, { pageTop, pinOf, pinViewport, setPin } from "./BallPin";
import SlopeBall from "./SlopeBall";
import CircleWipe from "./CircleWipe";
import { createGlide } from "./scrollGlide";
import config from "@/config/ballAnimation";
import { onJump, peekPendingJump, takePendingJump } from "@/lib/homeJump";
import { supabase } from "@/lib/supabase";
import styles from "./HomePage.module.css";

/* Where each navbar jump starts the page: its section as it is once the
   animations before it have played. */
const JUMP_START = {
  home: "hero",
  about: "intro",
  sponsors: "sponsors",
  contact: "sponsors",
};

/* Puts the page at a navbar jump's target — the top of what is left of it,
   or the footer — and keeps it there for a moment while the page settles
   around it (images loading, the balls pacing themselves), unless the
   visitor scrolls first. Returns the cleanup. */
function landOn(target) {
  const place = () => {
    const footer = target === "contact" && document.getElementById("contact");
    if (footer) footer.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
  };
  const observer = new ResizeObserver(place);
  const release = () => {
    observer.disconnect();
    window.removeEventListener("wheel", release);
    window.removeEventListener("touchstart", release);
    window.removeEventListener("keydown", release);
  };
  place();
  observer.observe(document.body);
  window.addEventListener("wheel", release, { passive: true });
  window.addEventListener("touchstart", release, { passive: true });
  window.addEventListener("keydown", release);
  const timer = setTimeout(release, 2500);
  return () => {
    clearTimeout(timer);
    release();
  };
}


/* ================= DIGIT REEL (single spinning character) ================= */
function DigitReel({ digit, spinning }) {
  const reelDigits = "0123456789";
  const targetIndex = reelDigits.indexOf(digit);
  const [index, setIndex] = useState(targetIndex);

  useEffect(() => {
    if (!spinning) return;

    let frame = 0;
    const totalFrames = 18 + Math.floor(Math.random() * 6);
    const stepMs = 55;

    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setIndex(targetIndex);
        clearInterval(interval);
      } else {
        setIndex(Math.floor(Math.random() * 10));
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [spinning, targetIndex]);

  
  return (
    <span className="relative inline-block h-[1.25em] w-[0.8em] overflow-hidden align-top">
      <span
        className="absolute inset-0 transition-transform duration-150 ease-out"
        style={{ transform: `translateY(-${index * 1.25}em)` }}
      >
        {reelDigits.split("").map((d) => (
          <span key={d} className="flex items-center justify-center h-[1.25em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ================= STAT NUMBER ================= */
function StatNumber({ value, spinning }) {
  return (
    <span className="inline-flex items-center">
      {value.split("").map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <DigitReel key={i} digit={ch} spinning={spinning} />
        ) : (
          <span key={i} className="inline-block leading-none">
            {ch}
          </span>
        )
      )}
    </span>
  );
}

/* ================= FLAGSHIP STATS ================= */
function FlagshipStats() {
  const ref = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          setSpinning(true);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: "2", label: "Days" },
    { value: "11+", label: "Events" },
    { value: "22+", label: "Sponsors" },
  ];

  return (
    <div
      ref={ref}
      id="flagship-stats-countdown"
      className=" absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-[1350px] flex items-center justify-around z-30"
    >
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center text-center">
          <span
            className="text-[#283618] flex items-center justify-center text-[14vw] md:text-[clamp(3.5rem,10.5vw,150px)]"
            style={{
              fontFamily: "'BBH Hegarty', sans-serif",
              lineHeight: 0.9,
              fontWeight: 700,
            }}
          >
            <StatNumber value={s.value} spinning={spinning} />
          </span>
          <span
            className="text-[#FDF7DE] mt-1 text-[6.75vw] md:text-[clamp(1.6rem,5vw,70px)]"
            style={{
              fontFamily: "'BBH Hegarty', sans-serif",
              lineHeight: 1,
            }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================= FLAGSHIP GRASS & WAVE PLATFORM ================= */
function FlagshipPlatform() {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkView = () => {
      ticking = false;
      const statsEl = document.getElementById("flagship-stats-countdown");
      if (!statsEl) return;

      const rect = statsEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Threshold:
      // Mobile: 70% of screen height (starts earlier as soon as countdown enters view)
      // Desktop: 30% of screen height
      const threshold = mobile ? vh * 0.70 : vh * 0.30;

      // When above countdown: false (leaves are UP)
      // When at or below countdown: true (leaves are HIDDEN)
      // On backward scroll, as soon as you scroll above threshold: false (leaves RISE smoothly)
      const isPastCountdown = rect.top < threshold;
      setIsInView(isPastCountdown);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checkView);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    checkView();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("touchmove", onScroll);
    };
  }, []);

  const hideLeaves = isHovered || isInView;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-10 w-screen left-1/2 -translate-x-1/2 mt-[4vw]"
    >
      {/* Retractable Leaves Row:
          - Sinks inside smoothly on forward scroll / hover (2.2s)
          - Rises back up neatly and smoothly on backward scroll / unhover (1.8s) */}
      <div
        className="relative z-0 block w-full pointer-events-none select-none"
        style={{
          transform: hideLeaves ? "translateY(110%)" : "translateY(0%)",
          transition: hideLeaves
            ? "transform 2.2s cubic-bezier(0.25, 1, 0.35, 1)"
            : "transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)",
          transitionDelay: hideLeaves ? (isMobile ? "0.05s" : "0.3s") : "0s",
          willChange: "transform",
        }}
      >
        <Image
          src="/carpediem-grass-row.png"
          alt=""
          width={1920}
          height={200}
          className="block w-full h-auto object-contain pointer-events-none select-none"
        />
      </div>

      {/* Green Wave Hill + Stats Overlay */}
      <div className="relative z-20 w-full -mt-[10.2083%]">
        <Image
          src="/flagship-wave.png"
          alt=""
          width={1920}
          height={600}
          data-ball-cover=""
          className="w-full h-auto top-[20%] object-cover pointer-events-none select-none"
        />
        <FlagshipStats />
      </div>
    </div>
  );
}

/* ================= PERFORMER FAN =================
   Desktop: cards fan out on hover.
   Touch: reveal the fan shortly after it scrolls into view. */
const FAN_IMAGES = {
  left: "/performer-2.jpeg",
  center: "/performer-1.jpeg",
  right: "/performer-3.jpeg",
};

const MOBILE_DELAY_MS = 1000;

function PerformerFan({ images = FAN_IMAGES }) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isTouch) return;
    const el = ref.current;
    if (!el) return;

    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting) {
          timer = setTimeout(() => setOpen(true), MOBILE_DELAY_MS);
        } else {
          setOpen(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isTouch]);


  const spread = isTouch ? 50 : 65;

  const rotation = isTouch ? 10 : 20;
  const imageSizes = "(max-width: 500px) 48vw, (max-width: 767px) 240px, (hover: none) 240px, (max-width: 1600px) 32vw, 520px";
  const cardClass =
    "rounded-xl md:rounded-2xl object-cover shadow-lg pointer-events-none select-none motion-reduce:!transition-none";

  return (
    <div
      ref={ref}
      className="relative z-10 cursor-pointer"
      style={{

        width: isTouch ? "min(35vw, 240px)" : "min(32vw, 520px)",
       
        aspectRatio: "3 / 2",
      }}
      onMouseEnter={() => !isTouch && setOpen(true)}
      onMouseLeave={() => !isTouch && setOpen(false)}
    >
      <Image
        src={images.left}
        alt="Carpediem performer"
        fill
        sizes={imageSizes}
        className={`${cardClass} z-0`}
        style={{
          transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          transform: open
            ? `translateX(-${spread}%) translateY(3%) rotate(-${rotation}deg)`
            : "translateX(0) translateY(0) rotate(0deg)",
        }}
      />
      <Image
        src={images.right}
        alt="Carpediem performer"
        fill
        sizes={imageSizes}
        className={`${cardClass} z-0`}
        style={{
          transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          transform: open
            ? `translateX(${spread}%) translateY(3%) rotate(${rotation}deg)`
            : "translateX(0) translateY(0) rotate(0deg)",
        }}
      />
      <Image
        src={images.center}
        alt="Carpediem performer"
        fill
        sizes={imageSizes}
        className={`${cardClass} z-10`}
      />
    </div>
  );
}

/* `enabled`: held at the start until then (the Intro is only the top of the
   page once the first blackout has finished), then rolls to where the
   scroll has got to. */
function BallTrack({ className = "", trailColor = "#C28B5B", enabled = true }) {
  const trackRef = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);
  const enabledRef = useRef(enabled);
  const glideRef = useRef(null);

  useEffect(() => {
    enabledRef.current = enabled;
    glideRef.current?.update();
  }, [enabled]);

  useEffect(() => {
    const track = trackRef.current;
    const ball = ballRef.current;
    const trail = trailRef.current;
    if (!track || !ball || !trail) return;

    // 0 when the track enters at the bottom of the screen — or where it is
    // with the page at its top, if that is higher (after the first blackout
    // it starts on screen), so the ball always sets off from the start —
    // and 1 when it has climbed to a quarter of the way down.
    const progress = () => {
      if (!enabledRef.current) return 0;
      const vh = window.innerHeight;
      const rect = track.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const from = Math.min(vh, pageTop(track) + rect.height / 2);
      const to = vh * 0.25;
      return Math.min(1, Math.max(0, (from - centerY) / Math.max(1, from - to)));
    };

    const draw = (p) => {
      const size = ball.offsetWidth;
      const x = p * (track.clientWidth - size);
      const rollDeg = (x / (size / 2)) * (180 / Math.PI); // rolls without slipping

      ball.style.transform = `translateX(${x}px) rotate(${rollDeg}deg)`;
      trail.style.width = `${x + size / 2}px`;
    };

    const glide = createGlide(progress, draw);
    glideRef.current = glide;
    const onResize = () => glide.jump();

    glide.jump();
    window.addEventListener("scroll", glide.update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", glide.update);
      window.removeEventListener("resize", onResize);
      glide.stop();
      glideRef.current = null;
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className={`pointer-events-none absolute left-1/2 w-screen -translate-x-1/2 ${className}`}
      style={{ "--ball": "clamp(28px, 5vw, 64px)", height: "var(--ball)" }}
      aria-hidden="true"
    >
      {/* Trail (behind the ball) */}
      <div
        ref={trailRef}
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
        style={{ width: 0, height: "55%", background: trailColor }}
      />
      {/* Ball */}
      <Image
        ref={ballRef}
        src="/ball.png"
        alt=""
        width={50}
        height={50}
        className="absolute left-0 top-0 h-full w-auto will-change-transform"
        style={{ width: "var(--ball)" }}
      />
    </div>
  );
}

/* ================= SPONSOR LOGOS OVERLAY ================= */
function resolveImageUrl(url) {
  if (!url) return "";
  let clean = url.trim().replace(/^["']+|["']+$/g, "");
  const dashboardMatch = clean.match(
    /supabase\.com\/dashboard\/project\/([^/]+)\/storage\/files\/buckets\/([^/?]+)\?preview=([^&]+)/
  );
  if (dashboardMatch) {
    const [, project, bucket, filename] = dashboardMatch;
    return `https://${project}.supabase.co/storage/v1/object/public/${bucket}/${decodeURIComponent(filename)}`;
  }
  return clean;
}

function SponsorBadge({ logo, isActive, onRegisterRef, badgeHeight }) {
  const { id, img_url, Name, name, text } = logo;
  const displayName = Name || name || text || "Sponsor";
  const resolvedUrl = resolveImageUrl(img_url);
  const calculatedHeight = badgeHeight ? `${badgeHeight}px` : undefined;

  return (
    <div
      ref={(el) => onRegisterRef?.(id, el)}
      className={`relative flex items-center justify-center p-1.5 md:p-2.5 bg-white/95 rounded-lg md:rounded-xl box-border cursor-pointer select-none transition-all duration-300 ${
        isActive
          ? "scale-[1.18] md:scale-[1.22] z-30 shadow-[0_20px_42px_rgba(0,0,0,0.38)]"
          : "scale-100 z-10 shadow-[0_4px_14px_rgba(0,0,0,0.20)] hover:scale-105 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
      } h-[clamp(36px,5.8vw,86px)] max-w-[clamp(90px,20vw,250px)] min-w-[clamp(70px,13vw,140px)]`}
      style={{
        height: calculatedHeight,
        transitionTimingFunction: isActive
          ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      {resolvedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={displayName}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "block";
          }}
        />
      ) : null}
      <span
        className={`text-center font-bold text-[#1C1F2A] text-[clamp(10px,1.3vw,16px)] font-sans truncate px-1 pointer-events-none ${
          resolvedUrl ? "hidden" : "block"
        }`}
      >
        {displayName}
      </span>
    </div>
  );
}

function SponsorLogos({ boxRef, lanes = [358, 781] }) {
  const [logos, setLogos] = useState([]);
  const [laneYs, setLaneYs] = useState({ topY: "32.1%", bottomY: "70.1%", laneHeight: null });
  const [activeId, setActiveId] = useState(null);
  const badgeElementsRef = useRef({});

  useEffect(() => {
    async function fetchLogos() {
      try {
        const { data, error } = await supabase
          .from("Logos")
          .select("*")
          .order("id", { ascending: true });
        if (error) {
          console.error("Supabase Logos error:", error.message);
        } else if (data && data.length > 0) {
          setLogos(data);
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
      }
    }
    fetchLogos();
  }, []);

  useEffect(() => {
    const box = boxRef?.current;
    if (!box) return;

    const measure = () => {
      const img = box.querySelector("img[data-run]");
      if (!img?.naturalHeight || !img?.clientHeight) return;
      const b = box.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      if (!b.height) return;

      const s = i.height / img.naturalHeight;
      const y0 = (i.top - b.top + lanes[0] * s) / b.height;
      const y1 = (i.top - b.top + lanes[1] * s) / b.height;
      const laneH = Math.round(112 * s);

      setLaneYs({
        topY: `${(y0 * 100).toFixed(2)}%`,
        bottomY: `${(y1 * 100).toFixed(2)}%`,
        laneHeight: laneH,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);

    const img = box.querySelector("img[data-run]");
    if (img) img.addEventListener("load", measure);

    return () => {
      ro.disconnect();
      if (img) img.removeEventListener("load", measure);
    };
  }, [boxRef, lanes]);

  // Listen to ball position events emitted by MazeRun
  useEffect(() => {
    const box = boxRef?.current;
    if (!box) return;

    const handleBallMove = (e) => {
      const { x, y, active } = e.detail || {};
      if (!active) {
        setActiveId((prev) => (prev !== null ? null : prev));
        return;
      }

      const boxRect = box.getBoundingClientRect();
      if (!boxRect.width || !boxRect.height) return;

      let closestId = null;
      let minDistance = Infinity;

      for (const [idKey, el] of Object.entries(badgeElementsRef.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const badgeCenterX = rect.left - boxRect.left + rect.width / 2;
        const badgeCenterY = rect.top - boxRect.top + rect.height / 2;

        const dx = Math.abs(x - badgeCenterX);
        const dy = Math.abs(y - badgeCenterY);

        const hitThresholdX = Math.max(rect.width * 0.72, 55);
        const hitThresholdY = Math.max(rect.height * 1.15, 45);

        if (dx <= hitThresholdX && dy <= hitThresholdY) {
          const dist = Math.hypot(dx, dy);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = isNaN(Number(idKey)) ? idKey : Number(idKey);
          }
        }
      }

      setActiveId((prev) => (prev !== closestId ? closestId : prev));
    };

    box.addEventListener("mazerun:ball", handleBallMove);
    return () => {
      box.removeEventListener("mazerun:ball", handleBallMove);
    };
  }, [boxRef]);

  // Specific ordering: 3, 2, 6 on top; remaining 4 on bottom
  const topIds = [3, 2, 6];
  const topFromDb = topIds
    .map((id) => logos.find((l) => l.id === id))
    .filter(Boolean);

  const bottomFromDb = logos.filter((l) => !topIds.includes(l.id));

  // Fallbacks matching reference image if DB rows are not yet populated
  const fallbackTop = [
    { id: 3, Name: "Touriga", text: "Touriga" },
    { id: 2, Name: "Bharath Snacks", text: "BHARATH SNACKS" },
    { id: 6, Name: "PS4 Gaming Lounge", text: "PS4 GAMING LOUNGE" },
  ];

  const fallbackBottom = [
    { id: 1, Name: "Aussie Bites", text: "Aussie Bites" },
    { id: 4, Name: "BOCS Pizza", text: "BOCS PIZZA" },
    { id: 5, Name: "Koblerr", text: "Koblerr" },
    { id: 7, Name: "Sponsor 4", text: "Sponsor 4" },
  ];

  const displayTop = topFromDb.length > 0 ? topFromDb : fallbackTop;
  const displayBottom = bottomFromDb.length > 0 ? bottomFromDb : fallbackBottom;

  const handleRegisterRef = (id, el) => {
    if (el) {
      badgeElementsRef.current[id] = el;
    } else {
      delete badgeElementsRef.current[id];
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Top Track Row (3 logos: 3, 2, 6) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1260px] flex items-center justify-around pointer-events-auto"
        style={{ top: laneYs.topY }}
      >
        {displayTop.map((logo) => (
          <SponsorBadge
            key={logo.id}
            logo={logo}
            badgeHeight={laneYs.laneHeight ? Math.round(laneYs.laneHeight * 0.84) : null}
            isActive={activeId === logo.id}
            onRegisterRef={handleRegisterRef}
          />
        ))}
      </div>

      {/* Bottom Track Row (4 logos: remaining) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-[1380px] flex items-center justify-around pointer-events-auto"
        style={{ top: laneYs.bottomY }}
      >
        {displayBottom.map((logo) => (
          <SponsorBadge
            key={logo.id}
            logo={logo}
            badgeHeight={laneYs.laneHeight ? Math.round(laneYs.laneHeight * 0.74) : null}
            isActive={activeId === logo.id}
            onRegisterRef={handleRegisterRef}
          />
        ))}
      </div>
    </div>
  );
}

/* ================= BALL RUN over a single maze image (serpentine lanes) ================= */
/* The least scrolling the whole run takes, in screen heights. */
const RUN_SCREENS = 1.2;
/* The run starts once the first lane has been scrolled up to RUN_FROM of the
   way down the screen, and is over — the ball gone off the left edge — by
   the time the second lane is up at RUN_TO, still well in view. */
const RUN_FROM = 0.75;
const RUN_TO = 0.3;
const SPACE_LANES = [358, 781];

/* `enabled`: held at the start, out of sight, until then — so it cannot run
   while the Sponsors maze ball is still falling above it. Once over, it
   marks its box with `data-run-end`, the scroll position by which its ball
   has gone, for the fall after it to wait for (BallFall's `after`). */
function MazeRun({
  boxRef,
  lanes, // the lanes' middles, in the image's own px down it
  corridor, // and how wide each is
  enabled = true,
  trailColor = "#C28B5B",
  debug = false,   // draws red bands where the code thinks the corridors are
}) {
  const [geo, setGeo] = useState(null);
  const pathRef = useRef(null);
  const trailRef = useRef(null);
  const ballRef = useRef(null);
  const enabledRef = useRef(enabled);
  const repaceRef = useRef(null);

  useEffect(() => {
    enabledRef.current = enabled;
    repaceRef.current?.();
  }, [enabled]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const measure = () => {
      const img = box.querySelector("img[data-run]");
      if (!img?.naturalHeight) return;
      const b = box.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      // Image px -> screen px, down the image: it is stretched sideways
      // further than it is drawn tall.
      const s = i.height / img.naturalHeight;

      const ys = lanes.map((y) => i.top - b.top + y * s);
      const thick = corridor * s;
      const r = (thick * 0.7) / 2; // ball fills 80% of the corridor
      // From just off one side of the screen to just off the other, where
      // the image runs on past them (it is drawn wider than the screen).
      const xL = Math.max(i.left - b.left, 0) - r * 2;
      const xR = Math.min(i.left - b.left + i.width, b.width) + r * 2;

      let d = `M ${xL} ${ys[0]}`;
      ys.forEach((y, n) => {
        const ltr = n % 2 === 0;
        const xEnd = ltr ? xR : xL;
        d += ` L ${xEnd} ${y}`;
        if (n < ys.length - 1) {
          const k = (ys[n + 1] - y) * 0.67 * (ltr ? 1 : -1);
          d += ` C ${xEnd + k} ${y} ${xEnd + k} ${ys[n + 1]} ${xEnd} ${ys[n + 1]}`;
        }
      });

      setGeo({ W: b.width, H: b.height, d, r, thick, ys, xL, xR });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    // It is only measurable once the image has loaded, which need not
    // resize the box (its size is known beforehand).
    const img = box.querySelector("img[data-run]");
    img?.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      img?.removeEventListener("load", measure);
    };
  }, [boxRef, lanes, corridor]);

  // 2) Move ball + trail along the path with scroll
  useEffect(() => {
    if (!geo) return;
    const box = boxRef.current;
    const path = pathRef.current;
    const trail = trailRef.current;
    const ball = ballRef.current;
    if (!box || !path || !trail || !ball) return;

    const total = path.getTotalLength();
    trail.style.strokeDasharray = `${total} ${total}`;

    // One pin owns all three lanes and the maze below them. Measure the
    // lanes' visible extent, so the maze's height does not force a mobile
    // lane group to move while its ball is still running.
    const pin = pinOf(box);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const on = () => enabledRef.current || reduced;
    let offset = 0; // the box's top below the scene's
    let top0 = 0;
    let hold = 0;
    let moving = 0;
    let runEnd = null;
    let viewport = null;
    const pace = () => {
      viewport = pinViewport(pin);
      const { height: vh, navBottom } = viewport;
      const boxTop = box.getBoundingClientRect().top;
      const scene = pin ? pin.sticky.getBoundingClientRect() : { top: boxTop, height: 0 };
      offset = boxTop - scene.top;
      // The scene's top with the page scrolled right to the top (the track
      // it is pinned in never sticks, so it gives that even mid-hold).
      const sceneTop = pageTop(pin ? pin.track : box);
      const topAtStart = sceneTop + offset;
      const holds = on() && !reduced && config.scroll.screensPerSecond > 0 && !!pin;
      const room = vh - navBottom;
      const floor = pin?.sticky.querySelector("[data-ball-floor]");
      const lanesHeight = floor ? floor.getBoundingClientRect().bottom - scene.top : scene.height;
      if (holds && lanesHeight <= room) {
        const heldTop = Math.min(navBottom + (room - lanesHeight) / 2, sceneTop);
        top0 = heldTop + offset;
        moving = 0;
        hold = RUN_SCREENS * vh;
      } else {
        top0 = Math.min(vh * RUN_FROM - geo.ys[0], topAtStart);
        const top1 = Math.max(vh * RUN_TO, navBottom + geo.r * 2) - geo.ys[1];
        moving = Math.max(0, top0 - top1);
        hold = holds ? Math.max(0, RUN_SCREENS * vh - moving) : 0;
      }
      if (pin) setPin(pin, top0 - offset, hold);

      // Where the page is scrolled to by the time the ball has gone: the
      // fall after it waits for that.
      const end = on() ? Math.round(topAtStart - top0 + hold + moving) : null;
      if (end !== runEnd) {
        runEnd = end;
        if (end === null) delete box.dataset.runEnd;
        else box.dataset.runEnd = String(end);
        window.dispatchEvent(new Event("ballrun:paced"));
      }
    };

    const progress = () => {
      if (!on()) return 0;
      // Where the box would be if the scene were never held.
      const top = pin
        ? pin.track.getBoundingClientRect().top + offset
        : box.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, (top0 - top) / Math.max(1, hold + moving)));
    };

    const draw = (p) => {
      const len = p * total;
      const pt = path.getPointAtLength(len);
      const roll = (pt.x / geo.r) * (180 / Math.PI);

      ball.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${roll})`);
      const trailLen = Math.max(0, len - geo.r * 1.2);
      trail.style.strokeDashoffset = String(total - trailLen);

      box.dispatchEvent(
        new CustomEvent("mazerun:ball", {
          detail: { x: pt.x, y: pt.y, active: p > 0.005 && p < 0.995 },
        })
      );
    };

    // Re-created whenever the layout is re-measured, so it starts from
    // where the ball belongs. Re-paced whenever the page around it changes
    // too: a blackout removing everything above it, or a resize.
    const glide = createGlide(progress, draw);
    const repace = () => {
      pace();
      glide.update();
    };
    const onResize = () => {
      if (pinViewport(pin) !== viewport) repace();
    };
    repaceRef.current = repace;
    repace();
    const pageObserver = new ResizeObserver(repace);
    pageObserver.observe(document.body);
    window.addEventListener("sponsorlanes:layout", repace);
    window.addEventListener("scroll", glide.update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", glide.update);
      window.removeEventListener("resize", onResize);
      pageObserver.disconnect();
      window.removeEventListener("sponsorlanes:layout", repace);
      glide.stop();
      box.dispatchEvent(
        new CustomEvent("mazerun:ball", {
          detail: { x: 0, y: 0, active: false },
        })
      );
      repaceRef.current = null;
    };
  }, [geo, boxRef]);

  if (!geo) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[15]"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geo.W} ${geo.H}`}
      aria-hidden="true"
    >
      {debug &&
        geo.ys.map((y, n) => (
          <rect key={n} x={0} y={y - geo.thick / 2} width={geo.W} height={geo.thick}
                fill="rgba(255,0,0,0.25)" />
        ))}

      <path ref={pathRef} d={geo.d} fill="none" stroke="none" />
      <path
        ref={trailRef}
        d={geo.d}
        fill="none"
        stroke={trailColor}
        strokeWidth={geo.r}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g ref={ballRef}>
        <image href="/ball.png" x={-geo.r} y={-geo.r} width={geo.r * 2} height={geo.r * 2} />
      </g>
    </svg>
  );
}

/* Keep the third lane one lane interval below the second. All artwork is
   in the same pin; this only sets its initial spacing, never a scroll offset. */
function SponsorLaneSpacing({ lanesRef, runRef, gapRef }) {
  useEffect(() => {
    const lanesImage = lanesRef.current?.querySelector("img[data-run]");
    const thirdBar = runRef.current?.querySelector("[data-bar='a']");
    const gapBox = gapRef.current;
    if (!lanesImage || !thirdBar || !gapBox) return;

    const previousPadding = gapBox.style.paddingTop;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const image = lanesImage.getBoundingClientRect();
      const bar = thirdBar.getBoundingClientRect();
      const scale = image.height / (lanesImage.naturalHeight || 1114);
      const firstLane = image.top + SPACE_LANES[0] * scale;
      const secondLane = image.top + SPACE_LANES[1] * scale;
      const currentGap = parseFloat(gapBox.style.paddingTop) || 0;
      const thirdWithoutGap = bar.top + bar.height / 2 - currentGap;
      const gap = Math.max(0, 2 * secondLane - firstLane - thirdWithoutGap);
      if (Math.abs(gap - currentGap) > 0.5) {
        gapBox.style.paddingTop = `${gap}px`;
        window.dispatchEvent(new Event("sponsorlanes:layout"));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(lanesImage);
    observer.observe(thirdBar);
    lanesImage.addEventListener("load", schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      lanesImage.removeEventListener("load", schedule);
      window.removeEventListener("resize", schedule);
      gapBox.style.paddingTop = previousPadding;
    };
  }, [lanesRef, runRef, gapRef]);

  return null;
}

const IDLE_MS = 1000;

function ScrollHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;

    const startTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(true), IDLE_MS);
    };

    const onActivity = () => {
      setVisible(false); // hide as soon as the user scrolls
      startTimer();      // and wait for 3s of stillness before showing again
    };

    startTimer(); // initial 3s wait after page load

    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("touchmove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("touchmove", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, []);

  // Kept at the bottom of the screen, not of the hero: on a phone the hero
  // is only as tall as the maze, and in scroll mode it holds still while the
  // ball falls, so there is nothing to scroll "to" — it scrolls a screen on.
  return (
    <button
      onClick={() =>
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })
      }
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#171C2E] border-[3px] border-[#505763]">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FDF7DE"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </span>
      <span className="font-['Archivo_Black'] text-lg font-bold uppercase tracking-wider text-[#1C1E2C]">
        SCROLL DOWN
      </span>
    </button>
  );
}

/* ================= BAR DROP =================
   Ball rolls in the corridor between two bars (data-bar="a" above, "b" below),
   leaves the right edge, and falls as a horizontal projectile onto the image
   marked data-drop-target. Scroll-driven. */
function BarDrop({
  boxRef,
  afterRef = null,   // the box of the animation to wait for (MazeRun's box)
  afterAt = 0.4,     // where that box's bottom must be on screen: 0.4 = 40% down, matching MazeRun's finish
  target = { x: 0.9, y: 0.1 },
  startAt = 0.8,
  endAt = 0.6,
  trailColor = "#C28B5B",
  airTrail = false,
  debug = false,
}) {
  const [geo, setGeo] = useState(null);
  const trailRef = useRef(null);
  const ballRef = useRef(null);

  // 1) Measure the layout
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const measure = () => {
      const a = box.querySelector("[data-bar='a']");
      const b = box.querySelector("[data-bar='b']");
      const t = box.querySelector("[data-drop-target]");
      if (!a || !b || !t) return;

      const bx = box.getBoundingClientRect();
      const A = a.getBoundingClientRect();
      const B = b.getBoundingClientRect();
      const T = t.getBoundingClientRect();

      const thick = B.top - A.bottom;
      if (thick <= 0) return;
      const r = (thick * 0.8) / 2;
      const yc = (A.bottom + B.top) / 2 - bx.top;
      const xStart = A.left - bx.left - r * 2;
      const x0 = A.right - bx.left;

      const tx = T.left - bx.left + T.width * target.x;
      const ty = T.top - bx.top + T.height * target.y;
      const dx = Math.max(tx - x0, 1);
      const dy = ty - yc;
      const D = ty - (A.top - bx.top);

      if (![thick, r, yc, xStart, x0, tx, ty, dx, dy, D].every(Number.isFinite) || r <= 0 || dy <= 0) return;
      setGeo({ W: bx.width, H: bx.height, r, thick, yc, xStart, x0, tx, ty, dx, dy, D,
               rollLen: x0 - xStart });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, [boxRef, target.x, target.y]);

  // 2) Move the ball with scroll
  useEffect(() => {
    if (!geo) return;
    const box = boxRef.current;
    const a = box?.querySelector("[data-bar='a']");
    const trail = trailRef.current;
    const ball = ballRef.current;
    if (!a || !trail || !ball) return;

    let raf = 0;
    const update = () => {
        raf = 0;
        const { r, yc, xStart, x0, dy, rollLen, D } = geo;
        const vh = window.innerHeight;

        // 0 until MazeRun has finished, then grows as you keep scrolling
        const gate = afterRef?.current
          ? vh * afterAt - afterRef.current.getBoundingClientRect().bottom
          : vh * startAt - a.getBoundingClientRect().top;

        const range = ((startAt - endAt) * vh + D)*0.5;
        const p = Math.min(1, Math.max(0, gate / range));

        const dist = p * (rollLen + dy);
        let x, y, d;

        if (dist <= rollLen) {
          x = xStart + dist;
          y = yc;
          d = dist < 1 ? "" : `M ${xStart} ${yc} L ${x} ${y}`;
        } else {
          const t = (dist - rollLen) / dy;
          x = x0;
          y = yc + dy * t * t;
          d = airTrail
            ? `M ${xStart} ${yc} L ${x0} ${yc} L ${x0} ${y}`
            : `M ${xStart} ${yc} L ${x0} ${yc}`;
        }

        if (!Number.isFinite(x) || !Number.isFinite(y) || !(r > 0)) return;
        trail.setAttribute("d", d);
        ball.setAttribute("transform", `translate(${x} ${y}) rotate(${(x / r) * (180 / Math.PI)})`);
      };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [geo, boxRef, afterRef, afterAt, startAt, endAt, airTrail]);

  if (!geo) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geo.W} ${geo.H}`}
      aria-hidden="true"
    >
      {debug && (
        <>
          <rect x={0} y={geo.yc - geo.thick / 2} width={geo.W} height={geo.thick}
                fill="rgba(255,0,0,0.25)" />
          <circle cx={geo.tx} cy={geo.ty} r={8} fill="red" />
        </>
      )}
      <path
        ref={trailRef}
        fill="none"
        stroke={trailColor}
        strokeWidth={geo.r}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g ref={ballRef}>
        <image href="/ball.png" x={-geo.r} y={-geo.r} width={geo.r * 2} height={geo.r * 2} />
      </g>
    </svg>
  );
}

export default function HomePage() {
  // The middles of the two gaps between the bars in sponsorsection.png the
  // ball runs along (rows 301–416 and 730–835), in its own px.
  const spaceRef = useRef(null);
  const gapRef = useRef(null);
  const ballTargetRef = useRef(null);
  const dropRef = useRef(null);
  // A navbar link that brought us here, if one did (src/lib/homeJump.js).
  const [initialJump] = useState(peekPendingJump);
  // Where the page begins. Each blackout drops everything above the section
  // it reveals: "hero" is everything, then "intro" once the first ball has
  // landed in About Us, then "sponsors" once the second has landed on the
  // maze end above the Sponsors section. A navbar link can start it at any
  // of them.
  const [startAt, setStartAt] = useState(() => JUMP_START[initialJump] ?? "hero");
  const enterIntro = useCallback(
    () => setStartAt((current) => (current === "hero" ? "intro" : current)),
    []
  );
  const enterSponsors = useCallback(() => setStartAt("sponsors"), []);
  const [wipeDone, setWipeDone] = useState(startAt !== "hero");
  const finishWipe = useCallback(() => setWipeDone(true), []);

  // A navbar link followed while already here starts the page afresh where
  // it asks (`round` remounts everything, so its blackouts can play again),
  // and `jump` then lands on it once that has rendered.
  const [round, setRound] = useState(0);
  const [jump, setJump] = useState(() => initialJump && { target: initialJump });
  useEffect(
    () =>
      onJump((target) => {
        setStartAt(JUMP_START[target]);
        setWipeDone(target !== "home");
        setRound((current) => current + 1);
        setJump({ target });
      }),
    []
  );
  useEffect(() => {
    if (!jump) return;
    takePendingJump();
    return landOn(jump.target);
  }, [jump]);

  return (
    <div key={round} className="relative w-full bg-[#EDD4A3] flex flex-col overflow-x-clip">
      <Navbar />

      {startAt === "hero" && (
        <>
      {/* Hero Section */}
      <MazeBall
        hero={
        <section className="relative h-full w-full">
          <ScrollHint />
        </section>
        }
      >
        {/* About Us Section — inside MazeBall so the ball can roll from the
            hero down into it; `data-ball-target` marks where it comes to rest. */}
        <section id="about-us" className="relative w-full flex items-center justify-center pt-10 pb-8 md:py-24">
          {/* The words turn about (50.15%, 71.28%) of aboutustxt.png
              (336 x 207), which these put on the ring's centre. */}
          <div className="relative">
            <Image
              src="/mazeend.png"
              alt="About Us"
              width={480}
              height={480}
              data-ball-target=""
              ref={ballTargetRef}
              className="w-[min(64vw,30rem)] h-[min(64vw,30rem)] object-contain"
            />
            <Image
              src="/aboutustxt.png"
              alt="Sponsors Text"
              width={300}
              height={300}
              className="absolute w-[61%] left-[19.4%] top-[23.2%] h-auto max-w-none animate-spin motion-reduce:animate-none"
              style={{
                transformOrigin: "50.15% 71.28%",
                animationDuration: "10s",
              }}
            />
          </div>
        </section>
      </MazeBall>
        </>
      )}

      {/* Outside the blocks they remove on purpose: each unmounts that
          content mid-transition, so it must not be a child of it or it would
          tear itself down before the circle could shrink back. */}
      <CircleWipe
        trigger="hero"
        originRef={ballTargetRef}
        onCovered={enterIntro}
        onDone={finishWipe}
      />
      <CircleWipe trigger="sponsors" onCovered={enterSponsors} />

      {startAt !== "sponsors" && (
        <>
      {/* Intro Section */}
      <section
        id="carpediem-intro"
        className="relative w-full min-h-0 md:min-h-[150vh] bg-[#EDD4A3] flex flex-col items-center justify-center px-6 pt-24 pb-0 md:py-24 text-center overflow-hidden"
      >
        <Image
          src="/carpediem-grass.png"
          alt=""
          width={1920}
          height={400}
          priority
          className="absolute top-0 left-0 w-full h-auto object-contain object-top pointer-events-none select-none z-0 scale-100 origin-top"
        />

        <p
          className="relative z-10 mb-2 md:mb-4 text-[15px] md:text-[clamp(1.1rem,2.5vw,37px)]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#283618",
          }}
        >
          a cultural experience
        </p>

        <h2
          className="relative z-10 uppercase text-[11.5vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          CARPEDIEM
        </h2>

        <h2
          className="relative z-10 normal-case md:uppercase text-[11.5vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          26th
        </h2>

        <h2
          className="relative z-10 uppercase mb-2 text-[11.5vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          EDITION
        </h2>

        <div className="relative z-10 w-full flex items-center justify-center mt-5 md:mt-8 py-[5vw] md:py-[min(5vw,80px)]">
          <div
            className="absolute left-1/2 -translate-x-1/2 w-screen flex flex-col gap-[7.5vw] md:gap-[clamp(24px,3vw,90px)]"
          >
            <Image
              src="/carpediem-maze-top.png"
              alt=""
              width={1920}
              height={300}
              className="w-full h-auto object-cover scale-y-[0.6] pointer-events-none select-none"
            />
            <Image
              src="/carpediem-maze-bottom.png"
              alt=""
              width={1920}
              height={300}
              className="w-full h-auto object-cover scale-y-[0.6] pointer-events-none select-none"
            />
          </div>

          <BallTrack enabled={wipeDone} className="top-1/2 -translate-y-1/2 z-0" />

          <PerformerFan />
        </div>

        <p
          className="relative z-10 max-w-[360px] md:max-w-[1000px] mt-5 md:mt-8 text-[15px] leading-[1.4] md:text-[clamp(1rem,2vw,36px)] md:leading-[1.4]"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            color: "#000000",
          }}
        >
          Carpediem is SASTRA University’s flagship cultural fest, a celebration where creativity knows no boundaries and every corner of campus comes alive with colour, rhythm, stories, and imagination. It brings together a kaleidoscope of talents and experiences, leaving behind moments that linger long after the fest is over.

          <span className="md:hidden">
            {" "}This year, Carpediem unfolds as Aranya - Enter the Unexplored, woven around curiosity, imagination, and the magic of the unknown. Like wandering into a forest where every turn reveals a little wonder, with unexpected encounters, wild ideas, and stories waiting to be discovered. Every performance, creation, and experience adding a new thread to the tale, Carpediem becomes a little world of its own where imagination runs wild and every corner holds a new adventure.
3
          </span>
        </p>
      </section>

      {/* The Flagship section and the Sponsors maze under its wave are held
          on screen together while the maze ball falls, so the wave stays
          over the top of the maze rather than scrolling off and leaving a
          gap: the slope ball drops behind it, the maze ball comes out from
          under it. */}
      <BallPin>
      {/* Flagship Event Section */}
      <section
        id="flagship-event"
        className="relative z-20 w-full pt-5 md:pt-8 px-6 text-center"
      >
        <div
          className="absolute right-[-10%] top-[10%] w-[4%] pointer-events-none select-none z-0"
          aria-hidden="true"
        >
          <Image
            src="/capediem-maze-slanted.png"
            alt=""
            width={355}
            height={232}
            data-ball-ceiling=""
            className="block w-[80%] h-auto object-contain"
          />
          {/* The ball rolls down this one, under the one above, before it
              falls off its low end behind the green wave (SlopeBall). */}
          <Image
            src="/capediem-maze-slanted-bottom.png"
            alt=""
            width={293}
            height={211}
            data-ball-slope=""
            className="block w-[70%] h-auto object-contain ml-auto mr-[18%] mt-[-10%]"
          />
        </div>

        <h2 className="relative z-10 mx-auto mt-0 md:mt-8 mb-4 md:mb-8 flex flex-col w-full max-w-[1020px] text-center uppercase font-['Unbounded',sans-serif] font-black leading-[1.44] md:leading-[1.3]">
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[10.5vw] md:text-[clamp(3rem,8.5vw,115px)]">
            OUR
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[10.5vw] md:text-[clamp(3rem,8.5vw,115px)]">
            FLAGSHIP
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[10.5vw] md:text-[clamp(3rem,8.5vw,115px)]">
            EVENT
          </span>
        </h2>

        <p
          className="relative z-10 mx-auto max-w-[360px] md:max-w-[1150px] mt-3 md:mt-35 px-0 md:px-4 text-[15px] leading-[1.4] md:text-[clamp(1rem,2.5vw,60px)] md:leading-[1.2]"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            color: "#000000",
          }}
        >
          The highlight, as always, is the Flagship event Mr./Ms. Freshers –
          the crown of this two-day extravaganza! Mark your calendars for the
          4th &amp; 5th of October – SASTRA awaits you for an endless flow of
          fun and celebration!
        </p>

        {/* Over the text, under the grass and the wave. */}
        <SlopeBall />

        {/* Grass + Green Platform */}
        <FlagshipPlatform />
      </section>

      {/* Fit the maze and its landing ring below the mobile navbar so the
          entire fall can play with the artwork held in place. */}
      <div className="relative z-10 w-full overflow-x-clip -mt-[12.5%]">
        <div className={styles.sponsorsMazeArt}>
            <Image
              src="/sponsormaze1.png"
              alt=""
              width={2072}
              height={1608}
              data-ball-maze=""
              className="block w-full h-auto scale-[1.18] origin-top pointer-events-none select-none"
            />

            <div className="relative w-full aspect-[1000/738] overflow-hidden -mt-[22%] -mb-[13%]">
              {/* The ring and its words, 1.2x the size they were, grown from
                  the top of the ring — where the ball comes in — so it still
                  meets the maze's exit. */}
              <div
                className="absolute inset-0 scale-[1.2]"
                style={{ transformOrigin: "50% 48.4%" }}
              >
                <Image
                  src="/mazeend.png"
                  alt=""
                  width={500}
                  height={500}
                  data-ball-target=""
                  className="absolute left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2 w-[24.9%] h-auto max-w-none pointer-events-none select-none"
                />
                <Image
                  src="/sponsortxt.png"
                  alt="Sponsors"
                  width={300}
                  height={300}
                  className="absolute w-[14.5%] h-auto max-w-none animate-spin motion-reduce:animate-none"
                  style={{
                    left: "43%",
                    top: "54.5%",
                    transformOrigin: "50.15% 71.28%",
                    animationDuration: "10s",
                  }}
                />
              </div>
            </div>
        </div>

            {/* The same maze again, with the same ball fall through it onto
                the maze end above, where the second blackout takes over. */}
            <BallFall variant="sponsors" />
      </div>
      </BallPin>
        </>
      )}

      {/* Sponsors Section. After the second blackout it is all that is left
          above the footer: with nothing above it, its heading starts clear
          of the navbar. Clipped sideways only, so it can still stick on
          screen while its balls run. */}
      <div
        className={`relative z-10 w-full overflow-x-clip ${
          startAt === "sponsors" ? "pt-[calc(9svh_+_64px)]" : "pt-[15%]"
        }`}
      >
        {/* All three lanes and the exit maze share one pin. No lane can
            stick, release, or move independently of the others. */}
        <BallPin className="z-20" data-sponsor-lanes="">
        <h2
          id="sponsors"
          className="relative z-20 w-full scroll-mt-24 text-center uppercase leading-none font-normal font-['BBH_Hegarty'] text-[#1C1F2A] text-[10vw] md:text-[clamp(6rem,2.9vw,56px)]"
        >
          Sponsors
        </h2>

        {/* sponsorsection.png is blank above its first bar, down to 18% of
            its height: the negative margin tucks most of that under the
            heading. */}
        <div ref={spaceRef} className="relative z-10 w-full max-sm:pb-[27.4%]">
          <Image
            data-run=""
            src="/sponsorsection.png"
            alt=""
            width={1712}
            height={1114}
            unoptimized
            className="block w-full h-auto -mt-[9%] max-sm:-mt-[15%] origin-top scale-x-[1.25] max-sm:scale-x-[1.9] max-sm:scale-y-[1.5] pointer-events-none select-none"
          />

          {/* Sponsor Logos: 3 on top track (3, 2, 6) & 4 on bottom track */}
          <SponsorLogos boxRef={spaceRef} lanes={SPACE_LANES} />

          {/* The second of the three balls here, in turn: it waits for the
              Sponsors maze ball's blackout, and the fall below waits for it. */}
          <MazeRun
            boxRef={spaceRef}
            lanes={SPACE_LANES}
            corridor={110}
            enabled={startAt === "sponsors"}
            debug={false}
          />
        </div>
        <SponsorLaneSpacing lanesRef={spaceRef} runRef={dropRef} gapRef={gapRef} />

        {/* The last run starts one lane interval below the second sponsor
            lane and flows with the three visible bars. */}
        <div ref={gapRef} className="flow-root">
        <div className="relative flow-root z-10 max-sm:pb-[28%]">
        <div ref={dropRef} className="relative z-10 w-full origin-top max-sm:scale-[1.3]">
          <Image
            data-bar="a"
            src="/carpediem-maze-bottom.png"
            alt=""
            width={1000}
            height={200}
            className="relative z-10 block w-[54%] aspect-[500/50] -mt-[14%] object-cover object-left pointer-events-none select-none"
          />

        {/* The ball's last run rolls along the top of this bar, between it
            and the one above, before it shoots off its end into the maze. */}
        <Image
          src="/carpediem-maze-top.png"
          alt=""
          width={1000}
          height={200}
          data-ball-floor=""
          className="relative z-10 block w-[54%] aspect-[500/50] object-cover object-left mt-[5%] pointer-events-none select-none"
        />

        {/* The ball's last run: along the bars above, down through this
            maze and into the logo below it. */}
        <div className="relative -mt-[16.4%]">
          <div className="relative w-full aspect-[1440/1000] overflow-hidden">
            <Image
              src="/endmaze1.png"
              alt=""
              width={1440}
              height={1455}
              data-ball-maze=""
              className="absolute bottom-0 left-0 w-full h-auto max-w-none pointer-events-none select-none"
            />
            <Image
              src="/endmaze2.png"
              alt=""
              width={600}
              height={600}
              className="absolute left-0 top-[25.0%] w-[32.92%] h-auto max-w-none pointer-events-none select-none"
            />
          </div>

          {/* carpediem.svg is square with the logo across its middle third,
              so this box reaches up behind the bottom of the maze and down
              past the end of the section with nothing drawn there: the
              margins put the logo itself just under the maze. */}
          <div
            data-ball-target=""
            role="img"
            aria-label="Carpe Diem"
            className="home-logo relative mx-auto w-[54%] aspect-square -mt-[16%] -mb-[12%] pointer-events-none"
          />

          <BallFall variant="end" />
        </div>

        <BarDrop boxRef={dropRef} afterRef={spaceRef} target={{ x: 0.9, y: 0.1 }} />
      </div>
        </div>
        </div>
        </BallPin>
      </div>
    </div>
  );
}
