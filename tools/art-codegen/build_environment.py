"""Export modules and furniture with exact camera, logical bounds and floor pivots."""
import json, math
from pathlib import Path
import numpy as np
from iso import Cam
import props
from world_modules import floor_diamond, wall_module, door_frame, WALL_HEIGHT_PX

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'apps/game-web/public/assets/environment'
CATALOG = ROOT/'packages/game-content/cases/case-001/environment-models.json'

def export_props():
    models = {}
    for name, builder in props.BUILDERS.items():
        if name in ('prop_note_01', 'prop_audio_recorder_01', 'prop_door_hallway_01'):
            continue
        scene = builder(); scene.cam = Cam('dimetric')
        vertices = np.concatenate([f['v'] for f in scene.faces])
        xymin, xymax = vertices[:, :2].min(0), vertices[:, :2].max(0)
        base = (xymin+xymax)/2
        projected = scene.cam.proj(vertices)[:, :2]* (64*math.sqrt(2))
        mn,mx=projected.min(0),projected.max(0)
        width,height=np.ceil(mx-mn+8).astype(int)
        anchor = scene.cam.proj([[*base,0]])[0,:2]*(64*math.sqrt(2))-mn+4
        image,_ = scene.render(int(width),int(height),S=3,fit=False,scale=64*math.sqrt(2),center=(0,0),bg='alpha',feet_anchor=([*base,0],anchor.tolist()),line_w=.55,sil_w=.7,wobble=.25,grain=.30)
        path=OUT/'props/dimetric'/f'{name}.png'; path.parent.mkdir(parents=True,exist_ok=True);image.save(path,optimize=True)
        models[name]={'url':'/assets/'+path.relative_to(ROOT/'apps/game-web/public/assets').as_posix(),'origin':(anchor/[width,height]).tolist(),'footprint':{'u':float((xymin-base)[0]),'v':float((xymin-base)[1]),'width':float((xymax-xymin)[0]),'height':float((xymax-xymin)[1])},'scale':1,'camera':'dimetric-2:1'}
        print(name,width,height,'pivot',anchor.tolist())
    CATALOG.write_text(json.dumps(models,indent=2)+'\n',encoding='utf-8')

def main():
    for kind in ('office','archive'):
        folder=OUT/kind; folder.mkdir(parents=True,exist_ok=True)
        common=OUT/'common'; common.mkdir(parents=True,exist_ok=True)
        floor_diamond(kind,16,12).save(common/f'tex_floor_{kind}.png',optimize=True)
        for axis in ('u','v'):
            for cap in (None,'start','end'):
                suffix='' if cap is None else f'_cap_{cap}'
                wall_module(kind,axis,cap).save(folder/f'wall_{axis}{suffix}.png',optimize=True)
            door_frame(kind,axis).save(folder/f'door_frame_{axis}.png',optimize=True)
    print('WALL_MODULE_ART: origin =', [0.5,(WALL_HEIGHT_PX+20)/(WALL_HEIGHT_PX+40)], 'scale = 1')
    export_props()

if __name__=='__main__': main()
