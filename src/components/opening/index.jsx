import "./opening.css";
import { readFile } from "node:fs/promises";
import path from "node:path";
import OpeningStage from "./opening-stage";

// The wordmark's outline: carpediem.svg is a single filled path, and the
// opening cuts that path out of its cover (see opening-stage.jsx).
async function loadLogoPath() {
  const svg = await readFile(
    path.join(process.cwd(), "src/components/opening/carpediem.svg"),
    "utf8",
  );
  const d = svg.match(/<path\b[^>]*?\sd="([^"]+)"/)?.[1];
  if (!d) throw new Error("carpediem.svg: no <path d=...> found");
  return d;
}

// `children` — the site itself — is mounted from the start, underneath the
// opening, and is what shows through the letters.
export default async function Opening({ children }) {
  const logoPath = await loadLogoPath();

  return (
    <OpeningStage
      logoPath={logoPath}
      text={
        <>
          <div className="font-['BBH_Hegarty'] text-[clamp(48px,18vw,136.35px)] leading-none font-normal text-[#283618]">
            Aranya
          </div>
          <div className="text-center font-['BBH_Hegarty'] text-[clamp(16px,5.5vw,30px)] leading-[clamp(56px,18vw,100px)] font-normal text-[#283618]">
            exploration and wilderness
          </div>
        </>
      }
    >
      {children}
    </OpeningStage>
  );
}
