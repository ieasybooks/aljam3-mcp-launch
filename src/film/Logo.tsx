import React from "react";
import { LOGO_PARTS, LOGO_VIEWBOX } from "../brand/logoData";
import { clamp, easeInOutCubic, easeOutBack, easeOutCubic, prog } from "../lib/time";

// Writing order (right to left like the hand would): alif, the long body, the sweep of «مع», then the dot.
const ORDER = [
  { part: 0, dir: "down" as const, start: 0.0, dur: 0.34 },
  { part: 1, dir: "rtl" as const, start: 0.22, dur: 0.55 },
  { part: 2, dir: "rtl" as const, start: 0.58, dur: 0.6 },
  { part: 3, dir: "pop" as const, start: 1.0, dur: 0.28 },
];
export const LOGO_WRITE_DURATION = 1.3;

/**
 * The Aljam3 calligraphic logo. `write` is seconds since writing began (Infinity = fully drawn).
 * `sheen` (0..1) sweeps a soft light across it once.
 */
export const Logo: React.FC<{ width: number; color: string; write?: number; sheen?: number; id: string; style?: React.CSSProperties }> = ({
  width,
  color,
  write = Infinity,
  sheen = -1,
  id,
  style,
}) => {
  const h = (width * LOGO_VIEWBOX.h) / LOGO_VIEWBOX.w;
  return (
    <svg width={width} height={h} viewBox={`-6 -6 ${LOGO_VIEWBOX.w + 12} ${LOGO_VIEWBOX.h + 12}`} style={{ overflow: "visible", ...style }}>
      <defs>
        {ORDER.map(({ part, dir, start, dur }) => {
          const b = LOGO_PARTS[part];
          const p = write === Infinity ? 1.2 : easeInOutCubic(clamp((write - start) / dur)) * 1.2 - 0.1;
          if (dir === "pop") return null;
          const vertical = dir === "down";
          return (
            <linearGradient
              key={part}
              id={`${id}-g${part}`}
              gradientUnits="userSpaceOnUse"
              x1={vertical ? 0 : b.x1 + 4}
              x2={vertical ? 0 : b.x0 - 4}
              y1={vertical ? b.y0 - 4 : 0}
              y2={vertical ? b.y1 + 4 : 0}
            >
              <stop offset={clamp(p - 0.08)} stopColor="#fff" />
              <stop offset={clamp(p)} stopColor="#000" />
            </linearGradient>
          );
        })}
        {ORDER.map(({ part, dir }) =>
          dir === "pop" ? null : (
            <mask id={`${id}-m${part}`} key={part} maskUnits="userSpaceOnUse" x={-20} y={-20} width={LOGO_VIEWBOX.w + 40} height={LOGO_VIEWBOX.h + 40}>
              <rect x={-20} y={-20} width={LOGO_VIEWBOX.w + 40} height={LOGO_VIEWBOX.h + 40} fill={`url(#${id}-g${part})`} />
            </mask>
          ),
        )}
        <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1={LOGO_VIEWBOX.w} y1={0} x2={0} y2={LOGO_VIEWBOX.h}>
          <stop offset={clamp(sheen - 0.12)} stopColor="#fff" stopOpacity={0} />
          <stop offset={clamp(sheen)} stopColor="#fff" stopOpacity={0.55} />
          <stop offset={clamp(sheen + 0.12)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          {LOGO_PARTS.map((p, i) => (
            <path key={i} d={p.d} />
          ))}
        </clipPath>
      </defs>
      {ORDER.map(({ part, dir, start, dur }) => {
        const b = LOGO_PARTS[part];
        if (dir === "pop") {
          const p = write === Infinity ? 1 : clamp((write - start) / dur);
          const s = p <= 0 ? 0 : easeOutBack(2.2)(p);
          const cx = (b.x0 + b.x1) / 2;
          const cy = (b.y0 + b.y1) / 2;
          return <path key={part} d={b.d} fill={color} opacity={easeOutCubic(p)} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} />;
        }
        return <path key={part} d={b.d} fill={color} mask={write === Infinity ? undefined : `url(#${id}-m${part})`} />;
      })}
      {sheen > -0.2 && sheen < 1.2 ? (
        <rect x={-10} y={-10} width={LOGO_VIEWBOX.w + 20} height={LOGO_VIEWBOX.h + 20} fill={`url(#${id}-sheen)`} clipPath={`url(#${id}-clip)`} />
      ) : null}
    </svg>
  );
};

export const sheenAt = (t: number, t0: number, dur = 1.1) => (t < t0 ? -1 : prog(t, t0, t0 + dur, easeInOutCubic) * 1.4 - 0.2);
