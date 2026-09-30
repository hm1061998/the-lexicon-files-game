import math, sys
import numpy as np
from PIL import Image
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
        # rug in the middle of the open hall (Phase 11C rooms), clear of the partitions
        rx0, ry0, rw, rd = 0.75, -0.85, 2.9, 2.0
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
    """features line up with the Main Office rooms (Phase 11C): investigation room 0-11.1 m
    (window, bulletin board, free stretch for the room sign), hall 11.4-19.8 m (whiteboard,
    clock, shelf), hallway behind the glass 20.1 m+ (window, small board)."""
    wood = M["wood"]
    # windows with blinds
    for x in (1.2, 20.5):
        _blinds_window(s, x, 1.02, 2.6, 1.45, rng)
    # bulletin boards with pinned papers
    for bx, bw in ((5.0, 3.1), (23.4, 1.7)):
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
    # whiteboard with faint scribbles and a marker tray
    wx, wz, ww, wh = 12.1, 1.05, 3.2, 1.25
    fy = _framed(s, wx, wz, ww, wh, M["metal"], mix("cream", [245, 240, 228], 0.6), border=0.05)
    for k in range(6):
        zz = wz + wh - 0.22 - k * 0.15
        s.stroke([[wx + 0.25, fy + 0.001, zz], [wx + 0.25 + rng.uniform(0.6, 1.4), fy + 0.001, zz + rng.uniform(-0.02, 0.02)]], w=1.0, alpha=0.35)
    s.stroke([[wx + 2.0, fy + 0.001, wz + 0.9], [wx + 2.8, fy + 0.001, wz + 0.9], [wx + 2.8, fy + 0.001, wz + 0.4], [wx + 2.0, fy + 0.001, wz + 0.4], [wx + 2.0, fy + 0.001, wz + 0.9]], w=0.9, alpha=0.3)
    s.box(wx + 0.3, 0.0, wz - 0.05, ww - 0.6, 0.07, 0.04, M["metal"], lw=0.8)
    # wall clock
    cx, cz = 16.1, 2.25
    ang = np.linspace(0, 2 * math.pi, 28, endpoint=False)
    s.quad([[cx + 0.2 * math.cos(t), 0.02, cz + 0.2 * math.sin(t)] for t in ang], M["metal_dk"], n=[0, 1, 0], lw=1.0)
    s.quad([[cx + 0.17 * math.cos(t), 0.022, cz + 0.17 * math.sin(t)] for t in ang], M["paper"], n=[0, 1, 0], lw=0.6)
    s.stroke([[cx, 0.023, cz], [cx, 0.023, cz + 0.12]], w=1.2, alpha=0.8)
    s.stroke([[cx, 0.023, cz], [cx + 0.08, 0.023, cz - 0.05]], w=1.2, alpha=0.8)
    # wall shelf with binders and archive boxes
    for sz in (1.35, 1.95):
        sx0, sw = 16.8, 2.6
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


# ------------------------------------------------------------------ inner room walls
PARTITION_H = 160           # px, wall height above the floor line (~1.7 m at 95 px/m)
PARTITION_T = 24            # px, wall thickness = collision depth; drawn as the top cap
PARTITION_MARGIN = 6        # px, transparent rows above the cap (outline room)
PARTITION_V_W = PARTITION_T + 8   # px, image width of a north-south wall (cap + outline room)
_SC = WALL_PX_PER_M
_MULLION_EVERY = 1.25       # m between glass frame posts
_RAIL_Z, _HEAD_Z = 0.66, 1.46   # m: top of the solid lower panel, bottom of the header band


def _partition_materials(kind):
    if kind == "office":
        return dict(panel=mix(M["plaster"], "beige", 0.45), trim=M["wood"], cap=M["wood_lt"],
                    frame=M["wood"], head=M["plaster"], glass=mix(M["glass"], "green", 0.22))
    return dict(panel=mix(mix("gray", "green", 0.15), "cream", 0.25), trim=M["metal_dk"], cap=M["metal"],
                frame=M["metal_dk"], head=mix(mix("gray", "green", 0.15), "cream", 0.35),
                glass=mix(M["glass"], "gray", 0.35))


def _partition_body(s, x0, x1, t, H, mat, glass):
    """a wall of thickness t (y in [-t, 0]) along x in [x0, x1]: skirting, lower panel, rail,
    glass bays between frame posts (left open, filled as glass after rendering), header, cap."""
    L = x1 - x0
    s.box(x0, -t, 0, L, t, 0.10, mat["trim"])                         # skirting
    lower = _RAIL_Z if glass else H - 0.03
    s.box(x0, -t, 0.10, L, t, lower - 0.10, mat["panel"])
    for px in (x0, x1 - 0.08):                                         # end posts (door jambs)
        s.box(px, -t - 0.004, 0, 0.08, t + 0.012, H - 0.03, mat["frame"], lw=1.0)
    for px in np.arange(x0 + 0.62, x1 - 0.5, _MULLION_EVERY):          # recessed panel lines
        s.box(px, 0.0, 0.18, _MULLION_EVERY - 0.24, 0.004, _RAIL_Z - 0.30, mix(mat["panel"], "beige", 0.3), lw=0.5)
    s.box(x0, -t, _RAIL_Z - 0.02, L, t + 0.012, 0.04, mat["trim"], lw=0.8)   # rail / sill
    if glass:
        s.box(x0, -t, _HEAD_Z, L, t, H - _HEAD_Z - 0.03, mat["head"])   # header band
        s.box(x0, -t, _HEAD_Z - 0.03, L, t + 0.008, 0.03, mat["frame"], lw=0.8)
        for px in np.arange(x0 + 0.5, x1, _MULLION_EVERY):             # frame posts
            s.box(px - 0.04, -t, _RAIL_Z, 0.08, t, _HEAD_Z - _RAIL_Z, mat["frame"], lw=0.9)
    s.box(x0, -t, H - 0.03, L, t, 0.03, mat["cap"], top=mix(mat["cap"], "cream", 0.15))  # cap


def _fill_glass(img, mat, rng, rows_from):
    """semi-transparent glass in the open bays: tint, an etched band and pale streaks (no glow)."""
    a = np.asarray(img).copy()
    hole = a[..., 3] < 128
    hole[:rows_from] = False
    if not hole.any():
        return img
    col = np.clip(mat["glass"], 0, 255)
    a[hole, :3] = np.round(col).astype(np.uint8)
    a[hole, 3] = 70
    ys, _ = np.nonzero(hole)
    y0, y1 = ys.min(), ys.max()
    rows = np.arange(a.shape[0])[:, None]
    b0 = y0 + (y1 - y0) * 0.42
    band = hole & (rows >= b0) & (rows <= b0 + 6)
    a[band, :3] = np.round(mix(col, M["paper"], 0.55)).astype(np.uint8)
    a[band, 3] = 150
    Hh, W = hole.shape
    yy, xx = np.mgrid[0:Hh, 0:W]
    for k in range(max(1, W // 90)):
        c0 = rng.uniform(0, W + Hh)
        for off, w in ((0, 2.0), (9, 1.1)):
            streak = hole & (np.abs((xx + yy) - (c0 + off)) < w)
            a[streak, :3] = np.round(mix(col, M["paper"], 0.7)).astype(np.uint8)
            a[streak, 3] = 115
    return Image.fromarray(a, "RGBA")


def partition(kind="office", orientation="h", length=480, glass=True):
    """inner room wall in the game's oblique projection (screen_y = y - z), RGBA.

    'h' (east-west): length x (MARGIN + T + H); the south face with glass bays stands on the
    bottom row and the cap (T px = the collision depth) is on top. Place with origin [0.5, 1]
    on the south edge of the collision.
    'v' (north-south): PARTITION_V_W x (MARGIN + length + H); the cap runs the length of the
    wall and the solid south end post stands on the bottom row; origin [0.5, 1] on the south end.
    """
    s = Scene(cam="oblique")
    rng = np.random.default_rng(31 + len(kind) + length)
    mat = _partition_materials(kind)
    t, H = PARTITION_T / _SC, PARTITION_H / _SC
    if orientation == "h":
        L = length / _SC
        _partition_body(s, 0.0, L, t, H, mat, glass)
        W, Hpx = length, PARTITION_MARGIN + PARTITION_T + PARTITION_H
        center = (L / 2, -Hpx / 2 / _SC)
    elif orientation == "v":
        Lr = length / _SC
        s.box(-t / 2, -Lr, 0, t, Lr, H - 0.03, mat["panel"])
        s.box(-t / 2, -Lr, H - 0.03, t, Lr, 0.03, mat["cap"], top=mix(mat["cap"], "cream", 0.15))
        for py in np.arange(-Lr + 0.45, -0.3, _MULLION_EVERY):        # frame post tops
            s.box(-t / 2 + 0.02, py, H, t - 0.04, 0.07, 0.004, mat["frame"], lw=0.7)
        s.stroke([[0, -Lr + 0.05, H + 0.006], [0, -0.05, H + 0.006]], w=0.8, col=mix(mat["cap"], "ink", 0.5), alpha=0.35)
        s.box(-t / 2, 0.0, 0, t, 0.012, 0.10, mat["trim"])              # skirting on the end post
        s.box(-t / 2, 0.0, _RAIL_Z - 0.02, t, 0.014, 0.04, mat["trim"], lw=0.8)
        W, Hpx = PARTITION_V_W, PARTITION_MARGIN + length + PARTITION_H
        center = (0.0, -Hpx / 2 / _SC)
    else:
        raise ValueError(f"orientation must be 'h' or 'v', got {orientation!r}")
    img, _ = s.render(W, Hpx, S=2, fit=False, scale=_SC, center=center, bg="alpha",
                      line_w=1.3, faint_alpha=0.45, grain=0.28, hatch_k=0.10)
    if orientation == "h" and glass:
        img = _fill_glass(img, mat, rng, PARTITION_MARGIN + PARTITION_T + 2)
    return img


# ------------------------------------------------------------------ wall-hung boards
BOARD_HANG = 68             # px of empty floor-to-board space kept under a hung board
BOARD_MARGIN = 6


def wall_board(name="whiteboard", width=200, height=80):
    """a board hung on a wall, RGBA, oblique projection. The bottom BOARD_HANG rows stay empty
    so the sprite's origin [0.5, 1] sits on the wall's floor line (depth just in front of it)."""
    s = Scene(cam="oblique")
    rng = np.random.default_rng(41 if name == "whiteboard" else 42)
    w, h = width / _SC, height / _SC
    z0 = BOARD_HANG / _SC
    d = 0.03
    if name == "whiteboard":
        s.box(0, -d, z0, w, d, h, M["metal"], lw=1.0)
        s.box(0.04, 0.0, z0 + 0.04, w - 0.08, 0.002, h - 0.08, mix("cream", [245, 240, 228], 0.6), lw=0.8)
        for k in range(4):                                              # faint marker scribbles
            zz = z0 + h - 0.16 - k * 0.12
            s.stroke([[0.16, 0.003, zz], [0.16 + rng.uniform(0.35, 0.9), 0.003, zz + rng.uniform(-0.02, 0.02)]], w=1.1, alpha=0.4)
            s.stroke([[0.10, 0.003, zz], [0.12, 0.003, zz]], w=1.1, alpha=0.5)
        s.stroke([[w * 0.62, 0.003, z0 + h * 0.72], [w * 0.9, 0.003, z0 + h * 0.72], [w * 0.9, 0.003, z0 + h * 0.3],
                  [w * 0.62, 0.003, z0 + h * 0.3], [w * 0.62, 0.003, z0 + h * 0.72]], w=0.9, alpha=0.3)
        s.box(0.2, 0.0, z0 + 0.07, w - 0.4, 0.05, 0.03, M["metal_dk"], lw=0.8)     # marker tray
    else:
        s.box(0, -d, z0, w, d, h, M["wood"], lw=1.0)
        s.box(0.05, 0.0, z0 + 0.05, w - 0.10, 0.002, h - 0.10, mix("beige", "brown", 0.32), lw=0.8)
        n = max(2, int(w / 0.34))
        for k in range(n * 2):
            if rng.random() < 0.15:
                continue
            pw, ph = rng.uniform(0.18, 0.26), rng.uniform(0.20, 0.27)
            px = 0.10 + (k % n) * (w - 0.24) / n + rng.uniform(-0.02, 0.02)
            pz = z0 + 0.08 + (k // n) * (h - 0.16) / 2 + rng.uniform(-0.02, 0.02)
            _pinned_paper(s, px, pz, pw, ph, 0.004, rng)
    W, Hpx = width + 8, BOARD_MARGIN + int(round(d * _SC)) + height + BOARD_HANG
    img, _ = s.render(W, Hpx, S=2, fit=False, scale=_SC, center=(w / 2, -Hpx / 2 / _SC), bg="alpha",
                      line_w=1.3, faint_alpha=0.45, grain=0.25, hatch_k=0.08)
    return img


# Inner walls used by the case scenes: name -> (kind, orientation, length px, glass).
# Lengths match the collision rects in packages/game-content/cases/*/scenes/*.json.
PARTITIONS = {
    "partition_office_meeting_n": ("office", "h", 1084, True),
    "partition_office_meeting_e_n": ("office", "v", 130, True),
    "partition_office_meeting_e_s": ("office", "v", 360, True),
    "partition_office_invest_e": ("office", "v", 220, True),
    "partition_office_hall_n": ("office", "h", 512, True),
    "partition_office_hall_w": ("office", "v", 226, True),
    "partition_office_east_n": ("office", "h", 620, True),
    "partition_archive_hall_n": ("archive", "h", 712, True),
    "partition_archive_hall_e": ("archive", "v", 226, True),
    "partition_archive_store_n_w": ("archive", "h", 560, True),
    "partition_archive_store_n_e": ("archive", "h", 444, True),
    "partition_archive_store_e": ("archive", "v", 640, True),
    "partition_archive_security_s": ("archive", "h", 1000, True),
}

BUILDERS = {
    **{name: (lambda spec=spec: partition(*spec)) for name, spec in PARTITIONS.items()},
    "prop_whiteboard_01": lambda: wall_board("whiteboard", 200, 80),
    "prop_bulletin_board_01": lambda: wall_board("bulletin", 180, 76),
    "scene_office_floor": lambda: floor("office"),
    "scene_archive_floor": lambda: floor("archive"),
    "scene_office_wall_back": lambda: wall("office"),
    "scene_archive_wall_back": lambda: wall("archive"),
}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILDERS):
        save(BUILDERS[n](), OUT + n + ".png")
        print("ok", n)
