"""Wall-mounted arch portal art: a front elevation sheared into the 2:1 dimetric wall plane.

`ne` is a wall running along v (its far end rises to the right), `nw` a wall along u (falls to
the right). Walls on the far side of a room reuse the same drawing flipped in the game.
Drawn at 2x and reduced, so edges stay clean. Seeded, deterministic, no image model.
"""
from typing import Literal

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 2  # supersampling

ARCH_W, ARCH_H = 256, 352
ARCH_BASE = (128, 300)  # base centre of the arch in the final 256x352 image (origin 0.5, 300/352)
OUTER_W, OUTER_R = 128, 64  # outer frame width / top radius
INNER_W, INNER_R = 100, 50
INNER_H = 168  # opening height
OUTER_H = 190

VEIL_W, VEIL_H = 128, 256
VEIL_BASE = (64, 224)
VEIL_FRAMES = 10

INK = (42, 37, 33)
WOOD = (62, 52, 43)
WOOD_LIGHT = (92, 77, 62)
BRASS = (166, 132, 74)
BRASS_LIGHT = (205, 176, 112)
DARK_INTERIOR = (84, 66, 46)

Facing = Literal["ne", "nw"]


def slope(facing: Facing) -> float:
    return -0.5 if facing == "ne" else 0.5


def shear(img: Image.Image, facing: Facing, base_x: float) -> Image.Image:
    """Shear columns vertically: out_y = in_y + slope * (x - base_x), keeping the base centre fixed."""
    k = slope(facing)
    return img.transform(
        img.size,
        Image.AFFINE,
        (1, 0, 0, -k, 1, k * base_x),
        resample=Image.BICUBIC,
    )


def arch_polygon(cx: float, base_y: float, width: float, radius: float, height: float, steps: int = 48):
    """Outline of a rectangle with a semicircular top: bottom-left, up the left side, round top, down."""
    half = width / 2
    centre_y = base_y - height + radius
    pts = [(cx - half, base_y), (cx - half, centre_y)]
    for i in range(steps + 1):
        t = np.pi - np.pi * i / steps
        pts.append((cx + half * np.cos(t), centre_y - radius * np.sin(t)))
    pts.append((cx + half, base_y))
    return pts


def scale_pts(pts, f: int = SS):
    return [(x * f, y * f) for x, y in pts]


def box(x0: float, y0: float, x1: float, y1: float) -> tuple[float, float, float, float]:
    return (x0 * SS, y0 * SS, x1 * SS, y1 * SS)


def render_portal_arch(facing: Facing, seed: int) -> Image.Image:
    g = np.random.default_rng(20261002 + seed)
    w, h = ARCH_W * SS, ARCH_H * SS
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    cx, base = ARCH_BASE

    outer = arch_polygon(cx, base, OUTER_W, OUTER_R, OUTER_H)
    inner = arch_polygon(cx, base, INNER_W, INNER_R, INNER_H)

    # Plinth.
    d.rectangle(box(cx - OUTER_W / 2 - 6, base - 10, cx + OUTER_W / 2 + 6, base), fill=BRASS + (255,))
    # Wooden frame.
    d.polygon(scale_pts(outer), fill=WOOD + (255,), outline=INK + (255,), width=2 * SS)
    # Lighter bevel on the outer top edge.
    d.line(scale_pts(outer[1:-1]), fill=WOOD_LIGHT + (255,), width=2 * SS)
    # Dark interior (the veil sprite is drawn over this).
    d.polygon(scale_pts(inner), fill=DARK_INTERIOR + (255,))
    # Brass inlay band hugging the opening.
    d.line(scale_pts(inner + [inner[0]]), fill=BRASS + (255,), width=3 * SS)
    d.line(scale_pts(inner[1:-1]), fill=BRASS_LIGHT + (255,), width=1 * SS)
    # Keystone.
    ky = base - OUTER_H + 6
    d.polygon(
        scale_pts([(cx - 10, ky), (cx + 10, ky), (cx + 7, ky + 18), (cx - 7, ky + 18)]),
        fill=BRASS + (255,),
        outline=INK + (255,),
    )
    d.line(scale_pts([(cx - 6, ky + 4), (cx + 6, ky + 4)]), fill=BRASS_LIGHT + (255,), width=SS)
    # Rivets down both posts.
    for yy in range(int(base - 150), int(base - 20), 26):
        for sx in (-1, 1):
            px = cx + sx * (INNER_W / 2 + 7)
            d.ellipse(box(px - 2, yy - 2, px + 2, yy + 2), fill=BRASS_LIGHT + (255,))
    # Wood grain.
    alpha = np.asarray(img)[:, :, 3] > 0
    grain = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain, "RGBA")
    for _ in range(140):
        x = int(g.integers(0, w))
        y0 = int(g.integers(0, h))
        gd.line((x, y0, x + int(g.integers(-3, 4)), y0 + int(g.integers(30, 120))), fill=(20, 14, 10, 28), width=1)
    grain_arr = np.asarray(grain).copy()
    grain_arr[~alpha] = 0
    img = Image.alpha_composite(img, Image.fromarray(grain_arr))

    img = shear(img, facing, cx * SS)
    # Soft contact shadow where the plinth meets the floor.
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    k = slope(facing)
    left, right = (cx - 74) * SS, (cx + 74) * SS
    y_l, y_r = (base + 2 + k * (left / SS - cx)) * SS, (base + 2 + k * (right / SS - cx)) * SS
    sd.polygon([(left, y_l), (right, y_r), (right, y_r + 10 * SS), (left, y_l + 10 * SS)], fill=(42, 37, 33, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3 * SS))
    img = Image.alpha_composite(shadow, img)
    return img.resize((ARCH_W, ARCH_H), Image.LANCZOS)


def veil_frame(phase: float, facing: Facing, g_seed: int) -> Image.Image:
    """One warm swirl frame inside the opening; `phase` in [0, 1) loops seamlessly."""
    w, h = VEIL_W * SS, VEIL_H * SS
    cx, base = VEIL_BASE
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    x = xx / SS - cx
    y = yy / SS - (base - INNER_H / 2)  # centre of the opening
    r = np.hypot(x / (INNER_W / 2), y / (INNER_H / 2))
    theta = np.arctan2(y, x)
    angle = 2 * np.pi * phase
    swirl = 0.5 + 0.5 * np.sin(3 * theta + 7.0 * r - angle)
    ripple = 0.5 + 0.5 * np.sin(11.0 * r - 2 * angle + 2 * theta)
    glow = np.clip(1.15 - 0.85 * r, 0, 1)
    intensity = np.clip(0.55 * glow + 0.3 * swirl * (1 - r * 0.6) + 0.15 * ripple * glow, 0, 1)
    warm_dark = np.array([196, 158, 92], float)
    warm_light = np.array([246, 232, 184], float)
    rgb = warm_dark + (warm_light - warm_dark) * intensity[:, :, None]
    # Opacity: solid in the middle, fading a little at the frame so it blends into the brass.
    opacity = np.clip(0.95 - 0.35 * np.clip((r - 0.8) / 0.2, 0, 1), 0, 1)

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).polygon(scale_pts(arch_polygon(cx, base, INNER_W - 4, INNER_R - 2, INNER_H - 2)), fill=255)
    alpha = np.asarray(mask, float) / 255.0 * opacity * 255.0
    img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8), "RGBA")
    img = shear(img, facing, cx * SS)
    return img.resize((VEIL_W, VEIL_H), Image.LANCZOS)


def render_portal_veil(facing: Facing, seed: int) -> Image.Image:
    sheet = Image.new("RGBA", (VEIL_W * VEIL_FRAMES, VEIL_H), (0, 0, 0, 0))
    for i in range(VEIL_FRAMES):
        sheet.paste(veil_frame(i / VEIL_FRAMES, facing, seed), (i * VEIL_W, 0))
    return sheet
