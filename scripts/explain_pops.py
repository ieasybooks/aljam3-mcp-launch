"""Find pops in a rendered mix that are not explained by transients already present in the
voice clips (natural consonants) or by intended SFX onsets. usage: explain_pops.py video.mp4"""
import sys, json, re, subprocess, numpy as np
SR = 48000
def load(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"])
    return np.frombuffer(raw, np.float32)
def pops(m, ratio=6, floor=0.04):
    d2 = np.abs(np.diff(m, 2)); env = np.sqrt(np.convolve(m ** 2, np.ones(480) / 480, mode="same"))[1:-1]
    idx = np.where((d2 / (env + 1e-4) > ratio) & (d2 > floor))[0]
    out = []
    for i in idx:
        if not out or i - out[-1] > SR * 0.05: out.append(i)
    return [i / SR for i in out]
mix_pops = pops(load(sys.argv[1]))
# voice clip starts from the timeline plan
vo = json.load(open("src/data/vo.json"))
plan = re.findall(r'\["(\w+)", ([\d.]+)\]', open("src/lib/timeline.ts").read())
t = 0; known = []
for cid, gap in plan:
    s = t + float(gap); t = s + vo[cid]["duration"]
    known += [s + p for p in pops(load(f"public/audio/vo/{cid}.wav"), ratio=4, floor=0.02)]
unexplained = [p for p in mix_pops if not any(abs(p - k) < 0.02 for k in known)]
print(f"mix pops {len(mix_pops)}, explained by voice transients {len(mix_pops) - len(unexplained)}")
print("unexplained:", [round(p, 3) for p in unexplained])
