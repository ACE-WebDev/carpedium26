import "./opening.css";
import { readFile } from "node:fs/promises";
import path from "node:path";
import OpeningStage from "./opening-stage";
import OpeningPhoto from "./opening-photo";

// The artwork's own bounding box inside carpediem.svg's 1095-square
// canvas. The canvas is mostly empty space, so it is cropped to this box
// on the way in: the box is what --logo-ratio describes and what
// public/logo-mask.png is rendered to, so the visible wordmark and the
// mask that clips the photo to it end up the same size and position.
// Re-measure these (and regenerate the mask) if the artwork changes.
const LOGO_BOX = "51.3 391.5 1037.2 333.38";

// Inlined rather than served through <img> so the logo's fill and
// opacity can be driven by CSS (see `.opening-logo path` in opening.css).
async function loadLogo() {
  const svg = await readFile(
    path.join(process.cwd(), "src/components/opening/carpediem.svg"),
    "utf8",
  );
  // Crop to the artwork and drop the intrinsic width/height so the SVG
  // scales to its container instead of the square canvas's dimensions.
  // Confined to the root <svg ...> tag so any width/height on the
  // artwork's own elements is left alone.
  return svg.replace(
    /<svg\b[^>]*>/,
    (tag) =>
      tag
        .replace(/viewBox="[^"]*"/, `viewBox="${LOGO_BOX}"`)
        .replace(/\s(?:width|height)="[^"]*"/g, ""),
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
              style={{
                transform:
                  "scale(var(--zoom)) translateY(var(--logo-dy))",
              }}
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
