"""Prepare audio for Remotion: loudness-matched voice clips, cleaned SFX, and a few
synthesized UI sounds whose transients must land exactly on screen actions."""
import json, re, subprocess, pathlib, numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000

def decode(path, sr=SR):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"])
    return np.frombuffer(raw, np.float32).copy()

def write(path, x, sr=SR):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(path)],
                   input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)

def lufs(path):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])

def fade(x, fin=0.004, fout=0.03):
    a, b = int(fin * SR), int(fout * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x

# Voice: match every clip to -23 LUFS with plain gain.
clips = json.loads((ROOT / "audio/vo_clean/clips.json").read_text())
vo = {}
for cid, info in clips.items():
    src = ROOT / f"audio/vo_clean/{cid}.wav"
    gain = 10 ** ((-23.0 - lufs(src)) / 20)
    x = decode(src) * gain
    peak = np.abs(x).max()
    if peak > 0.89: x *= 0.89 / peak
    write(ROOT / f"public/audio/vo/{cid}.wav", x)
    vo[cid] = {"duration": round(len(x) / SR, 3), "chars": "".join(info["chars"]), "starts": info["starts"], "ends": info["ends"]}
script = {c["id"]: c for c in json.loads((ROOT / "data/script.json").read_text())["clips"]}
for cid in vo: vo[cid]["caption"] = script[cid]["caption"]
(ROOT / "src/data/vo.json").write_text(json.dumps(vo, ensure_ascii=False))

# Generated SFX: trim to onset, normalise peak, short fades.
for p in sorted((ROOT / "audio/sfx_raw").glob("*.mp3")):
    x = decode(p)
    env = np.abs(x)
    onset = max(int(np.argmax(env > env.max() * 0.05)) - int(0.004 * SR), 0)
    if p.stem in ("room", "riser", "whoosh_long"): onset = 0
    x = x[onset:]
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    write(ROOT / f"public/audio/sfx/{p.stem}.wav", fade(x))

rng = np.random.default_rng(7)
def tone_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, n)

# Mouse click: a short bright tick plus a softer release 55 ms later.
def click():
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for at, amp, decay in ((0.0, 1.0, 900), (0.055, 0.45, 1200)):
        i = int(at * SR); m = n - i
        burst = tone_noise(m, 1800, 9000) * np.exp(-np.arange(m) / SR * decay)
        body = np.sin(2 * np.pi * 2300 * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * 1500) * 0.4
        x[i:] += amp * (burst / (np.abs(burst).max() + 1e-9) + body)
    return fade(x / np.abs(x).max() * 0.6, 0.0005, 0.02)
write(ROOT / "public/audio/sfx/ui_click.wav", click())

# Keystrokes: four soft variants.
for k in range(4):
    n = int(0.09 * SR)
    burst = tone_noise(n, 600 + k * 150, 6000) * np.exp(-np.arange(n) / SR * (500 + k * 60))
    thock = np.sin(2 * np.pi * (180 + k * 25) * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 260) * 0.5
    x = burst / np.abs(burst).max() + thock
    write(ROOT / f"public/audio/sfx/key{k}.wav", fade(x / np.abs(x).max() * 0.5, 0.0005, 0.02))

# Breath-like noise riser (no pitch), 2.4 s, band sweeping upward.
n = int(2.4 * SR); t = np.arange(n) / SR
x = np.zeros(n); seg = 2048
noise = rng.standard_normal(n + seg)
out = np.zeros(n + seg); win = np.hanning(seg)
for i in range(0, n, seg // 2):
    frac = i / n
    lo, hi = 200 + 1400 * frac ** 2, 1200 + 7000 * frac ** 1.5
    spec = np.fft.rfft(noise[i:i + seg] * win); f = np.fft.rfftfreq(seg, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    out[i:i + seg] += np.fft.irfft(spec, seg) * (0.15 + 0.85 * frac ** 2.2)
x = out[:n]; x = x / np.abs(x).max() * 0.6
write(ROOT / "public/audio/sfx/air_riser.wav", fade(x, 0.2, 0.08))
print("done", len(vo), "voice clips")

# Warm "air" bed: band-limited noise with a slow breathing swell. Non-musical; it only fills the
# silence between lines so the film doesn't drop to digital zero.
dur = 150.0
n = int(dur * SR)
spec = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
shape = np.where(f > 0, 1 / np.sqrt(np.maximum(f, 20)), 0)          # pink tilt
shape *= 1 / (1 + (f / 1400) ** 4) * (1 - 1 / (1 + (f / 70) ** 4))   # 70 Hz – 1.4 kHz band
bed = np.fft.irfft(spec * shape, n)
t = np.arange(n) / SR
bed *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 9.0) * np.sin(2 * np.pi * t / 23.0 + 1.3)
bed = bed / np.abs(bed).max() * 0.5
write(ROOT / "public/audio/sfx/air_bed.wav", fade(bed, 2.0, 3.0))
print("air bed written")
