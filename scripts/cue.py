"""Print absolute cue times: cue.py clip word [clip word ...] (mirrors cue() in src/lib/timeline.ts)."""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
VO = json.loads((ROOT / "src/data/vo.json").read_text())
src = (ROOT / "src/lib/timeline.ts").read_text()
plan = re.findall(r'\["(\w+)", ([\d.]+)\]', src)
starts, cur = {}, 0.0
for cid, gap in plan:
    starts[cid] = cur + float(gap); cur = starts[cid] + VO[cid]["duration"]
D = re.compile(r"[ً-ْٰـ]")
def cue(cid, needle):
    chars = list(VO[cid]["chars"]); idx = [i for i, c in enumerate(chars) if not D.match(c)]
    plain = "".join(chars[i] for i in idx); at = plain.find(needle)
    return starts[cid] + VO[cid]["starts"][idx[at]]
a = sys.argv[1:]
for cid, w in zip(a[::2], a[1::2]): print(cid, w, round(cue(cid, w), 3))
