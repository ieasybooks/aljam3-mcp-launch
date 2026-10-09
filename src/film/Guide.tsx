import React from "react";
import { CAPTIONS, cue as C, E, S } from "../lib/timeline";
import { clamp, easeInOutCubic, easeOutCubic, lerp, prog } from "../lib/time";
import { FILM } from "../ui/theme";
import { HEADING_FONT, LATIN_FONT, UI_FONT } from "../lib/fonts";
import { Icon } from "../ui/kit";
import { CHAPTERS, T } from "./director";
import { Layout } from "./layout";

const ink = FILM.ink;
const soft = FILM.inkSoft;
const acc = FILM.terracotta;
const COUNT = `0${CHAPTERS.length}`;

const mixColor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(",")})`;
};

const Chip: React.FC<{ label: string; icon: string; u: number; latin?: boolean }> = ({ label, icon, u, latin = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 * u, padding: `${9 * u}px ${20 * u}px`, borderRadius: 999, border: `${1.5 * u}px solid rgba(59,47,44,0.22)`, color: ink, fontFamily: latin ? LATIN_FONT : UI_FONT, fontWeight: latin ? 500 : 400, fontSize: 23 * u, direction: "ltr" }}>
    <Icon name={icon} size={20 * u} color={acc} />
    <span>{label}</span>
  </div>
);

/** “Aljam3 for AI assistants” title block shown while the connector is introduced. */
const TitleBlock: React.FC<{ t: number; L: Layout; align: "start" | "center" }> = ({ t, L, align }) => {
  const u = L.u;
  const a = prog(t, S("app") - 0.35, S("app") + 0.4, easeOutCubic);
  const chips = prog(t, C("app", "MCP") - 0.1, C("app", "MCP") + 0.4, easeOutCubic);
  const exitAt = L.format === "landscape" ? C("app", "متناول") - 0.1 : T.ch1 - 0.55;
  const out = prog(t, exitAt, exitAt + 0.55, easeInOutCubic);
  if (a <= 0 || out >= 1) return null;
  const land = L.format === "landscape";
  return (
    <div style={{ opacity: a * (1 - out), transform: `translateY(${(1 - a) * 24 * u - out * 30 * u}px)`, textAlign: align === "center" ? "center" : "right" }}>
      <div style={{ display: "inline-block", fontFamily: UI_FONT, fontSize: 24 * u, color: acc, background: "rgba(174,71,33,0.09)", borderRadius: 999, padding: `${6 * u}px ${18 * u}px` }}>جديد · مجاني</div>
      {land ? (
        <>
          <div style={{ fontFamily: HEADING_FONT, fontSize: 116 * u, lineHeight: 1.3, color: ink, marginTop: 10 * u }}>الجامع</div>
          <div style={{ fontFamily: HEADING_FONT, fontSize: 60 * u, lineHeight: 1.3, color: ink, marginTop: 10 * u }}>للمساعدات الذكية</div>
          <div style={{ fontFamily: UI_FONT, fontSize: 28 * u, lineHeight: 1.6, color: soft, marginTop: 16 * u, maxWidth: 540 * u }}>
            ابحث في الكتب الإسلامية، واقرأ النصوص في سياقها، وارجع إلى مصادرها مع مساعدك الذكي.
          </div>
        </>
      ) : (
        <div style={{ fontFamily: HEADING_FONT, fontSize: 80 * u, lineHeight: 1.25, color: ink, marginTop: 14 * u }}>الجامع للمساعدات الذكية</div>
      )}
      <div style={{ display: "flex", gap: 12 * u, marginTop: (land ? 26 : 18) * u, opacity: chips, transform: `translateY(${(1 - chips) * 12 * u}px)`, justifyContent: align === "center" ? "center" : "flex-start", direction: "rtl" }}>
        <Chip label="MCP" icon="plug" u={u} />
        <Chip label="ChatGPT" icon="message-square-text" u={u} />
        <Chip label="Claude" icon="sparkles" u={u} />
      </div>
    </div>
  );
};

const tocStart = () => E("app") - 0.15;

/** Landscape guide: a table of contents whose active chapter expands with its points. */
export const SidePanel: React.FC<{ t: number; L: Layout; fade: number }> = ({ t, L, fade }) => {
  const u = L.u;
  const { panel } = L;
  if (fade <= 0) return null;
  const tocIn = (i: number) => prog(t, tocStart() + i * 0.12, tocStart() + 0.55 + i * 0.12, easeOutCubic);
  const rowH = 76 * u;
  const titleH = 80 * u;
  const bulletH = 54 * u;
  const exp = CHAPTERS.map((ch, i) => prog(t, ch.t0 - 0.15, ch.t0 + 0.55, easeInOutCubic) * (i < CHAPTERS.length - 1 ? 1 - prog(t, ch.t1 - 0.15, ch.t1 + 0.55, easeInOutCubic) : 1));
  const heights = CHAPTERS.map((ch, i) => rowH + exp[i] * (titleH - rowH + 30 * u + 80 * u + ch.bullets.length * bulletH));
  const total = heights.reduce((a, b) => a + b, 0);
  const top = panel.y + (panel.h - total) / 2;
  let y = top;
  const centers: number[] = [];
  const rows = CHAPTERS.map((ch, i) => {
    const e = exp[i];
    const done = t >= ch.t1 + 0.2;
    const active = e > 0.01;
    const rowTop = y;
    y += heights[i];
    centers.push(rowTop + lerp(rowH, titleH, e) / 2);
    const ap = tocIn(i);
    return (
      <div key={ch.n} style={{ position: "absolute", left: panel.x, width: panel.w, top: rowTop, height: heights[i], opacity: ap, transform: `translateX(${(1 - ap) * -30 * u}px)` }}>
        <div style={{ position: "absolute", right: 0, top: 0, height: lerp(rowH, titleH, e), display: "flex", alignItems: "center", gap: 22 * u }}>
          <div
            style={{
              width: 54 * u,
              height: 54 * u,
              borderRadius: "50%",
              border: `${2 * u}px solid ${active || done ? acc : "rgba(140,120,110,0.35)"}`,
              background: active ? acc : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: LATIN_FONT,
              fontWeight: 600,
              fontSize: 20 * u,
              color: active ? "#fff" : done ? acc : soft,
              flexShrink: 0,
              direction: "ltr",
            }}
          >
            {done && !active ? <Icon name="check" size={24 * u} color={acc} strokeWidth={2.6} /> : `0${ch.n}`}
          </div>
          <div style={{ fontFamily: HEADING_FONT, fontSize: lerp(36, 54, e) * u, color: active ? ink : soft, whiteSpace: "nowrap" }}>{ch.title}</div>
        </div>
        {e > 0.02 ? (
          <div style={{ position: "absolute", right: 76 * u, left: 0, top: titleH + 6 * u, opacity: clamp((e - 0.35) / 0.65) }}>
            <div style={{ fontFamily: HEADING_FONT, fontSize: 42 * u, lineHeight: 1.3, color: acc }}>{ch.headline}</div>
            <div style={{ marginTop: 18 * u }}>
              {ch.bullets.map((b, k) => {
                const ba = prog(t, b.t - 0.25, b.t + 0.3, easeOutCubic);
                const latest = k === ch.bullets.length - 1 || t < ch.bullets[k + 1].t - 0.2;
                return (
                  <div key={k} style={{ height: bulletH, display: "flex", alignItems: "center", gap: 14 * u, opacity: 0.18 + 0.82 * ba, transform: `translateX(${(1 - ba) * -12 * u}px)` }}>
                    <div style={{ width: 10 * u, height: 10 * u, borderRadius: "50%", background: ba > 0.5 && latest ? acc : "rgba(140,120,110,0.45)", flexShrink: 0, boxShadow: ba > 0.5 && latest ? `0 0 0 ${5 * u}px rgba(174,71,33,0.15)` : undefined }} />
                    <div style={{ fontFamily: UI_FONT, fontSize: 29 * u, color: ink, whiteSpace: "nowrap" }}>{b.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  });
  const ringGap = 28 * u + 9 * u;
  const segments = centers.slice(1).map((c1, i) => {
    const y0 = centers[i] + ringGap;
    const y1 = c1 - ringGap;
    const fill = prog(t, CHAPTERS[i].t1 - 0.1, CHAPTERS[i].t1 + 0.4, easeInOutCubic);
    return y1 - y0 > 2 * u ? (
      <div key={i} style={{ position: "absolute", left: panel.x + panel.w - 28 * u, width: 2 * u, top: y0, height: y1 - y0, borderRadius: u, background: "rgba(140,120,110,0.25)", overflow: "hidden", opacity: tocIn(i + 1) }}>
        <div style={{ width: "100%", height: `${fill * 100}%`, background: acc }} />
      </div>
    ) : null;
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <div style={{ position: "absolute", left: panel.x, width: panel.w, top: panel.y + panel.h / 2 - 300 * u }}>
        <TitleBlock t={t} L={L} align="start" />
      </div>
      {segments}
      {rows}
    </div>
  );
};

/** Portrait header: story-style chapter progress, chapter label and headline. */
export const PortraitHeader: React.FC<{ t: number; L: Layout; fade: number }> = ({ t, L, fade }) => {
  const u = L.u;
  const { panel } = L;
  if (fade <= 0) return null;
  const barsIn = prog(t, tocStart(), tocStart() + 0.6, easeOutCubic);
  const gap = 12 * u;
  const n = CHAPTERS.length;
  const segW = (panel.w - gap * (n - 1)) / n;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <div style={{ position: "absolute", left: panel.x, width: panel.w, top: panel.y - 10 * u }}>
        <TitleBlock t={t} L={L} align="center" />
      </div>
      <div style={{ position: "absolute", left: panel.x, width: panel.w, top: panel.y - 40 * u, height: 8 * u, display: "flex", flexDirection: "row", direction: "rtl", gap, opacity: barsIn }}>
        {CHAPTERS.map((ch) => {
          const f = prog(t, ch.t0, ch.t1, (x) => x);
          return (
            <div key={ch.n} style={{ width: segW, height: 8 * u, borderRadius: 8 * u, background: "rgba(140,120,110,0.22)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${f * 100}%`, background: acc, borderRadius: 8 * u }} />
            </div>
          );
        })}
      </div>
      {CHAPTERS.map((ch) => {
        const a = prog(t, ch.t0 - 0.2, ch.t0 + 0.45, easeOutCubic) * (1 - prog(t, ch.t1 - 0.25, ch.t1 + 0.15, easeInOutCubic));
        if (a <= 0) return null;
        return (
          <div key={ch.n} style={{ position: "absolute", left: panel.x, width: panel.w, top: panel.y + 30 * u, textAlign: "center", opacity: a, transform: `translateY(${(1 - a) * 26 * u}px)` }}>
            <div style={{ fontFamily: UI_FONT, fontSize: 30 * u, color: acc, direction: "rtl" }}>
              <span style={{ direction: "ltr", unicodeBidi: "isolate", fontFamily: LATIN_FONT, fontWeight: 600, fontSize: 26 * u }}>{`0${ch.n} / ${COUNT}`}</span>
              {`  ·  ${ch.title}`}
            </div>
            <div style={{ fontFamily: HEADING_FONT, fontSize: 84 * u, lineHeight: 1.25, color: ink, marginTop: 22 * u }}>{ch.headline}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Word-by-word captions (portrait). */
export const Captions: React.FC<{ t: number; L: Layout; y: number; dark: number }> = ({ t, L, y, dark }) => {
  const u = L.u;
  const chunk = CAPTIONS.find((c) => t >= c.start - 0.12 && t <= c.end + 0.35);
  if (!chunk) return null;
  const a = prog(t, chunk.start - 0.12, chunk.start + 0.1, easeOutCubic) * (1 - prog(t, chunk.end + 0.15, chunk.end + 0.35));
  const words = chunk.text.split(/\s+/);
  const weights = words.map((w) => w.length + 1);
  const totalW = weights.reduce((x, y2) => x + y2, 0);
  let accW = 0;
  const color = mixColor(FILM.ink, "#f6eee7", dark);
  return (
    <div style={{ position: "absolute", left: L.captions!.x, width: L.captions!.w, top: y, textAlign: "center", opacity: a }}>
      <div style={{ display: "inline", fontFamily: UI_FONT, fontSize: 52 * u, lineHeight: 1.55, fontWeight: 600, color }}>
        {words.map((w, i) => {
          const w0 = chunk.start + ((chunk.end - chunk.start) * accW) / totalW;
          accW += weights[i];
          const on = prog(t, w0 - 0.05, w0 + 0.12, easeOutCubic);
          return (
            <span key={i} style={{ opacity: 0.32 + 0.68 * on }}>
              {w.split(/([A-Za-z]+)/).map((part, k) => (/[A-Za-z]/.test(part) ? <span key={k} style={{ fontFamily: LATIN_FONT, fontSize: 46 * u }}>{part}</span> : part))}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};
