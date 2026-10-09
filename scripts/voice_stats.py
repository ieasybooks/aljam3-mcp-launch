import sys, subprocess, numpy as np, pathlib
def load(p, sr=16000):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"])
    return np.frombuffer(raw, np.float32), sr
def f0_track(x, sr, fmin=60, fmax=400, hop=0.01, win=0.04):
    n, h = int(win*sr), int(hop*sr)
    f0s, rms = [], []
    for i in range(0, len(x)-n, h):
        fr = x[i:i+n] - x[i:i+n].mean()
        e = np.sqrt((fr**2).mean()); rms.append(e)
        if e < 0.02: f0s.append(np.nan); continue
        ac = np.correlate(fr, fr, "full")[n-1:]
        lo, hi = int(sr/fmax), int(sr/fmin)
        k = lo + np.argmax(ac[lo:hi])
        f0s.append(sr/k if ac[k] > 0.35*ac[0] else np.nan)
    return np.array(f0s), np.array(rms)
def main():
  for p in sorted(pathlib.Path(sys.argv[1]).glob("*.mp3")):
      x, sr = load(p)
      f0, rms = f0_track(x, sr)
      v = f0[~np.isnan(f0)]
      st = 12*np.log2(v/np.median(v))
      silent = (rms < 0.01).mean()
      peak = np.abs(x).max()
      print(f"{p.stem:14s} f0med={np.median(v):6.1f}Hz  f0sd={st.std():4.2f}st  range90={np.percentile(st,95)-np.percentile(st,5):5.2f}st  silence={silent:4.2f}  peak={peak:4.2f}")

if __name__ == "__main__":
    main()