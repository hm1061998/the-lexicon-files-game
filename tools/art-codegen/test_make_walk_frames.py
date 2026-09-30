"""Contract tests for chr_<name>_walk.png (8 cols x 4 rows NE,SE,SW,NW, 160 px cells, feet 88%).

The on-disk checks also apply to real sheets dropped in later (same file name, same contract).
"""
import unittest

import numpy as np
from PIL import Image

import make_walk_frames as w

NAMES = ("player", "leo", "anna", "david")
SHIPPED_SHEET_NAMES = ("player", "anna", "leo", "david")
CELL = 160
FEET_EXCLUSIVE = 141  # last opaque row 140 -> bbox bottom (exclusive) 141


def cells(sheet: np.ndarray):
    for r in range(4):
        yield r, [sheet[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL] for c in range(8)]


def dist(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.abs(a.astype(np.int16) - b.astype(np.int16)).sum()) / 255.0


class SheetContractTests(unittest.TestCase):
    def load(self, name):
        path = w.sheet_path(name)
        self.assertTrue(path.exists(), f"missing {path}")
        return np.asarray(Image.open(path).convert("RGBA"))

    def test_sheet_size(self):
        for name in SHIPPED_SHEET_NAMES:
            with self.subTest(name=name):
                self.assertEqual(self.load(name).shape[:2], (640, 1280))

    def test_cells_not_empty_and_feet_on_line(self):
        for name in SHIPPED_SHEET_NAMES:
            sheet = self.load(name)
            for r, row in cells(sheet):
                for c, cell in enumerate(row):
                    with self.subTest(name=name, row=r, col=c):
                        ys = np.nonzero(cell[..., 3] > 8)[0]
                        self.assertGreater(len(ys), 500)
                        self.assertLessEqual(abs(int(ys.max()) + 1 - FEET_EXCLUSIVE), 1)

    def test_frames_differ_and_loop_is_seamless(self):
        for name in SHIPPED_SHEET_NAMES:
            sheet = self.load(name)
            for r, row in cells(sheet):
                with self.subTest(name=name, row=r):
                    distinct = sum(1 for k in range(1, 8) if dist(row[k], row[0]) > 20)
                    self.assertGreaterEqual(distinct, 5)
                    steps = [dist(row[k], row[k + 1]) for k in range(7)]
                    self.assertLessEqual(dist(row[7], row[0]), 1.5 * (sum(steps) / 7))

    def test_no_magenta_on_translucent_pixels(self):
        for name in SHIPPED_SHEET_NAMES:
            with self.subTest(name=name):
                px = self.load(name).astype(int)
                semi = (px[..., 3] > 0) & (px[..., 3] < 255)
                r, g, b = px[..., 0][semi], px[..., 1][semi], px[..., 2][semi]
                self.assertFalse(((r - g > 40) & (b - g > 40)).any())


class FrameTests(unittest.TestCase):
    def test_frame_zero_is_idle_pose(self):
        idle = w.load_idle("player", "se")
        frame0 = np.asarray(w.make_frame(idle, w.analyze(idle), 0, w.params_for("se")))
        self.assertLess(dist(frame0, w.despill(np.asarray(idle))), 5)

    def test_legs_alternate(self):
        idle = w.load_idle("player", "se")
        info = w.analyze(idle)
        p = w.params_for("se")
        # Quarter and three-quarter cycle mirror the stride: the lower body differs strongly.
        a = np.asarray(w.make_frame(idle, info, 2, p))[info.split_y:]
        b = np.asarray(w.make_frame(idle, info, 6, p))[info.split_y:]
        self.assertGreater(dist(a, b), 60)

    def test_no_detached_fragments(self):
        from scipy import ndimage as ndi

        def stray(px):
            lab, n = ndi.label(px[..., 3] > 40, structure=np.ones((3, 3)))
            if n <= 1:
                return 0
            sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
            return int(sizes.sum() - sizes.max())

        for name in NAMES:
            for d in w.DIRS:
                idle = w.load_idle(name, d)
                info, p = w.analyze(idle), w.params_for(d)
                base = stray(np.asarray(idle))
                for k in range(8):
                    with self.subTest(name=name, dir=d, k=k):
                        self.assertLessEqual(stray(np.asarray(w.make_frame(idle, info, k, p))), base + 4)

    def test_cli_names(self):
        self.assertEqual(w.resolve_names(["--all"]), list(NAMES))
        self.assertEqual(w.resolve_names(["leo"]), ["leo"])


if __name__ == "__main__":
    unittest.main()
