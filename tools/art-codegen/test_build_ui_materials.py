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
    "desk_wood.png",
    "folder_cover.png",
    "folder_tab.png",
    "scrim_vignette.png",
    "cursor_magnifier.png",
    "cursor_pen.png",
    "cursor_hand.png",
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

    def test_builds_exactly_the_thirteen_files(self):
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


class ShellMaterialTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name)
        b.build(cls.out)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def load(self, name):
        return np.asarray(Image.open(self.out / name).convert("RGBA"), float)

    def test_desk_wood_tiles_and_stays_dark(self):
        a = self.load("desk_wood.png")
        self.assertEqual(a.shape[:2], (512, 512))
        self.assertLess(np.abs(a[:, 0, :3] - a[:, -1, :3]).mean(), 4)
        self.assertLess(np.abs(a[0, :, :3] - a[-1, :, :3]).mean(), 4)
        self.assertTrue(np.all(a[:, :, :3].reshape(-1, 3).mean(axis=0) < 90))
        self.assertTrue(np.all(a[:, :, 3] == 255))

    def test_folder_cover_and_tab_have_transparent_corners_and_solid_centre(self):
        for name, size in (("folder_cover.png", (240, 320)), ("folder_tab.png", (64, 160))):
            a = self.load(name)
            self.assertEqual(a.shape[:2], size, name)
            self.assertEqual(a[0, 0, 3], 0, name)
            self.assertEqual(a[a.shape[0] // 2, a.shape[1] // 2, 3], 255, name)
            slice_px = b.SLICES[name.replace(".png", "")]
            self.assertGreater(a.shape[0], slice_px * 2, name)
            self.assertGreater(a.shape[1], slice_px * 2, name)

    def test_scrim_vignette_only_changes_alpha(self):
        a = self.load("scrim_vignette.png")
        self.assertEqual(a.shape[:2], (256, 256))
        rgb = a[:, :, :3].reshape(-1, 3)
        self.assertTrue(np.all(rgb == rgb[0]))
        self.assertLess(a[128, 128, 3], 30)
        self.assertGreater(a[0, 0, 3], 150)


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

    def test_portal_arches_are_256_by_352_with_transparent_corners(self):
        for facing in ("ne", "nw"):
            a = np.asarray(Image.open(self.out / "world" / f"portal_arch_{facing}.png").convert("RGBA"), float)
            self.assertEqual(a.shape[:2], (352, 256), facing)
            self.assertEqual(a[0, 0, 3], 0, facing)
            self.assertEqual(a[0, -1, 3], 0, facing)
            self.assertGreater(a[:, :, 3].max(), 200, facing)

    def test_portal_arches_slope_in_opposite_directions(self):
        def base_row(facing, column):
            a = np.asarray(Image.open(self.out / "world" / f"portal_arch_{facing}.png").convert("RGBA"))
            ys = np.nonzero(a[:, column, 3] > 128)[0]
            return ys.max()

        # A wall running along v rises to the right (ne); one along u falls to the right (nw).
        self.assertLess(base_row("ne", 186), base_row("ne", 70))
        self.assertGreater(base_row("nw", 186), base_row("nw", 70))

    def test_portal_veils_are_ten_frames_of_128_by_256(self):
        for facing in ("ne", "nw"):
            a = np.asarray(Image.open(self.out / "world" / f"portal_veil_{facing}.png").convert("RGBA"), float)
            self.assertEqual(a.shape[:2], (256, 1280), facing)
            frames = [a[:, i * 128:(i + 1) * 128, :] for i in range(10)]
            self.assertTrue(any(not np.array_equal(frames[0], f) for f in frames[1:]), facing)
            for f in frames:
                self.assertEqual(f[0, 0, 3], 0)
                self.assertGreater(f[:, :, 3].max(), 150)

    def test_veil_loops_seamlessly(self):
        a = np.asarray(Image.open(self.out / "world" / "portal_veil_ne.png").convert("RGBA"), float)
        first, last = a[:, 0:128, :3], a[:, 9 * 128:10 * 128, :3]
        step = np.abs(a[:, 128:256, :3] - first).mean()
        wrap = np.abs(first - last).mean()
        self.assertLess(wrap, step * 1.5 + 1)

    def test_cursors_are_32_by_32_with_a_visible_hotspot(self):
        hotspots = {"magnifier": (11, 11), "pen": (2, 30), "hand": (10, 2)}
        for kind, (hx, hy) in hotspots.items():
            image = Image.open(self.out / f"cursor_{kind}.png")
            self.assertEqual(image.size, (32, 32), kind)
            alpha = np.asarray(image.convert("RGBA"))[:, :, 3]
            self.assertGreater(alpha.max(), 200, kind)
            near = alpha[max(0, hy - 3):hy + 4, max(0, hx - 3):hx + 4]
            self.assertGreater(near.max(), 0, f"{kind} hotspot area is empty")
            corners = [alpha[0, 0], alpha[0, 31], alpha[31, 0], alpha[31, 31]]
            self.assertGreaterEqual(sum(1 for c in corners if c == 0), 2, kind)

    def test_cursor_render_is_deterministic(self):
        a = b.render_cursor("pen")
        c = b.render_cursor("pen")
        self.assertEqual(a.tobytes(), c.tobytes())


if __name__ == "__main__":
    unittest.main()
