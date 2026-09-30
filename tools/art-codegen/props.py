import math, sys
import numpy as np
from iso import Scene, M, C, mix, rod, save

OUT = "out/"
rng = np.random.default_rng(3)


def paper_stack(s, x, y, z, n, w=0.30, d=0.22, rot=0.0, col=None, jitter=0.02, folder=False):
    zz = z
    for i in range(n):
        th = 0.012 if not folder else 0.02
        c = col if col is not None else (M["paper"] if i % 3 else M["paper2"])
        s.box(x + rng.uniform(-jitter, jitter), y + rng.uniform(-jitter, jitter), zz, w, d, th, c, lw=0.7,
              rot=rot + rng.uniform(-0.08, 0.08), pivot=(x + w / 2, y + d / 2))
        zz += th
    return zz


def scribble(s, x, y, z, w, d, lines=5, rot=0.0, alpha=0.6):
    """illegible handwriting: rows of short dashed 'words'."""
    cx, cy = x + w / 2, y + d / 2
    ca, sa = math.cos(rot), math.sin(rot)
    T = lambda px, py: [cx + (px - cx) * ca - (py - cy) * sa, cy + (px - cx) * sa + (py - cy) * ca, z + 0.0005]
    for k in range(lines):
        yy = y + d * (0.18 + 0.66 * k / max(lines - 1, 1))
        xe = x + w * rng.uniform(0.6, 0.9)
        px = x + w * 0.1
        while px < xe:
            wl = w * rng.uniform(0.05, 0.16)
            q = np.linspace(px, min(px + wl, xe), 6)
            pts = [T(a, yy + 0.0025 * math.sin(a * 400 + k) + rng.normal(0, 0.0006)) for a in q]
            s.stroke(pts, w=0.9, alpha=alpha)
            px += wl + w * 0.04


def mug(s, x, y, z, r=0.042, h=0.10, col=None):
    col = M["plaster"] if col is None else col
    s.cyl(x, y, z, r, h, col, top=mix("brown", "ink", 0.3))
    s.cyl(x, y, z + h - 0.0001, r, 0.0001, col, cap=True, top=mix("brown", "ink", 0.35))
    rod(s, [x + r * 0.7, y + r * 0.7, z + h * 0.8], [x + r * 1.5, y + r * 1.5, z + h * 0.55], 0.014, col)
    rod(s, [x + r * 1.5, y + r * 1.5, z + h * 0.55], [x + r * 0.7, y + r * 0.7, z + h * 0.25], 0.014, col)


def monitor(s, x, y, z, w=0.50, h=0.32):
    s.cyl(x + w / 2, y + 0.08, z, 0.09, 0.015, M["metal_dk"], ry=0.7)
    s.box(x + w / 2 - 0.025, y + 0.05, z + 0.015, 0.05, 0.03, 0.14, M["metal_dk"])
    s.box(x, y, z + 0.12, w, 0.04, h, M["metal_dk"])
    s.quad([[x + 0.02, y + 0.0405, z + 0.14], [x + w - 0.02, y + 0.0405, z + 0.14],
            [x + w - 0.02, y + 0.0405, z + 0.12 + h - 0.02], [x + 0.02, y + 0.0405, z + 0.12 + h - 0.02]],
           M["screen"], n=[0, 1, 0], lw=0.8)


def desk_lamp(s, x, y, z):
    s.cyl(x, y, z, 0.075, 0.025, M["metal_dk"])
    p0 = [x, y, z + 0.025]; p1 = [x - 0.02, y + 0.02, z + 0.36]; p2 = [x + 0.16, y + 0.12, z + 0.44]
    rod(s, p0, p1, 0.018, M["metal_dk"])
    rod(s, p1, p2, 0.018, M["metal_dk"])
    s.cyl(p2[0] + 0.03, p2[1] + 0.02, z + 0.33, 0.085, 0.11, M["metal_dk"], r2=0.035, top=M["metal_dk"])


def drawers(s, x, y, z, w, h, n, face_y, col, handle=True):
    gap = 0.012
    dh = (h - gap * (n + 1)) / n
    for i in range(n):
        zz = z + gap + i * (dh + gap)
        s.box(x + gap, face_y, zz, w - 2 * gap, 0.012, dh, col, lw=0.9)
        if handle:
            s.box(x + w / 2 - 0.05, face_y + 0.012, zz + dh * 0.62, 0.10, 0.012, 0.018, M["metal_dk"], lw=0.8)


# ------------------------------------------------------------------
def office_desk():
    s = Scene()
    W, D, H = 1.60, 0.80, 0.74
    # pedestal (left) & side panel (right)
    s.box(0.02, 0.05, 0, 0.46, D - 0.08, H - 0.04, M["metal"])
    drawers(s, 0.02, 0.05, 0.03, 0.46, H - 0.08, 3, D - 0.03, M["metal"])
    s.box(W - 0.06, 0.03, 0, 0.04, D - 0.06, H - 0.04, M["wood"])
    s.box(0.48, 0.06, 0.25, W - 0.54, 0.03, H - 0.29, M["wood"])  # modesty panel
    s.box(0, 0, H - 0.04, W, D, 0.04, M["wood"], top=M["wood_lt"])
    t = H
    monitor(s, 0.20, 0.10, t)
    monitor(s, 0.76, 0.06, t, w=0.46)
    # papers & files
    z = paper_stack(s, 0.05, 0.50, t, 6, rot=0.1)
    z = paper_stack(s, 0.07, 0.52, z, 3, col=M["cardboard"], folder=True, rot=-0.05)
    paper_stack(s, 1.26, 0.18, t, 9, w=0.26, d=0.20, rot=-0.15)
    s.box(0.58, 0.52, t, 0.30, 0.21, 0.004, M["paper"], lw=0.7, rot=0.25, pivot=(0.73, 0.62))
    scribble(s, 0.60, 0.54, t + 0.004, 0.26, 0.17, 5, rot=0.25)
    s.box(0.95, 0.55, t, 0.22, 0.16, 0.004, M["paper2"], lw=0.7, rot=-0.3, pivot=(1.06, 0.63))
    scribble(s, 0.97, 0.57, t + 0.004, 0.18, 0.12, 4, rot=-0.3)
    desk_lamp(s, 1.38, 0.55, t)
    mug(s, 1.20, 0.62, t)
    # keyboard
    s.box(0.36, 0.40, t, 0.42, 0.13, 0.02, M["metal_dk"], top=mix("gray", "brown", 0.2), lw=0.8)
    return s


def office_chair(rot=0.0):
    s = Scene()
    fab, base = M["fabric"], M["metal"]
    for k in range(5):
        a = rot + k * 2 * math.pi / 5 + 0.3
        ex, ey = 0.30 * math.cos(a), 0.30 * math.sin(a)
        rod(s, [0, 0, 0.07], [ex, ey, 0.05], 0.035, base)
        s.cyl(ex, ey, 0, 0.028, 0.05, mix("ink", "brown", 0.3))
    s.cyl(0, 0, 0.06, 0.04, 0.05, base)
    s.cyl(0, 0, 0.1, 0.025, 0.30, base)
    s.cyl(0, 0, 0.36, 0.06, 0.04, base)
    st = len(s.faces)
    s.box(-0.24, -0.23, 0.40, 0.48, 0.46, 0.08, fab, top=mix("brown", "gray", 0.12))
    rod(s, [0.0, -0.18, 0.45], [0.0, -0.27, 0.56], 0.06, base)
    s.box(-0.22, -0.31, 0.52, 0.44, 0.07, 0.48, fab)
    for sx in (-0.25, 0.21):
        s.box(sx, -0.12, 0.60, 0.04, 0.28, 0.03, mix("ink", "brown", 0.3))
        rod(s, [sx + 0.02, 0.0, 0.47], [sx + 0.02, 0.0, 0.60], 0.03, base)
    s.rotate(st, rot, (0, 0))
    return s


CHAIR_DIRECTION_ANGLES = {"ne": math.pi, "nw": math.pi / 2, "se": -math.pi / 2, "sw": 0.0}


def chair_forward(rot):
    """Facing direction in the chair's logical floor plane (the backrest is opposite)."""
    return np.array([-math.sin(rot), math.cos(rot)])


def office_chair_direction(direction):
    if direction not in CHAIR_DIRECTION_ANGLES:
        raise ValueError(f"unknown office chair direction: {direction}")
    return office_chair(CHAIR_DIRECTION_ANGLES[direction])


def chair_into(s, x, y, rot):
    c = office_chair(rot)
    for f in c.faces:
        f = dict(f)
        f["v"] = f["v"] + np.array([x, y, 0])
        s.faces.append(f)


def meeting_table():
    s = Scene()
    L, D, H = 2.6, 1.1, 0.74
    for cx in (0.45, L - 0.45):
        s.box(cx - 0.08, D / 2 - 0.30, 0, 0.16, 0.60, 0.04, M["wood"])
        s.box(cx - 0.05, D / 2 - 0.06, 0.04, 0.10, 0.12, H - 0.08, M["wood"])
    s.box(0, 0, H - 0.05, L, D, 0.05, M["wood"], top=M["wood_lt"])
    t = H
    for i, x in enumerate((0.25, 1.05, 1.85)):
        s.box(x + 0.1, 0.12, t, 0.30, 0.22, 0.004, M["paper"], lw=0.7, rot=0.2 * (i - 1), pivot=(x + 0.25, 0.23))
        scribble(s, x + 0.12, 0.14, t + 0.004, 0.26, 0.18, 5, rot=0.2 * (i - 1))
        s.box(x + 0.2, D - 0.40, t, 0.28, 0.21, 0.004, M["paper2"], lw=0.7, rot=-0.15 * (i - 1), pivot=(x + 0.34, D - 0.30))
        scribble(s, x + 0.22, D - 0.38, t + 0.004, 0.24, 0.17, 4, rot=-0.15 * (i - 1))
    paper_stack(s, 1.55, 0.45, t, 5, w=0.30, d=0.22, rot=0.3)
    mug(s, 1.25, 0.55, t)
    # six chairs: 3 back side (y<0, facing +y), 3 front side (facing -y)
    items = []
    for x in (0.55, 1.30, 2.05):
        items.append((x, -0.12, 0.0))
        items.append((x, D + 0.12, math.pi))
    # add in painter-agnostic way (z-buffer handles occlusion)
    for x, y, r in items:
        chair_into(s, x, y, r)
    return s


def filing_cabinet():
    s = Scene()
    W, D, H = 0.46, 0.62, 0.72
    s.box(0, 0, 0, W, D, H, M["metal"], top=mix("gray", "cream", 0.15))
    gap = 0.02
    dh = (H - 3 * gap) / 2
    for i in range(2):
        z = gap + i * (dh + gap)
        s.box(0.02, D, z, W - 0.04, 0.015, dh, M["metal"], lw=0.9)
        s.box(W / 2 - 0.07, D + 0.015, z + dh * 0.55, 0.14, 0.02, 0.025, M["metal_dk"], lw=0.8)
        s.box(W / 2 - 0.05, D + 0.0151, z + dh * 0.72, 0.10, 0.002, 0.05, M["paper"], lw=0.7)
        s.stroke([[W / 2 - 0.035, D + 0.0175, z + dh * 0.72 + 0.025], [W / 2 + 0.03, D + 0.0175, z + dh * 0.72 + 0.027]], w=0.9, alpha=0.5)
    paper_stack(s, 0.07, 0.12, H, 3, w=0.30, d=0.24, col=M["cardboard"], folder=True, rot=0.1)
    return s


def plant():
    s = Scene()
    s.cyl(0, 0, 0, 0.14, 0.32, M["ceramic"], r2=0.18, top=mix("brown", "ink", 0.2))
    s.cyl(0, 0, 0.30, 0.185, 0.04, mix("green", "cream", 0.1))
    s.disc(0, 0, 0.342, 0.16, mix("brown", "ink", 0.25), decal=False)
    lr = np.random.default_rng(11)
    for k in range(46):
        a = lr.uniform(0, 2 * math.pi)
        el = lr.uniform(0.55, 1.35)
        L = lr.uniform(0.30, 0.52)
        base = np.array([0.03 * math.cos(a), 0.03 * math.sin(a), 0.34])
        hor = np.array([math.cos(a), math.sin(a), 0.])
        side = np.array([-math.sin(a), math.cos(a), 0.])
        wdt = lr.uniform(0.03, 0.05)
        col = mix("olive", "green", lr.uniform(0, 0.6))
        droop = lr.uniform(0.6, 1.2)
        segs = 5
        pts = []
        for i in range(segs + 1):
            t = i / segs
            e = el - droop * t * t
            pts.append(base + L * t * (hor * math.cos(e) + np.array([0, 0, 1.]) * math.sin(e)) * (1 + 0.0 * t))
        # smooth: accumulate along direction
        P = [base]
        for i in range(1, segs + 1):
            t = i / segs
            e = el - droop * t
            P.append(P[-1] + L / segs * (hor * math.cos(e) + np.array([0, 0, 1.]) * math.sin(e)))
        g = s.gid()
        for i in range(segs):
            t0, t1 = i / segs, (i + 1) / segs
            w0 = wdt * math.sin(math.pi * min(0.15 + t0, 1) * 0.95)
            w1 = wdt * math.sin(math.pi * min(0.15 + t1, 1) * 0.95) if i < segs - 1 else 0.002
            q = [P[i] - side * w0, P[i] + side * w0, P[i + 1] + side * w1, P[i + 1] - side * w1]
            nrm = np.cross(side, P[i + 1] - P[i])
            s.face(q, nrm, col, lw=0.8, group=g, two=True)
        s.stroke([p + [0, 0, 0.003] for p in P], w=0.6, alpha=0.3)
    return s


def door():
    s = Scene()
    Wl, T, Hh = 1.7, 0.14, 2.35
    dw, dh = 0.92, 2.05
    x0 = (Wl - dw) / 2
    pl = M["plaster"]
    s.box(0, 0, 0, x0 - 0.06, T, Hh, pl)
    s.box(x0 + dw + 0.06, 0, 0, Wl - x0 - dw - 0.06, T, Hh, pl)
    s.box(x0 - 0.06, 0, dh + 0.06, dw + 0.12, T, Hh - dh - 0.06, pl)
    # frame
    fr = M["wood"]
    s.box(x0 - 0.06, T - 0.02, 0, 0.06, 0.05, dh + 0.06, fr)
    s.box(x0 + dw, T - 0.02, 0, 0.06, 0.05, dh + 0.06, fr)
    s.box(x0 - 0.06, T - 0.02, dh, dw + 0.12, 0.05, 0.06, fr)
    # baseboards
    s.box(0, T, 0, x0 - 0.06, 0.02, 0.10, fr)
    s.box(x0 + dw + 0.06, T, 0, Wl - x0 - dw - 0.06, 0.02, 0.10, fr)
    # door slab (recessed)
    g = M["ceramic"]
    s.box(x0, T - 0.07, 0, dw, 0.05, dh, g)
    s.box(x0 + 0.08, T - 0.019, 0.12, dw - 0.16, 0.008, 0.72, mix("green", "ink", 0.06), lw=0.8)
    # frosted window
    s.box(x0 + 0.14, T - 0.021, 1.18, dw - 0.28, 0.012, 0.70, mix("green", "ink", 0.06), lw=0.9)
    s.quad([[x0 + 0.18, T - 0.0085, 1.22], [x0 + dw - 0.18, T - 0.0085, 1.22], [x0 + dw - 0.18, T - 0.0085, 1.84], [x0 + 0.18, T - 0.0085, 1.84]],
           M["glass"], n=[0, 1, 0], lw=0.8)
    for k in range(4):
        z = 1.3 + k * 0.14
        s.stroke([[x0 + 0.24, T - 0.008, z], [x0 + 0.30 + 0.1 * (k % 2), T - 0.008, z + 0.04]], w=0.8, col=C["cream"], alpha=0.6)
    # handle
    s.box(x0 + dw - 0.14, T - 0.02, 0.98, 0.04, 0.02, 0.10, M["metal_dk"])
    rod(s, [x0 + dw - 0.12, T, 1.02], [x0 + dw - 0.24, T + 0.05, 1.02], 0.022, M["metal_dk"])
    return s


def note():
    s = Scene()
    W, D = 0.30, 0.30
    s.box(0, 0, 0, W, D, 0.004, M["paper"], lw=0.8, rot=0.12, pivot=(W / 2, D / 2))
    scribble(s, 0.0, 0.02, 0.0045, W, D * 0.8, 6, rot=0.12, alpha=0.6)
    # red corner mark (lower-right corner of the sheet)
    ca, sa = math.cos(0.12), math.sin(0.12)
    def R(px, py):
        dx, dy = px - W / 2, py - D / 2
        return [W / 2 + dx * ca - dy * sa, D / 2 + dx * sa + dy * ca, 0.0048]
    s.quad([R(W, D - 0.07), R(W, D), R(W - 0.07, D)], M["red"], n=[0, 0, 1], decal=True, lw=0)
    # pin
    s.cyl(*R(W / 2, 0.035)[:2], 0.004, 0.004, 0.012, mix("gray", "brown", 0.3), n=12)
    s.cyl(*R(W / 2, 0.035)[:2], 0.016, 0.012, 0.012, mix("gray", "brown", 0.2), n=16)
    return s


def security_terminal():
    s = Scene()
    # stand
    s.box(0.0, 0.0, 0.0, 0.70, 0.60, 0.05, M["metal_dk"])
    for x, y in ((0.03, 0.03), (0.62, 0.03), (0.03, 0.52), (0.62, 0.52)):
        s.box(x, y, 0.05, 0.05, 0.05, 0.62, M["metal"])
    s.box(0.0, 0.0, 0.67, 0.70, 0.60, 0.04, M["metal"], top=mix("gray", "cream", 0.15))
    t = 0.71
    case = M["plaster"]
    case = mix("beige", "cream", 0.3)
    # CRT: front box + tapered back
    s.box(0.08, 0.20, t + 0.02, 0.52, 0.30, 0.44, case)
    s.box(0.14, 0.04, t + 0.06, 0.40, 0.16, 0.36, mix("beige", "gray", 0.3))
    s.box(0.06, 0.18, t, 0.56, 0.34, 0.03, mix("beige", "gray", 0.25))
    s.box(0.13, 0.50, t + 0.10, 0.42, 0.012, 0.32, mix("gray", "brown", 0.2), lw=0.9)
    scr = mix("green", "ink", 0.35)
    s.quad([[0.16, 0.5125, t + 0.13], [0.52, 0.5125, t + 0.13], [0.52, 0.5125, t + 0.39], [0.16, 0.5125, t + 0.39]], scr, n=[0, 1, 0], lw=0.8)
    # faint scanline glow
    for k in range(6):
        z = t + 0.16 + k * 0.035
        s.stroke([[0.19, 0.513, z], [0.19 + 0.08 + 0.12 * ((k * 7) % 3) / 2, 0.513, z]], w=1.0, col=mix("green", "cream", 0.45), alpha=0.45)
    s.cyl(0.54, 0.505, t + 0.05, 0.012, 0.01, mix("gray", "ink", 0.4), cap=True)
    # keyboard
    s.box(0.12, 0.58 - 0.02 + 0.02, t, 0.46, 0.0, 0.0, case) if False else None
    s.box(0.10, 0.36, t + 0.03 + 0.001, 0.0, 0, 0, case) if False else None
    s.box(0.11, 0.62, 0.40, 0.48, 0.18, 0.025, case)  # pull-out shelf keyboard
    s.box(0.07, 0.60, 0.37, 0.56, 0.22, 0.03, M["metal"])
    s.box(0.12, 0.64, 0.40, 0.46, 0.14, 0.03, mix("beige", "gray", 0.25), top=case, lw=0.8)
    for r in range(3):
        for k in range(10):
            s.box(0.14 + k * 0.043, 0.655 + r * 0.04, 0.43, 0.034, 0.03, 0.012, mix("beige", "gray", 0.15), lw=0.6)
    return s


def audio_recorder():
    s = Scene()
    # tiny stand
    s.box(-0.05, -0.04, 0, 0.10, 0.08, 0.012, M["metal_dk"])
    s.box(-0.045, -0.035, 0.012, 0.09, 0.02, 0.03, M["metal_dk"])
    body = M["metal"]
    s.box(-0.032, -0.012, 0.012, 0.064, 0.024, 0.16, body, top=mix("gray", "cream", 0.1))
    # grille on front (+y)
    for r in range(4):
        for k in range(4):
            s.disc(-0.018 + k * 0.012, 0.0121, 0.14 - r * 0.011, 0.0035, mix("gray", "ink", 0.5), n=10) if False else None
    for r in range(5):
        z = 0.145 - r * 0.009
        s.stroke([[-0.02, 0.0121, z], [0.02, 0.0121, z]], w=0.9, alpha=0.6)
    s.quad([[-0.022, 0.01205, 0.06], [0.022, 0.01205, 0.06], [0.022, 0.01205, 0.09], [-0.022, 0.01205, 0.09]],
           mix("gray", "ink", 0.45), n=[0, 1, 0], lw=0.8)
    for k, x in enumerate((-0.018, -0.004, 0.010)):
        s.box(x, 0.012, 0.035, 0.010, 0.004, 0.010, mix("gray", "brown", 0.4), lw=0.6)
    s.cyl(0.018, 0.016, 0.040, 0.005, 0.0001, M["red"], n=16) if False else None
    # red record dot on front face as a small cylinder poking out along +y -> use a disk quad
    ang = np.linspace(0, 2 * math.pi, 16, endpoint=False)
    s.quad([[0.020 + 0.006 * math.cos(a), 0.0125, 0.040 + 0.006 * math.sin(a)] for a in ang], M["red"], n=[0, 1, 0], lw=0.7)
    s.cyl(0.02, 0.0, 0.172, 0.004, 0.03, mix("gray", "ink", 0.3))
    return s


# ------------------------------------------------------------------ Phase 11C furnishing
def coat_rack():
    s = Scene()
    wood = M["wood"]
    for k in range(4):                                                  # splayed feet
        a = k * math.pi / 2 + math.pi / 4
        rod(s, [0, 0, 0.10], [0.24 * math.cos(a), 0.24 * math.sin(a), 0.01], 0.035, wood)
    s.cyl(0, 0, 0.0, 0.05, 0.12, wood)
    s.cyl(0, 0, 0.1, 0.022, 1.62, wood, top=M["wood_lt"])
    s.cyl(0, 0, 1.70, 0.035, 0.05, wood, top=M["wood_lt"])
    for k in range(4):                                                  # hooks
        a = k * math.pi / 2
        rod(s, [0.01 * math.cos(a), 0.01 * math.sin(a), 1.62], [0.12 * math.cos(a), 0.12 * math.sin(a), 1.70], 0.02, M["metal_dk"])
    coat = mix("brown", "beige", 0.18)
    # trench coat hanging from the front hook: shoulders, body, belt, collar
    s.box(-0.17, 0.05, 0.62, 0.34, 0.12, 0.92, coat, top=mix(coat, "cream", 0.1))
    s.box(-0.20, 0.04, 1.36, 0.40, 0.14, 0.20, coat)
    s.box(-0.17, 0.17, 1.05, 0.34, 0.004, 0.045, mix(coat, "ink", 0.35), lw=0.7)
    s.box(-0.02, 0.171, 0.66, 0.012, 0.002, 0.86, mix(coat, "ink", 0.3), lw=0.5)
    s.quad([[-0.10, 0.181, 1.56], [0.0, 0.181, 1.46], [0.10, 0.181, 1.56]], mix(coat, "ink", 0.2), n=[0, 1, 0], lw=0.8)
    # hat on the left hook
    s.cyl(-0.05, -0.12, 1.66, 0.13, 0.015, mix("ink", "brown", 0.4))
    s.cyl(-0.05, -0.12, 1.675, 0.075, 0.09, mix("ink", "brown", 0.4), top=mix("ink", "brown", 0.5))
    return s


def water_cooler():
    s = Scene()
    body = mix(M["plaster"], "gray", 0.18)
    W, D, H = 0.34, 0.34, 0.98
    s.box(0, 0, 0, W, D, 0.06, M["metal_dk"])
    s.box(0.01, 0.01, 0.06, W - 0.02, D - 0.02, H - 0.06, body, top=mix(body, "cream", 0.2))
    s.box(0.05, D - 0.01, 0.52, W - 0.10, 0.012, 0.20, mix(body, "ink", 0.18), lw=0.8)   # tap recess
    for x in (0.10, 0.21):
        s.box(x, D, 0.63, 0.04, 0.04, 0.05, M["metal_dk"], lw=0.7)
    s.box(0.07, D - 0.002, 0.50, W - 0.14, 0.06, 0.02, M["metal"], lw=0.8)             # drip tray
    s.box(0.06, D - 0.009, 0.14, W - 0.12, 0.004, 0.30, mix(body, "beige", 0.3), lw=0.6)  # cabinet door
    glass = mix(M["glass"], "green", 0.30)
    s.cyl(W / 2, D / 2, H, 0.05, 0.04, mix(glass, "ink", 0.2))
    s.cyl(W / 2, D / 2, H + 0.04, 0.13, 0.36, glass, r2=0.13, top=mix(glass, "cream", 0.2))
    s.cyl(W / 2, D / 2, H + 0.40, 0.13, 0.05, glass, r2=0.06, top=mix(glass, "cream", 0.2))
    for z in (H + 0.12, H + 0.26):
        s.cyl(W / 2, D / 2, z, 0.132, 0.012, mix(glass, "ink", 0.15))
    # stack of paper cups on the side
    s.cyl(W + 0.04, D * 0.6, 0.62, 0.035, 0.16, M["paper"], r2=0.04)
    s.box(W, D * 0.6 - 0.04, 0.60, 0.02, 0.08, 0.22, M["metal"], lw=0.7)
    return s


def file_boxes():
    s = Scene()
    lr = np.random.default_rng(17)
    specs = [(0.0, 0.0, 0.0, 0.52, 0.38, 0.30, 0.0), (0.54, 0.04, 0.0, 0.46, 0.36, 0.28, 0.08),
             (0.04, 0.02, 0.30, 0.48, 0.36, 0.28, -0.06), (0.10, 0.44, 0.0, 0.44, 0.34, 0.26, 0.12)]
    for x, y, z, w, d, h, rot in specs:
        col = mix(M["cardboard"], "gray", lr.uniform(0, 0.3))
        s.box(x, y, z, w, d, h, col, rot=rot, pivot=(x + w / 2, y + d / 2))
        s.box(x - 0.008, y - 0.008, z + h - 0.05, w + 0.016, d + 0.016, 0.062, mix(col, "ink", 0.12), lw=0.8,
              rot=rot, pivot=(x + w / 2, y + d / 2))                   # lid, a little proud of the box
        st = len(s.faces)
        s.box(x + w / 2 - 0.08, y + d, z + h * 0.30, 0.16, 0.004, 0.09, M["paper"], lw=0.7)
        s.box(x + w / 2 - 0.05, y + d, z + h * 0.10, 0.10, 0.004, 0.04, mix("brown", "ink", 0.3), lw=0.5)
        s.rotate(st, rot, (x + w / 2, y + d / 2))
    paper_stack(s, 0.08, 0.06, 0.58, 3, w=0.30, d=0.22, col=M["cardboard"], folder=True, rot=0.2)
    return s


def plant_tall():
    s = Scene()
    s.cyl(0, 0, 0, 0.17, 0.46, mix("brown", "beige", 0.35), r2=0.20, top=mix("brown", "ink", 0.2))
    s.cyl(0, 0, 0.44, 0.205, 0.04, mix("brown", "beige", 0.45))
    s.disc(0, 0, 0.482, 0.18, mix("brown", "ink", 0.25), decal=False)
    lr = np.random.default_rng(23)
    rod(s, [0, 0, 0.48], [0.02, 0.01, 1.35], 0.03, mix("brown", "olive", 0.3))
    for k in range(30):                                                # broad leaves along a stem
        zb = lr.uniform(0.75, 1.45)
        a = lr.uniform(0, 2 * math.pi)
        L = lr.uniform(0.22, 0.34)
        wdt = lr.uniform(0.06, 0.09)
        base = np.array([0.02 * math.cos(a), 0.02 * math.sin(a), zb])
        hor = np.array([math.cos(a), math.sin(a), 0.])
        side = np.array([-math.sin(a), math.cos(a), 0.])
        tip = base + hor * L + np.array([0, 0, lr.uniform(-0.12, 0.10)])
        mid = (base + tip) / 2 + np.array([0, 0, 0.03])
        col = mix(mix("olive", "green", lr.uniform(0.3, 0.9)), "ink", lr.uniform(0.05, 0.2))
        g = s.gid()
        s.face([base, mid - side * wdt, tip, mid + side * wdt], np.cross(side, tip - base), col, lw=0.8, group=g, two=True)
        s.stroke([base + [0, 0, 0.003], tip + [0, 0, 0.003]], w=0.6, alpha=0.3)
    return s


def archive_shelf(seed=29):
    s = Scene()
    lr = np.random.default_rng(seed)
    W, D, H = 1.20, 0.45, 1.95
    for x in (0.0, W - 0.04):
        for y in (0.0, D - 0.04):
            s.box(x, y, 0, 0.04, 0.04, H, M["metal_dk"])
    for lvl in range(5):
        z = 0.06 + lvl * 0.46
        s.box(0, 0, z, W, D, 0.03, M["metal"], lw=1.0)
        if lvl == 4:
            continue
        x = 0.05
        while x < W - 0.30:
            if lr.random() < 0.15:
                x += 0.22
                continue
            if lr.random() < 0.6:
                bw = lr.uniform(0.28, 0.36)
                bh = lr.uniform(0.26, 0.32)
                col = mix(M["cardboard"], "gray", lr.uniform(0, 0.35))
                s.box(x, 0.04, z + 0.03, bw, D - 0.08, bh, col, lw=1.0)
                s.box(x + bw / 2 - 0.06, D - 0.039, z + 0.03 + bh * 0.5, 0.12, 0.002, 0.07, M["paper"], lw=0.6)
                x += bw + 0.03
            else:
                for k in range(lr.integers(3, 6)):
                    bw = 0.07
                    col = mix(lr.choice(["gray", "green", "brown", "beige"]), "ink", lr.uniform(0.05, 0.3))
                    s.box(x, 0.06, z + 0.03, bw, D - 0.12, lr.uniform(0.30, 0.36), col, lw=0.8)
                    x += bw + 0.005
                x += 0.03
    return s


def credenza():
    s = Scene()
    W, D, H = 1.30, 0.45, 0.72
    s.box(0, 0, 0, W, D, 0.06, mix(M["wood"], "ink", 0.2))
    s.box(0, 0, 0.06, W, D, H - 0.06, M["wood"], top=M["wood_lt"])
    for k in range(3):                                                   # doors
        s.box(0.03 + k * (W - 0.06) / 3, D, 0.10, (W - 0.06) / 3 - 0.02, 0.012, H - 0.16, M["wood"], lw=0.9)
        s.box(0.03 + (k + 0.5) * (W - 0.06) / 3 - 0.03, D + 0.012, H - 0.22, 0.06, 0.012, 0.02, M["metal_dk"], lw=0.7)
    for k in range(5):                                                   # binders on top
        s.box(0.10 + k * 0.08, 0.12, H, 0.07, 0.26, 0.30, mix(["gray", "green", "brown", "beige", "gray"][k], "ink", 0.2), lw=0.8)
        s.box(0.115 + k * 0.08, 0.381, H + 0.16, 0.04, 0.002, 0.06, M["paper"], lw=0.5)
    paper_stack(s, 0.66, 0.10, H, 5, w=0.30, d=0.22, rot=0.1)
    s.cyl(1.10, 0.22, H, 0.10, 0.14, M["ceramic"], r2=0.12, top=mix("brown", "ink", 0.2))   # small plant pot
    lr = np.random.default_rng(5)
    for k in range(14):
        a = lr.uniform(0, 2 * math.pi)
        base = np.array([1.10, 0.22, H + 0.14])
        hor = np.array([math.cos(a), math.sin(a), 0.])
        side = np.array([-math.sin(a), math.cos(a), 0.])
        tip = base + hor * 0.16 + np.array([0, 0, lr.uniform(0.08, 0.2)])
        g = s.gid()
        s.face([base - side * 0.02, base + side * 0.02, tip], np.cross(side, tip - base), mix("olive", "green", lr.uniform(0, 0.6)), lw=0.7, group=g, two=True)
    return s


BUILDERS = dict(
    prop_office_desk_01=office_desk,
    prop_office_chair_01=lambda: office_chair(math.radians(-20)),
    prop_office_chair_01_ne=lambda: office_chair_direction("ne"),
    prop_office_chair_01_nw=lambda: office_chair_direction("nw"),
    prop_office_chair_01_se=lambda: office_chair_direction("se"),
    prop_office_chair_01_sw=lambda: office_chair_direction("sw"),
    prop_meeting_table_01=meeting_table,
    prop_filing_cabinet_01=filing_cabinet,
    prop_office_plant_01=plant,
    prop_door_hallway_01=door,
    prop_note_01=note,
    prop_security_terminal_01=security_terminal,
    prop_audio_recorder_01=audio_recorder,
    prop_coat_rack_01=coat_rack,
    prop_water_cooler_01=water_cooler,
    prop_file_boxes_01=file_boxes,
    prop_plant_tall_01=plant_tall,
    prop_archive_shelf_01=archive_shelf,
    prop_archive_shelf_02=lambda: archive_shelf(37),
    prop_credenza_01=credenza,
)

if __name__ == "__main__":
    names = sys.argv[1:] or list(BUILDERS)
    for n in names:
        sc = BUILDERS[n]()
        img, _ = sc.render(1024, 1024)
        save(img, OUT + n + ".png")
        print("ok", n)
