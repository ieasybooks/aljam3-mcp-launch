import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { loadFonts } from "./lib/fonts";
import { AppAt } from "./film/Stage";
import { CAMERA, CLICKS, CURSOR, LAG, SFX, T } from "./film/director";
import { DURATION } from "./lib/timeline";
import { SOUND_EVENTS } from "./film/sounds";
import { TITLE_H } from "./ui/theme";

loadFonts();

/** Renders the assistant window at film time `t` (no camera) and logs the boxes of all [data-m] elements (app pixels). */
export const Measure: React.FC<{ t: number }> = ({ t }) => {
  const [handle] = useState(() => delayRender("measure"));
  useEffect(() => {
    document.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        const out: Record<string, number[][]> = {};
        document.querySelectorAll<HTMLElement>("[data-m]").forEach((el) => {
          const r = el.getBoundingClientRect();
          const k = el.dataset.m!;
          (out[k] ??= []).push([Math.round(r.left), Math.round(r.top - TITLE_H), Math.round(r.width), Math.round(r.height)]);
        });
        console.log("MEASURE:" + JSON.stringify(out));
        console.log("DIRECTOR:" + JSON.stringify({ T, SFX, CURSOR, CLICKS, CAMERA, DURATION, SOUND_EVENTS, LAG }));
        continueRender(handle);
      }),
    );
  }, [handle]);
  return (
    <AbsoluteFill>
      <AppAt t={t} />
    </AbsoluteFill>
  );
};
