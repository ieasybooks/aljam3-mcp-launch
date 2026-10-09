"""Small ElevenLabs helpers shared by the audition and voice-over scripts."""
import base64, json, os, pathlib, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent

def api_key():
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("ELEVENLABS_API_KEY missing from .env")

def request(path, payload=None, method=None, raw=False, headers=None, data=None):
    h = {"xi-api-key": api_key()}
    if payload is not None:
        data = json.dumps(payload).encode()
        h["Content-Type"] = "application/json"
    h.update(headers or {})
    req = urllib.request.Request("https://api.elevenlabs.io" + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            body = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{e.code} {path}: {e.read().decode()[:800]}")
    return body if raw else json.loads(body)

def tts(voice_id, text, model, settings, out_mp3, output_format="mp3_44100_128", extra=None):
    payload = {"text": text, "model_id": model, "voice_settings": settings}
    payload.update(extra or {})
    data = request(f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format={output_format}", payload)
    pathlib.Path(out_mp3).write_bytes(base64.b64decode(data["audio_base64"]))
    return data

def stt(path, language="ara"):
    boundary = "----aljam3boundary"
    file_bytes = pathlib.Path(path).read_bytes()
    parts = []
    for k, v in {"model_id": "scribe_v1", "language_code": language, "timestamps_granularity": "word"}.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{pathlib.Path(path).name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + file_bytes + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return request("/v1/speech-to-text", data=b"".join(parts), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
