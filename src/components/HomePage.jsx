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
            className="text-[#283618] flex items-center justify-center"
            style={{
              fontFamily: "'BBH Hegarty', sans-serif",
              fontSize: "clamp(3.5rem, 10.5vw, 150px)",
              lineHeight: 0.9,
              fontWeight: 700,
            }}
          >
            <StatNumber value={s.value} spinning={spinning} />
          </span>
          <span
            className="text-[#FDF7DE] mt-1"
            style={{
              fontFamily: "'BBH Hegarty', sans-serif",
              fontSize: "clamp(1.6rem, 5vw, 70px)",
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

export default function HomePage() {
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
    <div className="relative w-full overflow-x-clip bg-[#EDD4A3] flex flex-col">
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
        <section id="about-us" className="relative w-full flex items-center justify-center py-24">
          <Image
            src="/mazeend.png"
            alt="About Us"
            width={400}
            height={400}
            data-ball-target=""
            ref={ballTargetRef}
            className="w-[25rem] h-[25rem] object-contain"
          />
          <Image
            src="/aboutustxt.png"
            alt="Sponsors Text"
            width={300}
            height={300}
            className="absolute w-[16.5%] h-auto max-w-none animate-spin motion-reduce:animate-none"
            style={{
              left: "42%",
              top: "30%",
              transformOrigin: "50.15% 71.28%",
              animationDuration: "10s",
            }}
          />
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
        className="relative w-full min-h-[150vh] bg-[#EDD4A3] flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden"
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
          className="relative z-10 mb-4"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1.1rem, 2.5vw, 37px)",
            color: "#283618",
          }}
        >
          a cultural experience
        </p>

        <h2
          className="relative z-10 uppercase"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            color: "#C28B5B",
          }}
        >
          CARPEDIEM
        </h2>

        <h2
          className="relative z-10 uppercase"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            color: "#C28B5B",
          }}
        >
          26th
        </h2>

        <h2
          className="relative z-10 uppercase mb-2"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            color: "#C28B5B",
          }}
        >
          EDITION
        </h2>

        <div className="relative z-10 w-full flex items-center justify-center -mt-16">
          <div
            className="absolute left-1/2 -translate-x-1/2 w-screen flex flex-col"
            style={{ gap: "clamp(24px, 6vw, 90px)" }}
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

          <Image
            src="/performer-1.png"
            alt="Performer"
            width={1200}
            height={1200}
            className="relative z-10 w-100 sm:w-96 md:w-[480px] lg:w-[2200px] object-contain"
          />
        </div>

        <p
          className="relative z-10 max-w-[1000px] -mt-16"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2vw, 36px)",
            lineHeight: 1.4,
            color: "#000000",
          }}
        >
          The 25th Edition of Carpe Diem is here, flowing back with boundless
          energy and spirit! This year, with the theme Pravaah – The Flow of
          Expressions, we celebrate the rhythm of creativity, the pulse of
          talent, and the stream of unforgettable moments.
        </p>
      </section>

      {/* Flagship Event Section */}
      <section
        id="flagship-event"
        className="relative z-20 w-full bg-[#EDD4A3] pt-8 px-6 text-center"
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

        <h2 className="relative z-10 mx-auto mt-8 mb-8 flex flex-col w-full max-w-[1020px] text-center uppercase font-['Unbounded',sans-serif] font-black leading-[1.3]">
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[clamp(3rem,8.5vw,115px)]">
            OUR
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[clamp(3rem,8.5vw,115px)]">
            FLAGSHIP
          </span>
          <span className="block text-[#1C1E2C] hover:text-[#FACC15] transition-colors duration-200 cursor-default text-[clamp(3rem,8.5vw,115px)]">
            EVENT
          </span>
        </h2>

        <p
          className="relative z-10 mx-auto max-w-[1150px] mt-35 px-4"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2.5vw, 60px)",
            lineHeight: 1.2,
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
              className="block w-full h-auto object-cover pointer-events-none select-none"
            />
            <FlagshipStats />
          </div>
        </div>
      </section>
        </>
      )}

      {/* Sponsors & Maze Section. After the second blackout only the Sponsors
          part is left: with no maze above it and nothing to overlap, it drops
          the pull-up and starts clear of the navbar instead. */}
      <div
        className={`relative z-10 w-full overflow-hidden ${
          startAt === "sponsors" ? "" : "-mt-[30%]"
        }`}
        style={
          startAt === "sponsors"
            ? { paddingTop: "calc(9vh + 64px - 3%)" }
            : undefined
        }
      >
        {startAt !== "sponsors" && (
          <>
            <Image
              src="/sponsormaze1.png"
              alt=""
              width={1920}
              height={1080}
              data-ball-maze=""
              className="block w-full h-auto scale-[1.18] origin-top pointer-events-none select-none"
            />

            <div className="relative w-full aspect-[1000/738] overflow-hidden -mt-[22%] -mb-[13%]">
              <Image
                src="/sponsormaze2.png"
                alt=""
                width={1920}
                height={1080}
                className="absolute -left-[14%] top-0 w-[130.9%] max-w-none h-auto scale-[1.10] origin-center pointer-events-none select-none"
              />
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
                className="absolute w-[16.5%] h-auto max-w-none animate-spin motion-reduce:animate-none"
                style={{
                  left: "42%",
                  top: "53%",
                  transformOrigin: "50.15% 71.28%",
                  animationDuration: "10s",
                }}
              />
            </div>

            {/* The same maze again, with the ball falling through it onto the
                maze end above, where the second blackout takes over. The top
                of this maze is hidden under the flagship section, so this run
                starts lower (sponsors in ballAnimation.js). */}
            <BallFall variant="sponsors" />
          </>
        )}

        <h2 className="relative z-20 w-full mt-[3%] text-center uppercase leading-none font-normal font-['BBH_Hegarty'] text-[#1C1F2A] text-[clamp(6rem,2.9vw,56px)]">
          Sponsors
        </h2>

        <Image
          src="/sponsorsection.png"
          alt=""
          width={1920}
          height={1200}
          className="relative z-10 block w-[124%] max-w-none -ml-[12%] -mt-[14.3%] aspect-[1712/1448] object-fill pointer-events-none select-none"
        />

        <Image
          src="/carpediem-maze-bottom.png"
          alt=""
          width={1000}
          height={200}
          className="relative z-10 block w-[46%] aspect-[662/96] object-cover object-left pointer-events-none select-none"
        />

        <Image
          src="/carpediem-maze-top.png"
          alt=""
          width={1000}
          height={200}
          className="relative z-10 block w-[46%] aspect-[662/96] object-cover object-left mt-[8%] pointer-events-none select-none"
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