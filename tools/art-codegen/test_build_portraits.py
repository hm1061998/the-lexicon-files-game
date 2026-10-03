import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

import build_portraits as b

ROOT = Path(__file__).resolve().parents[2]
SPRITE = ROOT / "apps/game-web/public/assets/characters/anna/chr_anna_idle_sw.png"


class PortraitTests(unittest.TestCase):
    def test_portrait_is_240_by_300_and_opaque(self):
        image = b.render_portrait(Image.open(SPRITE))
        self.assertEqual(image.size, (240, 300))
        alpha = np.asarray(image.convert("RGBA"))[:, :, 3]
        self.assertTrue((alpha == 255).all())

    def test_same_input_gives_the_same_bytes(self):
        a = b.render_portrait(Image.open(SPRITE)).tobytes()
        c = b.render_portrait(Image.open(SPRITE)).tobytes()
        self.assertEqual(a, c)

    def test_figure_differs_from_the_paper(self):
        image = np.asarray(b.render_portrait(Image.open(SPRITE)).convert("RGB"), float)
        paper = np.array([0xCD, 0xBA, 0x97], float)
        far = np.abs(image - paper).sum(axis=2) > 60
        self.assertGreater(far.mean(), 0.15)

    def test_build_writes_one_png_per_npc(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = b.build(Path(tmp))
            self.assertEqual(sorted(p.name for p in paths), ["anna.png", "david.png", "leo.png"])
            for p in paths:
                self.assertEqual(Image.open(p).size, (240, 300))


if __name__ == "__main__":
    unittest.main()
