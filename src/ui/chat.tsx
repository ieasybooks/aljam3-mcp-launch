/**
 * A neutral AI-assistant window (not a specific product) with Aljam3 connected as an MCP connector.
 * Coordinates are in app pixels: 1160 × 820 below a 34 px title bar.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { APP_H, APP_W, CHAT, TITLE_H, WIN_H } from "./theme";
import { HEADING_FONT, LATIN_FONT, READING_FONT, UI_FONT } from "../lib/fonts";
import { Icon, Marked } from "./kit";
import demo from "../data/demo.json";

export const HEADER_H = 56;
export const COL = { x: 220, w: 720 };
export const COMPOSER = { x: 200, y: 676, w: 760, h: 116 };
export const VIEW = { top: HEADER_H, bottom: COMPOSER.y - 8 };
const MONO = "'Inter', monospace";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export type StepKind = "list_books" | "search" | "get_page" | "get_page2";
export type StepState = { kind: StepKind; appear: number; done: number; expand: number; pick?: number; mark?: number; context?: number };
export type ChatState = {
  composer: { text: string; caret: boolean; focus: number; sendPressed: number; pillPressed?: number };
  connected: number; // 0..1 connector pill switched on
  popover: { open: number; count: number; tools: number };
  greeting: number; // empty-state greeting
  sent: number; // 0..1 user message in the conversation
  status: { show: number; collapsed: number }; // assistant status row; collapsed = steps folded into a summary
  steps: StepState[];
  answer: number; // 0..1 streamed answer
  source: number; // 0..1 source card
  link: { hover: number; pressed: number };
  scroll: number;
};

export const AppIcon: React.FC<{ size: number; radius?: number }> = ({ size, radius = size * 0.24 }) => (
  <div style={{ width: size, height: size, borderRadius: radius, background: "#fff", boxShadow: `inset 0 0 0 1px ${CHAT.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
    <Img src={staticFile("brand/app-icon.png")} style={{ width: size * 1.02, height: size * 1.02 }} />
  </div>
);

const TrafficLights: React.FC = () => (
  <div style={{ position: "absolute", left: 14, top: 11, display: "flex", gap: 8, direction: "ltr" }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.12)" }} />
    ))}
  </div>
);

export const TitleBar: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: TITLE_H, background: "#f4f1ee", borderBottom: "1px solid #e6e0db", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <TrafficLights />
    <div style={{ fontFamily: UI_FONT, fontSize: 13.5, color: "#6b625e", fontWeight: 600 }}>{title}</div>
  </div>
);

const Spinner: React.FC<{ t: number; size?: number }> = ({ t, size = 16 }) => (
  <div style={{ width: size, height: size, transform: `rotate(${t * 400}deg)` }}>
    <Icon name="loader-circle" size={size} color={CHAT.muted} />
  </div>
);

const DoneMark: React.FC<{ a: number }> = ({ a }) => (
  <div style={{ width: 20, height: 20, borderRadius: 10, background: CHAT.ok, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * a})`, opacity: a, flexShrink: 0 }}>
    <Icon name="check" size={13} color="#fff" strokeWidth={3} />
  </div>
);

const ToolChip: React.FC<{ name: string }> = ({ name }) => (
  <span style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 500, color: CHAT.soft, background: CHAT.well, border: `1px solid ${CHAT.line}`, borderRadius: 6, padding: "2px 8px", direction: "ltr", unicodeBidi: "isolate", flexShrink: 0 }}>{name}</span>
);

// ------------------------------------------------------------------ tool steps

export const ROW_H = 52;
export const STEP_GAP = 8;
export const BODY_H: Record<StepKind, number> = { list_books: 162, search: 112, get_page: 226, get_page2: 0 };

const STEP_INFO: Record<StepKind, { tool: string; args: string; done: string }> = {
  list_books: { tool: "list_books", args: "«رياض الصالحين»", done: `${demo.booksCount} كتب` },
  search: { tool: "search", args: "«إنما الأعمال بالنيات» في رياض الصالحين", done: `صفحة ${demo.hit.page}` },
  get_page: { tool: "get_page", args: `رياض الصالحين · صفحة ${demo.page.number}`, done: "قُرئت الصفحة" },
  get_page2: { tool: "get_page", args: `الصفحتان ${demo.page.previous} و${demo.page.next}`, done: "قُرئت الصفحتان" },
};

const BookRow: React.FC<{ b: (typeof demo.books)[number]; pick: number; m?: string }> = ({ b, pick, m }) => (
  <div data-m={m} style={{ height: 46, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", borderRadius: 8, background: pick > 0 ? `rgba(174,71,33,${0.08 * pick})` : undefined, boxShadow: pick > 0 ? `inset 0 0 0 1px rgba(174,71,33,${0.28 * pick})` : undefined }}>
    <Icon name="book-open" size={17} color={CHAT.muted} />
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ fontFamily: UI_FONT, fontSize: 15.5, color: CHAT.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.35 }}>{b.title}</div>
      <div style={{ fontFamily: UI_FONT, fontSize: 12.5, color: CHAT.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{b.author}</div>
    </div>
    <div style={{ fontFamily: UI_FONT, fontSize: 13, color: CHAT.muted, flexShrink: 0 }}>{`${b.pages} صفحة`}</div>
  </div>
);

const StepBody: React.FC<{ s: StepState }> = ({ s }) => {
  if (s.kind === "list_books")
    return (
      <div style={{ padding: "8px 6px" }}>
        {demo.books.map((b, i) => (
          <BookRow key={b.id} b={b} pick={i === 0 ? (s.pick ?? 0) : 0} m={i === 0 ? "book-pick" : undefined} />
        ))}
      </div>
    );
  if (s.kind === "search")
    return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span data-m="hit-page" style={{ fontFamily: UI_FONT, fontSize: 13.5, color: CHAT.accent, background: CHAT.accentSoft, borderRadius: 6, padding: "1px 9px" }}>{`صفحة ${demo.hit.page}`}</span>
          <span style={{ fontFamily: UI_FONT, fontSize: 14, color: CHAT.muted }}>{demo.book.title}</span>
        </div>
        <div style={{ fontFamily: READING_FONT, fontSize: 18, lineHeight: 1.9, color: CHAT.ink, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <Marked text={demo.hit.excerpt + "…"} mark="إنما الأعمال بالنيات" amount={s.mark ?? 0} m="hit-mark" />
        </div>
      </div>
    );
  if (s.kind === "get_page") {
    const hadith = demo.page.hadith.slice(demo.page.hadith.indexOf("قَالَ: سَمِعْتُ"));
    return (
      <div style={{ padding: "12px 18px 10px" }}>
        <div style={{ fontFamily: UI_FONT, fontSize: 13.5, color: CHAT.muted }}>{`${demo.book.title} · صفحة ${demo.page.number} · ${demo.page.totalChars.toLocaleString("en-US")} حرفًا`}</div>
        <div data-m="page-text" style={{ position: "relative", marginTop: 6, height: 122, overflow: "hidden", fontFamily: READING_FONT, fontSize: 18, lineHeight: 1.75, color: CHAT.ink }}>
          <div data-m="page-chapter" style={{ display: "inline-block", fontWeight: 400, color: CHAT.soft }}>
            <Marked text={`١ - ${demo.page.chapter}`} mark={demo.page.chapter} amount={s.context ?? 0} color="rgba(174,71,33,0.13)" />
          </div>
          <div>
            <Marked text={hadith} mark="إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِيءٍ مَا نَوَى" amount={s.mark ?? 0} m="page-mark" />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: `linear-gradient(to bottom, rgba(255,255,255,0), ${CHAT.card})` }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <span style={{ fontFamily: UI_FONT, fontSize: 13, color: CHAT.muted }}>الصفحات المجاورة</span>
          {[demo.page.previous, demo.page.next].map((n, i) => (
            <span key={n} data-m={`nav-${i}`} style={{ fontFamily: UI_FONT, fontSize: 13, color: CHAT.soft, border: `1px solid ${CHAT.line}`, borderRadius: 6, padding: "0 8px", display: "flex", alignItems: "center", gap: 4 }}>
              {i === 0 ? <Icon name="chevron-left" size={13} color={CHAT.muted} style={{ transform: "scaleX(-1)" }} /> : null}
              {`صفحة ${n}`}
              {i === 1 ? <Icon name="chevron-left" size={13} color={CHAT.muted} /> : null}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const stepHeight = (s: StepState) => s.appear * (ROW_H + STEP_GAP) + s.expand * BODY_H[s.kind];

const Step: React.FC<{ s: StepState; t: number; y: number }> = ({ s, t, y }) => {
  const info = STEP_INFO[s.kind];
  if (s.appear <= 0) return null;
  return (
    <div
      data-m={`step-${s.kind}`}
      style={{
        position: "absolute",
        left: 0,
        width: COL.w,
        top: y,
        height: ROW_H + s.expand * BODY_H[s.kind],
        boxSizing: "border-box",
        border: `1px solid ${CHAT.line}`,
        borderRadius: 12,
        background: CHAT.card,
        overflow: "hidden",
        opacity: s.appear,
        transform: `translateY(${(1 - s.appear) * 10}px)`,
        boxShadow: "0 1px 2px rgba(60,40,30,0.04)",
      }}
    >
      <div style={{ height: ROW_H - 2, display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
        <AppIcon size={26} radius={7} />
        <span style={{ fontFamily: UI_FONT, fontSize: 14, color: CHAT.muted }}>الجامع</span>
        <ToolChip name={info.tool} />
        <span style={{ fontFamily: UI_FONT, fontSize: 15.5, color: CHAT.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{info.args}</span>
        {s.done < 1 ? <Spinner t={t} /> : null}
        <span style={{ fontFamily: UI_FONT, fontSize: 13.5, color: CHAT.muted, opacity: s.done }}>{info.done}</span>
        {s.done > 0 ? <DoneMark a={s.done} /> : null}
        {BODY_H[s.kind] > 0 ? <Icon name="chevron-down" size={16} color={CHAT.muted} style={{ transform: `rotate(${180 * s.expand}deg)` }} /> : <div style={{ width: 16 }} />}
      </div>
      {s.expand > 0 ? (
        <div style={{ borderTop: `1px solid ${CHAT.line}`, opacity: clamp01(s.expand * 1.6 - 0.4) }}>
          <StepBody s={s} />
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ answer

const QUOTE = "«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى…»";
const P1 = `ورد في أول أحاديث «رياض الصالحين» للنووي، تحت «${demo.page.chapter}»:`;
const P2 = "رواه عمر بن الخطاب رضي الله عنه، وقال النووي: «متفق على صحته».";

/** Reveal words of several paragraphs in order with one progress value. */
const useWords = (parts: string[], p: number) => {
  const counts = parts.map((s) => s.split(" ").length);
  const total = counts.reduce((a, b) => a + b, 0);
  let shown = p * total;
  return parts.map((s, i) => {
    const words = s.split(" ");
    const here = shown;
    shown -= counts[i];
    return words.map((w, k) => ({ w, a: clamp01(here - k) }));
  });
};

const Words: React.FC<{ words: { w: string; a: number }[] }> = ({ words }) => (
  <>
    {words.map(({ w, a }, k) => (
      <span key={k} style={{ opacity: a }}>
        {w}
        {k < words.length - 1 ? " " : ""}
      </span>
    ))}
  </>
);

export const SourceCard: React.FC<{ a: number; link: ChatState["link"] }> = ({ a, link }) => (
  <div
    data-m="source"
    style={{
      marginTop: 16,
      border: `1px solid ${CHAT.line}`,
      borderRadius: 14,
      background: CHAT.card,
      padding: "14px 18px",
      opacity: a,
      transform: `translateY(${(1 - a) * 12}px)`,
      boxShadow: "0 6px 18px rgba(60,40,30,0.06)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: LATIN_FONT, fontSize: 12, fontWeight: 600, color: "#fff", background: CHAT.accent, borderRadius: 4, padding: "0 6px", lineHeight: "18px" }}>1</span>
      <span style={{ fontFamily: UI_FONT, fontSize: 13.5, color: CHAT.muted }}>المصدر · من الجامع</span>
    </div>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 10 }}>
      <AppIcon size={44} radius={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div data-m="src-title" style={{ display: "inline-block", fontFamily: UI_FONT, fontSize: 18, fontWeight: 700, color: CHAT.ink, lineHeight: 1.4 }}>{demo.book.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
          <span data-m="src-author" style={{ fontFamily: UI_FONT, fontSize: 14.5, color: CHAT.soft }}>{demo.book.author}</span>
          <span style={{ color: CHAT.line }}>|</span>
          <span data-m="src-page" style={{ fontFamily: UI_FONT, fontSize: 14.5, color: CHAT.accent, background: CHAT.accentSoft, borderRadius: 6, padding: "0 8px" }}>{`صفحة ${demo.page.number}`}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <div
            data-m="src-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              borderRadius: 8,
              background: link.hover > 0 ? `rgba(174,71,33,${0.07 * link.hover})` : CHAT.well,
              border: `1px solid ${link.hover > 0 ? `rgba(174,71,33,${0.3 * link.hover})` : CHAT.line}`,
              transform: `scale(${1 - 0.03 * link.pressed})`,
            }}
          >
            <Icon name="link" size={15} color={CHAT.accent} />
            <span style={{ fontFamily: MONO, fontSize: 14.5, color: CHAT.accent, direction: "ltr", textDecoration: link.hover > 0.5 ? "underline" : "none" }}>{demo.page.url.replace("https://", "")}</span>
            <Icon name="external-link" size={14} color={CHAT.accent} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: CHAT.well, border: `1px solid ${CHAT.line}` }}>
            <Icon name="file-text" size={15} color={CHAT.soft} />
            <span style={{ fontFamily: LATIN_FONT, fontSize: 13.5, fontWeight: 600, color: CHAT.soft }}>PDF</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Answer: React.FC<{ s: ChatState }> = ({ s }) => {
  const [w1, wq, w2] = useWords([P1, QUOTE, P2], s.answer);
  return (
    <div data-m="answer" style={{ fontFamily: UI_FONT, fontSize: 18.5, lineHeight: 1.8, color: CHAT.ink }}>
      <div>
        <Words words={w1} />
      </div>
      <div data-m="quote" style={{ opacity: Math.min(1, wq[0].a * 2), margin: "10px 0", padding: "8px 18px", borderRight: `3px solid ${CHAT.accent}`, background: CHAT.well, borderRadius: "4px 0 0 4px", fontFamily: READING_FONT, fontSize: 23, lineHeight: 1.75 }}>
        <Words words={wq} />
      </div>
      <div>
        <Words words={w2} />
        <span style={{ fontFamily: LATIN_FONT, fontSize: 11, fontWeight: 600, color: CHAT.accent, background: CHAT.accentSoft, borderRadius: 4, padding: "1px 5px", marginRight: 6, verticalAlign: "3px", opacity: w2[w2.length - 1].a }}>1</span>
      </div>
      {s.source > 0 ? <SourceCard a={s.source} link={s.link} /> : null}
    </div>
  );
};

// ------------------------------------------------------------------ conversation layout

export const USER_Y = 20;
export const USER_H = 96;
export const STATUS_Y = USER_Y + USER_H + 26;
export const STEPS_Y = STATUS_Y + 44;

/** Y of the answer block (content coordinates) for the current steps state. */
export const answerY = (s: ChatState) => {
  const steps = s.steps.reduce((acc, st) => acc + stepHeight(st), 0);
  return STEPS_Y + steps * (1 - s.status.collapsed) + 6;
};

const StatusRow: React.FC<{ s: ChatState; t: number }> = ({ s, t }) => {
  const c = s.status.collapsed;
  const shimmer = (t * 0.9) % 1;
  return (
    <div style={{ position: "absolute", left: 0, width: COL.w, top: STATUS_Y, height: 32, display: "flex", alignItems: "center", gap: 12, opacity: s.status.show }}>
      <div style={{ width: 30, height: 30, borderRadius: 15, background: CHAT.send, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="sparkles" size={16} color="#fff" />
      </div>
      <div style={{ position: "relative", height: 30, flex: 1 }}>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 3,
            fontFamily: UI_FONT,
            fontSize: 16,
            color: CHAT.muted,
            opacity: 1 - c,
            backgroundImage: `linear-gradient(to left, ${CHAT.muted} ${shimmer * 100 - 20}%, ${CHAT.ink} ${shimmer * 100}%, ${CHAT.muted} ${shimmer * 100 + 20}%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          يبحث في الجامع…
        </div>
        <div data-m="status-summary" style={{ position: "absolute", right: 0, top: 0, display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${CHAT.line}`, background: CHAT.card, opacity: c }}>
          <AppIcon size={20} radius={5} />
          <span style={{ fontFamily: UI_FONT, fontSize: 14.5, color: CHAT.soft }}>{`استخدم الجامع · ${s.steps.length} أدوات`}</span>
          <Icon name="chevron-down" size={15} color={CHAT.muted} />
        </div>
      </div>
    </div>
  );
};

const Conversation: React.FC<{ s: ChatState; t: number }> = ({ s, t }) => {
  let y = STEPS_Y;
  const steps = s.steps.map((st, i) => {
    const el = <Step key={i} s={st} t={t} y={y} />;
    y += stepHeight(st);
    return el;
  });
  const stepsVisible = 1 - s.status.collapsed;
  return (
    <div style={{ position: "absolute", left: COL.x, top: VIEW.top - s.scroll, width: COL.w, height: 2000 }}>
      {s.sent > 0 ? (
        <div
          data-m="user-msg"
          style={{
            position: "absolute",
            right: 0,
            top: USER_Y,
            width: 520,
            height: USER_H,
            boxSizing: "border-box",
            padding: "14px 20px",
            borderRadius: 20,
            borderTopRightRadius: 6,
            background: CHAT.bubble,
            fontFamily: UI_FONT,
            fontSize: 18.5,
            lineHeight: 1.75,
            color: CHAT.ink,
            opacity: s.sent,
            transform: `translateY(${(1 - s.sent) * 260}px) scale(${0.96 + 0.04 * s.sent})`,
            transformOrigin: "100% 100%",
          }}
        >
          {demo.question}
        </div>
      ) : null}
      {s.status.show > 0 ? <StatusRow s={s} t={t} /> : null}
      {stepsVisible > 0 ? <div style={{ position: "absolute", inset: 0, opacity: stepsVisible, transform: `scaleY(${0.9 + 0.1 * stepsVisible})`, transformOrigin: `50% ${STEPS_Y}px` }}>{steps}</div> : null}
      {s.answer > 0 ? (
        <div style={{ position: "absolute", left: 0, width: COL.w, top: answerY(s) }}>
          <Answer s={s} />
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ composer and connector

const Composer: React.FC<{ s: ChatState }> = ({ s }) => {
  const c = s.composer;
  const has = c.text.length > 0;
  const on = s.connected;
  return (
    <div
      data-m="composer"
      style={{
        position: "absolute",
        left: COMPOSER.x,
        top: COMPOSER.y,
        width: COMPOSER.w,
        height: COMPOSER.h,
        boxSizing: "border-box",
        borderRadius: 24,
        background: "#fff",
        border: `1px solid ${c.focus > 0.5 ? "#d9d0ca" : CHAT.line}`,
        boxShadow: `0 8px 28px rgba(60,40,30,${0.06 + 0.04 * c.focus}), 0 1px 2px rgba(60,40,30,0.05)`,
      }}
    >
      <div data-m="composer-text" style={{ position: "absolute", right: 22, left: 22, top: 14, height: 56, fontFamily: UI_FONT, fontSize: 18.5, lineHeight: 1.6, color: has ? CHAT.ink : CHAT.muted, overflow: "hidden" }}>
        {has ? c.text : "اسأل أي شيء…"}
        {c.caret ? <span style={{ display: "inline-block", width: 1.5, height: 22, background: CHAT.ink, marginRight: 1, verticalAlign: "-5px" }} /> : null}
      </div>
      <div style={{ position: "absolute", right: 14, left: 14, bottom: 12, height: 36, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${CHAT.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={18} color={CHAT.soft} />
        </div>
        <div
          data-m="pill"
          style={{
            position: "relative",
            height: 34,
            borderRadius: 17,
            padding: "0 12px 0 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${on > 0 ? `rgba(174,71,33,${0.3 * on})` : CHAT.line}`,
            background: on > 0 ? `rgba(247,235,227,${on})` : "#fff",
            transform: `scale(${1 - 0.04 * (c.pillPressed ?? 0)})`,
          }}
        >
          <div style={{ width: 22, height: 22, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - on }}>
              <Icon name="plug" size={18} color={CHAT.muted} style={{ margin: 2 }} />
            </div>
            <div data-m="pill-icon" style={{ position: "absolute", inset: 0, opacity: on > 0.05 ? 1 : 0 }}>
              <AppIcon size={22} radius={6} />
            </div>
          </div>
          <span style={{ fontFamily: UI_FONT, fontSize: 14.5, color: on > 0.5 ? CHAT.accent : CHAT.soft, fontWeight: on > 0.5 ? 700 : 400 }}>{on > 0.5 ? "الجامع" : "الموصلات"}</span>
          {on > 0 ? <Icon name="check" size={15} color={CHAT.accent} strokeWidth={2.6} style={{ opacity: on }} /> : null}
        </div>
        <div style={{ flex: 1 }} />
        <Icon name="mic" size={19} color={CHAT.muted} />
        <div data-m="send" style={{ width: 38, height: 38, borderRadius: 19, background: has ? CHAT.send : "#e8e2de", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.08 * c.sendPressed})` }}>
          <Icon name="arrow-up" size={19} color="#fff" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
};

const TOOL_LABELS: Record<string, string> = {
  search: "بحث في النصوص",
  list_books: "الكتب",
  get_book: "ملفات الكتاب",
  get_page: "قراءة صفحة",
  list_authors: "المؤلفون",
  list_categories: "الموضوعات",
  list_libraries: "المكتبات",
};

export const POPOVER = { x: 470, y: 352, w: 470, h: 312 };

const Popover: React.FC<{ s: ChatState }> = ({ s }) => {
  const p = s.popover;
  if (p.open <= 0) return null;
  const n = Math.round(63000 * p.count);
  return (
    <div
      data-m="popover"
      style={{
        position: "absolute",
        left: POPOVER.x,
        top: POPOVER.y,
        width: POPOVER.w,
        height: POPOVER.h,
        boxSizing: "border-box",
        borderRadius: 18,
        background: "#fff",
        border: `1px solid ${CHAT.line}`,
        boxShadow: "0 24px 60px rgba(60,40,30,0.16), 0 4px 12px rgba(60,40,30,0.06)",
        padding: "18px 20px",
        opacity: p.open,
        transform: `translateY(${(1 - p.open) * 14}px) scale(${0.97 + 0.03 * p.open})`,
        transformOrigin: "70% 100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <AppIcon size={44} radius={11} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: HEADING_FONT, fontSize: 22, color: CHAT.ink, lineHeight: 1.2 }}>الجامع</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: CHAT.ok }} />
            <span style={{ fontFamily: UI_FONT, fontSize: 14, color: CHAT.soft }}>متصل · خادم</span>
            <span style={{ fontFamily: LATIN_FONT, fontSize: 13, fontWeight: 600, color: CHAT.soft }}>MCP</span>
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div data-m="pop-count" style={{ fontFamily: LATIN_FONT, fontSize: 30, fontWeight: 600, color: CHAT.accent, direction: "ltr", letterSpacing: -0.5, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{`${n.toLocaleString("en-US")}+`}</div>
          <div style={{ fontFamily: UI_FONT, fontSize: 14, color: CHAT.muted, textAlign: "left" }}>{`كتاب من ${demo.libraries.length} مكتبات`}</div>
        </div>
      </div>
      <div style={{ height: 1, background: CHAT.line, margin: "14px 0 12px" }} />
      <div style={{ fontFamily: UI_FONT, fontSize: 13.5, color: CHAT.muted, marginBottom: 8 }}>{`${demo.tools.length} أدوات للقراءة فقط`}</div>
      <div data-m="pop-tools" style={{ display: "flex", flexWrap: "wrap", gap: 7, direction: "ltr" }}>
        {demo.tools.map((name, i) => {
          const a = clamp01(p.tools * demo.tools.length - i);
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 7, background: CHAT.well, border: `1px solid ${CHAT.line}`, opacity: a, transform: `translateY(${(1 - a) * 6}px)` }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: CHAT.ink }}>{name}</span>
              <span style={{ fontFamily: UI_FONT, fontSize: 12, color: CHAT.muted, direction: "rtl" }}>{TOOL_LABELS[name]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** The assistant window (title bar + app area), drawn at APP_W × WIN_H. */
export const ChatWindow: React.FC<{ s: ChatState; t: number; overlay?: React.ReactNode }> = ({ s, t, overlay }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: WIN_H, background: CHAT.bg, overflow: "hidden", direction: "rtl", fontFamily: UI_FONT }}>
    <TitleBar title="مساعدك الذكي" />
    <div style={{ position: "absolute", left: 0, top: TITLE_H, width: APP_W, height: APP_H, overflow: "hidden" }}>
      {/* conversation (clipped between header and composer) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: VIEW.bottom, overflow: "hidden" }}>
        <Conversation s={s} t={t} />
        <div style={{ position: "absolute", left: 0, right: 0, top: VIEW.bottom - 30, height: 30, background: `linear-gradient(to bottom, rgba(253,252,251,0), ${CHAT.bg})` }} />
      </div>
      {/* header */}
      <div style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: HEADER_H, background: CHAT.header, display: "flex", alignItems: "center", padding: "0 22px", boxSizing: "border-box", gap: 8 }}>
        <span style={{ fontFamily: UI_FONT, fontSize: 17, fontWeight: 700, color: CHAT.ink }}>مساعدك الذكي</span>
        <Icon name="chevron-down" size={16} color={CHAT.muted} />
        <div style={{ flex: 1 }} />
        <Icon name="square-pen" size={19} color={CHAT.soft} />
      </div>
      {s.greeting > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 268, textAlign: "center", opacity: s.greeting, transform: `translateY(${(1 - s.greeting) * -16}px)` }}>
          <div style={{ fontFamily: HEADING_FONT, fontSize: 40, color: CHAT.ink }}>كيف أساعدك اليوم؟</div>
        </div>
      ) : null}
      <Composer s={s} />
      <Popover s={s} />
      {overlay}
    </div>
  </div>
);

// ------------------------------------------------------------------ browser (the cited page on aljam3.com)

export const BROWSER = { x: 34, y: 58, w: 1092, bar: 46 };
export const SHOT = { w: 2880, h: 1800 };
export const shotScale = BROWSER.w / SHOT.w;
/** Converts screenshot pixels to window coordinates (top of the window = 0, title bar included). */
export const shotToWin = (x: number, y: number) => ({ x: BROWSER.x + x * shotScale, y: BROWSER.y + BROWSER.bar + y * shotScale });

export const BrowserWindow: React.FC<{ open: number; loaded: number; url: string; marks: { x: number; y: number; w: number; h: number; a: number }[]; origin: { x: number; y: number } }> = ({ open, loaded, url, marks, origin }) => {
  if (open <= 0) return null;
  const h = BROWSER.bar + SHOT.h * shotScale;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(30,22,18,${0.28 * open})` }} />
      <div
        style={{
          position: "absolute",
          left: BROWSER.x,
          top: BROWSER.y,
          width: BROWSER.w,
          height: h,
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 40px 100px rgba(40,25,18,0.35), 0 0 0 1px rgba(0,0,0,0.08)",
          transformOrigin: `${origin.x - BROWSER.x}px ${origin.y - BROWSER.y}px`,
          transform: `scale(${0.12 + 0.88 * open})`,
          opacity: Math.min(1, open * 2.5),
          direction: "ltr",
        }}
      >
        <div style={{ height: BROWSER.bar, background: "#f1ece7", borderBottom: "1px solid #e2d9d1", display: "flex", alignItems: "center", gap: 14, padding: "0 16px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, height: 30, borderRadius: 15, background: "#fff", border: "1px solid #e2d9d1", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", fontFamily: LATIN_FONT, fontSize: 15, color: "#3b2f2c" }}>
            <Icon name="lock" size={13} color="#7d716c" />
            <span>{url}</span>
          </div>
        </div>
        <div style={{ position: "relative", width: BROWSER.w, height: SHOT.h * shotScale, background: "#fff" }}>
          <Img src={staticFile("web/source-page.png")} style={{ width: BROWSER.w, height: SHOT.h * shotScale, opacity: loaded }} />
        </div>
      </div>
      {marks.map((m, i) =>
        m.a > 0 ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: m.x,
              top: m.y,
              width: m.w * Math.min(1, m.a * 1.4),
              height: m.h,
              marginLeft: m.w * (1 - Math.min(1, m.a * 1.4)),
              background: "rgba(225,110,74,0.18)",
              boxShadow: `inset 0 -2.5px 0 ${CHAT.accent}`,
              borderRadius: 3,
              opacity: Math.min(1, m.a * 3),
              mixBlendMode: "multiply",
            }}
          />
        ) : null,
      )}
    </div>
  );
};
