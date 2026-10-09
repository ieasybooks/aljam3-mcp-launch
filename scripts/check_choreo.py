"""Sanity-check the director after timing changes: clicks after cursor arrival, ordered beats."""
import json
d = json.load(open("out/dbg/director.json"))
T, cur, clicks = d["T"], d["CURSOR"], d["CLICKS"]
print("film duration", round(d["DURATION"], 2))
problems = 0
for c in clicks:
    keys = [k for k in cur if k["t"] <= c + 1e-6]
    k = keys[-1]
    arrive = k["t"] + k.get("d", 0.5)
    if arrive > c + 0.03:
        problems += 1
        print(f"click at {c:.2f} before cursor arrives ({arrive:.2f}) target {k['v']}")
# beats that must stay in order
chain = ["shrink", "launch", "dock", "popOpen", "countStart", "countEnd", "popClose", "ch1", "field", "typeStart", "typeEnd", "send",
         "s1", "d1", "s2", "d2", "ch2", "s3", "d3", "s4", "d4", "context", "ch3", "answer0", "answer1", "linkHover", "open", "loaded", "tourEnd"]
for a, b in zip(chain, chain[1:]):
    if T[a] > T[b] - 0.05:
        problems += 1
        print(f"order: {a}={T[a]:.2f} !< {b}={T[b]:.2f}")
names = {round(v, 3): k for k, v in T.items()}
for l in d["LAG"]:
    late = l["t"] - l["want"]
    if late > 0.3:
        print(f"lag {late:.2f}s: {names.get(round(l['t'], 3), '?')} at {l['t']:.2f} (cue {l['want']:.2f})")
print("problems:", problems)
