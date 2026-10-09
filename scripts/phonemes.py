"""Phoneme transcription (eSpeak IPA) of audio files with wav2vec2 xlsr-53 espeak-cv-ft.
usage: phonemes.py file.wav|mp3 [...] ; prints one line of phonemes per file.
Optional --from S --to E (seconds) slices the audio."""
import sys, subprocess, numpy as np, torch
import json
from huggingface_hub import hf_hub_download
from transformers import Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor
MID = "facebook/wav2vec2-xlsr-53-espeak-cv-ft"
fe = Wav2Vec2FeatureExtractor.from_pretrained(MID)
vocab = {v: k for k, v in json.load(open(hf_hub_download(MID, 'vocab.json'))).items()}
model = Wav2Vec2ForCTC.from_pretrained(MID).eval()
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)
args = sys.argv[1:]
for p in args:
    spec = p.split("@")
    x = load(spec[0])
    if len(spec) == 3: x = x[int(float(spec[1]) * 16000): int(float(spec[2]) * 16000)]
    inp = fe(x, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad(): ids = model(inp.input_values).logits.argmax(-1)[0].tolist()
    out, prev = [], None
    for i in ids:
        if i != prev and vocab[i] not in ("<pad>", "<s>", "</s>", "<unk>"): out.append(vocab[i])
        prev = i
    print(p, "|", " ".join(out), flush=True)
