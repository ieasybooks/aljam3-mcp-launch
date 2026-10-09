/**
 * The demo's choreography: cursor path, clicks, camera, spotlights, sounds and the assistant's state at any
 * time. Every time comes from the narration (cue/S/E), so regenerating the voice keeps it in sync.
 * Coordinates are in app pixels (1160 × 820, below the window title bar).
 */
import { cue as C, E, S } from "../lib/timeline";
import { Key, Pt, clamp, easeInOutCubic, easeOutCubic, keyTimes, prog, typed } from "../lib/time";
import { TITLE_H } from "../ui/theme";
import { COMPOSER, COL, ChatState, ROW_H, STEPS_Y, STEP_GAP, StepKind, StepState, VIEW, shotToWin } from "../ui/chat";
import demo from "../data/demo.json";

export type Cam = { z: number; x: number; y: number; zp?: number; xp?: number; portraitOnly?: boolean };
export type Sfx = { t: number; name: string; vol: number };
export type Spot = { t0: number; t1: number; x: number; y: number; w: number; h: number; r?: number };

export const CURSOR: Key<Pt>[] = [];
export const CLICKS: number[] = [];
export const CAMERA: Key<Cam>[] = [];
export const SFX: Sfx[] = [];
export const SPOTS: Spot[] = [];
/** Clicks that had to wait for the cursor (want = the spoken cue they belong to). */
export const LAG: { want: number; t: number; x: number; y: number }[] = [];

const move = (t: number, x: number, y: number, d = 0.5) => CURSOR.push({ t, v: { x, y }, d, e: easeInOutCubic });
const click = (t: number, vol = 0.42) => {
  CLICKS.push(t);
  SFX.push({ t, name: "ui_click", vol });
  return t;
};
/** Camera key; portrait zooms further (zp overrides the automatic boost) and can aim elsewhere (xp). */
const cam = (t: number, z: number, x: number, y: number, d = 0.8, zp?: number, xp?: number) => CAMERA.push({ t, v: { z, x, y, zp, xp }, d, e: easeInOutCubic });
const sfx = (t: number, name: string, vol: number) => SFX.push({ t, name, vol });
const spot = (t0: number, t1: number, x: number, y: number, w: number, h: number, r = 8) => SPOTS.push({ t0, t1: Math.max(t1, t0 + 0.9), x, y, w, h, r });
const keys = (text: string, t0: number, cps: number, vol = 0.24) => keyTimes(text, t0, cps).forEach((t, i) => sfx(t - 0.012, `key${i % 4}`, vol));
/** Click "press" amount: quick dip and release around the click time. */
export const press = (t: number, tc: number | undefined) => (tc === undefined ? 0 : clamp(1 - Math.abs(t - tc - 0.03) / 0.11));

export const T = {} as Record<string, number>;

// The cursor works through one action at a time: `free` is when it is available again.
let free = 0;
/** Move to (x, y) and click at `want` (a spoken cue), never before the cursor has arrived. */
const goClick = (want: number, x: number, y: number, d = 0.42) => {
  const start = Math.max(free, want - d - 0.06);
  move(start, x, y, d);
  const t = click(Math.max(want, start + d + 0.04));
  LAG.push({ want, t, x, y });
  free = t + 0.1;
  return t;
};
const goTo = (want: number, x: number, y: number, d = 0.35) => {
  const start = Math.max(free, want);
  move(start, x, y, d);
  free = start + d;
  return free;
};
const typeText = (want: number, text: string, cps: number) => {
  const start = Math.max(free, want);
  keys(text, start, cps);
  const end = start + Array.from(text).length / cps;
  free = end + 0.05;
  return [start, end];
};

// ---------------------------------------------------------------- timings

// Intro hands over: the assistant's window rises in and the Aljam3 icon docks in its composer.
T.shrink = E("intro3") - 0.1;
T.launch = T.shrink + 0.3;
T.dock = T.launch + 1.1;
sfx(T.dock - 0.02, "toggle", 0.3);
sfx(T.dock, "pop", 0.22);
CURSOR.push({ t: 0, v: { x: 820, y: 560 }, d: 0.01 });
cam(0, 1, 580, 410, 0.01);

// The connector: an MCP server with read-only research tools
T.popOpen = C("app", "MCP") - 0.2;
T.toolsIn = T.popOpen + 0.35;
T.countStart = C("app", "ثلاثة") - 0.1;
T.countEnd = C("app", "كتاب") + 0.25;
T.popClose = E("app") + 0.15;
sfx(T.popOpen, "pop", 0.16);
cam(T.popOpen - 0.15, 1.4, 700, 545, 0.9, 1.62, 705);
cam(T.popClose - 0.25, 1, 580, 410, 0.8);

// Chapter 1 — ask; the assistant finds the book by title, then searches its text
T.ch1 = S("search") - 1.15;
T.cursorIn = T.ch1 - 0.1;
free = T.ch1;
cam(T.ch1 - 0.1, 1.42, 580, 700, 0.9, 1.55, 580);
T.field = goClick(T.ch1 + 0.4, 700, COMPOSER.y + 36, 0.55);
T.typeCps = 44;
[T.typeStart, T.typeEnd] = typeText(T.field + 0.12, demo.question, T.typeCps);
const SEND = { x: COMPOSER.x + 14 + 19, y: COMPOSER.y + COMPOSER.h - 12 - 19 };
T.send = goClick(Math.max(C("search", "فيبحث"), T.typeEnd + 0.16), SEND.x, SEND.y, 0.4);
T.sent = T.send + 0.06;
T.status = T.send + 0.35;
sfx(T.sent, "whoosh", 0.16);
cam(T.send + 0.12, 1.3, 580, 330, 0.85, 1.5, 580);
goTo(T.send + 0.3, 1010, 560, 0.6);

const STEPS: { kind: StepKind; appear: number; done: number; expand?: number; collapse?: number }[] = [];
const step = (kind: StepKind, appear: number, run: number) => {
  STEPS.push({ kind, appear, done: appear + run });
  sfx(appear + run, "pop", 0.1);
  return appear + run;
};
const stepTop = (i: number) => STEPS_Y + i * (ROW_H + STEP_GAP); // content y while earlier steps are collapsed
const toApp = (contentY: number, scroll: number) => VIEW.top + contentY - scroll;

T.s1 = Math.max(C("search", "عناوين") - 0.2, T.send + 0.55);
T.d1 = step("list_books", T.s1, 0.6);
T.pick = T.d1 + 0.45;
T.s2 = Math.max(C("search", "ونصوصها") - 0.15, T.d1 + 0.7);
T.d2 = step("search", T.s2, 0.6);
T.hitMark = T.d2 + 0.3;
spot(T.d1 + 0.05, T.s2 - 0.05, COL.x - 6, toApp(stepTop(0), 0) - 4, COL.w + 12, ROW_H + 4 + 162, 12);
spot(T.d2 + 0.05, T.d2 + 1.2, COL.x - 6, toApp(stepTop(1), 0) - 4, COL.w + 12, ROW_H + 4 + 112, 12);

// Chapter 2 — read the page and the pages around it
T.ch2 = S("read") - 0.5;
T.s3 = Math.max(C("read", "يقرأ") - 0.15, T.d2 + 1.0);
T.d3 = step("get_page", T.s3, 0.5);
T.pageMark = Math.max(C("read", "الصفحة") + 0.25, T.d3 + 0.3);
T.s4 = Math.max(C("read", "حولها") - 0.2, T.d3 + 0.55);
T.d4 = step("get_page2", T.s4, 0.7);
T.context = C("read", "سياقه") - 0.25;
T.scroll1 = T.s4 - 0.1;
const SCROLL1 = 76;
cam(T.s3 + 0.1, 1.32, 580, 395, 0.8, 1.55, 580);
spot(T.d3 + 0.1, T.s4 - 0.1, COL.x - 6, toApp(stepTop(2), 0) - 4, COL.w + 12, ROW_H + 4 + 226, 12);
spot(T.d4 - 0.15, T.context - 0.1, COL.x - 6, toApp(stepTop(3) + 226, SCROLL1) - 4, COL.w + 12, ROW_H + 4, 12);
// the chapter heading above the hadith: the text in its context (box measured with the Measure composition)
spot(T.context, E("read") + 0.4, 478, 370, 451, 40, 6);

// Chapter 3 — the answer with its source, then the source page itself
T.ch3 = E("read") + 0.1;
T.collapse = T.ch3;
T.answer0 = T.collapse + 0.3;
T.answer1 = T.answer0 + 1.5;
T.source = T.answer1 - 0.15;
sfx(T.source, "pop", 0.16);
cam(T.collapse + 0.05, 1.28, 580, 340, 0.8, 1.5, 580);
cam(Math.max(C("cite", "اسم") - 0.35, T.source + 0.2), 1.48, 580, 520, 0.8, 1.52, 580);
// source card boxes (measured)
const SRC = { title: [576, 494, 287, 25], author: [603, 528, 260, 26], page: [506, 528, 69, 26], link: [596, 568, 267, 38] };
const sp = (t0: number, t1: number, b: number[]) => spot(t0, t1, b[0] - 8, b[1] - 6, b[2] + 16, b[3] + 12, 8);
sp(C("cite", "الكتاب") - 0.15, C("cite", "والمؤلف") - 0.08, SRC.title);
sp(C("cite", "والمؤلف"), C("cite", "ورقم") - 0.08, SRC.author);
sp(C("cite", "ورقم"), C("cite", "ورابط") - 0.1, SRC.page);
sp(C("cite", "ورابط"), E("cite") + 0.3, SRC.link);
const LINK = { x: SRC.link[0] + SRC.link[2] * 0.55, y: SRC.link[1] + SRC.link[3] / 2 };
T.linkHover = goTo(C("cite", "ورابط") + 0.2, LINK.x, LINK.y, 0.6);
T.open = goClick(C("verify", "إفتح") + 0.12, LINK.x - 4, LINK.y + 2, 0.3);
T.browser = T.open + 0.06;
T.loaded = T.open + 0.42;
T.cursorOut = T.open + 0.35;
sfx(T.browser - 0.2, "whoosh_long", 0.2);
sfx(T.loaded, "page_flip", 0.18);
cam(T.open + 0.05, 1, 580, 410, 0.6);
// the hadith in the scanned page (screenshot pixels → window → app coordinates)
const q0 = shotToWin(425, 1352);
const q1 = shotToWin(945, 1402);
const m0 = shotToWin(890, 1478);
const m1 = shotToWin(1128, 1518);
export const SHOT_MARKS = [
  { t: C("verify", "بنفسك") - 0.15, x: q0.x, y: q0.y, w: q1.x - q0.x, h: q1.y - q0.y },
  { t: C("verify", "الأصلية") - 0.1, x: m0.x, y: m0.y, w: m1.x - m0.x, h: m1.y - m0.y },
];
cam(C("verify", "لتتحقق") - 0.35, 2.15, (q0.x + q1.x) / 2 + 30, (q0.y + m1.y) / 2 - TITLE_H, 1.0, 2.6, (q0.x + q1.x) / 2 + 20);
T.tourEnd = E("verify") + 0.45;
cam(T.tourEnd - 0.25, 1, 580, 410, 0.7);

CURSOR.sort((a, b) => a.t - b.t);
CAMERA.sort((a, b) => a.t - b.t);
SFX.sort((a, b) => a.t - b.t);

export const cursorOpacity = (t: number) => prog(t, T.cursorIn, T.cursorIn + 0.35) * (1 - prog(t, T.cursorOut, T.cursorOut + 0.3));

// ---------------------------------------------------------------- chapters for the guide
export type Chapter = { n: number; title: string; headline: string; t0: number; t1: number; bullets: { text: string; t: number }[] };
export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    title: "البحث",
    headline: "اسأل بأسلوبك",
    t0: T.ch1,
    t1: T.ch2,
    bullets: [
      { text: "يجد الكتاب بعنوانه", t: C("search", "عناوين") },
      { text: "ويبحث في نصوصه", t: C("search", "ونصوصها") },
    ],
  },
  {
    n: 2,
    title: "القراءة",
    headline: "النص في سياقه",
    t0: T.ch2,
    t1: T.ch3,
    bullets: [
      { text: "يقرأ الصفحة كاملة", t: C("read", "يقرأ") },
      { text: "والصفحات المجاورة لها", t: C("read", "حولها") },
    ],
  },
  {
    n: 3,
    title: "التوثيق",
    headline: "المصدر مع كل جواب",
    t0: T.ch3,
    t1: T.tourEnd,
    bullets: [
      { text: "الكتاب والمؤلف والصفحة", t: C("cite", "اسم") },
      { text: "رابط إلى الصفحة في الجامع", t: C("cite", "ورابط") },
      { text: "تحقّق من الصفحة الأصلية", t: C("verify", "إفتح") },
    ],
  },
];

// ---------------------------------------------------------------- assistant state
const caretOn = (t: number, since: number) => Math.floor((t - since) * 1.8) % 2 === 0;

export const chatAt = (t: number): ChatState => {
  const typing = t >= T.typeStart && t < T.sent;
  const steps: StepState[] = STEPS.map((s, i) => {
    const next = STEPS[i + 1];
    const appear = prog(t, s.appear, s.appear + 0.3, easeOutCubic);
    const done = prog(t, s.done - 0.05, s.done + 0.15, easeOutCubic);
    // the open step folds away when the next one starts (except the page, which stays open for its neighbours)
    const closeAt = s.kind !== "get_page" && next ? next.appear : null;
    const open = prog(t, s.done, s.done + 0.35, easeInOutCubic);
    const expand = s.kind === "get_page2" ? 0 : closeAt === null ? open : open * (1 - prog(t, closeAt, closeAt + 0.35, easeInOutCubic));
    return {
      kind: s.kind,
      appear,
      done,
      expand,
      pick: prog(t, T.pick, T.pick + 0.3),
      mark: s.kind === "search" ? prog(t, T.hitMark, T.hitMark + 0.5) : prog(t, T.pageMark, T.pageMark + 0.6),
      context: prog(t, T.context, T.context + 0.5),
    };
  });
  const scroll = SCROLL1 * prog(t, T.scroll1, T.scroll1 + 0.5, easeInOutCubic) * (1 - prog(t, T.collapse, T.collapse + 0.5, easeInOutCubic));
  return {
    composer: {
      text: t < T.sent ? typed(demo.question, t, T.typeStart, T.typeCps) : "",
      caret: t >= T.field && t < T.sent && (typing || caretOn(t, T.field)),
      focus: t >= T.field && t < T.sent + 0.4 ? 1 : 0,
      sendPressed: press(t, T.send),
    },
    connected: prog(t, T.dock - 0.05, T.dock + 0.25, easeOutCubic),
    popover: {
      open: prog(t, T.popOpen, T.popOpen + 0.3, easeOutCubic) * (1 - prog(t, T.popClose, T.popClose + 0.25)),
      count: easeOutCubic(prog(t, T.countStart, T.countEnd, (x) => x)),
      tools: prog(t, T.toolsIn, T.toolsIn + 1.3, (x) => x),
    },
    greeting: prog(t, T.launch + 0.5, T.launch + 1.1, easeOutCubic) * (1 - prog(t, T.sent - 0.1, T.sent + 0.2)),
    sent: prog(t, T.sent, T.sent + 0.45, easeOutCubic),
    status: { show: prog(t, T.status, T.status + 0.25), collapsed: prog(t, T.collapse, T.collapse + 0.45, easeInOutCubic) },
    steps,
    answer: prog(t, T.answer0, T.answer1, (x) => x),
    source: prog(t, T.source, T.source + 0.35, easeOutCubic),
    link: { hover: prog(t, T.linkHover - 0.1, T.linkHover + 0.1), pressed: press(t, T.open) },
    scroll,
  };
};

const LINK_WIN = { x: LINK.x, y: LINK.y + TITLE_H };
export const browserAt = (t: number) => ({
  open: prog(t, T.browser, T.browser + 0.5, easeInOutCubic) * (1 - prog(t, T.tourEnd - 0.45, T.tourEnd + 0.05, easeInOutCubic)),
  loaded: prog(t, T.loaded, T.loaded + 0.3),
  marks: SHOT_MARKS.map((m) => ({ ...m, a: prog(t, m.t, m.t + 0.45, easeInOutCubic) })),
  origin: LINK_WIN,
});
