// Generates TS modules from the app's SVG assets: Lucide icon bodies and the logo split into strokes.
import fs from "node:fs";
import { getSubpaths, normalizePath, getBoundingBox, getLength } from "@remotion/paths";

const icons = {};
for (const file of fs.readdirSync("public/icons")) {
  if (!file.endsWith(".svg") || file.endsWith("-dark.svg")) continue;
  const svg = fs.readFileSync(`public/icons/${file}`, "utf8");
  const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s+/g, " ").trim();
  icons[file.replace(".svg", "")] = body;
}
fs.writeFileSync("src/ui/iconData.ts", `// Generated from public/icons (Lucide 0.468.0, ISC) by scripts/gen_assets.mjs\nexport const ICONS: Record<string, string> = ${JSON.stringify(icons, null, 1)};\n`);

const logo = fs.readFileSync("public/brand/aljam3.svg", "utf8");
const d = logo.match(/ d="([^"]+)"/)[1];
const parts = getSubpaths(normalizePath(d)).map((p) => {
  const b = getBoundingBox(p);
  return { d: p, x0: b.x1, y0: b.y1, x1: b.x2, y1: b.y2, length: getLength(p) };
});
fs.writeFileSync("src/brand/logoData.ts", `// Generated from public/brand/aljam3.svg by scripts/gen_assets.mjs\nexport const LOGO_VIEWBOX = { w: 366, h: 288 };\nexport const LOGO_PATH = ${JSON.stringify(d)};\nexport const LOGO_PARTS = ${JSON.stringify(parts)};\n`);
console.log(Object.keys(icons).length, "icons;", parts.length, "logo parts");
console.log(parts.map((p) => [Math.round(p.x0), Math.round(p.y0), Math.round(p.x1), Math.round(p.y1)]));
