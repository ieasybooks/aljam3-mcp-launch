import React from "react";
import { Img, staticFile } from "remotion";
import { cue as C, S } from "../lib/timeline";
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, prog, rand } from "../lib/time";
import { FILM, TITLE_H } from "../ui/theme";
import { HEADING_FONT, UI_FONT } from "../lib/fonts";
import { Icon } from "../ui/kit";
import { Layout } from "./layout";
import { Logo, sheenAt } from "./Logo";
import { T } from "./director";

export const I = {
  q: S("intro1") - 0.15,
  a: C("intro1", "فيجيبك") - 0.15,
  doubt: C("intro2", "كتاب") - 0.15,
  page: C("intro2", "جاء") - 0.05,
  gather: S("intro3") - 0.35,
  bloom: C("intro3", "الجامع") - 0.1,
  logo: C("intro3", "الجامع"),
  subtitle: C("intro3", "مساعدك") - 0.1,
  shrink: T.shrink,
  launch: T.launch,
  dock: T.dock,
};

/** Where the composer's connector icon sits (window pixels, measured with the Measure composition). */
export const PILL_ICON = { x: 879, y: 761 + TITLE_H, size: 22 };

const QUESTION = "ما معنى حديث «إنما الأعمال بالنيات»؟";
const REPLY = "معناه أن الأعمال تُعتبر بالنيات، فلكل امرئ ما نواه.";

/** The opening exchange: an answer with nowhere to check it. */
const Prelude: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  const { W, H, u } = L;
  const land = L.format === "landscape";
  const out = prog(t, I.gather, I.gather + 0.7, easeInOutCubic);
  if (t < I.q - 0.1 || out >= 1) return null;
  const colW = land ? 900 * u : W - 110 * u;
  const x0 = (W - colW) / 2;
  const fs = (land ? 40 : 44) * u;
  const q = prog(t, I.q, I.q + 0.5, easeOutCubic);
  const a = prog(t, I.a - 0.25, I.a + 0.15, easeOutCubic);
  const words = REPLY.split(" ");
  const shown = prog(t, I.a, I.a + 1.25, (x) => x) * words.length;
  const doubt = prog(t, I.doubt, I.doubt + 0.4, easeInOutCubic);
  const chip1 = prog(t, I.doubt + 0.05, I.doubt + 0.45, easeOutCubic);
  const chip2 = prog(t, I.page, I.page + 0.4, easeOutCubic);
  const top = H / 2 - (land ? 230 : 300) * u;
  return (
    <div style={{ position: "absolute", left: x0, top, width: colW, opacity: 1 - out, filter: `blur(${out * 8}px)`, transform: `scale(${1 - 0.06 * out})`, transformOrigin: `50% ${H / 2 - top}px` }}>
      <div style={{ display: "flex", justifyContent: "flex-start", direction: "rtl" }}>
        <div
          style={{
            maxWidth: colW * 0.82,
            padding: `${22 * u}px ${34 * u}px`,
            borderRadius: 34 * u,
            borderTopRightRadius: 10 * u,
            background: "rgba(255,255,255,0.09)",
            border: `${1.5 * u}px solid rgba(255,255,255,0.08)`,
            fontFamily: UI_FONT,
            fontSize: fs,
            lineHeight: 1.5,
            color: FILM.cream,
            opacity: q,
            transform: `translateY(${(1 - q) * 30 * u}px)`,
          }}
        >
          {QUESTION}
        </div>
      </div>
      <div style={{ display: "flex", gap: 22 * u, marginTop: 46 * u, direction: "rtl", opacity: a, transform: `translateY(${(1 - a) * 24 * u}px)` }}>
        <div style={{ width: 58 * u, height: 58 * u, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 6 * u }}>
          <Icon name="sparkles" size={28 * u} color={FILM.cream} />
        </div>
        <div style={{ fontFamily: UI_FONT, fontSize: fs, lineHeight: 1.6, color: FILM.cream, opacity: 1 - 0.55 * doubt, filter: `blur(${doubt * 1.2}px)` }}>
          {words.map((w, i) => (
            <span key={i} style={{ opacity: clamp(shown - i) }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 18 * u, marginTop: 34 * u, marginRight: 80 * u, direction: "rtl" }}>
        {[
          { icon: "book-open", label: "أي كتاب؟", a: chip1 },
          { icon: "file-text", label: "أي صفحة؟", a: chip2 },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              padding: `${12 * u}px ${24 * u}px`,
              borderRadius: 999,
              border: `${2 * u}px dashed rgba(225,110,74,0.75)`,
              color: FILM.ember,
              fontFamily: HEADING_FONT,
              fontSize: (land ? 34 : 38) * u,
              opacity: c.a,
              transform: `translateY(${(1 - c.a) * 16 * u}px) scale(${0.94 + 0.06 * c.a})`,
            }}
          >
            <Icon name={c.icon} size={30 * u} color={FILM.ember} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const N = 120;
const PALETTE = ["#ae4721", "#e16e4a", "#c98a5c", "#8c5a43", "#dcb48e", "#f1ddc9", "#b8653d"];

/** Book spines pour in from every side and gather into one point. */
const Spines: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  const { W, H, u } = L;
  if (t < I.gather - 0.6 || t > I.bloom + 0.3) return null;
  const R = Math.max(W, H) * 0.62;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const depth = 0.35 + 0.65 * rand(i * 3.1);
    const w = (5 + 9 * rand(i * 7.7)) * u * (0.6 + 0.6 * depth);
    const h = (34 + 70 * rand(i * 5.3)) * u * (0.6 + 0.6 * depth);
    const color = PALETTE[Math.floor(rand(i * 11.9) * PALETTE.length)];
    const a0 = rand(i * 1.37) * Math.PI * 2;
    const r0 = R * (0.55 + 0.6 * rand(i * 2.71));
    const s0 = I.gather - 0.5 + rand(i * 8.8) * 0.5;
    const g = prog(t, s0, I.bloom - 0.08, easeInOutCubic);
    const ang = a0 + g * 2.0;
    const r = r0 * (1 - g);
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r * (L.format === "landscape" ? 0.72 : 1);
    const appear = prog(t, s0, s0 + 0.5, easeOutCubic);
    const op = appear * (0.3 + 0.6 * depth) * (1 - prog(t, I.bloom - 0.1, I.bloom + 0.15));
    const rot = (rand(i * 12.3) - 0.5) * 30 + g * 120;
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: W / 2 + x - w / 2,
          top: H / 2 + y - h / 2,
          width: w,
          height: h,
          borderRadius: w * 0.35,
          background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0.25) 100%)`,
          opacity: op,
          transform: `rotate(${rot}deg) scale(${1 - 0.7 * g})`,
          boxShadow: depth > 0.8 ? `0 0 ${10 * u}px rgba(225,110,74,0.35)` : undefined,
        }}
      />,
    );
  }
  return <>{items}</>;
};

/** Bloom: the gathered point flashes and paper spreads from it. Returns the paper circle radius. */
export const bloomRadius = (t: number, L: Layout) => prog(t, I.bloom - 0.05, I.bloom + 1.0, easeInOutCubic) * Math.hypot(L.W, L.H) * 0.66;

export const IntroForeground: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  if (t > I.dock + 0.5) return null;
  const { W, H, u } = L;
  const flash = Math.max(0, 1 - Math.abs(t - I.bloom - 0.05) / 0.3);
  const point = prog(t, I.bloom - 0.7, I.bloom, easeInOutCubic) * (1 - prog(t, I.bloom, I.bloom + 0.3));
  const subtitle = prog(t, I.subtitle, I.subtitle + 0.55, easeOutCubic) * (1 - prog(t, I.shrink - 0.1, I.shrink + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Prelude t={t} L={L} />
      <Spines t={t} L={L} />
      {point > 0 ? (
        <div
          style={{
            position: "absolute",
            left: W / 2 - 160 * u,
            top: H / 2 - 160 * u,
            width: 320 * u,
            height: 320 * u,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,246,236,1) 0%, rgba(255,214,186,0.85) 10%, rgba(240,150,105,0.5) 26%, rgba(174,71,33,0.0) 62%)",
            opacity: point,
            transform: `scale(${0.5 + point * 0.7})`,
          }}
        />
      ) : null}
      {flash > 0 ? (
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(255,246,236,${0.9 * flash}) 0%, rgba(255,230,210,${0.35 * flash}) 30%, rgba(255,230,210,0) 70%)` }} />
      ) : null}
      {subtitle > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H / 2 + (L.format === "landscape" ? 215 : 255) * u,
            textAlign: "center",
            fontFamily: HEADING_FONT,
            fontSize: 58 * u,
            color: FILM.ink,
            opacity: subtitle,
            transform: `translateY(${(1 - subtitle) * 14 * u}px)`,
          }}
        >
          للمساعدات الذكية
        </div>
      ) : null}
    </div>
  );
};

/** The Aljam3 logo writes itself, becomes the app icon, and docks in the assistant's composer. */
export const IntroIcon: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  if (t < I.logo - 0.05 || t > I.dock + 0.3) return null;
  const { W, H, u } = L;
  const land = L.format === "landscape";
  const shrink = prog(t, I.shrink, I.shrink + 0.65, easeInOutCubic);
  const fly = prog(t, I.launch + 0.15, I.dock, easeInOutCubic);
  const tile0 = 170 * u;
  const tile1 = PILL_ICON.size * L.win.s;
  const home = { x: W / 2, y: H / 2 - (land ? 30 : 40) * u };
  const dock = { x: L.win.x + PILL_ICON.x * L.win.s, y: L.win.y + PILL_ICON.y * L.win.s };
  // a gentle arc on the way to the composer
  const cx = lerp(home.x, dock.x, fly);
  const cy = lerp(home.y, dock.y, fly) - Math.sin(Math.PI * fly) * 90 * u;
  const tile = lerp(tile0, tile1, fly);
  const logoW0 = (land ? 520 : 600) * u;
  const logoW = shrink < 1 ? lerp(logoW0, tile0 * 0.66, shrink) : tile * 0.66;
  const tileIn = shrink <= 0 ? 0 : easeOutBack(1.3)(clamp((t - I.shrink - 0.15) / 0.55));
  const fade = 1 - prog(t, I.dock - 0.05, I.dock + 0.2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <div
        style={{
          position: "absolute",
          left: cx - tile / 2,
          top: cy - tile / 2,
          width: tile,
          height: tile,
          borderRadius: tile * 0.24,
          background: "#ffffff",
          transform: `scale(${tileIn})`,
          boxShadow: `0 ${30 * (1 - fly) + 2}px ${70 * (1 - fly) + 6}px rgba(110,60,35,0.28)`,
        }}
      />
      <div style={{ position: "absolute", left: cx - logoW / 2, top: cy - (logoW * 288) / 366 / 2 }}>
        <Logo id="intro-logo" width={logoW} color={FILM.terracotta} write={t - I.logo} sheen={sheenAt(t, I.logo + 1.2)} />
      </div>
    </div>
  );
};

export const AppIconImg: React.FC<{ size: number }> = ({ size }) => <Img src={staticFile("brand/app-icon.png")} style={{ width: size, height: size }} />;
