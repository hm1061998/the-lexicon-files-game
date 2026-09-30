"""Chair geometry and scene-placement contracts for meeting desks."""
import math
import unittest
from pathlib import Path
import json
import numpy as np
import props
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
DIRECTIONS={"ne":math.pi,"nw":math.pi/2,"se":-math.pi/2,"sw":0.0}

class ChairDirectionTests(unittest.TestCase):
    def test_directional_geometry_keeps_the_seat_pivot_at_the_floor_origin(self):
        for direction,angle in DIRECTIONS.items():
            with self.subTest(direction=direction):
                scene=props.office_chair_direction(direction)
                vertices=np.concatenate([face['v'] for face in scene.faces])
                original=np.concatenate([face['v'] for face in props.office_chair().faces])
                upper=vertices[vertices[:,2] > .48]
                original_upper=original[original[:,2] > .48]
                expected_upper=original_upper.copy()
                expected_upper[:,:2]=original_upper[:,:2] @ np.array([[math.cos(angle),math.sin(angle)],[-math.sin(angle),math.cos(angle)]])
                np.testing.assert_allclose(upper,expected_upper,atol=1e-6)
                self.assertTrue(np.isfinite(vertices).all())
                vector=props.chair_forward(angle)
                self.assertAlmostEqual(float(np.linalg.norm(vector)),1,places=6)
                expected={"ne":(0.0,-1.0),"nw":(-1.0,0.0),"se":(1.0,0.0),"sw":(0.0,1.0)}[direction]
                self.assertAlmostEqual(vector[0],expected[0],places=6)
                self.assertAlmostEqual(vector[1],expected[1],places=6)

    def test_every_office_and_archive_desk_chair_uses_its_facing_asset(self):
        mappings={"decor_chair_desk_west":"ne","decor_chair_desk_invest":"ne","decor_chair_player_desk":"ne","decor_chair_desk_east":"ne","decor_chair_terminal":"se"}
        for filename in ("main_office.json","archive.json"):
            data=json.loads((ROOT/'packages/game-content/cases/case-001/scenes'/filename).read_text(encoding='utf-8'))
            desks={asset['id']:asset['position'] for asset in data['assets'] if 'position' in asset}
            for asset in data['assets']:
                if asset['id'] in mappings:
                    direction=mappings[asset['id']]
                    self.assertEqual(asset['texture'],f'tex_office_chair_{direction}')
                    desk_id={'decor_chair_desk_west':'decor_desk_west','decor_chair_desk_invest':'decor_desk_invest','decor_chair_player_desk':'player_desk','decor_chair_desk_east':'decor_desk_east','decor_chair_terminal':'decor_desk_security'}[asset['id']]
                    delta=np.array([desks[desk_id]['u']-asset['position']['u'],desks[desk_id]['v']-asset['position']['v']],dtype=float)
                    delta/=np.linalg.norm(delta)
                    self.assertGreater(float(np.dot(props.chair_forward(DIRECTIONS[direction]),delta)),0.8)

    def test_all_six_meeting_table_chairs_face_the_table(self):
        placements=[]
        original=props.chair_into
        def capture(scene,x,y,rotation=0.0):
            placements.append((x,y,rotation))
            return original(scene,x,y,rotation)
        with patch.object(props,'chair_into',side_effect=capture):
            props.meeting_table()
        self.assertEqual(len(placements),6)
        center=np.array([1.3,0.55])
        for x,y,rotation in placements:
            with self.subTest(x=x,y=y,rotation=rotation):
                toward=center-np.array([x,y])
                toward/=np.linalg.norm(toward)
                self.assertGreater(float(np.dot(props.chair_forward(rotation),toward)),0.6)

if __name__=="__main__":
    unittest.main()
