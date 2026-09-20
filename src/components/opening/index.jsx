import "./opening.css";
import { readFile } from "node:fs/promises";
import path from "node:path";
import OpeningStage from "./opening-stage";
import OpeningPhoto from "./opening-photo";

// Inlined rather than served through <img> so the logo's fill can be
// driven by CSS (it is a masked rect using currentColor).
async function loadLogo() {
  return readFile(
    path.join(process.cwd(), "src/components/opening/carpediem.svg"),
    "utf8",
  );
}

// `children` is whatever follows the opening; it is mounted only once the
// animation has finished.
export default async function Opening({ children }) {
  const logo = await loadLogo();

  return (
    <OpeningStage
      after={children}
      photo={<OpeningPhoto />}
      chrome={
        /* Everything but the photo: fades away once the zoom is done,
           then is removed from the DOM entirely. */
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-around pointer-events-none will-change-[opacity]"
          style={{ opacity: "calc(1 - var(--takeover))" }}
        >
          <div className="opening-logo-intro">
            <div
              className="opening-zoom relative z-20 flex origin-center items-center justify-center will-change-transform"
              style={{ transform: "scale(var(--zoom))" }}
            >
              <div className="opening-logo-bounce">
                <div
                  className="opening-logo block w-[var(--logo-w)] text-[var(--logo-solid)]"
                  role="img"
                  aria-label="Carpe Diem"
                  dangerouslySetInnerHTML={{ __html: logo }}
                />
              </div>
            </div>
          </div>
          <div className="opening-text-intro">
            <div
              className="opening-text relative z-20 mt-5 flex flex-col items-center justify-center will-change-[opacity,transform]"
              style={{
                opacity: "var(--fade)",
                transform: "translateY(var(--drift))",
              }}
            >
              <div
                className="font-['BBH_Hegarty'] text-[136.35px] leading-none font-normal text-[#283618]"
              >
                Aranya
              </div>
              <div className="text-center font-['BBH_Hegarty'] text-[30px] leading-[100px] font-normal text-[#283618]">
                exploration and wilderness
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
