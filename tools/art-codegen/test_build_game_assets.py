import unittest

import numpy as np
from PIL import Image

import build_game_assets as b


def synth():
    a = np.zeros((64, 64, 3), np.uint8)
    a[:] = (255, 0, 255)
    a[20:44, 20:44] = (120, 80, 40)
    return Image.fromarray(a)


class KeyTests(unittest.TestCase):
    def test_key_alpha(self):
        out = np.asarray(b.key_magenta(synth()))
        self.assertEqual(out[0, 0, 3], 0)
        self.assertEqual(out[32, 32, 3], 255)

    def test_no_magenta_fringe(self):
        # soften edges like a resampled image
        from PIL import ImageFilter
        img = synth().filter(ImageFilter.GaussianBlur(1.5))
        out = np.asarray(b.key_magenta(img)).astype(int)
        m = (out[..., 3] > 0) & (out[..., 3] < 255)
        self.assertTrue(m.any())
        self.assertTrue((out[..., 0][m] - out[..., 1][m] <= 40).all())
        self.assertTrue((out[..., 2][m] - out[..., 1][m] <= 40).all())

    def test_fit_width(self):
        self.assertEqual(b.fit_width(Image.new("RGBA", (100, 50)), 40).size, (40, 20))

    def test_frame_character(self):
        self.assertEqual(b.frame_character(Image.new("RGBA", (512, 512)), 160).size, (160, 160))

    def test_alpha_bbox(self):
        self.assertEqual(b.alpha_bbox(b.key_magenta(synth())), (20, 20, 44, 44))


if __name__ == "__main__":
    unittest.main()
