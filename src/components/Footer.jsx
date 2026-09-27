"use client";

export default function Footer() {
  const committeeMembers = [
    { name: "Amrutha K", phone: "+91 76038874553" },
    { name: "Madhav V K", phone: "+91 9444192898" },
    { name: "Sakthi Guru S", phone: "+91 9600527934" },
    { name: "Arshia Barirah A", phone: "+91 9566007948" },
    { name: "Ram Karthick S V ", phone: "+91 9025696315" },
  ];

  return (
    <footer className="relative w-full bg-[#EDD4A3] px-8 md:px-20 py-16 flex flex-col justify-between">
      <div>
        {/* Contact us: DELIRIUM NVC, Weight 400, Size 71.19px */}
        <h2 
          className="uppercase mb-8 text-[#283618]"
          style={{
            fontFamily: "'DELIRIUM NCV', sans-serif",
            fontWeight: 400,
            fontSize: "71.19px",
            lineHeight: "100%",
            letterSpacing: "0%",
          }}
        >
          Contact us
        </h2>

        {/* Core Committee: Product Sans Medium, Weight 500, Size 29.24px, Color #283618 */}
        <h3 
          className="mb-6 text-[#283618]"
          style={{
            fontFamily: "'Google Sans Flex', sans-serif",
            fontWeight: 500,
            fontSize: "29.24px",
            lineHeight: "100%",
            letterSpacing: "0%",
          }}
        >
          Core Committee
        </h3>

        {/* 4-Column Grid layout for contacts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-16 mb-24">
          {committeeMembers.map((member, index) => (
            <div key={index} className="flex flex-col gap-2">
              {/* Sudarsan P: Product Sans Medium, Weight 500, Size 27.97px, Color #602D00 */}
              <span 
                style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontWeight: 500,
                  fontSize: "27.97px",
                  lineHeight: "100%",
                  letterSpacing: "0%",
                  color: "#602D00",
                }}
              >
                {member.name}
              </span>
              {/* Phone number: Product Sans Medium, Weight 500, Size 25.42px, Color #602D00 */}
              <span 
                style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontWeight: 500,
                  fontSize: "25.42px",
                  lineHeight: "100%",
                  letterSpacing: "0%",
                  color: "#602D00",
                }}
              >
                {member.phone}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Row: Credits & Social Icons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-[#2B3A1A]/10 pt-8">
        
        {/* Made with love credit: Bricolage Grotesque, Weight 600 (SemiBold), Size 32px, Color #FFFBE0 */}
        <p 
          className="flex items-center gap-2"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 600,
            fontSize: "32px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#FFFBE0",
          }}
        >
          Made with <span className="text-3xl">🧡</span> by 300DPI and ACE
        </p>

        {/* Social Media Links */}
        <div className="flex items-center gap-4">
          {/* Facebook Link (Redirects to Facebook page) */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="grid h-10 w-10 place-items-center rounded bg-black text-white hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 5.025 3.658 9.184 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.201 22 17.042 22 12.017 22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Instagram Link */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="grid h-10 w-10 place-items-center rounded bg-black text-white hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          {/* YouTube Link */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="grid h-10 w-10 place-items-center rounded bg-black text-white hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          {/* LinkedIn Link */}
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="grid h-10 w-10 place-items-center rounded bg-black text-white hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>

      </div>
    </footer>
  );
}