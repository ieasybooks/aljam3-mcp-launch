import React from "react";
import { APP_W, FILM, TITLE_H, WIN_H } from "../ui/theme";
import { clamp, easeInOutCubic, easeOutCubic, mixPt, prog, track } from "../lib/time";
import { BrowserWindow, ChatWindow } from "../ui/chat";
import { CAMERA, CLICKS, CURSOR, Cam, SPOTS, browserAt, chatAt, cursorOpacity } from "./director";
import { Layout } from "./layout";

const mixCam = (a: Cam, b: Cam, p: number): Cam => {
  // interpolate zoom in log space so zoom speed feels constant
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * p);
  return { z, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
};

/** Portrait screens are small: zoom further unless a key says otherwise. */
const portraitKey = (c: Cam): Cam => ({ ...c, x: c.xp ?? c.x, z: c.zp ?? (c.z <= 1 ? 1 : 1 + (c.z - 1) * 1.55) });

export const cameraAt = (t: number, portrait = false): Cam => {
  const keys = portrait ? CAMERA.map((k) => ({ ...k, v: portraitKey(k.v) })) : CAMERA.filter((k) => !k.v.portraitOnly);
  const c = track(keys, t, mixCam);
  const z = Math.max(1, c.z);
  const halfW = APP_W / (2 * z);
  const halfH = WIN_H / (2 * z);
  const y = c.y + TITLE_H;
  return { z, x: clamp(c.x, halfW, APP_W - halfW), y: clamp(y, halfH, WIN_H - halfH) };
};

export const cursorAt = (t: number) => {
  const p = track(CURSOR, t, mixPt);
  return { x: p.x, y: p.y + TITLE_H };
};

const Cursor: React.FC<{ t: number }> = ({ t }) => {
  const { x, y } = cursorAt(t);
  const op = cursorOpacity(t);
  if (op <= 0) return null;
  let dip = 0;
  const ripples: React.ReactNode[] = [];
  for (const c of CLICKS) {
    const dt = t - c;
    if (dt > -0.08 && dt < 0.16) dip = Math.max(dip, 1 - Math.abs(dt - 0.02) / 0.12);
    if (dt >= 0 && dt < 0.55) {
      const p = easeOutCubic(dt / 0.55);
      ripples.push(
        <div
          key={c}
          style={{
            position: "absolute",
            left: x - 4 - 26 * p,
            top: y - 4 - 26 * p,
            width: 8 + 52 * p,
            height: 8 + 52 * p,
            borderRadius: "50%",
            border: `2.5px solid ${FILM.terracotta}`,
            opacity: 0.55 * (1 - p),
            boxSizing: "border-box",
          }}
        />,
      );
    }
  }
  const s = 1 - 0.16 * clamp(dip);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: op }}>
      {ripples}
      <svg
        width={26}
        height={36}
        viewBox="0 0 26 36"
        style={{ position: "absolute", left: x - 3, top: y - 2, transform: `scale(${s})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))" }}
      >
        <path d="M3 2 L3 27 L9 21.5 L13.2 31 L17 29.4 L12.9 20 L21 20 Z" fill="#141010" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Spotlights: React.FC<{ t: number }> = ({ t }) => (
  <>
    {SPOTS.map((sp, i) => {
      const a = Math.min(prog(t, sp.t0, sp.t0 + 0.3, easeOutCubic), 1 - prog(t, sp.t1 - 0.25, sp.t1, easeInOutCubic));
      if (a <= 0) return null;
      const grow = 1 + 0.04 * (1 - prog(t, sp.t0, sp.t0 + 0.35, easeOutCubic));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: sp.x,
            top: sp.y + TITLE_H,
            width: sp.w,
            height: sp.h,
            borderRadius: sp.r ?? 8,
            boxShadow: `0 0 0 2.5px ${FILM.terracotta}, 0 0 0 7px rgba(174,71,33,0.16), 0 0 0 3000px rgba(28,18,14,${0.14 * a})`,
            opacity: a,
            transform: `scale(${grow})`,
            pointerEvents: "none",
          }}
        />
      );
    })}
  </>
);

/** The assistant window at film time t, plus the browser that opens the cited page. */
export const AppAt: React.FC<{ t: number }> = ({ t }) => {
  const b = browserAt(t);
  return (
    <>
      <ChatWindow s={chatAt(t)} t={t} />
      <BrowserWindow open={b.open} loaded={b.loaded} url={"aljam3.com/ar/1889/4971/29"} marks={b.marks} origin={b.origin} />
    </>
  );
};

/** The window on the stage, with camera, cursor and spotlights. */
export const Stage: React.FC<{
  t: number;
  layout: Layout;
  launch: number; // 0..1 window rising in
  frame?: { dx: number; dy: number; scale: number; opacity: number; tilt?: number };
}> = ({ t, layout, launch, frame = { dx: 0, dy: 0, scale: 1, opacity: 1 } }) => {
  if (launch <= 0 || frame.opacity <= 0) return null;
  const { win } = layout;
  const cam = cameraAt(t, layout.format === "portrait");
  const L = easeOutCubic(launch);
  const scale = win.s * (0.9 + 0.1 * L) * frame.scale;
  const cx = win.x + win.w / 2 + frame.dx;
  const cy = win.y + win.h / 2 + frame.dy + (1 - L) * 70 * layout.u;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - (APP_W * scale) / 2,
        top: cy - (WIN_H * scale) / 2,
        width: APP_W,
        height: WIN_H,
        transformOrigin: "0 0",
        transform: `scale(${scale})`,
        opacity: frame.opacity * clamp(launch * 1.8),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 50px 140px rgba(90,48,30,0.26), 0 14px 36px rgba(90,48,30,0.16)",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: APP_W,
            height: WIN_H,
            transformOrigin: "0 0",
            transform: `translate(${APP_W / 2}px, ${WIN_H / 2}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`,
          }}
        >
          <AppAt t={t} />
          <Spotlights t={t} />
          <Cursor t={t} />
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.10)", pointerEvents: "none" }} />
      </div>
    </div>
  );
};
