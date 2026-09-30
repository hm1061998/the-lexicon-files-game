"""lexicon_isometric_v1 — tiny code renderer.

Orthographic iso camera (yaw 45°, pitch 35°), top-down or front-elevation camera, z-buffer
rasterisation at 4x supersampling, ink outlines detected from face-id
boundaries, soft pencil hatching on shadowed faces, light paper grain.
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HEX = {
    "cream": "#D8C5A4", "beige": "#CDBA97", "gray": "#A89B87", "brown": "#3E342B",
    "ink": "#2A2521", "green": "#737660", "olive": "#8A8469",
    "red": "#A4412D", "dred": "#743026",
}
C = {k: np.array([int(v[i:i + 2], 16) for i in (1, 3, 5)], float) for k, v in HEX.items()}
MAGENTA = np.array([255, 0, 255], float)


def mix(a, b, t):
    a = C[a] if isinstance(a, str) else np.asarray(a, float)
    b = C[b] if isinstance(b, str) else np.asarray(b, float)
    return a * (1 - t) + b * t


# common materials (all derived from the locked palette)
M = {
    "wood": mix("brown", "beige", 0.30),
    "wood_lt": mix("brown", "beige", 0.46),
    "metal": C["gray"],
    "metal_dk": mix("gray", "brown", 0.35),
    "paper": mix("cream", [240, 232, 214], 0.55),
    "paper2": mix("cream", [240, 232, 214], 0.35),
    "screen": mix("ink", "green", 0.18),
    "plaster": mix("cream", [238, 228, 208], 0.35),
    "cardboard": mix("beige", "brown", 0.28),
    "fabric": mix("brown", "ink", 0.15),
    "ceramic": C["green"],
    "leaf": C["olive"],
    "glass": mix("cream", "gray", 0.25),
    "ink": C["ink"],
    "red": C["red"],
}

PHI = math.radians(35)
SQ = 1 / math.sqrt(2)


class Cam:
    def __init__(self, mode="iso"):
        self.mode = mode
        if mode in ("iso", "dimetric"):
            angle = math.radians(30) if mode == "dimetric" else PHI
            s, c = math.sin(angle), math.cos(angle)
            self.r = np.array([SQ, -SQ, 0])
            self.d = np.array([s * SQ, s * SQ, -c])
            self.c = np.array([c * SQ, c * SQ, s])
            l = -0.62 * self.r - 0.5 * self.d + 0.6 * self.c
        elif mode == "front":
            # straight elevation seen from +y, pitched down slightly so shelf tops read;
            # horizontal world lines stay horizontal on screen (no iso diagonal)
            p = math.radians(12)
            self.r = np.array([1., 0, 0])
            self.d = np.array([0, math.sin(p), -math.cos(p)])
            self.c = np.array([0, math.cos(p), math.sin(p)])
            l = np.array([-0.35, 0.8, 0.5])
        elif mode == "oblique":
            # the game's own 2D projection: floor y maps 1:1 to screen y and height rises
            # straight up (screen_y = y - z), so wall caps match their collision footprints
            self.r = np.array([1., 0, 0])
            self.d = np.array([0, 1., -1.])
            self.c = np.array([0, 0.6, 0.8])
            l = np.array([-0.35, 0.75, 0.55])
        else:
            self.r = np.array([1., 0, 0])
            self.d = np.array([0, -1., 0])
            self.c = np.array([0, 0, 1.])
            l = np.array([-0.45, 0.5, 1.0])
        self.l = l / np.linalg.norm(l)

    def proj(self, P):
        P = np.atleast_2d(P)
        return np.stack([P @ self.r, P @ self.d, P @ self.c], 1)


class Scene:
    def __init__(self, cam="iso"):
        self.cam = Cam(cam)
        self.faces = []      # dict(v, n, col, lw, smooth, decal, alpha, two)
        self.strokes = []    # dict(pts, w, col, alpha)
        self._gid = 1

    def gid(self):
        self._gid += 1
        return self._gid

    # ---------- primitives ----------
    def face(self, v, n, col, lw=1.0, group=None, decal=False, alpha=1.0, two=False, shade=True, hatch=True):
        v = np.asarray(v, float)
        n = np.asarray(n, float)
        n = n / (np.linalg.norm(n) + 1e-12)
        self.faces.append(dict(v=v, n=n, col=(C[col] if isinstance(col, str) else np.asarray(col, float)), lw=lw,
                               g=group if group is not None else self.gid(),
                               decal=decal, alpha=alpha, two=two, shade=shade, hatch=hatch))

    def box(self, x, y, z, sx, sy, sz, col, lw=1.0, top=None, sides=None, rot=0.0, pivot=None):
        """axis-aligned box (optionally rotated about z around pivot)."""
        x1, y1, z1 = x + sx, y + sy, z + sz
        V = lambda *p: np.array(p, float)
        fs = [
            ([V(x, y, z1), V(x1, y, z1), V(x1, y1, z1), V(x, y1, z1)], V(0, 0, 1), top),
            ([V(x1, y, z), V(x1, y1, z), V(x1, y1, z1), V(x1, y, z1)], V(1, 0, 0), sides),
            ([V(x, y1, z), V(x1, y1, z), V(x1, y1, z1), V(x, y1, z1)], V(0, 1, 0), sides),
            ([V(x, y, z), V(x, y1, z), V(x, y1, z1), V(x, y, z1)], V(-1, 0, 0), sides),
            ([V(x, y, z), V(x1, y, z), V(x1, y, z1), V(x, y, z1)], V(0, -1, 0), sides),
            ([V(x, y, z), V(x1, y, z), V(x1, y1, z), V(x, y1, z)], V(0, 0, -1), sides),
        ]
        start = len(self.faces)
        for v, n, cc in fs:
            self.face(v, n, col if cc is None else cc, lw)
        if rot:
            self.rotate(start, rot, pivot if pivot is not None else (x + sx / 2, y + sy / 2))

    def cyl(self, cx, cy, z, r, h, col, n=28, r2=None, lw=1.0, top=None, rx=None, ry=None, cap=True):
        r2 = r if r2 is None else r2
        rx = rx or 1.0
        ry = ry or 1.0
        g = self.gid()
        a = np.linspace(0, 2 * math.pi, n + 1)
        for i in range(n):
            a0, a1 = a[i], a[i + 1]
            p = lambda aa, rr, zz: [cx + rr * rx * math.cos(aa), cy + rr * ry * math.sin(aa), zz]
            v = [p(a0, r, z), p(a1, r, z), p(a1, r2, z + h), p(a0, r2, z + h)]
            am = (a0 + a1) / 2
            nz = (r - r2) / max(h, 1e-6)
            self.face(v, [math.cos(am) / rx, math.sin(am) / ry, nz], col, lw, group=g)
        if cap:
            v = [[cx + r2 * rx * math.cos(t), cy + r2 * ry * math.sin(t), z + h] for t in a[:-1]]
            self.face(v, [0, 0, 1], col if top is None else top, lw)

    def disc(self, cx, cy, z, r, col, n=28, rx=1, ry=1, decal=True, alpha=1.0, ring=None, lw=0):
        a = np.linspace(0, 2 * math.pi, n, endpoint=False)
        if ring is None:
            v = [[cx + r * rx * math.cos(t), cy + r * ry * math.sin(t), z] for t in a]
            self.face(v, [0, 0, 1], col, lw=lw, decal=decal, alpha=alpha)
        else:  # annulus as quads
            for i in range(n):
                t0, t1 = a[i], a[(i + 1) % n]
                v = [[cx + r * math.cos(t0), cy + r * math.sin(t0), z], [cx + r * math.cos(t1), cy + r * math.sin(t1), z],
                     [cx + ring * math.cos(t1), cy + ring * math.sin(t1), z], [cx + ring * math.cos(t0), cy + ring * math.sin(t0), z]]
                self.face(v, [0, 0, 1], col, lw=0, decal=True, alpha=alpha)

    def quad(self, pts, col, n=None, **kw):
        pts = np.asarray(pts, float)
        if n is None:
            n = np.cross(pts[1] - pts[0], pts[2] - pts[0])
        self.face(pts, n, col, **kw)

    def stroke(self, pts, w=1.0, col=None, alpha=0.9):
        self.strokes.append(dict(pts=np.asarray(pts, float), w=w, col=C["ink"] if col is None else np.asarray(col, float), alpha=alpha))

    def rotate(self, start, ang, pivot):
        ca, sa = math.cos(ang), math.sin(ang)
        R = np.array([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]])
        p = np.array([pivot[0], pivot[1], 0])
        for f in self.faces[start:]:
            f["v"] = (f["v"] - p) @ R.T + p
            f["n"] = f["n"] @ R.T

    # ---------- render ----------
    def render(self, W, H, S=4, fit=True, margin=0.08, scale=None, center=None, bg="magenta",
               line_w=1.25, sil_w=2.0, faint_alpha=0.35, grain=0.35, wobble=1.0, hatch_k=0.16, seed=7,
               feet_anchor=None):
        rng = np.random.default_rng(seed)
        cam = self.cam
        faces = [f for f in self.faces if f["two"] or f["decal"] or (f["n"] @ cam.c) > 1e-6]
        allp = np.concatenate([cam.proj(f["v"]) for f in faces] + [cam.proj(s["pts"]) for s in self.strokes] if self.strokes else [cam.proj(f["v"]) for f in faces])
        mn, mx = allp[:, :2].min(0), allp[:, :2].max(0)
        WW, HH = W * S, H * S
        if fit:
            sc = min(W * (1 - 2 * margin) / (mx[0] - mn[0]), H * (1 - 2 * margin) / (mx[1] - mn[1]))
            ctr = (mn + mx) / 2
        else:
            sc, ctr = scale, np.asarray(center, float)
        sc_s = sc * S
        off = np.array([WW / 2, HH / 2]) - ctr * sc_s
        if feet_anchor is not None:   # put world point on a fixed pixel
            wp, pix = feet_anchor
            pp = cam.proj(np.array(wp, float))[0, :2]
            off = np.array(pix, float) * S - pp * sc_s
        self.px_per_unit = sc

        zb = np.full((HH, WW), -1e9)
        idb = np.zeros((HH, WW), np.int32)
        lwb = {}
        rgb = np.zeros((HH, WW, 3))
        hat = np.zeros((HH, WW))
        shadeless = np.zeros((HH, WW), bool)

        # draw solid faces first, decals afterwards (ordered by list)
        order = [f for f in faces if not f["decal"]] + [f for f in faces if f["decal"]]
        for f in order:
            P = cam.proj(f["v"])
            XY = P[:, :2] * sc_s + off
            x0, y0 = np.floor(XY.min(0)).astype(int)
            x1, y1 = np.ceil(XY.max(0)).astype(int) + 1
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, WW), min(y1, HH)
            if x1 <= x0 or y1 <= y0:
                continue
            m = Image.new("L", (x1 - x0, y1 - y0), 0)
            ImageDraw.Draw(m).polygon([tuple(p - [x0, y0]) for p in XY], fill=255)
            mask = np.asarray(m) > 127
            if not mask.any():
                continue
            # depth plane
            A = np.c_[XY, np.ones(len(XY))]
            coef, *_ = np.linalg.lstsq(A, P[:, 2], rcond=None)
            yy, xx = np.nonzero(mask)
            gx, gy = xx + x0, yy + y0
            dep = coef[0] * (gx + 0.5) + coef[1] * (gy + 0.5) + coef[2]
            # shading
            n = f["n"]
            if f["two"] and n @ cam.c < 0:
                n = -n
            t = max(0.0, float(n @ cam.l)) if f["shade"] else 0.75
            col = f["col"]
            if t > 0.6:
                c2 = mix(col, "cream", (t - 0.6) * 0.8)
            else:
                c2 = mix(col, "ink", (0.6 - t) * 0.55)
            h = np.clip((0.62 - t) * 1.6, 0, 1) if f["hatch"] else 0
            if f["decal"]:
                ok = dep >= zb[gy, gx] - 0.002
                gx, gy = gx[ok], gy[ok]
                a = f["alpha"]
                rgb[gy, gx] = rgb[gy, gx] * (1 - a) + c2 * a
                if f["lw"] > 0:
                    idb[gy, gx] = f["g"]
                    lwb[f["g"]] = f["lw"]
                continue
            ok = dep > zb[gy, gx]
            gx, gy = gx[ok], gy[ok]
            zb[gy, gx] = dep[ok]
            idb[gy, gx] = f["g"]
            lwb[f["g"]] = f["lw"]
            rgb[gy, gx] = c2
            hat[gy, gx] = h

        obj = idb > 0
        # ---- strokes (details, drawn on top, clipped to object) ----
        for st in self.strokes:
            P = cam.proj(st["pts"])
            XY = P[:, :2] * sc_s + off
            wpx = max(1, int(round(st["w"] * S)))
            x0, y0 = np.floor(XY.min(0)).astype(int) - wpx - 1
            x1, y1 = np.ceil(XY.max(0)).astype(int) + wpx + 2
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, WW), min(y1, HH)
            if x1 <= x0 or y1 <= y0:
                continue
            m = Image.new("L", (x1 - x0, y1 - y0), 0)
            ImageDraw.Draw(m).line([tuple(p - [x0, y0]) for p in XY], fill=255, width=wpx, joint="curve")
            a = np.asarray(m, float) / 255
            sdep = P[:, 2].max()
            vis = (zb[y0:y1, x0:x1] <= sdep + 0.003) & obj[y0:y1, x0:x1]
            a = (a * vis * st["alpha"])[..., None]
            rgb[y0:y1, x0:x1] = rgb[y0:y1, x0:x1] * (1 - a) + st["col"] * a

        # ---- pencil hatching ----
        yy, xx = np.mgrid[0:HH, 0:WW]
        per = 5.5 * S
        stripes = (np.sin(2 * math.pi * (xx + yy) / per) > 0.35).astype(float)
        brk = ndi.gaussian_filter(rng.random((HH // 8 + 1, WW // 8 + 1)), 1.2)
        brk = np.kron(brk, np.ones((8, 8)))[:HH, :WW]
        brk = (brk - brk.min()) / (np.ptp(brk) + 1e-9)
        stripes = ndi.gaussian_filter(stripes * (brk > 0.35), 0.8 * S / 4 + 0.5)
        rgb = rgb * (1 - hatch_k * hat[..., None] * stripes[..., None])
        # soft mottled pencil on everything
        mott = ndi.gaussian_filter(rng.standard_normal((HH // 4 + 1, WW // 4 + 1)), 2.0)
        mott = np.kron(mott / (mott.std() + 1e-9), np.ones((4, 4)))[:HH, :WW]
        rgb = rgb * (1 + 0.018 * mott[..., None])

        # ---- ink lines from id boundaries ----
        lwarr = np.zeros(max(list(lwb) + [int(idb.max())]) + 1)
        for g, w in lwb.items():
            lwarr[g] = w
        W0 = lwarr[idb]
        bx = (idb[:, 1:] != idb[:, :-1]) & obj[:, 1:] & obj[:, :-1]
        by = (idb[1:, :] != idb[:-1, :]) & obj[1:, :] & obj[:-1, :]
        wx = np.maximum(W0[:, 1:], W0[:, :-1]) * bx
        wy = np.maximum(W0[1:, :], W0[:-1, :]) * by
        wmap = np.zeros((HH, WW))
        wmap[:, 1:] = np.maximum(wmap[:, 1:], wx)
        wmap[1:, :] = np.maximum(wmap[1:, :], wy)
        lines = np.zeros((HH, WW))
        # varying pressure
        pres = ndi.gaussian_filter(rng.standard_normal((HH // 16 + 1, WW // 16 + 1)), 1.5)
        pres = np.kron(pres / (pres.std() + 1e-9), np.ones((16, 16)))[:HH, :WW]
        pres = np.clip(0.85 + 0.15 * pres, 0.6, 1.1)
        wmap = np.round(wmap, 1)
        for lvl in sorted(set(wmap[wmap > 0].tolist())):
            b = wmap == lvl
            d = ndi.distance_transform_edt(~b)
            ww = line_w * S * 0.5 * max(lvl, 0.35) * pres
            alpha = 1.0 if lvl >= 0.6 else faint_alpha
            lines = np.maximum(lines, np.clip(ww - d + 0.5, 0, 1) * alpha)
        # silhouette
        if bg is not None:
            din = ndi.distance_transform_edt(obj)
            dout = ndi.distance_transform_edt(~obj)
            sw = sil_w * S * 0.5 * pres
            sil = np.clip(sw - np.where(obj, din, dout) + 0.5, 0, 1) * (np.where(obj, din, dout) < sw + 1)
            lines = np.maximum(lines, sil)
        # wobble
        if wobble:
            dxf = ndi.gaussian_filter(rng.standard_normal((HH // 16 + 1, WW // 16 + 1)), 4.0)
            dyf = ndi.gaussian_filter(rng.standard_normal((HH // 16 + 1, WW // 16 + 1)), 4.0)
            dxf = ndi.zoom(dxf / (dxf.std() + 1e-9), 16, order=1)[:HH, :WW]
            dyf = ndi.zoom(dyf / (dyf.std() + 1e-9), 16, order=1)[:HH, :WW]
            amp = wobble * 0.4 * S
            lines = ndi.map_coordinates(lines, [yy + dyf * amp, xx + dxf * amp], order=1, mode="constant")

        alpha_obj = np.maximum(obj.astype(float), lines if bg is not None else 0)
        ink = C["ink"]
        col = rgb * (1 - lines[..., None]) + ink * lines[..., None]
        if bg == "alpha":
            # Coverage already lives in alpha: exterior ink must not be multiplied twice.
            col[~obj] = ink
        # premultiplied downsample
        pm = col * alpha_obj[..., None]
        pm = pm.reshape(H, S, W, S, 3).mean((1, 3))
        al = alpha_obj.reshape(H, S, W, S).mean((1, 3))
        out = pm / np.maximum(al[..., None], 1e-6)
        # grain
        tex = np.asarray(Image.open(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "textures", "paper_grain_cream_tile_1024.png")).convert("L"), float)
        tex = np.tile(tex, (H // tex.shape[0] + 1, W // tex.shape[1] + 1))[:H, :W]
        tex = tex / tex.mean() - 1
        out = out * (1 + grain * tex[..., None])
        out = np.clip(out, 0, 255)
        if bg == "magenta":
            keep = al >= 0.5
            out = np.where(keep[..., None], out, MAGENTA)
        elif bg == "alpha":
            # straight RGBA: ink silhouette included, nothing rendered stays fully transparent
            rgba = np.dstack([np.round(out), np.round(np.clip(al, 0, 1) * 255)]).astype(np.uint8)
            rgba[rgba[..., 3] == 0, :3] = 0
            return Image.fromarray(rgba, "RGBA"), al
        elif bg is None:
            pass
        return Image.fromarray(np.round(out).astype(np.uint8)), al


def rod(sc, p0, p1, w, col, lw=1.0, wz=None):
    """square-section bar between two points."""
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    a = p1 - p0
    a /= np.linalg.norm(a)
    up = np.array([0, 0, 1.]) if abs(a[2]) < 0.9 else np.array([1., 0, 0])
    u = np.cross(a, up); u /= np.linalg.norm(u)
    v = np.cross(u, a)
    h = w / 2
    hv = (wz or w) / 2
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    ring = lambda p: [p + u * h * i + v * hv * j for i, j in corners]
    r0, r1 = ring(p0), ring(p1)
    for k in range(4):
        q = [r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k]]
        mid = sum(q) / 4 - (p0 + p1) / 2
        sc.face(q, mid, col, lw)
    sc.face(r1, a, col, lw)
    sc.face(r0, -a, col, lw)


def save(img, path):
    img.save(path, optimize=True)
    return path
