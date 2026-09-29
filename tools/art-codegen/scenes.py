import math, sys
import numpy as np
from iso import Scene, M, C, mix, rod, save
from props import paper_stack, scribble

OUT = "out/"


def floor(kind="office"):
    s = Scene()
    rng = np.random.default_rng(21 if kind == "office" else 22)
    T = 0.30 if kind == "office" else 0.45
    if kind == "office":
        base = mix("beige", "cream", 0.35)
        var = lambda: mix(base, "gray", rng.uniform(0, 0.10))
    else:
        base = mix("gray", "green", 0.18)
        base = mix(base, "ink", 0.12)
        var = lambda: mix(base, "ink", rng.uniform(0, 0.10))
    R = 10.5
    n = int(2 * R / T)
    for i in range(n):
        for j in range(n):
            x, y = -R + i * T, -R + j * T
            s.face([[x, y, 0], [x + T, y, 0], [x + T, y + T, 0], [x, y + T, 0]], [0, 0, 1], var(), lw=0.3, hatch=False)
    # worn patches
    for k in range(40):
        cx, cy = rng.uniform(-9, 9, 2)
        r = rng.uniform(0.25, 0.9)
        s.disc(cx, cy, 0.0005, r, "cream" if kind == "office" else "gray", rx=rng.uniform(0.7, 1.3), alpha=0.10)
    for k in range(14):
        cx, cy = rng.uniform(-9, 9, 2)
        s.disc(cx, cy, 0.0005, rng.uniform(0.2, 0.7), "brown", alpha=0.05)
    if kind == "office":
        # rug in the centre
        rx0, ry0, rw, rd = -2.4, -1.65, 4.8, 3.3
        rug = mix("beige", "brown", 0.38)
        s.face([[rx0, ry0, 0.003], [rx0 + rw, ry0, 0.003], [rx0 + rw, ry0 + rd, 0.003], [rx0, ry0 + rd, 0.003]], [0, 0, 1], rug, lw=1.0, hatch=False)
        b = 0.18
        s.face([[rx0 + b, ry0 + b, 0.0035], [rx0 + rw - b, ry0 + b, 0.0035], [rx0 + rw - b, ry0 + rd - b, 0.0035], [rx0 + b, ry0 + rd - b, 0.0035]],
               [0, 0, 1], mix(rug, "cream", 0.12), lw=0.7, decal=True, alpha=1.0)
        # pencil texture on rug
        for k in range(420):
            x = rng.uniform(rx0 + 0.3, rx0 + rw - 0.3); y = rng.uniform(ry0 + 0.3, ry0 + rd - 0.3)
            s.stroke([[x, y, 0.004], [x + 0.07, y - 0.07, 0.004]], w=0.8, col=mix(rug, "ink", 0.35), alpha=0.16)
    else:
        # drain + stains
        s.disc(1.0, 0.8, 0.001, 0.18, "ink", alpha=0.35)
        for k in range(6):
            s.stroke([[0.88 + k * 0.045, 0.72, 0.0012], [0.88 + k * 0.045, 0.88, 0.0012]], w=1.0, alpha=0.5)
    img, _ = s.render(2400, 1600, S=2, fit=False, scale=200, center=(0, 0), bg=None,
                      line_w=1.3, faint_alpha=0.45, grain=0.35, hatch_k=0.0)
    return img


WALL_W, WALL_H = 2400, 260      # px, full scene width; bottom row = floor contact line
WALL_PX_PER_M = 95.0            # matches the desk prop at scale 0.45 (~95 px per metre)


def _pinned_paper(s, x, z, w, h, y, rng, col=None):
    """a sheet pinned flat to a vertical surface at depth y, slightly rotated, with a pin."""
    a = rng.uniform(-0.07, 0.07)
    ca, sa = math.cos(a), math.sin(a)
    pts = np.array([[0, 0], [w, 0], [w, h], [0, h]]) @ np.array([[ca, sa], [-sa, ca]])
    s.quad([[x + p[0], y, z + p[1]] for p in pts], col if col is not None else (M["paper"] if rng.random() > 0.5 else M["paper2"]),
           n=[0, 1, 0], lw=0.7)
    for k in range(int(h / 0.07) - 1):         # illegible lines of handwriting
        zz = z + h - 0.08 - k * 0.06
        if zz < z + 0.04:
            break
        x0 = x + 0.03 - sa * (zz - z)
        s.stroke([[x0, y + 0.0015, zz], [x0 + w * rng.uniform(0.45, 0.85), y + 0.0015, zz + sa * w * 0.6]], w=0.7, alpha=0.35)
    pin = [x + w / 2 - sa * (h - 0.03), y + 0.002, z + ca * (h - 0.03)]
    ang = np.linspace(0, 2 * math.pi, 10, endpoint=False)
    s.quad([[pin[0] + 0.016 * math.cos(t), pin[1], pin[2] + 0.016 * math.sin(t)] for t in ang],
           mix("gray", "ink", 0.35), n=[0, 1, 0], lw=0.6)


def _framed(s, x, z, w, h, frame, fill, y=0.0, depth=0.035, border=0.05):
    s.box(x, y, z, w, depth, h, frame, lw=1.0)
    s.box(x + border, y + depth, z + border, w - 2 * border, 0.003, h - 2 * border, fill, lw=0.8)
    return y + depth + 0.003


def _blinds_window(s, x, z, w, h, rng):
    fy = _framed(s, x, z, w, h, M["wood"], mix("cream", "gray", 0.18), border=0.07)
    s.box(x - 0.06, 0.0, z - 0.06, w + 0.12, 0.09, 0.06, M["wood_lt"])      # sill
    for k in range(int((h - 0.2) / 0.075)):                                  # venetian slats
        zz = z + h - 0.12 - k * 0.075
        s.box(x + 0.08, fy, zz, w - 0.16, 0.01, 0.028, mix("beige", "cream", 0.25), lw=0.6)
    s.stroke([[x + w * 0.8, fy + 0.012, z + h - 0.1], [x + w * 0.8, fy + 0.012, z + 0.35]], w=0.7, alpha=0.5)


def _office_wall(s, L, rng):
    wood = M["wood"]
    # windows with blinds
    for x in (1.2, 19.4):
        _blinds_window(s, x, 1.02, 2.6, 1.45, rng)
    # bulletin boards with pinned papers
    for bx, bw in ((5.0, 3.1), (22.6, 1.9)):
        bz, bh = 1.08, 1.22
        fy = _framed(s, bx, bz, bw, bh, wood, mix("beige", "brown", 0.32), border=0.06)
        n = int(bw / 0.5)
        for k in range(n * 2):
            pw, ph = rng.uniform(0.26, 0.36), rng.uniform(0.30, 0.40)
            px = bx + 0.14 + (k % n) * (bw - 0.3) / n + rng.uniform(-0.04, 0.04)
            pz = bz + 0.12 + (k // n) * 0.54 + rng.uniform(-0.03, 0.05)
            if rng.random() < 0.18:
                continue
            _pinned_paper(s, px, pz, pw, ph, fy + 0.002, rng)
    # framed certificate and a small map
    fy = _framed(s, 9.0, 1.45, 0.62, 0.78, M["wood"], M["paper"], border=0.06)
    for k in range(5):
        s.stroke([[9.12, fy + 0.001, 2.05 - k * 0.1], [9.5 - 0.04 * (k % 2), fy + 0.001, 2.05 - k * 0.1]], w=0.7, alpha=0.35)
    fy = _framed(s, 9.9, 1.30, 0.55, 0.45, M["metal_dk"], mix("cream", "green", 0.2), border=0.04)
    s.stroke([[9.98, fy + 0.001, 1.40], [10.1, fy + 0.001, 1.55], [10.25, fy + 0.001, 1.48], [10.38, fy + 0.001, 1.64]], w=0.7, alpha=0.4)
    # whiteboard with faint scribbles and a marker tray
    wx, wz, ww, wh = 11.0, 1.05, 3.2, 1.25
    fy = _framed(s, wx, wz, ww, wh, M["metal"], mix("cream", [245, 240, 228], 0.6), border=0.05)
    for k in range(6):
        zz = wz + wh - 0.22 - k * 0.15
        s.stroke([[wx + 0.25, fy + 0.001, zz], [wx + 0.25 + rng.uniform(0.6, 1.4), fy + 0.001, zz + rng.uniform(-0.02, 0.02)]], w=1.0, alpha=0.35)
    s.stroke([[wx + 2.0, fy + 0.001, wz + 0.9], [wx + 2.8, fy + 0.001, wz + 0.9], [wx + 2.8, fy + 0.001, wz + 0.4], [wx + 2.0, fy + 0.001, wz + 0.4], [wx + 2.0, fy + 0.001, wz + 0.9]], w=0.9, alpha=0.3)
    s.box(wx + 0.3, 0.0, wz - 0.05, ww - 0.6, 0.07, 0.04, M["metal"], lw=0.8)
    # wall clock
    cx, cz = 15.0, 2.25
    ang = np.linspace(0, 2 * math.pi, 28, endpoint=False)
    s.quad([[cx + 0.2 * math.cos(t), 0.02, cz + 0.2 * math.sin(t)] for t in ang], M["metal_dk"], n=[0, 1, 0], lw=1.0)
    s.quad([[cx + 0.17 * math.cos(t), 0.022, cz + 0.17 * math.sin(t)] for t in ang], M["paper"], n=[0, 1, 0], lw=0.6)
    s.stroke([[cx, 0.023, cz], [cx, 0.023, cz + 0.12]], w=1.2, alpha=0.8)
    s.stroke([[cx, 0.023, cz], [cx + 0.08, 0.023, cz - 0.05]], w=1.2, alpha=0.8)
    # wall shelf with binders and archive boxes
    for sz in (1.35, 1.95):
        sx0, sw = 15.9, 2.7
        s.box(sx0, 0.0, sz - 0.04, sw, 0.30, 0.04, M["wood_lt"], lw=1.0)
        x = sx0 + 0.1
        while x < sx0 + sw - 0.2:
            if rng.random() < 0.55:
                bw = rng.uniform(0.07, 0.10)
                col = mix(rng.choice(["gray", "green", "brown", "beige"]), "ink", rng.uniform(0.05, 0.3))
                bh = rng.uniform(0.28, 0.34)
                s.box(x, 0.04, sz, bw, 0.24, bh, col, lw=0.8)
                s.box(x + bw * 0.2, 0.281, sz + bh * 0.55, bw * 0.6, 0.002, 0.07, M["paper"], lw=0.5)
                x += bw + 0.006
            else:
                bw = rng.uniform(0.34, 0.42)
                s.box(x, 0.02, sz, bw, 0.26, 0.26, M["cardboard"], lw=0.9)
                s.box(x + bw / 2 - 0.07, 0.281, sz + 0.12, 0.14, 0.002, 0.07, M["paper"], lw=0.5)
                x += bw + 0.04
    # coat hooks
    for hx in (21.9, 22.15):
        s.box(hx, 0.0, 1.72, 0.04, 0.10, 0.04, M["metal_dk"], lw=0.8)


def _archive_wall(s, L, Hh, rng):
    # pipe run under the ceiling
    for pz, pr in ((Hh - 0.22, 0.05), (Hh - 0.36, 0.035)):
        s.box(-0.5, 0.06, pz, L + 1.0, pr * 2, pr * 2, M["metal_dk"], lw=1.0)
        for bx in np.arange(1.0, L, 3.2):
            s.box(bx, 0.0, pz - 0.02, 0.05, 0.08, pr * 2 + 0.04, mix("gray", "ink", 0.4), lw=0.7)
    # ventilation grille
    fy = _framed(s, 1.2, 1.9, 0.9, 0.45, M["metal_dk"], mix("gray", "ink", 0.25), border=0.04)
    for k in range(6):
        s.stroke([[1.28, fy + 0.001, 1.98 + k * 0.055], [2.02, fy + 0.001, 1.98 + k * 0.055]], w=1.0, alpha=0.6)
    # blank room sign plate
    fy = _framed(s, 2.4, 1.55, 0.9, 0.3, M["metal_dk"], M["paper2"], border=0.03)
    s.stroke([[2.52, fy + 0.001, 1.70], [3.1, fy + 0.001, 1.70]], w=1.4, alpha=0.45)
    # metal shelving units with archive boxes
    ud, uh = 0.45, 2.25
    ux = 6.0
    while ux < L - 1.5:
        uw = 2.3 if ux < L - 3.0 else L - 0.6 - ux
        for px in (ux, ux + uw - 0.05):
            s.box(px, ud - 0.05, -0.1, 0.05, 0.05, uh + 0.1, M["metal_dk"])
        for lvl in range(4):
            z = 0.10 + lvl * 0.68
            s.box(ux, 0, z, uw, ud, 0.035, M["metal"], lw=1.0)
            if z + 0.5 > uh:
                continue
            x = ux + 0.08
            while x < ux + uw - 0.45:
                if rng.random() < 0.12:
                    x += 0.4
                    continue
                bw = rng.uniform(0.34, 0.46); bh = rng.uniform(0.34, 0.46)
                col = mix(M["cardboard"], "gray", rng.uniform(0, 0.35))
                s.box(x, 0.04, z + 0.035, bw, ud - 0.1, bh, col, lw=1.0)
                s.box(x + bw / 2 - 0.07, ud - 0.059, z + 0.035 + bh * 0.55, 0.14, 0.002, 0.08, M["paper"], lw=0.7)
                s.box(x + bw / 2 - 0.05, ud - 0.059, z + 0.035 + bh * 0.2, 0.10, 0.002, 0.03, mix("brown", "ink", 0.3), lw=0.5)
                x += bw + rng.uniform(0.03, 0.10)
        ux += uw + 0.35
    # dim wall lamps on the free stretch of wall (shelves would hide them elsewhere)
    for lx in (3.6, 5.3):
        s.box(lx - 0.06, 0, Hh - 0.62, 0.12, 0.03, 0.14, M["metal_dk"])
        s.box(lx - 0.015, 0.03, Hh - 0.57, 0.03, 0.25, 0.03, M["metal_dk"])
        s.cyl(lx, 0.30, Hh - 0.78, 0.16, 0.16, M["metal_dk"], r2=0.05)


def wall(kind="office"):
    """straight front elevation of the back wall: WALL_W x WALL_H, opaque, base on the bottom row."""
    s = Scene(cam="front")
    sc = WALL_PX_PER_M
    L = WALL_W / sc
    Hh = (WALL_H / sc) / math.cos(math.radians(12))    # wall height that fills the frame
    rng = np.random.default_rng(5 if kind == "office" else 6)
    pl = M["plaster"] if kind == "office" else mix(mix("gray", "green", 0.15), "cream", 0.30)
    # plaster slab overshooting the frame so every pixel is covered
    s.box(-1.0, -0.2, -0.5, L + 2.0, 0.2, Hh + 1.0, pl)
    # faint plaster wear and stains
    for k in range(160):
        x = rng.uniform(0.1, L - 0.1); z = rng.uniform(0.3, Hh - 0.3)
        s.stroke([[x, 0.001, z], [x + rng.uniform(0.05, 0.3), 0.001, z - rng.uniform(0.05, 0.25)]], w=0.8, alpha=0.10)
    for k in range(10 if kind == "office" else 22):
        s.quad([[x, 0.0005, z] for x, z in _blob(rng, L, Hh)], mix(pl, "gray", 0.5), n=[0, 1, 0], lw=0, decal=True, alpha=0.10)
    # ceiling cornice (dark band at the top edge) and baseboard at floor contact
    trim = M["wood"] if kind == "office" else M["metal_dk"]
    s.box(-1.0, 0.0, Hh - 0.10, L + 2.0, 0.05, 0.6, mix(trim, "ink", 0.25))
    s.box(-1.0, 0.0, Hh - 0.16, L + 2.0, 0.03, 0.06, M["ceramic"] if kind == "office" else M["metal"], lw=0.8)
    s.box(-1.0, 0.0, -0.3, L + 2.0, 0.03, 0.42, trim)
    s.box(-1.0, 0.03, 0.06, L + 2.0, 0.008, 0.02, mix(trim, "cream", 0.2), lw=0.6)
    if kind == "office":
        s.box(-1.0, 0.0, 0.90, L + 2.0, 0.02, 0.05, M["ceramic"])   # chair rail
        # darker wainscot panels below the rail
        s.box(-1.0, 0.0, 0.12, L + 2.0, 0.006, 0.78, mix(pl, "beige", 0.55), lw=0.6)
        for px in np.arange(0.2, L, 1.25):
            s.box(px, 0.006, 0.2, 1.05, 0.004, 0.62, mix(pl, "beige", 0.45), lw=0.5)
        _office_wall(s, L, rng)
    else:
        _archive_wall(s, L, Hh, rng)
    Hs = WALL_H / sc
    img, _ = s.render(WALL_W, WALL_H, S=2, fit=False, scale=sc, center=(L / 2, -Hs / 2), bg=None,
                      line_w=1.3, faint_alpha=0.45, grain=0.30, hatch_k=0.12)
    return img


def _blob(rng, L, Hh):
    cx, cz = rng.uniform(0.5, L - 0.5), rng.uniform(0.4, Hh - 0.4)
    r = rng.uniform(0.15, 0.5)
    ang = np.linspace(0, 2 * math.pi, 14, endpoint=False)
    return [(cx + r * rng.uniform(0.7, 1.3) * math.cos(t), cz + r * 0.6 * rng.uniform(0.7, 1.3) * math.sin(t)) for t in ang]


BUILDERS = {
    "scene_office_floor": lambda: floor("office"),
    "scene_archive_floor": lambda: floor("archive"),
    "scene_office_wall_back": lambda: wall("office"),
    "scene_archive_wall_back": lambda: wall("archive"),
}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILDERS):
        save(BUILDERS[n](), OUT + n + ".png")
        print("ok", n)
