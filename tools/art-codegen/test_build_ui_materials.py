import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

import build_ui_materials as b

EXPECTED = {
    "paper_sheet_fresh.png",
    "paper_sheet_aged.png",
    "paper_torn_frame.png",
    "paper_clip.png",
    "tape_corner.png",
    "index_tab_frame.png",
    "stamp_ring.png",
    "keycap_plate.png",
    "cork_board.png",
}


def hex_rgb(value):
    return np.array([int(value[i:i + 2], 16) for i in (1, 3, 5)], float)


class UiMaterialTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / "a"
        cls.paths = b.build(cls.out)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def load(self, name):
        return np.asarray(Image.open(self.out / name).convert("RGBA"), float)

    def test_builds_exactly_the_nine_files(self):
        self.assertEqual({p.name for p in self.paths if p.parent == self.out}, EXPECTED)
        self.assertEqual({p.name for p in self.out.glob("*.png")}, EXPECTED)

    def test_two_builds_are_byte_identical(self):
        with tempfile.TemporaryDirectory() as other:
            b.build(Path(other))
            for name in EXPECTED | {"world/evidence_ripple.png"}:
                self.assertEqual((self.out / name).read_bytes(), (Path(other) / name).read_bytes(), name)

    def test_paper_sheets_tile_horizontally_and_vertically(self):
        # Cork carries stronger speckle, so its neighbouring columns differ more by nature.
        for name, limit in (("paper_sheet_fresh.png", 2), ("paper_sheet_aged.png", 2), ("cork_board.png", 4)):
            a = self.load(name)
            self.assertEqual(a.shape[:2], (512, 512), name)
            self.assertLess(np.abs(a[:, 0, :3] - a[:, -1, :3]).mean(), limit, name)
            self.assertLess(np.abs(a[0, :, :3] - a[-1, :, :3]).mean(), limit, name)

    def test_paper_tones_stay_near_the_palette(self):
        for name, color in (("paper_sheet_fresh.png", "#D8C5A4"), ("paper_sheet_aged.png", "#CDBA97")):
            mean = self.load(name)[:, :, :3].reshape(-1, 3).mean(axis=0)
            self.assertTrue(np.all(np.abs(mean - hex_rgb(color)) <= 8), (name, mean))

    def test_torn_frame_is_opaque_inside_and_cut_on_bottom_and_right(self):
        a = self.load("paper_torn_frame.png")
        h, w = a.shape[:2]
        s = b.SLICES["paper_torn_frame"]
        self.assertEqual(a[h // 2, w // 2, 3], 255)
        self.assertEqual(a[h // 2, s, 3], 255)
        self.assertEqual(a[0, w // 2, 3], 255)  # top edge stays clean
        self.assertEqual(a[h // 2, 0, 3], 255)  # left edge stays clean
        self.assertEqual(a[h - 1, w - 1, 3], 0)
        self.assertTrue((a[h - 1, :, 3] == 0).any())
        self.assertTrue((a[:, w - 1, 3] == 0).any())
        # Tear never eats into the slice band's inner side: the cut lies in the last `s` px.
        self.assertTrue((a[: h - s, w // 2, 3] == 255).all())
        self.assertTrue((a[h // 2, : w - s, 3] == 255).all())

    def test_slices_fit_their_images(self):
        for name, size in b.SLICES.items():
            a = self.load(name + ".png")
            self.assertGreater(a.shape[0], size * 2, name)
            self.assertGreater(a.shape[1], size * 2, name)

    def test_stamp_ring_only_changes_alpha(self):
        a = self.load("stamp_ring.png")
        rgb = a[:, :, :3].reshape(-1, 3)
        self.assertTrue(np.all(rgb == rgb[0]))
        self.assertGreater(a[:, :, 3].max(), 200)
        self.assertEqual(a[0, 0, 3], 0)
        self.assertEqual(a[a.shape[0] // 2, a.shape[1] // 2, 3], 0)  # hollow ring

    def test_clip_and_tape_are_transparent_cutouts(self):
        for name in ("paper_clip.png", "tape_corner.png"):
            a = self.load(name)
            self.assertEqual(a[0, 0, 3], 0, name)
            self.assertGreater(a[:, :, 3].max(), 100, name)

    def test_keycap_and_tab_have_transparent_corners(self):
        for name in ("keycap_plate.png", "index_tab_frame.png"):
            a = self.load(name)
            self.assertEqual(a[0, 0, 3], 0, name)
            self.assertEqual(a[a.shape[0] // 2, a.shape[1] // 2, 3], 255, name)


class WorldMaterialTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name)
        b.build(cls.out)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_evidence_ripple_is_128_by_64_and_only_alpha_varies(self):
        a = np.asarray(Image.open(self.out / "world" / "evidence_ripple.png").convert("RGBA"), float)
        self.assertEqual(a.shape[:2], (64, 128))
        rgb = a[:, :, :3].reshape(-1, 3)
        self.assertTrue(np.all(rgb == rgb[0]))
        self.assertGreater(a[:, :, 3].max(), 150)
        self.assertEqual(a[0, 0, 3], 0)
        self.assertEqual(a[32, 64, 3], 0)  # hollow centre


if __name__ == "__main__":
    unittest.main()
