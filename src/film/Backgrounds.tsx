import React from "react";
import { FILM } from "../ui/theme";

/** Eight-point star lattice, the quiet geometric texture of the stage. */
const Pattern: React.FC<{ id: string; color: string; opacity: number; size: number; offset: number }> = ({ id, color, opacity, size, offset }) => {
  const s = size;
  const c = s / 2;
  const r = s * 0.34;
  const star = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i;
    const rr = i % 2 === 0 ? r : r * 0.62;
    return `${c + rr * Math.cos(a)},${c + rr * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse" patternTransform={`translate(${offset} ${offset * 0.4})`}>
          <polygon points={star} fill="none" stroke={color} strokeWidth={1.2} />
          <circle cx={c} cy={c} r={r * 0.28} fill="none" stroke={color} strokeWidth={1} />
          <path d={`M0 ${c} L${c - r} ${c} M${c + r} ${c} L${s} ${c} M${c} 0 L${c} ${c - r} M${c} ${c + r} L${c} ${s}`} stroke={color} strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export const Grain: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

/** Night background (intro, dark stage, outro): deep warm black with an ember glow. */
export const NightBg: React.FC<{ glow?: number; glowX?: number; glowY?: number; u: number; pattern?: number; drift?: number }> = ({ glow = 1, glowX = 50, glowY = 50, u, pattern = 0, drift = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: FILM.night }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 60% 55% at ${glowX}% ${glowY}%, rgba(174,71,33,${0.32 * glow}) 0%, rgba(120,48,24,${0.12 * glow}) 42%, rgba(21,17,16,0) 75%)`,
      }}
    />
    {pattern > 0 ? <Pattern id="night-pat" color="#e9b08f" opacity={0.045 * pattern} size={120 * u} offset={drift} /> : null}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 85% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
  </div>
);

/** Warm paper stage behind the app window. */
export const StageBg: React.FC<{ u: number; drift: number }> = ({ u, drift }) => (
  <div style={{ position: "absolute", inset: 0, background: FILM.stage }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 30% 35%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%), radial-gradient(ellipse 60% 70% at 85% 80%, rgba(226,170,140,0.28) 0%, rgba(226,170,140,0) 65%)",
      }}
    />
    <Pattern id="stage-pat" color="#ae4721" opacity={0.055} size={120 * u} offset={drift} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 85% at 50% 50%, rgba(0,0,0,0) 60%, rgba(120,70,45,0.10) 100%)" }} />
  </div>
);
