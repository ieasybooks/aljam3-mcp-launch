import { continueRender, delayRender, staticFile } from "remotion";

// The app's own fonts (assets/fonts in aljam3-desktop).
export const UI_FONT = "'Noto Naskh Arabic UI', serif";
export const HEADING_FONT = "'Thmanyah Serif Display', 'Noto Naskh Arabic UI', serif";
export const READING_FONT = "'Kitab', 'Noto Naskh Arabic UI', serif";
export const LATIN_FONT = "'Inter', 'Noto Naskh Arabic UI', sans-serif";

const FACES: [string, string, string][] = [
  ["Noto Naskh Arabic UI", "fonts/NotoNaskhArabicUI.ttf", "400 700"],
  ["Thmanyah Serif Display", "fonts/Thmanyah.ttf", "400 500"],
  ["Kitab", "fonts/Kitab.ttf", "400"],
  ["Inter", "fonts/Inter-400.ttf", "400"],
  ["Inter", "fonts/Inter-500.ttf", "500"],
  ["Inter", "fonts/Inter-600.ttf", "600"],
  ["Inter", "fonts/Inter-700.ttf", "700"],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("fonts");
  Promise.all(
    FACES.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, { weight });
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
