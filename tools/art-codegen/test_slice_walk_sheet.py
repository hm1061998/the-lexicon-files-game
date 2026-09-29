import unittest

import numpy as np
from PIL import Image

import slice_walk_sheet as s


def synthetic_sheet(cell=300):
    """8x4 magenta sheet; each cell holds a figure whose feet sit at varying heights."""
    a = np.zeros((cell * 4, cell * 8, 3), np.uint8)
    a[:] = (255, 0, 255)
    for r in range(4):
        for c in range(8):
            x0, y0 = c * cell, r * cell
            lift = 12 if c % 4 == 2 else 0  # a raised frame keeps its lift
            h = 180 + (r * 5)
            bottom = y0 + 260 - lift
            a[bottom - h:bottom, x0 + 130 + c:x0 + 170 + c] = (110, 90, 60)
    return Image.fromarray(a)


class SliceWalkSheetTests(unittest.TestCase):
    def test_output_contract(self):
        out = np.asarray(s.slice_sheet(synthetic_sheet()))
        self.assertEqual(out.shape, (640, 1280, 4))
        for r in range(4):
            bottoms = []
            for c in range(8):
                cell = out[r * 160:(r + 1) * 160, c * 160:(c + 1) * 160]
                ys = np.nonzero(cell[..., 3] > 8)[0]
                self.assertGreater(len(ys), 100)
                bottoms.append(int(ys.max()) + 1)
            # The lowest foot of each row sits on the 88% line, lifted frames stay lifted.
            self.assertEqual(max(bottoms), 141)
            self.assertLess(bottoms[2], 141)

    def test_tallest_figure_is_100px(self):
        out = np.asarray(s.slice_sheet(synthetic_sheet()))
        ys = np.nonzero(out[..., 3] > 8)[0]
        heights = []
        for r in range(4):
            cell = out[r * 160:(r + 1) * 160, 0:160]
            cy = np.nonzero(cell[..., 3] > 8)[0]
            heights.append(int(cy.max() - cy.min() + 1))
        self.assertTrue(len(ys))
        self.assertLessEqual(abs(max(heights) - s.FIGURE_HEIGHT), 1)

    def test_no_magenta_left(self):
        from PIL import ImageFilter

        out = np.asarray(s.slice_sheet(synthetic_sheet().filter(ImageFilter.GaussianBlur(2)))).astype(int)
        semi = (out[..., 3] > 0) & (out[..., 3] < 255)
        r, g, b = out[..., 0][semi], out[..., 1][semi], out[..., 2][semi]
        self.assertFalse(((r - g > 40) & (b - g > 40)).any())

    def test_rejects_wrong_grid(self):
        with self.assertRaises(ValueError):
            s.slice_sheet(Image.new("RGB", (803, 400), (255, 0, 255)))


if __name__ == "__main__":
    unittest.main()
