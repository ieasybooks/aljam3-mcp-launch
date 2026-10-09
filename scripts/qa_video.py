"""QA a rendered video: loudness, audio pops (isolated sample spikes), clipping, and visual jumps.
usage: python qa_video.py video.mp4 [start_offset_seconds]"""
import sys, subprocess, re, numpy as np
path = sys.argv[1]; off = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
SR = 48000
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"])
a = np.frombuffer(raw, np.float32).reshape(-1, 2)
mono = a.mean(axis=1)
peak = np.abs(a).max()
lufs = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", lufs)[-1]; TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lufs)[-1]
print(f"audio: {len(mono)/SR:.2f}s  integrated {I} LUFS  true peak {TP} dBFS  sample peak {20*np.log10(peak+1e-9):.2f} dBFS  clipped samples {(np.abs(a) > 0.999).sum()}")
# pops: second difference much larger than the local level (a click is a sharp discontinuity)
d2 = np.abs(np.diff(mono, 2))
win = 480
env = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode="same"))[1:-1]
ratio = d2 / (env + 1e-4)
idx = np.where((ratio > 6) & (d2 > 0.04))[0]
pops = []
for i in idx:
    if not pops or i - pops[-1] > SR * 0.05: pops.append(i)
print(f"pops: {len(pops)}", [round(off + i / SR, 3) for i in pops[:20]])
# video jumps: mean abs difference between consecutive downscaled frames
w, h = 192, 108
probe = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", path]).decode().strip().split(",")
if int(probe[1]) > int(probe[0]): w, h = 108, 192
fps = eval(probe[2])
vraw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"])
v = np.frombuffer(vraw, np.uint8).reshape(-1, h, w).astype(np.float32)
diff = np.abs(np.diff(v, axis=0)).mean(axis=(1, 2))
med = np.median(diff) + 0.5
jumps = [(round(off + (i + 1) / fps, 3), round(float(diff[i]), 1)) for i in range(len(diff)) if diff[i] > 6 and diff[i] > 4 * max(diff[max(0, i - 3):i].max(initial=0), diff[i + 1:i + 4].max(initial=0), 0.5)]
print(f"frames {len(v)}  median diff {np.median(diff):.2f}  max {diff.max():.1f} at {off + (diff.argmax()+1)/fps:.2f}s")
print("isolated visual jumps:", jumps[:30])
