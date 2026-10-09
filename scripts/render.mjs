// Render a composition: node scripts/render.mjs <id> <out.mp4> [--scale=0.5] [--from=s --to=s] [--muted] [--crf=18]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [id, output, ...flags] = process.argv.slice(2);
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id });
const fps = composition.fps;
const frameRange = opt.from ? [Math.round(Number(opt.from) * fps), Math.min(composition.durationInFrames - 1, Math.round(Number(opt.to) * fps))] : null;
const started = Date.now();
let last = 0;
await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  outputLocation: output,
  scale: opt.scale ? Number(opt.scale) : 1,
  frameRange,
  muted: !!opt.muted,
  crf: opt.crf ? Number(opt.crf) : 18,
  pixelFormat: "yuv420p",
  x264Preset: opt.preset ?? "medium",
  audioCodec: "aac",
  audioBitrate: "256k",
  concurrency: opt.concurrency ? Number(opt.concurrency) : 4,
  chromiumOptions: { gl: "angle" },
  imageFormat: "jpeg",
  jpegQuality: 92,
  onProgress: ({ progress, renderedFrames }) => {
    const now = Date.now();
    if (now - last > 15000) {
      last = now;
      console.log(`${(progress * 100).toFixed(1)}%  frames=${renderedFrames}  ${((now - started) / 1000).toFixed(0)}s`);
    }
  },
});
console.log(`done ${output} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
fs.rmSync(serveUrl, { recursive: true, force: true });
