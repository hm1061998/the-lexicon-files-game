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


def _unrendered(rgba):
    """opaque pixels that show the renderer's black or magenta background."""
    solid = rgba[..., 3] > 128
    rgb = rgba[..., :3].astype(int)
    black = rgb.max(-1) < 20
    magenta = (rgb[..., 0] > 240) & (rgb[..., 1] < 30) & (rgb[..., 2] > 240)
    return solid & (black | magenta)


class PartitionTests(unittest.TestCase):
    """Inner room walls: thin oblique elevations with a cap, glass and alpha around them."""

    @classmethod
    def setUpClass(cls):
        cls.h = {kind: np.asarray(scenes.partition(kind, "h", 480)) for kind in ("office", "archive")}
        cls.v = {kind: np.asarray(scenes.partition(kind, "v", 360)) for kind in ("office", "archive")}

    def test_horizontal_size_is_length_by_cap_plus_height(self):
        for kind, a in self.h.items():
            with self.subTest(kind=kind):
                self.assertEqual(a.shape, (scenes.PARTITION_MARGIN + scenes.PARTITION_T + scenes.PARTITION_H, 480, 4))

    def test_vertical_size_is_narrow_column_with_run_plus_height(self):
        for kind, a in self.v.items():
            with self.subTest(kind=kind):
                self.assertEqual(a.shape, (scenes.PARTITION_MARGIN + 360 + scenes.PARTITION_H, scenes.PARTITION_V_W, 4))
                self.assertLessEqual(a.shape[1], 48)

    def test_no_unrendered_black_or_magenta(self):
        for kind in self.h:
            for name, a in (("h", self.h[kind]), ("v", self.v[kind])):
                with self.subTest(kind=kind, orientation=name):
                    self.assertEqual(int(_unrendered(a).sum()), 0)

    def test_outside_top_edge_is_transparent(self):
        for kind in self.h:
            for name, a in (("h", self.h[kind]), ("v", self.v[kind])):
                with self.subTest(kind=kind, orientation=name):
                    top = a[: scenes.PARTITION_MARGIN - 2]
                    self.assertTrue((top[..., 3] == 0).all(), "rows above the cap must be transparent")

    def test_vertical_sides_are_transparent(self):
        for kind, a in self.v.items():
            with self.subTest(kind=kind):
                self.assertTrue((a[:, 0, 3] == 0).all())
                self.assertTrue((a[:, -1, 3] == 0).all())

    def test_base_row_is_solid_wall(self):
        # the bottom rows (skirting at the floor line) are opaque, so the wall stands on the floor
        for kind, a in self.h.items():
            with self.subTest(kind=kind):
                self.assertGreater(float((a[-3, :, 3] > 200).mean()), 0.95)

    def test_office_glass_is_see_through(self):
        a = self.h["office"]
        alpha = a[scenes.PARTITION_MARGIN + scenes.PARTITION_T:, :, 3]
        partial = (alpha > 20) & (alpha < 200)
        self.assertGreater(float(partial.mean()), 0.15, "glass panes should be semi-transparent")

    def test_palette_only_no_saturated_colour(self):
        for kind in self.h:
            for a in (self.h[kind], self.v[kind]):
                rgb = a[a[..., 3] > 128][:, :3].astype(int)
                sat = rgb.max(-1) - rgb.min(-1)
                self.assertLess(int(np.percentile(sat, 99)), 70)


class HangingPropTests(unittest.TestCase):
    """Wall-hung boards keep transparent space below so their origin sits on the wall base."""

    def test_boards_hang_above_the_floor_line(self):
        for name in ("whiteboard", "bulletin"):
            with self.subTest(name=name):
                a = np.asarray(scenes.wall_board(name))
                self.assertEqual(a.shape[2], 4)
                # the ink outline may reach a few px under the board edge
                self.assertTrue((a[-(scenes.BOARD_HANG - 4):, :, 3] == 0).all())
                self.assertGreater(float((a[..., 3] > 200).mean()), 0.2)
                self.assertEqual(int(_unrendered(a).sum()), 0)


class PartitionConfigTests(unittest.TestCase):
    def test_every_partition_texture_is_built_unkeyed_at_native_size(self):
        entries = [e for e in CONFIG if "/partition_" in e["dest"]]
        self.assertGreater(len(entries), 0)
        for e in entries:
            with self.subTest(dest=e["dest"]):
                self.assertFalse(e["keyMagenta"])
                self.assertIsNone(e["targetWidth"])


if __name__ == "__main__":
    unittest.main()
