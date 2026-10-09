import voData from "../data/vo.json";

type VoClip = { duration: number; chars: string; starts: number[]; ends: number[]; caption: string };
const VO = voData as Record<string, VoClip>;

/** Narration order and the silence (seconds) before each line. Everything on screen is timed from this. */
const PLAN: [string, number][] = [
  ["intro1", 1.0],
  ["intro2", 0.6],
  ["intro3", 0.9],
  ["app", 1.4],
  ["search", 1.4],
  ["read", 1.3],
  ["cite", 1.0],
  ["verify", 1.1],
  ["outro1", 1.4],
  ["outro2", 0.5],
  ["outro3", 0.8],
];
const END_HOLD = 3.0;

export type ClipTime = { id: string; start: number; end: number; dur: number; caption: string };
export const CLIPS: Record<string, ClipTime> = {};
export const ORDER: ClipTime[] = [];
let cursor = 0;
for (const [id, gap] of PLAN) {
  const clip = VO[id];
  if (!clip) throw new Error(`missing voice clip ${id}`);
  const start = cursor + gap;
  const entry = { id, start, end: start + clip.duration, dur: clip.duration, caption: clip.caption };
  CLIPS[id] = entry;
  ORDER.push(entry);
  cursor = entry.end;
}
export const DURATION = cursor + END_HOLD;

export const S = (id: string) => CLIPS[id].start;
export const E = (id: string) => CLIPS[id].end;

const DIACRITIC = /[ً-ْٰـ]/;
const plainIndex = (chars: string) => {
  const map: number[] = [];
  let plain = "";
  Array.from(chars).forEach((c, i) => {
    if (!DIACRITIC.test(c)) {
      plain += c;
      map.push(i);
    }
  });
  return { plain, map };
};

/** Absolute time at which `needle` (undiacritized) is spoken in clip `id`. */
export const cue = (id: string, needle: string, occurrence = 0, edge: "start" | "end" = "start") => {
  const clip = VO[id];
  const { plain, map } = plainIndex(clip.chars);
  let at = -1;
  for (let n = 0; n <= occurrence; n++) at = plain.indexOf(needle, at + 1);
  if (at < 0) throw new Error(`cue "${needle}" not found in ${id}: ${plain}`);
  const idx = edge === "start" ? map[at] : map[at + Array.from(needle).length - 1];
  return CLIPS[id].start + (edge === "start" ? clip.starts[idx] : clip.ends[idx]);
};

/** Caption chunks (split at commas/periods) with the times they are spoken. */
export type CaptionChunk = { text: string; start: number; end: number; clip: string };
export const CAPTIONS: CaptionChunk[] = ORDER.flatMap((c) => {
  const clip = VO[c.id];
  const chars = Array.from(clip.chars);
  const textParts = c.caption.split(/(?<=[،.:…])\s+/).filter(Boolean);
  // boundaries in the spoken text: index of first char after each punctuation mark
  const bounds = [0];
  chars.forEach((ch, i) => {
    if ("،.:".includes(ch) && i < chars.length - 1) bounds.push(i + 1);
  });
  const usable = textParts.length === bounds.length;
  const parts = usable ? textParts : [c.caption];
  const starts = usable ? bounds : [0];
  return parts.map((text, k) => {
    const i0 = starts[k];
    const i1 = k + 1 < starts.length ? starts[k + 1] - 1 : chars.length - 1;
    let a = i0;
    while (a < chars.length - 1 && /\s/.test(chars[a])) a++;
    return { text, start: c.start + clip.starts[a], end: k + 1 < starts.length ? c.start + clip.ends[i1] : c.end, clip: c.id };
  });
});
