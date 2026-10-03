import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import import_ui_sounds as imp

ROOT = Path(__file__).resolve().parents[2]
MAP = ROOT / "tools/audio-codegen/ui_sound_map.json"
OUT = ROOT / "apps/game-web/public/audio/ui"
SFX_IDS = {"press", "paper-open", "paper-close", "pen", "stamp", "tab", "device-click"}


class UiSoundMapTests(unittest.TestCase):
    def setUp(self):
        self.map = json.loads(MAP.read_text(encoding="utf-8"))["sounds"]

    def test_every_mapped_sound_is_a_known_id_with_cc0_credit(self):
        for sound_id, entry in self.map.items():
            self.assertIn(sound_id, SFX_IDS | {"tape-loop"}, sound_id)
            self.assertEqual(entry["license"], "CC0-1.0", sound_id)
            for key in ("source", "pack", "url"):
                self.assertTrue(entry.get(key), f"{sound_id}.{key}")

    def test_the_seven_interface_sounds_are_mapped(self):
        self.assertTrue(SFX_IDS <= set(self.map), SFX_IDS - set(self.map))

    def test_every_mapped_sound_has_an_output_file_matching_the_provenance(self):
        provenance = json.loads((OUT / "provenance.json").read_text(encoding="utf-8"))
        self.assertEqual(set(provenance["sounds"]), set(self.map))
        for sound_id, row in provenance["sounds"].items():
            out = OUT / f"{sound_id}.ogg"
            self.assertTrue(out.exists(), sound_id)
            self.assertEqual(hashlib.sha256(out.read_bytes()).hexdigest(), row["outputSha256"], sound_id)
            self.assertEqual(row["license"], "CC0-1.0")
            for key in ("sourceSha256", "source", "pack", "url", "transform"):
                self.assertIn(key, row, f"{sound_id}.{key}")

    def test_files_are_ogg_vorbis(self):
        for sound_id in self.map:
            self.assertEqual((OUT / f"{sound_id}.ogg").read_bytes()[:4], b"OggS", sound_id)


class ImportTests(unittest.TestCase):
    def make_source(self, root):
        pack = root / "pack"
        pack.mkdir()
        (pack / "License.txt").write_text("License: (Creative Commons Zero, CC0)", encoding="utf-8")
        (pack / "a.ogg").write_bytes(b"OggS" + b"\x00" * 60)
        return {"press": {"source": "pack/a.ogg", "pack": "Test pack", "url": "https://example.test", "license": "CC0-1.0"}}

    def test_import_copies_files_and_writes_a_provenance_row_per_sound(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sounds = self.make_source(root)
            out = root / "out"
            imp.run(sounds, root, out)
            self.assertEqual((out / "press.ogg").read_bytes(), (root / "pack/a.ogg").read_bytes())
            row = json.loads((out / "provenance.json").read_text(encoding="utf-8"))["sounds"]["press"]
            self.assertEqual(row["sourceSha256"], hashlib.sha256((root / "pack/a.ogg").read_bytes()).hexdigest())

    def test_import_is_repeatable(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sounds = self.make_source(root)
            out = root / "out"
            imp.run(sounds, root, out)
            first = (out / "provenance.json").read_bytes()
            imp.run(sounds, root, out)
            self.assertEqual((out / "provenance.json").read_bytes(), first)

    def test_a_pack_without_a_cc0_licence_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sounds = self.make_source(root)
            (root / "pack/License.txt").write_text("All rights reserved", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "CC0"):
                imp.run(sounds, root, root / "out")

    def test_a_missing_source_file_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sounds = self.make_source(root)
            sounds["press"]["source"] = "pack/missing.ogg"
            with self.assertRaisesRegex(FileNotFoundError, "missing.ogg"):
                imp.run(sounds, root, root / "out")


if __name__ == "__main__":
    unittest.main()
