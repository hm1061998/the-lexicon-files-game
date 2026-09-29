import json
import unittest
from pathlib import Path

import numpy as np

import scenes

CONFIG = json.loads((Path(__file__).parent / "assets_config.json").read_text(encoding="utf-8"))
WALL_DESTS = {
    "office": "environment/office/scene_office_wall_back.png",
    "archive": "environment/archive/scene_archive_wall_back.png",
}


class WallElevationTests(unittest.TestCase):
    """The back walls are straight front elevations that tile the full scene width."""

    @classmethod
    def setUpClass(cls):
        cls.walls = {kind: np.asarray(scenes.wall(kind).convert("RGBA")) for kind in WALL_DESTS}

    def test_wall_is_2400_by_260(self):
        for kind, a in self.walls.items():
            with self.subTest(kind=kind):
                self.assertEqual(a.shape[:2], (260, 2400))

    def test_top_and_bottom_rows_are_opaque_wall(self):
        for kind, a in self.walls.items():
            for row in (0, 1, a.shape[0] - 2, a.shape[0] - 1):
                with self.subTest(kind=kind, row=row):
                    self.assertTrue((a[row, :, 3] == 255).all(), "row has transparent pixels")
                    # an unrendered (background) pixel is pure black / magenta, never palette ink
                    rgb = a[row, :, :3].astype(int)
                    self.assertFalse((rgb.max(1) < 20).any(), "row shows unrendered black background")
                    self.assertFalse(((rgb[:, 0] > 240) & (rgb[:, 1] < 30) & (rgb[:, 2] > 240)).any())

    def test_no_background_leaks_anywhere(self):
        for kind, a in self.walls.items():
            with self.subTest(kind=kind):
                self.assertTrue((a[..., 3] == 255).all())
                self.assertLess(float((a[..., :3].max(-1) < 20).mean()), 0.001)

    def test_wall_is_straight_not_diagonal(self):
        # the baseboard sits on the same rows at both ends of a straight elevation
        for kind, a in self.walls.items():
            with self.subTest(kind=kind):
                lum = a[..., :3].astype(float).mean(-1)
                left, right = lum[:, 5:60].mean(1), lum[:, -60:-5].mean(1)
                self.assertLess(float(np.abs(left - right)[-40:].mean()), 25.0)

    def test_config_keeps_wall_dest_opaque_full_width(self):
        for kind, dest in WALL_DESTS.items():
            with self.subTest(kind=kind):
                entry = next(e for e in CONFIG if e["dest"] == dest)
                self.assertEqual(entry["targetWidth"], 2400)
                self.assertFalse(entry["keyMagenta"])


if __name__ == "__main__":
    unittest.main()
