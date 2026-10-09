import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from eleven import request, ROOT
SFX = {
  "whoosh": ("soft smooth airy whoosh transition, gentle and clean, modern UI motion, no music", 1.0),
  "whoosh_long": ("slow soft cinematic air whoosh passing by, warm and smooth, no music, no tones", 1.8),
  "click": ("single soft modern computer mouse click, close and clean, no reverb", 0.5),
  "typing": ("gentle typing on a quiet modern laptop keyboard, steady soft keystrokes, close microphone, no music", 2.6),
  "paper_gather": ("many paper pages fluttering and gathering together into one stack, soft airy flutter ending in a gentle settle, no music", 2.4),
  "impact": ("deep soft cinematic low boom with a warm airy tail, gentle and elegant, not aggressive, no music, no melody", 3.0),
  "riser": ("soft airy cinematic riser made of wind and breath, slowly building, no music, no tones, no melody", 2.5),
  "pop": ("soft subtle user interface pop notification sound, short and clean, no melody", 0.5),
  "toggle": ("small soft plastic switch toggle click, crisp, close", 0.5),
  "slide": ("soft subtle sliding swipe of a card across a desk, short, smooth", 0.7),
  "book_close": ("hardcover book gently closing, soft thump with paper air, close", 1.0),
  "room": ("very quiet calm library room tone, soft air, distant faint page turns, no voices, no music", 12.0),
}
for name, (text, dur) in SFX.items():
    out = ROOT / f"audio/sfx_raw/{name}.mp3"
    if out.exists(): continue
    out.write_bytes(request("/v1/sound-generation", {"text": text, "duration_seconds": dur, "prompt_influence": 0.55}, raw=True))
    print("ok", name, flush=True)
