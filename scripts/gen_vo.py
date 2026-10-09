"""Generate one voice-over clip per script line, with neighbouring lines as context
so the prosody stays continuous. Existing clips are kept unless named on the command line."""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from eleven import tts, ROOT

script = json.loads((ROOT / "data/script.json").read_text())
voice, clips = script["voice"], script["clips"]
force = set(sys.argv[1:])
for i, clip in enumerate(clips):
    out = ROOT / f"audio/vo/{clip['id']}.mp3"
    if out.exists() and clip["id"] not in force:
        continue
    extra = {"seed": clip.get("seed", voice["seed"])}
    if i > 0: extra["previous_text"] = clips[i - 1]["text"]
    if i < len(clips) - 1: extra["next_text"] = clips[i + 1]["text"]
    data = tts(voice["id"], clip["text"], voice["model"], voice["settings"], out, extra=extra)
    out.with_suffix(".json").write_text(json.dumps(data["alignment"], ensure_ascii=False))
    print("generated", clip["id"], flush=True)
