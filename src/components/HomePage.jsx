"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Navbar from "./navbar";
import MazeBall from "./MazeBall";
import BallFall from "./BallFall";
import CircleWipe from "./CircleWipe";

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

/* ================= PERFORMER FAN =================
   Desktop (mouse): 3 cards fan out on hover.
   Mobile (touch):  the stack fans out into 3 cards automatically,
                    3 seconds after it scrolls into view. */
const FAN_IMAGES = {
  left: "/performer-1.png",   // swap in different photos if you have them
  center: "/performer-1.png",
  right: "/performer-1.png",
};

const MOBILE_DELAY_MS = 1000;

function PerformerFan({ images = FAN_IMAGES }) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const ref = useRef(null);

  // Phone-sized screens OR devices with no real hover (so it also works in a
  // resized desktop browser window, not only in touch emulation)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Touch only: open 3s after the fan is on screen, close again when it leaves
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

  const spread = isTouch ? 40 : 68;
  const rot = isTouch ? 12 : 20; // tighter fan on phones so it stays on screen // % sideways offset of the side cards
  const ease = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
  const cardClass =
    "absolute inset-0 h-full w-full object-cover pointer-events-none select-none motion-reduce:!transition-none";

  return (
    <div
      ref={ref}
      className="relative z-10 cursor-pointer"
      // slightly narrower on phones so the fanned-out cards stay on screen
      style={{
        width: isTouch ? "min(62vw, 300px)" : "min(30vw, 512px)",
        aspectRatio: "512 / 718",
        // phones: big when closed, shrinks a little when fanned so all 3 fit
        transform: isTouch && open ? "scale(0.74)" : "none",
        transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onMouseEnter={() => !isTouch && setOpen(true)}
      onMouseLeave={() => !isTouch && setOpen(false)}
    >
      {/* Left card */}
      <Image
        src={images.left}
        alt=""
        width={1500}
        height={1500}
        className={`${cardClass} z-0`}
        style={{
          transition: ease,
          transform: open
            ? `translateX(-${spread}%) translateY(3%) rotate(-${rot}deg)`
            : "translateX(0) translateY(0) rotate(0deg)",
        }}
      />

      {/* Right card */}
      <Image
        src={images.right}
        alt=""
        width={1500}
        height={1500}
        className={`${cardClass} z-0`}
        style={{
          transition: ease,
          transform: open
            ? `translateX(${spread}%) translateY(3%) rotate(${rot}deg)`
            : "translateX(0) translateY(0) rotate(0deg)",
        }}
      />

      {/* Center card (always on top) */}
      <Image
        src={images.center}
        alt="Performer"
        width={1500}
        height={1500}
        className={`${cardClass} z-10`}
      />
    </div>
  );
}

function BallTrack({ className = "", trailColor = "#C28B5B" }) {
  const trackRef = useRef(null);
  const ballRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const ball = ballRef.current;
    const trail = trailRef.current;
    if (!track || !ball || !trail) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rect = track.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      // 0 when the track enters at the bottom of the screen,
      // 1 when it has climbed to 30% from the top
      const p = Math.min(1, Math.max(0, (vh - centerY) / (vh * 0.7)));

      const size = ball.offsetWidth;
      const x = p * (track.clientWidth - size);
      const rollDeg = (x / (size / 2)) * (180 / Math.PI); // rolls without slipping

      ball.style.transform = `translateX(${x}px) rotate(${rollDeg}deg)`;
      trail.style.width = `${x + size / 2}px`;
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

/* ================= BALL RUN over a single maze image (serpentine lanes) ================= */
function MazeRun({
  boxRef,
  srcWidth,
  lanes,
  corridor,
  trailColor = "#C28B5B",
  debug = false,   // draws red bands where the code thinks the corridors are
}) {
  const [geo, setGeo] = useState(null);
  const pathRef = useRef(null);
  const trailRef = useRef(null);
  const ballRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const measure = () => {
      const img = box.querySelector("img[data-run]");
      if (!img) return;
      const b = box.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      const s = i.width / srcWidth; // PNG pixels -> screen pixels

      const ys = lanes.map((y) => i.top - b.top + y * s);
      const thick = corridor * s;
      const r = (thick * 0.8) / 2; // ball fills 80% of the corridor
      const xL = i.left - b.left - r * 2;
      const xR = i.left - b.left + i.width + r * 2;

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
    return () => ro.disconnect();
  }, [boxRef, srcWidth, lanes, corridor]);

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

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rect = box.getBoundingClientRect();
      // starts when the maze top reaches 70% of the screen,
      // finishes when its bottom reaches 40%
      const p = Math.min(1, Math.max(0, (vh * 0.7 - rect.top) / (vh * 0.3 + rect.height)));
      const len = p * total;
      const pt = path.getPointAtLength(len);
      const roll = (pt.x / geo.r) * (180 / Math.PI);

      ball.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${roll})`);
      const trailLen = Math.max(0, len - geo.r * 1.2);
      trail.style.strokeDashoffset = String(total - trailLen);
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
  }, [geo, boxRef]);

  if (!geo) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1]"
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

export default function HomePage() {
  const SPACE_LANES = [270, 600];
  const spaceRef = useRef(null);
  const ballTargetRef = useRef(null);
  // Where the page begins. Each blackout drops everything above the section
  // it reveals, so the page really does begin there afterwards rather than
  // just being scrolled past what came before: "hero" is everything, then
  // "intro" once the first ball has landed in About Us, then "sponsors" once
  // the second has landed on the maze end above the Sponsors section.
  const [startAt, setStartAt] = useState("hero");
  const enterIntro = useCallback(
    () => setStartAt((current) => (current === "hero" ? "intro" : current)),
    []
  );
  const enterSponsors = useCallback(() => setStartAt("sponsors"), []);

  return (
    <div className="relative w-full bg-[#EDD4A3] flex flex-col overflow-x-clip">
      <Navbar />

      {startAt === "hero" && (
        <>
      {/* Hero Section */}
      <MazeBall
        heroClassName="h-[150vh]"
        hero={
        <section className="relative h-screen w-full flex flex-col items-center justify-start pt-32">
          <button
            onClick={() =>
              document
                .getElementById("about-us")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute bottom-16 flex cursor-pointer flex-col items-center gap-3"
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
          </section>
        }
      >
        {/* About Us Section — inside MazeBall so the ball can roll from the
            hero down into it; `data-ball-target` marks where it comes to rest. */}
        <section id="about-us" className="relative w-full flex items-center justify-center pt-24 pb-8 md:py-24">
          <div className="relative md:contents">
            <Image
              src="/mazeend.png"
              alt="About Us"
              width={400}
              height={400}
              data-ball-target=""
              ref={ballTargetRef}
              className="w-[min(51vw,25rem)] h-[min(51vw,25rem)] object-contain"
            />
            <Image
              src="/aboutustxt.png"
              alt="Sponsors Text"
              width={300}
              height={300}
              className="absolute w-[59.4%] left-[20.2%] top-[7.7%] md:w-[16.5%] md:left-[42%] md:top-[30%] h-auto max-w-none animate-spin motion-reduce:animate-none"
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
      />
      <CircleWipe trigger="sponsors" onCovered={enterSponsors} />

      {startAt !== "sponsors" && (
        <>
      {/* Intro Section */}
      <section
        id="carpediem-intro"
        className="relative w-full min-h-0 md:min-h-[150vh] bg-[#EDD4A3] flex flex-col items-center justify-center px-6 pt-11 pb-0 md:py-24 text-center overflow-hidden"
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
          className="relative z-10 mb-4 text-[12.5px] md:text-[clamp(1.1rem,2.5vw,37px)]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#283618",
          }}
        >
          a cultural experience
        </p>

        <h2
          className="relative z-10 uppercase text-[10vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          CARPEDIEM
        </h2>

        <h2
          className="relative z-10 normal-case md:uppercase text-[10vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          26th
        </h2>

        <h2
          className="relative z-10 uppercase mb-2 text-[10vw] leading-[1.02] md:text-[clamp(2.75rem,10vw,150px)] md:leading-[1.0667]"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            color: "#C28B5B",
          }}
        >
          EDITION
        </h2>

        <div className="relative z-10 w-full flex items-center justify-center mt-11 md:-mt-16">
          <div
            className="absolute left-1/2 -translate-x-1/2 w-screen flex flex-col gap-[24vw] md:gap-[clamp(24px,6vw,90px)]"
          >
            <Image
              src="/carpediem-maze-top.png"
              alt=""
              width={1920}
              height={300}
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
            <Image
              src="/carpediem-maze-bottom.png"
              alt=""
              width={1920}
              height={300}
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
          </div>

          <BallTrack className="top-1/2 -translate-y-1/2 z-0" />

          <PerformerFan />
        </div>

        <p
          className="relative z-10 max-w-[330px] md:max-w-[1000px] mt-10 md:-mt-16 text-[11px] leading-[1.25] md:text-[clamp(1rem,2vw,36px)] md:leading-[1.4]"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            color: "#000000",
          }}
        >
          The 25th Edition of Carpe Diem is here, flowing back with boundless
          energy and spirit! This year, with the theme Pravaah – The Flow of
          Expressions, we celebrate the rhythm of creativity, the pulse of
          talent, and the stream of unforgettable moments.
          <span className="md:hidden">
            {" "}From fiery beats to graceful moves, Carpe Diem promises to be a
            vibrant celebration of expression.
          </span>
        </p>
      </section>

      {/* Flagship Event Section */}
      <section
        id="flagship-event"
        className="relative z-20 w-full pt-5 md:pt-8 px-6 text-center"
      >
        <div
          className="absolute right-[-10%] top-[10%] w-[34%] pointer-events-none select-none z-0"
          aria-hidden="true"
        >
          <Image
            src="/capediem-maze-slanted.png"
            alt=""
            width={600}
            height={400}
            className="block w-[80%] h-auto object-contain"
          />
          <Image
            src="/capediem-maze-slanted-bottom.png"
            alt=""
            width={600}
            height={400}
            className="block w-[70%] h-auto object-contain ml-auto mr-[18%] mt-[-10%]"
          />
        </div>

        <h2 className="relative z-10 mx-auto mt-0 md:mt-8 mb-8 flex flex-col w-full max-w-[1020px] text-center uppercase font-['Unbounded',sans-serif] font-black leading-[1.44] md:leading-[1.3]">
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[9vw] md:text-[clamp(3rem,8.5vw,115px)]">
            OUR
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[9vw] md:text-[clamp(3rem,8.5vw,115px)]">
            FLAGSHIP
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[9vw] md:text-[clamp(3rem,8.5vw,115px)]">
            EVENT
          </span>
        </h2>

        <p
          className="relative z-10 mx-auto max-w-[312px] md:max-w-[1150px] mt-7 md:mt-35 px-0 md:px-4 text-[10px] leading-[1.3] md:text-[clamp(1rem,2.5vw,60px)] md:leading-[1.2]"
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

        {/* Grass + Green Platform */}
        <div className="relative w-screen left-1/2 -translate-x-1/2 mt-[4vw]">
          <Image
            src="/carpediem-grass-row.png"
            alt=""
            width={1920}
            height={200}
            className="relative z-0 block w-full h-auto object-contain pointer-events-none select-none"
          />

          <div className="relative z-20 w-full -mt-[10.2083%]">
            <Image
              src="/flagship-wave.png"
              alt=""
              width={1920}
              height={600}
              className="w-full h-auto top-[20%] object-cover pointer-events-none select-none"
            />
            <FlagshipStats />
          </div>
        </div>
      </section>
        </>
      )}

      {/* Sponsors & Maze Section */}
      <div className="relative z-10 w-full overflow-hidden -mt-[12.5%]">
        <Image
          src="/sponsormaze1.png"
          alt=""
          width={1920}
          height={1080}
          className="block w-full h-auto scale-[1.18] origin-top pointer-events-none select-none"
        />

        <div className="relative w-full aspect-[1000/738] overflow-hidden -mt-[22%] -mb-[13%]">
          <Image
            src="/mazeend.png"
            alt=""
            width={500}
            height={500}
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

        <h2 className="relative z-20 w-full mt-[15%] text-center uppercase leading-none font-normal font-['BBH_Hegarty'] text-[#1C1F2A] text-[10vw] md:text-[clamp(6rem,2.9vw,56px)]">
          Sponsors
        </h2>

        <div ref={spaceRef} className="relative z-10 w-full">
          <Image
            data-run=""
            src="/sponsorsection.png"
            alt=""
            width={1920}
            height={1080}
            unoptimized
            className="block w-full h-auto scale-x-[1.25] scale-y-[0.85] pointer-events-none select-none"
          />

          <MazeRun
            boxRef={spaceRef}
            srcWidth={1920}
            lanes={SPACE_LANES}
            corridor={90}
            debug={false}
          />
        </div>

        <Image
          src="/carpediem-maze-bottom.png"
          alt=""
          width={1000}
          height={200}
          className="relative z-10 block w-[46%] aspect-[500/50] object-cover object-left pointer-events-none select-none"
        />

        <Image
          src="/carpediem-maze-top.png"
          alt=""
          width={1000}
          height={200}
          className="relative z-10 block w-[46%] aspect-[500/50] object-cover object-left mt-[5%] pointer-events-none select-none"
        />

        <div className="relative w-full -mt-[16.4%] aspect-[1440/1000] overflow-hidden">
          <Image
            src="/endmaze1.png"
            alt=""
            width={1920}
            height={1080}
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

      </div>
    </div>
  );
}
