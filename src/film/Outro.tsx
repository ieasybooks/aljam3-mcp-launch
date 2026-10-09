import React from "react";
import { Img, staticFile } from "remotion";
import { cue as C, DURATION, E, S } from "../lib/timeline";
import { clamp, easeInOutCubic, easeOutCubic, lerp, prog, rand, typed } from "../lib/time";
import { FILM } from "../ui/theme";
import { HEADING_FONT, LATIN_FONT, UI_FONT } from "../lib/fonts";
import { Icon } from "../ui/kit";
import { Layout } from "./layout";
import { Logo, sheenAt } from "./Logo";
import { T } from "./director";

export const O = {
  start: () => T.tourEnd,
  o1: S("outro1"),
  gpt: C("outro1", "ChatGPT"),
  claude: C("outro1", "وClaude"),
  others: C("outro1", "وغيرهما"),
  o2: S("outro2"),
  url: C("outro2", "أضفه"),
  link: C("outro2", "برابط"),
  copy: C("outro2", "واحد") + 0.25,
  site: C("outro2", "موقع"),
  account: C("outro2", "حساب"),
  key: C("outro2", "مفتاح"),
  gather: E("outro2") + 0.15,
  logo: S("outro3") + 0.05,
  tagline: C("outro3", "المكتبة"),
  end: DURATION,
};

/** Where the assistant's window goes during the outro (applied by the Stage). */
export const outroFrame = (t: number, L: Layout) => {
  const a = prog(t, O.start(), O.start() + 1.1, easeInOutCubic);
  const away = prog(t, O.o2 - 0.5, O.o2 + 0.5, easeInOutCubic);
  if (L.format === "landscape") {
    return { dx: lerp(0, -40, a) - away * 260, dy: lerp(0, 10, a), scale: lerp(1, 0.74, a) - away * 0.1, opacity: 1 - away };
  }
  return { dx: 0, dy: lerp(0, -300, a) - away * 120, scale: lerp(1, 0.86, a) - away * 0.08, opacity: 1 - away };
};

const ClientCard: React.FC<{ title: string; sub: string; icon: string; latin: boolean; u: number; a: number; width: number }> = ({ title, sub, icon, latin, u, a, width }) => (
  <div
    style={{
      width,
      boxSizing: "border-box",
      padding: `${20 * u}px ${26 * u}px`,
      borderRadius: 22 * u,
      background: "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
      border: `${1.5 * u}px solid rgba(255,255,255,0.14)`,
      display: "flex",
      alignItems: "center",
      gap: 20 * u,
      opacity: a,
      transform: `translateY(${(1 - a) * 24 * u}px) scale(${0.96 + 0.04 * a})`,
      direction: "rtl",
    }}
  >
    <div style={{ width: 60 * u, height: 60 * u, borderRadius: 16 * u, background: "rgba(225,110,74,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={30 * u} color={FILM.ember} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: latin ? LATIN_FONT : HEADING_FONT, fontSize: (latin ? 32 : 36) * u, color: "#f6eee7", fontWeight: latin ? 600 : 400, letterSpacing: latin ? -0.3 * u : 0, lineHeight: 1.25 }}>{title}</div>
      <div style={{ fontFamily: UI_FONT, fontSize: 22 * u, color: "#b9aca5", marginTop: 4 * u }}>{sub}</div>
    </div>
    <div style={{ width: 44 * u, height: 44 * u, borderRadius: "50%", background: "rgba(61,143,90,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: clamp(a * 2 - 1) }}>
      <Icon name="check" size={24 * u} color="#7fd29b" strokeWidth={2.6} />
    </div>
  </div>
);

// The guide page's connection card and copy button (pixels in the 2880 × 1800 screenshot).
const URL_BOX = { x: 386, y: 389, w: 757, h: 115 };
const COPY_BTN = { x: 1029, y: 575 };

const Browser: React.FC<{ t: number; w: number; u: number }> = ({ t, w, u }) => {
  const chrome = 64 * u;
  const h = w * (1800 / 2880);
  const k = w / 2880;
  const url = typed("aljam3.com/mcp", t, O.o2 - 0.3, 22);
  const loaded = prog(t, O.link - 0.25, O.link + 0.1, easeOutCubic);
  const ring = prog(t, O.link, O.link + 0.4, easeOutCubic) * (1 - prog(t, O.copy + 0.6, O.copy + 1.0));
  const cursorP = prog(t, O.link + 0.05, O.copy - 0.08, easeInOutCubic);
  const cx = lerp(w * 0.62, COPY_BTN.x * k, cursorP);
  const cy = lerp(h * 0.78, COPY_BTN.y * k, cursorP);
  const copied = prog(t, O.copy, O.copy + 0.2, easeOutCubic);
  const clickD = t - O.copy;
  const ripple = clickD > 0 && clickD < 0.55 ? easeOutCubic(clickD / 0.55) : -1;
  return (
    <div style={{ width: w, height: chrome + h, borderRadius: 16 * u, overflow: "hidden", background: "#fff", boxShadow: "0 50px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)", position: "relative" }}>
      <div style={{ height: chrome, background: "#f1ece7", display: "flex", alignItems: "center", gap: 14 * u, padding: `0 ${18 * u}px`, direction: "ltr", borderBottom: "1px solid #e2d9d1" }}>
        <div style={{ display: "flex", gap: 8 * u }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 13 * u, height: 13 * u, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, height: 38 * u, borderRadius: 19 * u, background: "#fff", border: "1px solid #e2d9d1", display: "flex", alignItems: "center", gap: 10 * u, padding: `0 ${16 * u}px`, fontFamily: LATIN_FONT, fontSize: 20 * u, color: "#3b2f2c" }}>
          <Icon name="lock" size={15 * u} color="#7d716c" />
          <span>{url}</span>
          {t >= O.o2 - 0.3 && t < O.link - 0.2 ? <span style={{ width: 1.5 * u, height: 22 * u, background: "#3b2f2c" }} /> : null}
        </div>
      </div>
      <div style={{ position: "relative", width: w, height: h, background: "#fff" }}>
        <Img src={staticFile("web/mcp-desktop.png")} style={{ width: w, height: h, opacity: loaded, transform: `translateY(${(1 - loaded) * 10 * u}px)` }} />
        {ring > 0 ? (
          <div style={{ position: "absolute", boxSizing: "border-box", left: URL_BOX.x * k - 6 * u, top: URL_BOX.y * k - 6 * u, width: URL_BOX.w * k + 12 * u, height: URL_BOX.h * k + 12 * u, borderRadius: 10 * u, border: `${3 * u}px solid ${FILM.terracotta}`, boxShadow: "0 0 0 6px rgba(174,71,33,0.15)", opacity: ring }} />
        ) : null}
        {copied > 0 ? (
          <div style={{ position: "absolute", left: COPY_BTN.x * k - 70 * u, top: COPY_BTN.y * k - 26 * u, width: 150 * u, height: 40 * u, borderRadius: 10 * u, background: "#2b2422", color: "#fff", fontFamily: UI_FONT, fontSize: 19 * u, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 * u, direction: "rtl", opacity: copied * (1 - prog(t, O.gather - 0.4, O.gather)), transform: `translateY(${(1 - copied) * 8 * u - 46 * u}px)` }}>
            <Icon name="check" size={18 * u} color="#7fd29b" strokeWidth={2.6} />
            تم النسخ
          </div>
        ) : null}
        {ripple >= 0 ? (
          <div style={{ position: "absolute", left: cx - (6 + 26 * ripple) * u, top: cy - (6 + 26 * ripple) * u, width: (12 + 52 * ripple) * u, height: (12 + 52 * ripple) * u, borderRadius: "50%", border: `${2.5 * u}px solid ${FILM.terracotta}`, opacity: 0.6 * (1 - ripple), boxSizing: "border-box" }} />
        ) : null}
        {t > O.link - 0.1 ? (
          <svg width={26 * u} height={36 * u} viewBox="0 0 26 36" style={{ position: "absolute", left: cx - 3 * u, top: cy - 2 * u, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))", opacity: loaded }}>
            <path d="M3 2 L3 27 L9 21.5 L13.2 31 L17 29.4 L12.9 20 L21 20 Z" fill="#141010" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </div>
  );
};

const Phone: React.FC<{ w: number; u: number }> = ({ w, u }) => {
  const bezel = 11 * u;
  const sw = w - bezel * 2;
  const sh = sw * (2532 / 1170);
  return (
    <div style={{ width: w, height: sh + bezel * 2, borderRadius: 52 * u, background: "#0d0b0a", padding: bezel, boxSizing: "border-box", boxShadow: "0 50px 110px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(255,255,255,0.12)" }}>
      <div style={{ width: sw, height: sh, borderRadius: 42 * u, overflow: "hidden", position: "relative" }}>
        <Img src={staticFile("web/mcp-mobile.png")} style={{ width: sw, height: sh }} />
        <div style={{ position: "absolute", left: sw / 2 - 52 * u, top: 10 * u, width: 104 * u, height: 30 * u, borderRadius: 15 * u, background: "#0d0b0a" }} />
      </div>
    </div>
  );
};

/** Particles that pour out of the outro scene and gather into the final logo (echo of the intro). */
const GatherSparks: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  const g0 = O.gather;
  if (t < g0 - 0.1 || t > O.logo + 0.4) return null;
  const items: React.ReactNode[] = [];
  const { W, H, u } = L;
  for (let i = 0; i < 90; i++) {
    const a0 = rand(i * 1.7) * Math.PI * 2;
    const r0 = (0.35 + 0.65 * rand(i * 2.9)) * Math.max(W, H) * 0.55;
    const g = prog(t, g0 + rand(i * 3.3) * 0.3, O.logo - 0.05, easeInOutCubic);
    const ang = a0 + g * 2.2;
    const r = r0 * (1 - g);
    const appear = prog(t, g0 + rand(i) * 0.25, g0 + 0.3 + rand(i) * 0.25);
    const w = (5 + 8 * rand(i * 5.5)) * u;
    const h = (30 + 60 * rand(i * 6.1)) * u;
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: W / 2 + Math.cos(ang) * r - w / 2,
          top: H / 2 + Math.sin(ang) * r * 0.75 - h / 2,
          width: w,
          height: h,
          borderRadius: w * 0.35,
          background: ["#ae4721", "#e16e4a", "#c98a5c", "#dcb48e"][i % 4],
          opacity: appear * (1 - prog(t, O.logo - 0.15, O.logo + 0.1)) * 0.85,
          transform: `rotate(${(rand(i * 9) - 0.5) * 30 + g * 90}deg) scale(${1 - 0.7 * g})`,
        }}
      />,
    );
  }
  return <>{items}</>;
};

const Chip: React.FC<{ label: string; u: number; a: number; icon: string }> = ({ label, u, a, icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 * u, padding: `${8 * u}px ${20 * u}px`, borderRadius: 999, border: `${1.5 * u}px solid rgba(225,110,74,0.5)`, color: "#f6eee7", fontFamily: UI_FONT, fontSize: 28 * u, opacity: a, transform: `translateY(${(1 - a) * 14 * u}px)` }}>
    <Icon name={icon} size={22 * u} color={FILM.ember} />
    {label}
  </div>
);

export const OutroForeground: React.FC<{ t: number; L: Layout }> = ({ t, L }) => {
  const { W, H, u } = L;
  const start = O.start();
  if (t < start) return null;
  const land = L.format === "landscape";
  const title = prog(t, start + 0.4, start + 1.1, easeOutCubic) * (1 - prog(t, O.o2 - 0.4, O.o2 + 0.2, easeInOutCubic));
  const cards = [prog(t, O.gpt - 0.3, O.gpt + 0.3, easeOutCubic), prog(t, O.claude - 0.25, O.claude + 0.35, easeOutCubic), prog(t, O.others - 0.2, O.others + 0.4, easeOutCubic)];
  const browserIn = prog(t, O.o2 - 0.45, O.o2 + 0.45, easeOutCubic);
  const phoneIn = prog(t, O.site - 0.1, O.site + 0.6, easeOutCubic);
  const gatherOut = prog(t, O.gather, O.gather + 0.65, easeInOutCubic);
  const side = prog(t, O.link, O.link + 0.5, easeOutCubic) * (1 - gatherOut);
  const chipA = prog(t, O.account - 0.15, O.account + 0.3, easeOutCubic);
  const chipK = prog(t, O.key - 0.15, O.key + 0.3, easeOutCubic);
  const logoT = t - O.logo;
  const tagline = prog(t, O.tagline - 0.2, O.tagline + 0.5, easeOutCubic);
  const foot = prog(t, E("outro3") - 0.2, E("outro3") + 0.5, easeOutCubic);
  const endFade = prog(t, O.end - 0.55, O.end - 0.02, easeInOutCubic);

  // geometry
  const colX = land ? W * 0.56 : 70 * u;
  const colW = land ? W * 0.39 : W - 140 * u;
  const browserW = land ? 1040 * u : 940 * u;
  const browserX = land ? 110 * u : (W - browserW) / 2;
  const browserY = land ? (H - (browserW * 0.625 + 64 * u)) / 2 - 10 * u : 250 * u;
  const phoneW = 300 * u;
  const phoneX = land ? browserX + browserW - phoneW * 0.55 : W - phoneW - 70 * u;
  const phoneY = land ? H - phoneW * 2.164 - 50 * u : 690 * u;
  const scatter = (p: number) => `scale(${1 - 0.55 * p})`;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* title + supported assistants */}
      <div style={{ position: "absolute", left: colX, width: colW, top: land ? 230 * u : 1000 * u, textAlign: land ? "right" : "center", opacity: title, transform: `translateY(${(1 - title) * 20 * u}px)` }}>
        <div style={{ fontFamily: HEADING_FONT, fontSize: (land ? 80 : 86) * u, lineHeight: 1.2, color: "#f6eee7" }}>الجامع للمساعدات الذكية</div>
        <div style={{ display: "inline-block", marginTop: 26 * u, fontFamily: UI_FONT, fontSize: 30 * u, color: FILM.ember, border: `${1.5 * u}px solid rgba(225,110,74,0.5)`, borderRadius: 999, padding: `${6 * u}px ${22 * u}px` }}>مجاني · للقراءة فقط</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 * u, marginTop: 36 * u, alignItems: land ? "flex-end" : "center" }}>
          <ClientCard title="ChatGPT" sub="إضافة MCP مخصّصة" icon="message-square-text" latin u={u} a={cards[0]} width={land ? colW : colW * 0.92} />
          <ClientCard title="Claude" sub="موصل مخصّص" icon="sparkles" latin u={u} a={cards[1]} width={land ? colW : colW * 0.92} />
          <ClientCard title="وغيرهما" sub="أي مساعد يدعم MCP" icon="plug" latin={false} u={u} a={cards[2]} width={land ? colW : colW * 0.92} />
        </div>
      </div>
      {/* the setup guide on aljam3.com */}
      {browserIn > 0 && gatherOut < 1 ? (
        <div style={{ position: "absolute", left: browserX, top: browserY, opacity: browserIn * (1 - gatherOut), transform: `translateY(${(1 - browserIn) * 80 * u}px) ${scatter(gatherOut)}`, transformOrigin: `${W / 2 - browserX}px ${H / 2 - browserY}px` }}>
          <Browser t={t} w={browserW} u={u} />
        </div>
      ) : null}
      {phoneIn > 0 && gatherOut < 1 ? (
        <div style={{ position: "absolute", left: phoneX, top: phoneY, opacity: phoneIn * (1 - gatherOut), transform: `translateY(${(1 - phoneIn) * 140 * u}px) rotate(${(1 - phoneIn) * 6}deg) ${scatter(gatherOut)}`, transformOrigin: `${W / 2 - phoneX}px ${H / 2 - phoneY}px` }}>
          <Phone w={phoneW} u={u} />
        </div>
      ) : null}
      {side > 0 ? (
        <div style={{ position: "absolute", left: land ? W * 0.655 : 0, width: land ? W * 0.31 : W, top: land ? 300 * u : 1430 * u, textAlign: land ? "right" : "center", opacity: side, transform: `translateY(${(1 - side) * 20 * u}px)` }}>
          <div style={{ fontFamily: HEADING_FONT, fontSize: 40 * u, color: FILM.ember }}>رابط واحد للاتصال</div>
          <div style={{ fontFamily: LATIN_FONT, fontSize: (land ? 54 : 60) * u, color: "#f6eee7", direction: "ltr", fontWeight: 600, letterSpacing: -1 * u, marginTop: 6 * u, textAlign: land ? "right" : "center" }}>aljam3.com/mcp</div>
          <div style={{ display: "flex", gap: 14 * u, marginTop: 24 * u, justifyContent: land ? "flex-start" : "center", direction: "rtl" }}>
            <Chip label="دون حساب" u={u} a={chipA} icon="users" />
            <Chip label="دون مفتاح" u={u} a={chipK} icon="lock" />
          </div>
        </div>
      ) : null}
      <GatherSparks t={t} L={L} />
      {/* final card */}
      {logoT > -0.3 ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: W / 2 - 240 * u,
              top: H / 2 - 240 * u - (land ? 80 : 120) * u,
              width: 480 * u,
              height: 480 * u,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(225,110,74,0.32) 0%, rgba(225,110,74,0) 65%)",
              opacity: prog(t, O.logo - 0.2, O.logo + 0.4),
              transform: `scale(${0.6 + 0.5 * prog(t, O.logo - 0.2, O.logo + 1.2, easeOutCubic)})`,
            }}
          />
          <div style={{ position: "absolute", left: W / 2 - (land ? 230 : 260) * u, top: H / 2 - (land ? 230 : 290) * u }}>
            <Logo id="outro-logo" width={(land ? 460 : 520) * u} color={FILM.ember} write={logoT} sheen={sheenAt(t, O.logo + 1.3)} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 + (land ? 170 : 200) * u, textAlign: "center", opacity: tagline, transform: `translateY(${(1 - tagline) * 18 * u}px)`, filter: `blur(${(1 - tagline) * 6}px)` }}>
            <div style={{ fontFamily: HEADING_FONT, fontSize: (land ? 74 : 76) * u, color: "#f6eee7" }}>المكتبة بين يديك ويدي مساعدك</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 + (land ? 300 : 335) * u, textAlign: "center", opacity: foot, transform: `translateY(${(1 - foot) * 14 * u}px)` }}>
            <div style={{ fontFamily: LATIN_FONT, fontSize: 38 * u, color: FILM.ember, direction: "ltr", fontWeight: 600, letterSpacing: -0.5 * u }}>aljam3.com/mcp</div>
            <div style={{ fontFamily: LATIN_FONT, fontSize: 24 * u, color: "#b9aca5", marginTop: 12 * u, direction: "ltr" }}>{"ChatGPT   ·   Claude   ·   MCP"}</div>
          </div>
        </div>
      ) : null}
      {endFade > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${endFade})` }} /> : null}
    </div>
  );
};
