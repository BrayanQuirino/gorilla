#!/usr/bin/env python3
"""Download approved, openly licensed Gorilla samples during Pages build.
Unavailable sources are reported rather than replaced with synthetic audio.
"""
import html, json, re, subprocess, tempfile, urllib.request
from pathlib import Path
from urllib.parse import urljoin, unquote

BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; GorillaGame/1.0)", "Accept": "text/html,application/xhtml+xml,*/*"}
SOURCES = [
  # key, page, trim-start, duration, speed, pitch semitones, variant index
  ("inicio_batalla", "https://cdn.freesound.org/previews/764/764267_11744683-hq.mp3", 0, 4, 1, 0, 0),
  ("golpe_humano", "https://cdn.freesound.org/previews/517/517744_9996727-hq.mp3", 0, 1, 1, 0, 0),
  ("rugido", "https://cdn.freesound.org/previews/397/397054_2884295-hq.mp3", 0, 3.1, 1, 0, 0),
  ("pisada_gorila", "https://cdn.pixabay.com/download/audio/2025/05/23/audio_b1a8e3188f.mp3?filename=running-on-dirt-road-footsteps-sound-effect-194380.mp3", 0, 14, 1.5, 0, 0),
  ("estrujon", "https://pixabay.com/sound-effects/film-special-effects-lettuce-crushing-gore-sound-27156/", 0, 3, 1, 0, 0),
  ("lanzamiento", "https://pixabay.com/sound-effects/film-special-effects-fast-swoosh-383967/", 0, 8, .65, 0, 0),
  ("disparo", "https://cdn.freesound.org/previews/427/427594_3094998-hq.mp3", 0, 3.1, 1, 0, 0),
  ("objeto_lanzado", "https://pixabay.com/sound-effects/film-special-effects-swing-whoosh-5-198498/", 0, 3, 1, 0, 0),
  ("impacto_objeto", "https://pixabay.com/sound-effects/film-special-effects-impact-thud-291047/", 0, 2, 1, 0, 0),
  ("baja", "https://cdn.freesound.org/previews/160/160742_2895542-hq.mp3", 0, 1.1, 1, 0, 0),
  ("segunda_vida", "https://pixabay.com/sound-effects/film-special-effects-gorilla-roar-523007/", 2, 3, 1, 0, 0),
  ("captura_desplegada", "https://pixabay.com/es/sound-effects/pel%C3%ADculas-y-efectos-especiales-rope-tighten-knot-5-199791/", 0, 2, 1, 0, 0),
  ("captura_rota", "https://cdn.freesound.org/previews/443/443833_9184212-hq.mp3", 0, 1, 1, 0, 0),
  ("suministro_recogido", "https://cdn.freesound.org/previews/822/822565_71257-hq.mp3", 0, 1, 1, 0, 0),
  ("objeto_soltado", "https://cdn.freesound.org/previews/189/189312_71257-hq.mp3", 0, 1, 1, 0, 0),
  ("music_a", "https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Epic%20Boss%20Battle%20%5BSeamlessly%20Looping%5D.wav", 0, None, 1, 0, 0),
  ("music_b1", "https://opengameart.org/sites/default/files/CleytonRX%20-%20Battle%20RPG%20Theme_1.mp3", 0, None, 1, 0, 0),
  ("music_b2", "https://opengameart.org/sites/default/files/CleytonRX%20-%20Battle%20RPG%20Theme%20Var_0.ogg", 0, None, 1, 0, 0),
]

def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=24) as r:
        return r.read()

def media_url(page):
    if re.search(r"\.(mp3|ogg|wav)(?:\?|$)", page):
        return page
    data = fetch(page).decode("utf-8", "replace")
    normalized = html.unescape(data.replace(r"\/", "/").replace(r"\u002F", "/").replace(r"\u0026", "&"))
    if "freesound.org" in page:
        # Freesound embeds its public preview URL in og:audio.
        urls = re.findall(r'https?://(?:cdn\.)?freesound\.org/(?:data/)?previews/[^"\s<>]+?\.mp3', normalized)
        if urls:
            return urls[0].replace("-lq.mp3", "-hq.mp3")
    else:
        urls = re.findall(r'https?://cdn\.pixabay\.com/(?:audio|download/audio)/[^"\s<>\\]+?\.(?:mp3|wav|ogg)', normalized)
        if urls:
            return urls[0]
        # Some Pixabay pages expose the audio URL as a JSON string.
        urls = re.findall(r'["\'](https?://[^"\']+\.(?:mp3|wav|ogg)(?:\?[^"\']*)?)["\']', normalized)
        if urls:
            return urls[0]
    raise RuntimeError("No public audio preview found in page HTML")

ok = []
missing = []
with tempfile.TemporaryDirectory() as temp:
    for key, page, start, duration, speed, pitch, index in SOURCES:
        try:
            source = media_url(page)
            raw = Path(temp) / (key + ".source")
            raw.write_bytes(fetch(source))
            target = OUT / (key + ".mp3")
            filters = ["aresample=44100"]
            if speed != 1: filters.append(f"atempo={speed}")
            # Maintain the selected actual recording, with speed alteration only where requested.
            cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-ss", str(start)]
            if duration is not None: cmd += ["-t", str(duration)]
            cmd += ["-af", ",".join(filters), "-codec:a", "libmp3lame", "-b:a", "144k", str(target)]
            subprocess.run(cmd, check=True, timeout=120)
            if target.stat().st_size < 250: raise RuntimeError("Empty converted clip")
            ok.append(key)
            print(f"OK {key}: {target.stat().st_size} bytes")
        except Exception as exc:
            missing.append({"name": key, "source": page, "error": str(exc)})
            print(f"WARNING {key}: {exc}")
(OUT / "status.json").write_text(json.dumps({"ok": ok, "missing": missing}, ensure_ascii=False, indent=2))
print(f"Audio available: {len(ok)}/{len(SOURCES)}")
if not any(x.startswith("music_") for x in ok):
    raise SystemExit("No licensed music could be retrieved. Stop deployment instead of publishing broken audio.")
