import { useVideoConfig } from "remotion";
import { APP_W, WIN_H } from "../ui/theme";

export type Format = "landscape" | "portrait";

export type Layout = {
  format: Format;
  W: number;
  H: number;
  /** where the app window sits on the stage, and its scale */
  win: { x: number; y: number; s: number; w: number; h: number };
  /** landscape: side panel box; portrait: header box */
  panel: { x: number; y: number; w: number; h: number };
  captions: { x: number; y: number; w: number; h: number } | null;
  u: number; // typographic unit relative to 1080p short side
};

export const useLayout = (): Layout => {
  const { width: W, height: H } = useVideoConfig();
  return layoutFor(W, H);
};

export const layoutFor = (W: number, H: number): Layout => {
  if (W >= H) {
    const s = 0.985;
    const w = APP_W * s;
    const h = WIN_H * s;
    const x = 78;
    return {
      format: "landscape",
      W,
      H,
      win: { x, y: (H - h) / 2, s, w, h },
      panel: { x: x + w + 64, y: 120, w: W - (x + w + 64) - 80, h: H - 240 },
      captions: null,
      u: H / 1080,
    };
  }
  const s = (W - 52) / APP_W;
  const w = APP_W * s;
  const h = WIN_H * s;
  return {
    format: "portrait",
    W,
    H,
    win: { x: (W - w) / 2, y: 575, s, w, h },
    panel: { x: 70, y: 285, w: W - 140, h: 260 },
    captions: { x: 60, y: 575 + h + 64, w: W - 120, h: 260 },
    u: W / 1080,
  };
};
