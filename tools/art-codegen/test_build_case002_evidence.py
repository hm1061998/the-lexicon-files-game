import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import build_case002_evidence as b

ROOT = Path(__file__).resolve().parents[2]
EVIDENCES = json.loads((ROOT / "packages/game-content/cases/case-002/evidences.json").read_text(encoding="utf-8"))["evidences"]
REF = ROOT / "apps/game-web/public/assets/evidence/evidence_meeting_minutes.png"


def render_all(evidences):
    return {e["id"]: b.render_evidence(e).tobytes() for e in evidences}


class Case002EvidenceTests(unittest.TestCase):
    def test_renders_one_png_per_evidence_with_case001_size(self):
        size = Image.open(REF).size
        with tempfile.TemporaryDirectory() as tmp:
            b.build(EVIDENCES, Path(tmp))
            names = sorted(p.name for p in Path(tmp).glob("*.png"))
            self.assertEqual(names, sorted(f"evidence_{e['id']}.png" for e in EVIDENCES))
            for p in Path(tmp).glob("*.png"):
                self.assertEqual(Image.open(p).size, size)

    def test_text_comes_from_evidences_json(self):
        base = render_all(EVIDENCES)
        changed = [dict(e, description=e["description"].replace("Bridge", "Bridgx")) for e in EVIDENCES]
        after = render_all(changed)
        for e in EVIDENCES:
            if "Bridge" in e["description"]:
                self.assertNotEqual(base[e["id"]], after[e["id"]], e["id"])

    def test_check_mode_detects_drift(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            b.build(EVIDENCES, out)
            self.assertEqual(b.check(EVIDENCES, out), [])
            victim = out / f"evidence_{EVIDENCES[0]['id']}.png"
            Image.new("RGBA", (480, 480), (0, 0, 0, 255)).save(victim)
            self.assertEqual(b.check(EVIDENCES, out), [victim.name])
            victim.unlink()
            self.assertEqual(b.check(EVIDENCES, out), [victim.name])


if __name__ == "__main__":
    unittest.main()
