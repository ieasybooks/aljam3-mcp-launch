import { useCurrentFrame, useVideoConfig } from "remotion";

/** Current time in seconds. Every animation in the film is written in seconds, so the fps can change freely. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export type Ease = (x: number) => number;

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const linear: Ease = (x) => x;
export const easeOutCubic: Ease = (x) => 1 - Math.pow(1 - x, 3);
export const easeInCubic: Ease = (x) => x * x * x;
export const easeInOutCubic: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutQuart: Ease = (x) => 1 - Math.pow(1 - x, 4);
export const easeInOutQuart: Ease = (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2);
export const easeOutExpo: Ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeInOutSine: Ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
export const easeOutBack =
  (s = 1.4): Ease =>
  (x) =>
    1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);

/** Eased progress of t through [a, b]. */
export const prog = (t: number, a: number, b: number, ease: Ease = easeInOutCubic) =>
  ease(clamp((t - a) / Math.max(b - a, 1e-6)));

/** Fade in over [a, a+fin] and out over [b-fout, b]. */
export const window01 = (t: number, a: number, b: number, fin = 0.35, fout = 0.35, ease: Ease = easeInOutSine) =>
  Math.min(prog(t, a, a + fin, ease), 1 - prog(t, b - fout, b, ease));

/** Damped spring response (0 → 1) for time since start, independent of fps. */
export const springAt = (dt: number, { stiffness = 170, damping = 22, mass = 1 } = {}) => {
  if (dt <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * dt) * (Math.cos(wd * dt) + ((zeta * w0) / wd) * Math.sin(wd * dt));
  }
  return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
};

export type Key<V> = { t: number; v: V; d?: number; e?: Ease };

/**
 * Piecewise motion: at each key's time, start moving from wherever the value is
 * towards key.v over key.d seconds. Interrupted moves continue smoothly from their current value.
 */
export function track<V>(keys: Key<V>[], t: number, mix: (a: V, b: V, p: number) => V): V {
  if (keys.length === 0) throw new Error("empty track");
  const at = (k: Key<V>, time: number) => (k.e ?? easeInOutCubic)(clamp((time - k.t) / (k.d ?? 0.5)));
  let from = keys[0].v; // start value of the segment currently being evaluated
  let current = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (k.t > t) break;
    // where the previous segment had got to when this one starts
    from = i === 1 ? keys[0].v : mix(from, keys[i - 1].v, at(keys[i - 1], k.t));
    current = mix(from, k.v, at(k, t));
  }
  return current;
}

export const mixNum = (a: number, b: number, p: number) => lerp(a, b, p);
export type Pt = { x: number; y: number };
export const mixPt = (a: Pt, b: Pt, p: number): Pt => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

/** Characters of `text` revealed by time t when typing starts at t0 with `cps` chars per second. */
export const typed = (text: string, t: number, t0: number, cps = 16) => {
  const chars = Array.from(text);
  const n = Math.floor(clamp((t - t0) * cps, 0, chars.length));
  return chars.slice(0, n).join("");
};

/** Times (absolute) at which each character of a typed string appears. */
export const keyTimes = (text: string, t0: number, cps = 16) =>
  Array.from(text).map((_, i) => t0 + (i + 1) / cps);

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
