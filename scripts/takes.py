"""Generate alternative takes of one clip with different seeds (same context as gen_vo.py).
usage: takes.py clip seed [seed ...]  → archive/takes/<clip>-<seed>.mp3 (+ .json alignment)
Pick a take, then set "seed" on the clip in data/script.json and run gen_vo.py <clip>."""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from eleven import tts, ROOT

script = json.loads((ROOT / "data/script.json").read_text())
voice, clips = script["voice"], script["clips"]
cid, seeds = sys.argv[1], [int(s) for s in sys.argv[2:]]
i = next(k for k, c in enumerate(clips) if c["id"] == cid)
out_dir = ROOT / "archive/takes"
out_dir.mkdir(parents=True, exist_ok=True)
for seed in seeds:
    out = out_dir / f"{cid}-{seed}.mp3"
    if out.exists():
        continue
    extra = {"seed": seed}
    if i > 0: extra["previous_text"] = clips[i - 1]["text"]
    if i < len(clips) - 1: extra["next_text"] = clips[i + 1]["text"]
    data = tts(voice["id"], clips[i]["text"], voice["model"], voice["settings"], out, extra=extra)
    out.with_suffix(".json").write_text(json.dumps(data["alignment"], ensure_ascii=False))
    print("take", out.name, flush=True)
