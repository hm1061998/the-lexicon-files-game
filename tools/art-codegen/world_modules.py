"""Deterministic illustrated modules. Projection and pivots match logical scene geometry."""
import numpy as np
from PIL import Image, ImageDraw

PX_PER_LOGICAL = 64
WALL_HEIGHT_PX = 90
OFFICE_RUG = (6, 6, 3, 2)
INK = '#3E342B'

def brass_portal():
    """Illustrated brass podium, floor pivot (64,92); ellipse ratio 2:1."""
    image=Image.new('RGBA',(128,128))
    d=ImageDraw.Draw(image)
    d.ellipse((8,68,120,124),fill='#786345',outline=INK,width=2)
    d.ellipse((8,64,120,120),fill='#B39A68',outline=INK,width=2)
    for inset,color in [(6,'#D0B981'),(12,'#786345'),(18,'#C4AE7E')]:
        d.ellipse((8+inset,64+inset/2,120-inset,120-inset/2),outline=color,width=2)
    for x,y in [(23,92),(105,92),(64,71),(64,113)]:
        d.ellipse((x-2,y-1,x+2,y+1),fill=INK)
    d.ellipse((40,80,88,104),fill='#8A8469',outline='#DAC594',width=1)
    return _grain(image)

def project(u, v, z=0):
    return ((u-v)*64, (u+v)*32-z)

def _grain(image, seed=19):
    a = np.array(image)
    noise = np.random.default_rng(seed).normal(0, 1.3, a.shape[:2])
    a[..., :3] = np.clip(a[..., :3].astype(float)+noise[..., None], 0, 255).astype(np.uint8)
    a[a[..., 3] == 0, :3] = 0
    return Image.fromarray(a)

def floor_diamond(kind, width_u, height_v):
    width, height = (width_u+height_v)*64, (width_u+height_v)*32
    image = Image.new('RGBA', (width, height))
    d = ImageDraw.Draw(image)
    p = lambda u,v: (project(u,v)[0]+height_v*64, project(u,v)[1])
    corners = [p(0,0), p(width_u,0), p(width_u,height_v), p(0,height_v)]
    d.polygon(corners, fill='#CDBA97' if kind == 'office' else '#A89B87')
    for u in range(width_u+1):
        d.line([p(u,0),p(u,height_v)], fill='#B8A789' if kind == 'office' else '#938A7B', width=1)
    for v in range(height_v+1):
        d.line([p(0,v),p(width_u,v)], fill='#B8A789' if kind == 'office' else '#938A7B', width=1)
    if kind == 'office':
        u,v,w,h = OFFICE_RUG
        d.polygon([p(u,v),p(u+w,v),p(u+w,v+h),p(u,v+h)], fill='#8A8469', outline=INK, width=2)
        for k in range(1, 6):
            inset=k*0.035
            d.line([p(u+inset,v+inset),p(u+w-inset,v+inset),p(u+w-inset,v+h-inset),p(u+inset,v+h-inset),p(u+inset,v+inset)],fill='#A89B87',width=1)
    else:
        d.polygon([p(10,9),p(10.8,9),p(10.8,9.8),p(10,9.8)], fill='#737660', outline=INK)
        for k in range(1,6):
            d.line([p(10+k*.12,9.08),p(10+k*.12,9.72)],fill=INK,width=1)
    return _grain(image)

def wall_module(kind, axis, cap=None):
    image = Image.new('RGBA', (80, WALL_HEIGHT_PX+40))
    d = ImageDraw.Draw(image)
    p = lambda u,v,z=0: (project(u,v,z)[0]+40,project(u,v,z)[1]+WALL_HEIGHT_PX+20)
    shape = [(-.5,-.125),(.5,-.125),(.5,.125),(-.5,.125)] if axis=='u' else [(-.125,-.5),(.125,-.5),(.125,.5),(-.125,.5)]
    plaster = '#D8C5A4' if kind=='office' else '#B8AB92'
    for i,j in [(1,2),(2,3)]:
        a,b = shape[i],shape[j]
        d.polygon([p(*a),p(*b),p(*b,WALL_HEIGHT_PX),p(*a,WALL_HEIGHT_PX)],fill=plaster if i==2 else '#A89B87')
        d.polygon([p(*a),p(*b),p(*b,10),p(*a,10)],fill='#5A493A')
        d.line([p(*a,11),p(*b,11)],fill='#8A8469',width=1)
        # Faint pencil hatching confined to the wall body.
        for h in range(24, WALL_HEIGHT_PX-8, 11):
            d.line([p(*a,h),p(*b,h)],fill='#CDBA97' if kind=='office' else '#A89B87',width=1)
    d.polygon([p(*a,WALL_HEIGHT_PX) for a in shape],fill='#E0CFB0',outline=INK,width=1)
    d.line([p(*shape[2]),p(*shape[3])],fill=INK,width=1)
    if cap:
        i = 3 if cap=='start' else 1
        d.line([p(*shape[i]),p(*shape[i],WALL_HEIGHT_PX)],fill=INK,width=2)
    return _grain(image)

def door_frame(kind, axis, opening_width=2):
    width, height = opening_width*64, WALL_HEIGHT_PX+opening_width*32
    image = Image.new('RGBA',(width,height))
    d = ImageDraw.Draw(image)
    p = lambda t,z: ((t if axis=='u' else -t)*64+width/2,t*32-z+WALL_HEIGHT_PX+opening_width*16)
    left,right=-opening_width/2,opening_width/2
    wood='#5A493A' if kind=='office' else '#737660'
    for a,b in [(left,left+.10),(right-.10,right)]:
        d.polygon([p(a,0),p(b,0),p(b,WALL_HEIGHT_PX),p(a,WALL_HEIGHT_PX)],fill=wood,outline=INK,width=1)
    d.polygon([p(left,WALL_HEIGHT_PX-10),p(right,WALL_HEIGHT_PX-10),p(right,WALL_HEIGHT_PX),p(left,WALL_HEIGHT_PX)],fill=wood,outline=INK,width=1)
    return _grain(image)
