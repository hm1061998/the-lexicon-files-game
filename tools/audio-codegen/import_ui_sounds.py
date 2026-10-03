"""Import the CC0 UI sound set into the game.

    python tools/audio-codegen/import_ui_sounds.py

Reads `ui_sound_map.json` (UI sound id -> a file in `assets/_incoming/audio`, kept local and not
committed), copies each file to `apps/game-web/public/audio/ui/<id>.ogg` and writes
`provenance.json` with the source, the pack, the licence and SHA-256 of both ends.

The Kenney files are already Ogg Vorbis and are copied unchanged: no re-encoding, so no ffmpeg is
needed. A pack is refused unless its `License.txt` states CC0.
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAP = ROOT / "tools/audio-codegen/ui_sound_map.json"
INCOMING = ROOT / "assets/_incoming/audio"
OUT_DIR = ROOT / "apps/game-web/public/audio/ui"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assert_cc0(pack_dir: Path) -> None:
    licence = pack_dir / "License.txt"
    text = licence.read_text(encoding="utf-8", errors="replace") if licence.exists() else ""
    if "CC0" not in text and "Creative Commons Zero" not in text:
        raise ValueError(f"{pack_dir.name}: License.txt does not state CC0")


def run(sounds: dict, incoming: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = {}
    for sound_id, entry in sorted(sounds.items()):
        source = incoming / entry["source"]
        if not source.exists():
            raise FileNotFoundError(f"{sound_id}: {source}")
        assert_cc0(incoming / Path(entry["source"]).parts[0])
        target = out_dir / f"{sound_id}.ogg"
        shutil.copyfile(source, target)
        rows[sound_id] = {
            "source": entry["source"],
            "pack": entry["pack"],
            "url": entry["url"],
            "license": entry["license"],
            "transform": "copied unchanged (already Ogg Vorbis)",
            "sourceSha256": sha256(source),
            "outputSha256": sha256(target),
        }
    provenance = {"generator": "tools/audio-codegen/import_ui_sounds.py", "sounds": rows}
    (out_dir / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    return provenance


def main() -> int:
    sounds = json.loads(MAP.read_text(encoding="utf-8"))["sounds"]
    try:
        run(sounds, INCOMING, OUT_DIR)
    except (FileNotFoundError, ValueError) as error:
        print(f"import_ui_sounds: {error}", file=sys.stderr)
        return 1
    print(f"imported {len(sounds)} UI sounds into {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
