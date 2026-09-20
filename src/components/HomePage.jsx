"use client";
export default function HomePage() {
  return (
    /* Main wrapper with the base background color */
    <div className="relative w-full bg-[#EDD4A3] flex flex-col">
      <div 
        className="relative w-full h-[150vh] bg-top bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/maze.png')" }}
      >
        <section className="relative h-screen w-full flex flex-col items-center justify-start pt-32">          
          {/* Scroll Indicator */}
          <button
            onClick={() => document.getElementById("about-us")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-16 flex cursor-pointer flex-col items-center gap-3"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#171C2E] border-[3px] border-[#505763]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="#FDF7DE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
            <span className="font-['Archivo_Black'] text-lg font-bold uppercase tracking-wider text-[#1C1E2C]">
              SCROLL DOWN
            </span>
          </button>
        </section>
      </div>

      {/* ---- ABOUT US SECTION ---- */}
      <section id="about-us" className="relative w-full flex items-center justify-center py-24">
        
        {/* The central About Us Image */}
        <img 
          src="/mazeaboutus.png" 
          alt="About Us" 
          className="w-[25rem] h-[25rem] object-contain" 
        />
          
      </section>
      
    </div>
  );
}