"use client";
import Navbar from "./navbar";
export default function HomePage() {
  return (
    /* Main wrapper with the base background color */
    <div className="relative w-full bg-[#EDD4A3] flex flex-col">
      <Navbar/>

      <div
        className="relative w-full h-[150vh] bg-top bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/maze.png')" }}
      >
        <section className="relative h-screen w-full flex flex-col items-center justify-start pt-32">

          {/* Scroll Indicator */}
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
      </div>

      {/* ---- ABOUT US SECTION (teammate's) ---- */}
      <section
        id="about-us"
        className="relative w-full flex items-center justify-center py-24"
      >
        <img
          src="/mazeaboutus.png"
          alt="About Us"
          className="w-[33rem] h-[33rem] object-contain"
        />
      </section>

      {/* ---- CARPEDIEM 26TH EDITION INTRO SECTION ---- */}
      <section
        id="carpediem-intro"
        className="relative w-full min-h-[150vh] bg-[#EDD4A3] flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden"
      >

        {/* Grass / leaf decoration */}
        <img
          src="/carpediem-grass.png"
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-0 w-full h-auto object-contain object-top pointer-events-none select-none z-0 scale-100 origin-top"
        />

        {/* Small heading */}
        <p
          className="relative z-10 mb-4"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1.1rem, 2.5vw, 37px)",
            letterSpacing: "0%",
            textAlign: "center",
            color: "#283618",
          }}
        >
          a cultural experience
        </p>

        {/* CARPEDIEM */}
        <h2
          className="relative z-10 uppercase"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            letterSpacing: "0%",
            textAlign: "center",
            color: "#C28B5B",
          }}
        >
          CARPEDIEM
        </h2>

        {/* 26th */}
        <h2
          className="relative z-10 uppercase"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            letterSpacing: "0%",
            textAlign: "center",
            color: "#C28B5B",
          }}
        >
          26th
        </h2>

        {/* EDITION */}
        <h2
          className="relative z-10 uppercase mb-2"
          style={{
            fontFamily: "'BBH Hegarty', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(2.75rem, 10vw, 150px)",
            lineHeight: 1.0667,
            letterSpacing: "0%",
            textAlign: "center",
            color: "#C28B5B",
          }}
        >
          EDITION
        </h2>

        {/* Maze + Performer */}
        <div className="relative z-10 w-full flex items-center justify-center -mt-16">

          {/* Maze */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-screen flex flex-col"
            style={{
              gap: "clamp(24px, 6vw, 90px)",
            }}
          >
            <img
              src="/carpediem-maze-top.png"
              alt=""
              aria-hidden="true"
              className="w-full h-auto object-cover pointer-events-none select-none"
            />

            <img
              src="/carpediem-maze-bottom.png"
              alt=""
              aria-hidden="true"
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
          </div>

          {/* Performer */}
          <img
            src="/performer-1.png"
            alt="Performer"
            className="relative z-10 w-100 sm:w-96 md:w-[480px] lg:w-[2200px] object-contain"
          />

        </div>

        {/* Paragraph */}
        <p
          className="relative z-10 max-w-[1000px] -mt-16"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2vw, 36px)",
            lineHeight: 1.4,
            letterSpacing: "0%",
            textAlign: "center",
            color: "#000000",
          }}
        >
          The 25th Edition of Carpe Diem is here, flowing back with boundless
          energy and spirit! This year, with the theme Pravaah – The Flow of
          Expressions, we celebrate the rhythm of creativity, the pulse of
          talent, and the stream of unforgettable moments. From fiery beats to
          graceful moves, Carpe Diem promises to be a vibrant celebration of
          expression.
        </p>

      </section>
    </div>
  );
}