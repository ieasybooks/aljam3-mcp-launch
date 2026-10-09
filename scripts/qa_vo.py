import json, sys, pathlib, re, difflib, numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from eleven import stt, ROOT
from voice_stats import load

def norm(s):
    s = re.sub(r"[ً-ْٰـ]", "", s)
    s = re.sub(r"[إأآا]", "ا", s).replace("ة", "ه").replace("ى", "ي")
    s = re.sub(r"[^ء-ي\s]", " ", s)
    return s.split()

script = json.loads((ROOT / "data/script.json").read_text())
total = 0
for clip in script["clips"]:
    mp3 = ROOT / f"audio/vo/{clip['id']}.mp3"
    cache = mp3.with_suffix(".stt.json")
    if not cache.exists() or cache.stat().st_mtime < mp3.stat().st_mtime:
        cache.write_text(json.dumps(stt(mp3), ensure_ascii=False))
    res = json.loads(cache.read_text())
    ref, hyp = norm(clip["text"]), norm(res["text"])
    sm = difflib.SequenceMatcher(None, ref, hyp)
    errs = [(" ".join(ref[a:b]), " ".join(hyp[c:d])) for op, a, b, c, d in sm.get_opcodes() if op != "equal"]
    x, sr = load(mp3, 44100)
    h = int(0.01 * sr)
    rms = np.array([np.sqrt((x[i:i+h]**2).mean()) for i in range(0, len(x) - h, h)])
    voiced = np.where(rms > 0.006)[0]
    lead, tail = voiced[0] / 100, (len(rms) - voiced[-1]) / 100
    dur = len(x) / sr
    total += dur
    print(f"{clip['id']:8s} {dur:5.2f}s lead={lead:.2f} tail={tail:.2f} peak={np.abs(x).max():.2f} match={sm.ratio():.2f} {errs if errs else ''}")
print("total", round(total, 1))
