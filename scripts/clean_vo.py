"""Trim each voice clip to its speech, removing stray onsets that ElevenLabs sometimes leaves
after the final silence (from next_text context). Cuts only ever happen inside silence."""
import json, sys, pathlib, subprocess, numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from voice_stats import load

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR, HOP = 44100, 0.01
script = json.loads((ROOT / "data/script.json").read_text())
report = {}
for clip in script["clips"]:
    cid = clip["id"]
    x, _ = load(ROOT / f"audio/vo/{cid}.mp3", SR)
    h = int(HOP * SR)
    rms = np.array([np.sqrt((x[i:i+h]**2).mean()) for i in range(0, len(x) - h + 1, h)])
    on = rms > 0.004
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            segs.append([i, j]); i = j
        else: i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < 25: merged[-1][1] = s[1]
        else: merged.append(s)
    dropped = []
    while len(merged) > 1 and merged[-1][1] - merged[-1][0] < 15 and merged[-1][0] - merged[-2][1] >= 20:
        dropped.append(merged.pop())
    while len(merged) > 1 and merged[0][1] - merged[0][0] < 15 and merged[1][0] - merged[0][1] >= 20:
        dropped.append(merged.pop(0))
    start = max(merged[0][0] * HOP - 0.05, 0)
    end = merged[-1][1] * HOP + 0.30
    if dropped and dropped[0][0] * HOP > merged[-1][1] * HOP:
        end = min(end, dropped[0][0] * HOP - 0.03)
    end = min(end, len(x) / SR)
    y = x[int(start * SR): int(end * SR)].copy()
    al = json.loads((ROOT / f"audio/vo/{cid}.json").read_text())
    rel = lambda t: t - start
    # tighten long pauses inside the line (cuts happen only in the middle of silence)
    hr = np.array([np.sqrt((y[i:i+h]**2).mean()) for i in range(0, len(y) - h + 1, h)])
    voiced = np.where(hr > 0.004)[0]
    cuts = []
    if len(voiced):
        i = voiced[0]
        while i < voiced[-1]:
            if hr[i] <= 0.006:
                j = i
                while j < len(hr) and hr[j] <= 0.006: j += 1
                s0, s1 = i * HOP, j * HOP
                if s1 - s0 >= 0.16:
                    near = [ch for k, ch in enumerate(al["characters"]) if ch in "،.:" and s0 - 0.35 <= rel(al["character_start_times_seconds"][k]) <= s1 + 0.1]
                    cap = (0.75 if cid == "intro4" else 0.42) if "." in near else 0.28 if near else 0.07
                    # only cut where it is truly quiet, so soft consonant tails (ث، ف، س) stay intact
                    quiet = [k for k in range(i, j) if hr[k] < 0.0025]
                    if quiet and (quiet[-1] - quiet[0]) * HOP > cap:
                        q0, q1 = quiet[0] * HOP + cap / 2, (quiet[-1] + 1) * HOP - cap / 2
                        if q1 > q0 and all(hr[k] < 0.0035 for k in range(int(q0 / HOP), int(q1 / HOP))):
                            cuts.append((q0, q1))
                i = j
            else:
                i += 1
    xf = int(0.012 * SR)
    for c0, c1 in reversed(cuts):
        a, b = int(c0 * SR), int(c1 * SR)
        head, tail = y[:a], y[b:]
        ramp = np.linspace(0, 1, xf)
        mid = head[-xf:] * (1 - ramp) + tail[:xf] * ramp
        y = np.concatenate([head[:-xf], mid, tail[xf:]])
    def remap(t):
        out = t
        for c0, c1 in cuts:
            if t >= c1: out -= (c1 - c0)
            elif t > c0: out -= (t - c0)
        return out
    fi, fo = int(0.008 * SR), int(0.04 * SR)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    out = ROOT / f"audio/vo_clean/{cid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(out)], input=y.astype(np.float32).tobytes(), check=True)
    report[cid] = {"offset": round(start, 3), "duration": round(len(y) / SR, 3),
                   "chars": al["characters"],
                   "starts": [round(remap(t - start), 3) for t in al["character_start_times_seconds"]],
                   "ends": [round(remap(t - start), 3) for t in al["character_end_times_seconds"]]}
    removed = sum(c1 - c0 for c0, c1 in cuts)
    print(f"{cid:8s} trim {start:.2f}-{end:.2f}  dur {len(y)/SR:.2f}  pauses tightened by {removed:.2f}s ({len(cuts)})  dropped {[(a*HOP, b*HOP) for a, b in dropped]}")
(ROOT / "audio/vo_clean/clips.json").write_text(json.dumps(report, ensure_ascii=False))
