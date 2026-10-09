"""List every pause (>= 0.1 s) in the cleaned clips with the words around it, and the pace."""
import json, re, sys, pathlib, numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from voice_stats import load
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "audio/vo_clean")
rep = json.loads((DIR / "clips.json").read_text())
tot_words = tot_speech = 0
for cid, r in rep.items():
    x, sr = load(DIR / f"{cid}.wav", 16000)
    rms = np.array([np.sqrt((x[i:i+160]**2).mean()) for i in range(0, len(x)-160, 160)])
    sil = rms < 0.008; v = np.where(~sil)[0]
    chars = r["chars"]; starts = r["starts"]
    text = "".join(chars)
    # word spans
    words = [(m.start(), m.end()) for m in re.finditer(r"\S+", text)]
    wstart = [starts[a] for a, b in words]
    out = []; i = v[0]
    while i < v[-1]:
        if sil[i]:
            j = i
            while j < v[-1] and sil[j]: j += 1
            if j - i >= 10:
                t0 = i / 100
                k = max([n for n, ws in enumerate(wstart) if ws <= t0 + 0.05] or [0])
                out.append(f"{(j-i)/100:.2f}s after «{text[words[k][0]:words[k][1]]}»")
            i = j
        else: i += 1
    nw = len(words); sp = (v[-1] - v[0]) / 100
    tot_words += nw; tot_speech += sp
    print(f"{cid:8s} {sp:5.2f}s {nw/sp:4.2f} w/s  " + "; ".join(out))
print(f"total speech {tot_speech:.1f}s, {tot_words/tot_speech:.2f} w/s")
