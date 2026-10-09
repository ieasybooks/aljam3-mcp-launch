// node scripts/measure.mjs t1 t2 ... → prints the [data-m] boxes (app pixels) at each film time.
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
const times = process.argv.slice(2).map(Number);
const all = {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
for (const t of times) {
  const inputProps = { t };
  const composition = await selectComposition({ serveUrl, id: "Measure", inputProps, puppeteerInstance: browser });
  let result = null;
  await renderStill({
    serveUrl, composition, frame: 0, inputProps, output: `out/dbg/measure-${t}.jpeg`, imageFormat: "jpeg", puppeteerInstance: browser,
    onBrowserLog: (log) => { if (log.text.startsWith("MEASURE:")) result = JSON.parse(log.text.slice(8)); if (log.text.startsWith("DIRECTOR:")) fs.writeFileSync("out/dbg/director.json", log.text.slice(9)); },
  });
  all[t] = result;
}
await browser.close({ silent: true });
fs.writeFileSync("out/dbg/measure.json", JSON.stringify(all));
fs.rmSync(serveUrl, { recursive: true, force: true });
