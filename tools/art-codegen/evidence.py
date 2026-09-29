import math, sys
import numpy as np
from iso import Scene, M, C, mix, rod, save

OUT = "out/"


def desk_surface(s, rng, R=0.36):
    """wooden planks filling the frame (top-down)."""
    pw = 0.12
    x = -R - 0.05
    k = 0
    while x < R + 0.05:
        col = mix(M["wood_lt"], "brown", rng.uniform(0, 0.12))
        s.face([[x, -R - 0.05, 0], [x + pw, -R - 0.05, 0], [x + pw, R + 0.05, 0], [x, R + 0.05, 0]], [0, 0, 1], col, lw=0.8, shade=False, hatch=False)
        for g in range(7):
            gx = x + rng.uniform(0.01, pw - 0.01)
            ys = np.linspace(-R - 0.05, R + 0.05, 40)
            xs = gx + 0.004 * np.sin(ys * rng.uniform(8, 20) + rng.uniform(0, 6))
            s.stroke(np.c_[xs, ys, np.zeros_like(ys) + 0.0002], w=0.9, col=mix("brown", "ink", 0.3), alpha=rng.uniform(0.12, 0.25))
        x += pw
        k += 1


def soft_shadow(s, pts, z, steps=5, dx=0.004, dy=-0.004, a=0.06):
    pts = np.asarray(pts, float)
    for i in range(1, steps + 1):
        s.quad([[p[0] + dx * i, p[1] + dy * i, z] for p in pts], C["ink"], n=[0, 0, 1], decal=True, alpha=a, lw=0)


def rect(cx, cy, w, h, a):
    ca, sa = math.cos(a), math.sin(a)
    return [[cx + x * ca - y * sa, cy + x * sa + y * ca] for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]


def local(cx, cy, a):
    ca, sa = math.cos(a), math.sin(a)
    return lambda x, y: [cx + x * ca - y * sa, cy + x * sa + y * ca]


def text_lines(s, L, x0, x1, y0, y1, n, z, alpha=0.62, w=0.8, col=None, jag=True, rng=None):
    for k in range(n):
        y = y0 - (y0 - y1) * k / max(n - 1, 1)
        xe = x1 if not jag else x0 + (x1 - x0) * rng.uniform(0.55, 1.0)
        # dashed "words"
        x = x0
        while x < xe:
            wl = rng.uniform(0.008, 0.03)
            s.stroke([L(x, y) + [z], L(min(x + wl, xe), y) + [z]], w=w, col=col, alpha=alpha)
            x += wl + 0.006


def meeting_minutes():
    s = Scene("top")
    rng = np.random.default_rng(41)
    desk_surface(s, rng)
    a = 0.06
    P = rect(0.0, 0.0, 0.46, 0.60, a)
    soft_shadow(s, P, 0.0003)
    s.face([p + [0.004] for p in P], [0, 0, 1], M["paper"], lw=0.9, shade=False, hatch=False)
    L = local(0, 0, a)
    z = 0.0045
    # header block + lines
    s.stroke([L(-0.16, 0.235) + [z], L(0.02, 0.235) + [z]], w=2.0, alpha=0.55)
    s.stroke([L(-0.16, 0.21) + [z], L(-0.04, 0.21) + [z]], w=1.0, alpha=0.4)
    s.stroke([L(-0.18, 0.19) + [z], L(0.18, 0.19) + [z]], w=0.8, alpha=0.35)
    text_lines(s, L, -0.17, 0.17, 0.165, -0.24, 22, z, rng=rng)
    # faint ruled lines
    for k in range(24):
        y = 0.175 - k * 0.0182
        s.stroke([L(-0.18, y) + [z], L(0.18, y) + [z]], w=0.6, col=C["gray"], alpha=0.25)
    # coffee ring (broken annulus)
    cx, cy, r = 0.12, -0.14, 0.055
    ang = np.linspace(0, 2 * math.pi, 60)
    for i in range(59):
        if 0.9 < ang[i] < 1.5:
            continue
        rr = r + 0.0015 * math.sin(ang[i] * 2.3 + 1)
        s.stroke([[cx + rr * math.cos(ang[i]), cy + rr * math.sin(ang[i]), z + 0.0001],
                  [cx + rr * math.cos(ang[i + 1]), cy + rr * math.sin(ang[i + 1]), z + 0.0001]], w=2.2, col=mix("brown", "beige", 0.35), alpha=0.35)
    s.disc(cx, cy, z + 0.00005, r, mix("brown", "beige", 0.5), alpha=0.08, n=40)
    # paperclip (top-left)
    px, py = -0.15, 0.255
    def arc(cx, cy, r, a0, a1, n=10):
        return [[cx + r * math.cos(t), cy + r * math.sin(t)] for t in np.linspace(a0, a1, n)]
    clip = ([[px + 0.012, py - 0.045]] + [[px + 0.012, py + 0.02]] + arc(px + 0.006, py + 0.02, 0.006, 0, math.pi)
            + [[px, py - 0.055]] + arc(px + 0.009, py - 0.055, 0.009, math.pi, 2 * math.pi) + [[px + 0.018, py + 0.028]]
            + arc(px + 0.0105, py + 0.028, 0.0075, 0, math.pi))
    L2 = local(0, 0, a)
    clip = [L2(x, y) for x, y in clip]
    s.stroke([[x + 0.002, y - 0.002, z + 0.001] for x, y in clip], w=2.4, col=C["ink"], alpha=0.25)
    s.stroke([[x, y, z + 0.002] for x, y in clip], w=2.0, col=mix("gray", "ink", 0.45), alpha=0.95)
    s.stroke([[x - 0.0006, y + 0.0006, z + 0.0021] for x, y in clip], w=0.7, col=mix("gray", "cream", 0.6), alpha=0.8)
    img, _ = s.render(1024, 1024, S=4, fit=False, scale=1024 / 0.72, center=(0, 0), bg=None, line_w=1.2, grain=0.35, hatch_k=0)
    return img


def voice_recorder():
    s = Scene("top")
    rng = np.random.default_rng(42)
    desk_surface(s, rng)
    # folded note beside
    a = -0.18
    P = rect(0.12, 0.05, 0.20, 0.26, a)
    soft_shadow(s, P, 0.0003)
    s.face([p + [0.004] for p in P], [0, 0, 1], M["paper2"], lw=0.9, shade=False, hatch=False)
    L = local(0.12, 0.05, a)
    s.stroke([L(-0.1, 0.0) + [0.0045], L(0.1, 0.0) + [0.0045]], w=0.9, col=C["gray"], alpha=0.6)   # fold crease
    P2 = [L(-0.1, 0.0), L(0.1, 0.0), L(0.1, 0.13), L(-0.1, 0.13)]
    s.face([p + [0.0046] for p in P2], [0, 0, 1], M["paper"], lw=0.9, shade=False, hatch=False)
    text_lines(s, L, -0.08, 0.07, 0.11, 0.025, 6, 0.0048, alpha=0.5, rng=rng)
    text_lines(s, L, -0.08, 0.06, -0.025, -0.1, 5, 0.0045, alpha=0.4, rng=rng)
    # recorder body
    a = 0.22
    cx, cy = -0.12, -0.03
    P = rect(cx, cy, 0.075, 0.19, a)
    soft_shadow(s, P, 0.0003, steps=6, a=0.08)
    s.face([p + [0.02] for p in P], [0, 0, 1], M["metal"], lw=1.2, shade=False, hatch=False)
    L = local(cx, cy, a)
    P = [L(-0.03, 0.035), L(0.03, 0.035), L(0.03, 0.085), L(-0.03, 0.085)]
    s.face([p + [0.0205] for p in P], [0, 0, 1], mix("gray", "ink", 0.3), lw=0.9, shade=False, decal=True)
    for k in range(6):
        y = 0.04 + k * 0.008
        s.stroke([L(-0.025, y) + [0.021], L(0.025, y) + [0.021]], w=1.0, col=mix("gray", "ink", 0.6), alpha=0.8)
    P = [L(-0.028, -0.01), L(0.028, -0.01), L(0.028, 0.02), L(-0.028, 0.02)]
    s.face([p + [0.0205] for p in P], [0, 0, 1], mix("green", "ink", 0.35), lw=0.9, shade=False, decal=True)
    for k, x in enumerate((-0.02, 0.0, 0.02)):
        P = [L(x - 0.007, -0.06), L(x + 0.007, -0.06), L(x + 0.007, -0.045), L(x - 0.007, -0.045)]
        s.face([p + [0.021] for p in P], [0, 0, 1], mix("gray", "brown", 0.35), lw=0.7, shade=False, decal=True)
    rc = L(0.0, -0.075)
    s.disc(rc[0], rc[1], 0.021, 0.008, M["red"], n=20, lw=0.7)
    img, _ = s.render(1024, 1024, S=4, fit=False, scale=1024 / 0.50, center=(0, 0.0), bg=None, line_w=1.2, grain=0.35, hatch_k=0)
    return img


def security_log():
    s = Scene("top")
    rng = np.random.default_rng(43)
    desk_surface(s, rng)
    a = -0.05
    B = rect(0, -0.01, 0.46, 0.62, a)
    soft_shadow(s, B, 0.0003, steps=6, a=0.07)
    s.face([p + [0.006] for p in B], [0, 0, 1], M["cardboard"], lw=1.2, shade=False, hatch=False)
    L = local(0, -0.01, a)
    P = [L(-0.2, -0.29), L(0.2, -0.29), L(0.2, 0.25), L(-0.2, 0.25)]
    s.face([p + [0.008] for p in P], [0, 0, 1], M["paper"], lw=0.9, shade=False, hatch=False)
    z = 0.0085
    # columns of tiny entries
    cols = [(-0.18, -0.10), (-0.08, 0.0), (0.02, 0.12), (0.14, 0.185)]
    rows = 24
    hi = 13
    for r in range(rows):
        y = 0.19 - r * 0.019
        if r == hi:
            H = [L(-0.19, y - 0.008), L(0.19, y - 0.008), L(0.19, y + 0.008), L(-0.19, y + 0.008)]
            s.face([p + [z + 0.0003] for p in H], [0, 0, 1], M["red"], lw=0, shade=False, decal=True, alpha=0.55)
        for c0, c1 in cols:
            e = c0 + (c1 - c0) * rng.uniform(0.5, 1.0)
            s.stroke([L(c0, y) + [z + 0.0005], L(e, y) + [z + 0.0005]], w=0.9, alpha=0.5 if r != hi else 0.7)
    for c0, _ in cols[1:]:
        s.stroke([L(c0 - 0.01, 0.21) + [z], L(c0 - 0.01, -0.27) + [z]], w=0.6, col=C["gray"], alpha=0.5)
    s.stroke([L(-0.19, 0.205) + [z], L(0.19, 0.205) + [z]], w=1.0, col=C["gray"], alpha=0.6)
    s.stroke([L(-0.18, 0.228) + [z], L(0.0, 0.228) + [z]], w=2.0, alpha=0.5)
    # red circle mark next to highlighted line
    yy = 0.19 - hi * 0.019
    ang = np.linspace(0, 2 * math.pi, 30)
    s.stroke([L(0.205 + 0.012 * math.cos(t), yy + 0.01 * math.sin(t)) + [z + 0.001] for t in ang], w=1.6, col=M["red"], alpha=0.85)
    # metal clip
    Cp = [L(-0.08, 0.235), L(0.08, 0.235), L(0.07, 0.30), L(-0.07, 0.30)]
    s.face([p + [0.014] for p in Cp], [0, 0, 1], M["metal"], lw=1.2, shade=False, hatch=False)
    s.stroke([L(-0.05, 0.285) + [0.0145], L(0.05, 0.285) + [0.0145]], w=1.2, col=mix("gray", "ink", 0.4), alpha=0.8)
    ang = np.linspace(0, 2 * math.pi, 16, endpoint=False)
    hc = L(0, 0.268)
    s.face([[hc[0] + 0.012 * math.cos(t), hc[1] + 0.012 * math.sin(t), 0.0146] for t in ang], [0, 0, 1], mix("brown", "ink", 0.3), lw=0.8, shade=False, decal=True)
    img, _ = s.render(1024, 1024, S=4, fit=False, scale=1024 / 0.72, center=(0, 0), bg=None, line_w=1.2, grain=0.35, hatch_k=0)
    return img


BUILDERS = {
    "evidence_meeting_minutes": meeting_minutes,
    "evidence_leo_phone_recording": voice_recorder,
    "evidence_security_log": security_log,
}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILDERS):
        save(BUILDERS[n](), OUT + n + ".png")
        print("ok", n, flush=True)
