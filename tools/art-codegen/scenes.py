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


def wall(kind="office"):
    s = Scene()
    L, Hh, T = 8.0, 2.8, 0.16
    pl = M["plaster"] if kind == "office" else mix("gray", "cream", 0.35)
    s.box(0, -T, 0, L, T, Hh, pl, top=mix(pl, "gray", 0.3))
    wood = M["wood"]
    s.box(0, 0, 0, L, 0.025, 0.14, wood)                       # baseboard
    s.box(0, 0, Hh - 0.12, L, 0.02, 0.08, M["ceramic"])        # muted green top trim
    s.box(0, 0, 0.92, L, 0.018, 0.05, M["ceramic"])            # chair rail
    rng = np.random.default_rng(5)
    # faint plaster wear
    for k in range(30):
        x = rng.uniform(0.2, L - 0.2); z = rng.uniform(1.0, Hh - 0.3)
        s.stroke([[x, 0.001, z], [x + rng.uniform(0.05, 0.25), 0.001, z - rng.uniform(0.05, 0.25)]], w=0.8, alpha=0.12)
    if kind == "office":
        # bulletin board with blank pinned papers
        bx, bz, bw, bh = 2.3, 1.12, 3.0, 1.30
        s.box(bx, 0, bz, bw, 0.04, bh, wood)
        s.box(bx + 0.06, 0.04, bz + 0.06, bw - 0.12, 0.004, bh - 0.12, mix("beige", "brown", 0.3), lw=0.8)
        for k in range(10):
            pw, ph = rng.uniform(0.26, 0.38), rng.uniform(0.30, 0.42)
            px = bx + 0.15 + (k % 5) * 0.56 + rng.uniform(-0.05, 0.05)
            pz = bz + 0.12 + (k // 5) * 0.58 + rng.uniform(-0.04, 0.06)
            a = rng.uniform(-0.08, 0.08)
            pts = np.array([[0, 0], [pw, 0], [pw, ph], [0, ph]])
            ca, sa = math.cos(a), math.sin(a)
            pts = pts @ np.array([[ca, sa], [-sa, ca]])
            s.quad([[px + p[0], 0.046, pz + p[1]] for p in pts], M["paper"] if k % 2 else M["paper2"], n=[0, 1, 0], lw=0.7)
            s.cyl(px + pw / 2, 0.048, pz + ph - 0.03, 0.0, 0.0, M["ink"], cap=False) if False else None
            pin = [px + pw / 2 - sa * (ph - 0.03), 0.048, pz + ca * (ph - 0.03)]
            ang = np.linspace(0, 2 * math.pi, 10, endpoint=False)
            s.quad([[pin[0] + 0.018 * math.cos(t), 0.0485, pin[2] + 0.018 * math.sin(t)] for t in ang], mix("gray", "ink", 0.35), n=[0, 1, 0], lw=0.6)
    else:
        # metal shelving units with archive boxes
        for u in range(3):
            ux = 0.4 + u * 2.55
            uw, ud, uh = 2.3, 0.45, 2.3
            for px in (ux, ux + uw - 0.05):
                for py in (0.0, ud - 0.05):
                    s.box(px, py, 0, 0.05, 0.05, uh, M["metal_dk"])
            for lvl in range(4):
                z = 0.12 + lvl * 0.72
                if z > uh:
                    break
                s.box(ux, 0, z, uw, ud, 0.035, M["metal"], lw=1.0)
                if z + 0.5 > uh:
                    continue
                x = ux + 0.08
                while x < ux + uw - 0.5:
                    bw = rng.uniform(0.34, 0.46); bh = rng.uniform(0.34, 0.46)
                    col = mix("cardboard" if False else M["cardboard"], "gray", rng.uniform(0, 0.3))
                    s.box(x, 0.03, z + 0.035, bw, ud - 0.08, bh, col, lw=1.0)
                    s.box(x + bw / 2 - 0.07, ud - 0.049, z + 0.035 + bh * 0.55, 0.14, 0.002, 0.08, M["paper"], lw=0.7)
                    s.quad([[x + bw / 2 - 0.05, ud - 0.0465, z + 0.035 + bh * 0.2], [x + bw / 2 + 0.05, ud - 0.0465, z + 0.035 + bh * 0.2],
                            [x + bw / 2 + 0.05, ud - 0.0465, z + 0.035 + bh * 0.3], [x + bw / 2 - 0.05, ud - 0.0465, z + 0.035 + bh * 0.3]],
                           mix("brown", "ink", 0.3), n=[0, 1, 0], lw=0.5)
                    x += bw + rng.uniform(0.03, 0.10)
        # dim wall lamp
        lx = 4.0
        s.box(lx - 0.06, 0, Hh - 0.42, 0.12, 0.03, 0.14, M["metal_dk"])
        rod(s, [lx, 0.03, Hh - 0.35], [lx, 0.30, Hh - 0.35], 0.03, M["metal_dk"])
        s.cyl(lx, 0.34, Hh - 0.52, 0.16, 0.16, M["metal_dk"], r2=0.05)
        s.disc(lx, 0.34, Hh - 0.521, 0.12, mix("beige", "cream", 0.5), decal=True, alpha=0.0)
    img, _ = s.render(2400, 1600, S=2, margin=0.03, line_w=1.4, sil_w=2.4, grain=0.3)
    return img


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
