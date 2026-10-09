// Render stills from one bundle and one browser:
//   node scripts/stills.mjs <composition> <out-prefix> <spec...>
// spec = seconds (film compositions) or JSON props (UITest), e.g. 12.5 or '{"screen":"reader"}'
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [id, prefix, ...specs] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
for (const spec of specs) {
  const isProps = spec.startsWith("{");
  const inputProps = isProps ? JSON.parse(spec) : {};
  const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser });
  const frame = isProps ? 0 : Math.min(composition.durationInFrames - 1, Math.round(Number(spec) * composition.fps));
  const name = isProps ? Object.values(inputProps).join("-") : Number(spec).toFixed(2).padStart(6, "0");
  const output = `${prefix}-${name}.png`;
  await renderStill({ serveUrl, composition, frame, output, inputProps, imageFormat: "jpeg", jpegQuality: 85, puppeteerInstance: browser });
  console.log(output);
}
await browser.close({ silent: true });
fs.rmSync(serveUrl, { recursive: true, force: true });
