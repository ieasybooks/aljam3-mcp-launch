"""Loudness-normalise a rendered film to -16 LUFS (true peak ≤ -1.5 dBTP) and remux with fast start.
usage: finalize.py video.mp4 final.mp4 "Title" [mix.wav]   (mix.wav replaces the video's audio)"""
import re, subprocess, sys
raw, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
audio = sys.argv[4] if len(sys.argv) > 4 else raw
def loud(path):
    err = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])
I, tp = loud(audio)
gain = -16.0 - I
print(f"raw: {I} LUFS, true peak {tp} dBTP → gain {gain:+.2f} dB")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-shortest",
                "-af", f"volume={gain:.2f}dB,alimiter=limit=0.68:attack=5:release=90:level=disabled,aresample=48000",
                "-c:a", "aac", "-b:a", "256k", "-metadata", f"title={title}", "-metadata:s:a:0", "language=ara",
                "-movflags", "+faststart", out], check=True)
I2, tp2 = loud(out)
print(f"final: {I2} LUFS, true peak {tp2} dBTP")
