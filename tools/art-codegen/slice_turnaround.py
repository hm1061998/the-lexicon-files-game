"""Slice a 4-pose turnaround sheet (NE, SE, SW, NW left->right, magenta bg)
into chr_<name>_idle_<dir>.png frames with a common scale and feet at 88%.

usage: python slice_turnaround.py sheet.png name out_dir [--px-per-src 0.42] [--frame 512]
"""
import sys, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument("sheet"); ap.add_argument("name"); ap.add_argument("out")
ap.add_argument("--frame", type=int, default=512)
ap.add_argument("--scale", type=float, default=0.0, help="frame px per source px (0 = auto from this sheet)")
ap.add_argument("--target-h", type=float, default=0.625, help="tallest figure height / frame height when auto")
a = ap.parse_args()

im = np.asarray(Image.open(a.sheet).convert("RGB")).astype(int)
d = np.sqrt(((im - [255, 0, 255]) ** 2).sum(-1))
fg = d > 120
fg = ndi.binary_opening(fg, iterations=2)
lab, n = ndi.label(ndi.binary_dilation(fg, iterations=6))
sizes = ndi.sum(fg, lab, range(1, n + 1))
keep = np.argsort(sizes)[::-1][:4] + 1
boxes = sorted([ndi.find_objects((lab == k).astype(int))[0] for k in keep], key=lambda s: s[1].start)
hs = [b[0].stop - b[0].start for b in boxes]
scale = a.scale or a.target_h * a.frame / max(hs)
print("heights", hs, "scale", round(scale, 4))
F = a.frame
for b, dname in zip(boxes, ["ne", "se", "sw", "nw"]):
    y0, y1, x0, x1 = b[0].start, b[0].stop, b[1].start, b[1].stop
    crop = Image.fromarray(im[y0:y1, x0:x1].astype(np.uint8))
    mask = Image.fromarray((fg[y0:y1, x0:x1] * 255).astype(np.uint8))
    w, h = crop.size
    nw_, nh_ = max(1, round(w * scale)), max(1, round(h * scale))
    crop = crop.resize((nw_, nh_), Image.LANCZOS)
    mask = mask.resize((nw_, nh_), Image.LANCZOS)
    out = Image.new("RGB", (F, F), (255, 0, 255))
    fx = F // 2 - nw_ // 2
    fy = round(0.88 * F) - nh_          # feet on 88% line
    m = mask.point(lambda v: 255 if v >= 128 else 0)
    out.paste(crop, (fx, fy), m)
    p = f"{a.out}/chr_{a.name}_idle_{dname}.png"
    out.save(p, optimize=True)
    print(p, (nw_, nh_))
