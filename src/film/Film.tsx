import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { loadFonts } from "../lib/fonts";
import { DURATION, ORDER, S } from "../lib/timeline";
import { easeInOutCubic, prog, useT } from "../lib/time";
import { NightBg, StageBg } from "./Backgrounds";
import { SFX } from "./director";
import { FILM_SFX, FilmSfx, SFX_LEN } from "./sounds";
import { Captions, PortraitHeader, SidePanel } from "./Guide";
import { I, IntroForeground, IntroIcon, bloomRadius } from "./Intro";
import { useLayout } from "./layout";
import { O, OutroForeground, outroFrame } from "./Outro";
import { Stage } from "./Stage";

loadFonts();

const AudioTrack: React.FC = () => {
  const { fps } = useVideoConfig();
  const events: FilmSfx[] = [...FILM_SFX, ...SFX];
  return (
    <>
      {ORDER.map((c) => (
        <Sequence key={c.id} from={Math.round(c.start * fps)} durationInFrames={Math.ceil((c.dur + 0.1) * fps)} layout="none">
          <Html5Audio src={staticFile(`audio/vo/${c.id}.wav`)} />
        </Sequence>
      ))}
      {events.map((e, i) => {
        const len = SFX_LEN[e.name] ?? 1;
        const fadeOut = e.fadeOut ?? null;
        return (
          <Sequence key={`s${i}`} from={Math.max(0, Math.round(e.t * fps))} durationInFrames={Math.ceil((fadeOut ?? len) * fps) + 2} layout="none">
            <Html5Audio
              src={staticFile(`audio/sfx/${e.name}.wav`)}
              volume={(f) => {
                if (fadeOut === null) return e.vol;
                const s = f / fps;
                return e.vol * Math.min(1, s / 2) * (1 - prog(s, fadeOut - 3, fadeOut));
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const Film: React.FC = () => {
  const t = useT();
  const L = useLayout();
  const { W, H, u } = L;
  // backgrounds: night → paper bloom → night again for the outro
  const bloom = bloomRadius(t, L);
  const night = prog(t, O.start() + 0.1, O.start() + 1.0, easeInOutCubic);
  const stageVisible = t >= I.bloom - 0.1 && night < 1;
  const launch = prog(t, I.launch, I.launch + 0.8, (x) => x);
  const frame = outroFrame(t, L);
  const guideFade = prog(t, S("app") - 0.45, S("app") + 0.25, easeInOutCubic) * (1 - prog(t, O.start() - 0.1, O.start() + 0.5, easeInOutCubic));
  const glowX = t < I.launch ? 50 : ((L.win.x + L.win.w / 2) / W) * 100;
  const glowY = t < I.launch ? 50 : ((L.win.y + L.win.h / 2) / H) * 100;
  const capY = L.captions ? (t < I.launch + 0.5 ? H - 300 * u : t > O.start() ? H - 225 * u : L.captions.y) : 0;
  const stageDrift = t * 6 * u;
  return (
    <AbsoluteFill style={{ background: "#000", direction: "rtl", overflow: "hidden" }}>
      <NightBg u={u} glow={t < I.bloom ? 0.55 + 0.45 * prog(t, I.gather, I.bloom) : 0.9} glowX={glowX} glowY={glowY} pattern={night} drift={stageDrift} />
      {stageVisible ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - night,
            maskImage: t < I.bloom + 1 ? `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, bloom - 90 * u)}px, transparent ${bloom + 40 * u}px)` : undefined,
            WebkitMaskImage: t < I.bloom + 1 ? `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, bloom - 90 * u)}px, transparent ${bloom + 40 * u}px)` : undefined,
          }}
        >
          <StageBg u={u} drift={stageDrift} />
        </div>
      ) : null}
      <IntroForeground t={t} L={L} />
      {L.format === "landscape" ? <SidePanel t={t} L={L} fade={guideFade} /> : <PortraitHeader t={t} L={L} fade={guideFade} />}
      <Stage t={t} layout={L} launch={launch} frame={frame} />
      <IntroIcon t={t} L={L} />
      <OutroForeground t={t} L={L} />
      {L.captions && t < O.gather ? <Captions t={t} L={L} y={capY} dark={t < I.bloom + 0.3 || t > O.start() + 0.4 ? 1 : 0} /> : null}
      <AudioTrack />
    </AbsoluteFill>
  );
};

export const FILM_DURATION = DURATION;
