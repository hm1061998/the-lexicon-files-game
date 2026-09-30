import unittest
import json
from pathlib import Path
import numpy as np
from iso import Cam
from world_modules import floor_diamond, wall_module, door_frame, WALL_HEIGHT_PX

class WorldModuleTests(unittest.TestCase):
    def test_dimetric_axes_have_2_to_1_slope(self):
        p = Cam('dimetric').proj([[1, 0, 0], [0, 1, 0]])
        for row in p:
            self.assertAlmostEqual(abs(row[1] / row[0]), 0.5, places=9)
        self.assertGreater(p[0, 0], 0)
        self.assertLess(p[1, 0], 0)

    def test_floor_diamond_size_and_corners(self):
        img = floor_diamond('office', 16, 12)
        self.assertEqual(img.size, (1792, 896))
        a = np.asarray(img)
        for x, y in [(768, 1), (1790, 512), (1024, 894), (1, 384)]:
            self.assertEqual(a[y, x, 3], 255)
        self.assertEqual(a[0, 0, 3], 0)

    def test_wall_module_footprint_alignment_and_tiling(self):
        for axis in ('u', 'v'):
            img = wall_module('office', axis)
            self.assertEqual(img.size, (80, WALL_HEIGHT_PX + 40))
            self.assertEqual(img.getpixel((40, WALL_HEIGHT_PX + 19))[3], 255)
        a = np.asarray(wall_module('office', 'u'))
        from PIL import Image
        canvas = Image.new('RGBA', (144, WALL_HEIGHT_PX + 72))
        canvas.alpha_composite(Image.fromarray(a), (0, 0))
        canvas.alpha_composite(Image.fromarray(a), (64, 32))
        # The vertical shared edge stays occupied through the wall body.
        self.assertTrue((np.asarray(canvas)[35:85, 64:72, 3] > 0).all())

    def test_door_frame_fits_opening(self):
        image = door_frame('office', 'v', 2)
        self.assertEqual(image.width, 128)
        self.assertEqual(image.getpixel((64, WALL_HEIGHT_PX))[3], 0)

    def test_outputs_are_clean_alpha(self):
        for kind in ('office', 'archive'):
            for img in [floor_diamond(kind, 16, 12), wall_module(kind, 'u'), wall_module(kind, 'v'), door_frame(kind, 'v')]:
                a = np.asarray(img); rgb = a[..., :3][a[..., 3] > 0]
                self.assertFalse(((rgb[:, 0] == 255) & (rgb[:, 1] == 0) & (rgb[:, 2] == 255)).any())
                self.assertFalse((rgb == 0).all(axis=1).any())

    def test_props_share_camera_and_contact_pivot(self):
        from PIL import Image
        root = Path(__file__).resolve().parents[2]
        catalog = json.loads((root/'packages/game-content/cases/case-001/environment-models.json').read_text())
        self.assertEqual(len(catalog), 15)
        for name, model in catalog.items():
            with self.subTest(name=name):
                self.assertEqual(model['camera'], 'dimetric-2:1')
                self.assertTrue(all(0 < value < 1 for value in model['origin']))
                img = Image.open(root/'apps/game-web/public'/model['url'].lstrip('/'))
                a=np.asarray(img)
                self.assertEqual(a.shape[2],4)
                self.assertGreater(np.count_nonzero(a[...,3]),100)
                visible=a[...,:3][a[...,3]>0]
                self.assertFalse((visible==[255,0,255]).all(axis=1).any())
                self.assertFalse((visible==0).all(axis=1).any())
                f=model['footprint']
                self.assertAlmostEqual(f['u']+f['width']/2,0)
                self.assertAlmostEqual(f['v']+f['height']/2,0)

if __name__ == '__main__':
    unittest.main()
