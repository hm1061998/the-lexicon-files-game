"""Generate the paper UI materials (sheets, torn frame, clip, tape, tab, stamp, keycap, cork).

Pure code: numpy noise with a fixed seed plus Pillow drawing, no image model. Output is
byte-stable on the same library versions.

    python tools/art-codegen/build_ui_materials.py [--check]

`--check` rebuilds into a temp folder and exits 1 when the committed files differ.
"""
import hashlib
import sys
import tempfile
from pathlib import Path
from typing import Literal

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "apps/game-web/public/assets/ui"

SEED = 20261002
SLICES = {"paper_torn_frame": 48, "index_tab_frame": 24, "keycap_plate": 10}

PAPER_FRESH = (0xD8, 0xC5, 0xA4)
PAPER_AGED = (0xCD, 0xBA, 0x97)
INK = (0x3E, 0x34, 0x2B)
CORK = (0xA8, 0x8B, 0x63)


def rng(salt: int) -> np.random.Generator:
    return np.random.default_rng(SEED + salt)


def wrap_blur(a: np.ndarray, radius: int) -> np.ndarray:
    """Box blur with wrap-around, so tiled noise stays seamless."""
    out = a.astype(float)
    for axis in (0, 1):
        acc = np.zeros_like(out)
        for shift in range(-radius, radius + 1):
            acc += np.roll(out, shift, axis=axis)
        out = acc / (2 * radius + 1)
    return out


def tileable_noise(size: int, generator: np.random.Generator) -> np.ndarray:
    """Zero-mean noise in about [-1, 1] mixing fine grain and soft blotches, seamless on both axes."""
    fine = wrap_blur(generator.standard_normal((size, size)), 1)
    mid = wrap_blur(generator.standard_normal((size, size)), 6)
    soft = wrap_blur(generator.standard_normal((size, size)), 24)
    noise = 0.55 * fine / fine.std() + 0.3 * mid / mid.std() + 0.45 * soft / soft.std()
    noise -= noise.mean()
    return noise / (np.abs(noise).max() or 1.0)


def to_image(rgba: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(np.rint(rgba), 0, 255).astype(np.uint8), "RGBA")


def render_paper_sheet(tone: Literal["fresh", "aged"], seed: int) -> Image.Image:
    base = np.array(PAPER_FRESH if tone == "fresh" else PAPER_AGED, float)
    size = 512
    g = rng(seed)
    noise = tileable_noise(size, g)
    # Fibres: short wrapped strokes a little darker or lighter than the sheet.
    fibres = np.zeros((size, size))
    for _ in range(900):
        x, y = g.integers(0, size, 2)
        length = int(g.integers(6, 22))
        dx, dy = g.choice([-1, 0, 1]), g.choice([-1, 0, 1])
        sign = g.choice([-1.0, 1.0])
        for k in range(length):
            fibres[(y + dy * k) % size, (x + dx * k) % size] += sign * 0.35
    shade = noise * (4.5 if tone == "fresh" else 6.0) + fibres * 1.5
    rgb = base[None, None, :] + shade[:, :, None] * np.array([1.0, 0.95, 0.85])
    alpha = np.full((size, size, 1), 255.0)
    return to_image(np.concatenate([rgb, alpha], axis=2))


def torn_edge(length: int, depth: int, g: np.random.Generator) -> np.ndarray:
    """Per-position cut distance (px) in [2, depth-4], jagged with a slow wander."""
    wander = np.cumsum(g.standard_normal(length))
    wander -= np.linspace(wander[0], wander[-1], length)
    wander = wander / (np.abs(wander).max() or 1.0) * (depth * 0.22)
    jag = g.uniform(-1.0, 1.0, length) * (depth * 0.12)
    base = depth * 0.45
    return np.clip(np.rint(base + wander + jag), 2, depth - 4).astype(int)


def render_torn_frame(seed: int) -> Image.Image:
    size = 256
    s = SLICES["paper_torn_frame"]
    g = rng(seed)
    sheet = np.asarray(render_paper_sheet("fresh", seed + 100), float)[:size, :size]
    alpha = np.full((size, size), 255.0)
    bottom = torn_edge(size, s, g)  # cut starts this many px above the bottom edge
    right = torn_edge(size, s, g)
    for x in range(size):
        alpha[size - bottom[x]:, x] = 0
    for y in range(size):
        alpha[y, size - right[y]:] = 0
    # Fibrous fringe: a few semi-transparent pixels along the cut.
    soft = np.asarray(Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), float)
    alpha = np.where((alpha > 0) & (soft < 255), np.maximum(soft, 120), alpha)
    alpha[size - 1, size - 1] = 0
    # Soft inner shade toward the torn sides so the sheet reads as thick paper.
    yy, xx = np.mgrid[0:size, 0:size]
    edge_dist = np.minimum(size - 1 - yy, size - 1 - xx)
    shade = np.clip(1.0 - edge_dist / 28.0, 0, 1) * 10.0
    rgb = sheet[:, :, :3] - shade[:, :, None]
    # Keep the interior fully opaque, including the slice band's inner side.
    out = np.concatenate([rgb, alpha[:, :, None]], axis=2)
    return to_image(out)


def render_paper_clip() -> Image.Image:
    scale = 2
    w, h = 40 * scale, 92 * scale
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = INK + (255,)
    lw = 3 * scale
    # Gem-style clip: nested rounded loops.
    d.rounded_rectangle((6 * scale, 4 * scale, 34 * scale, 86 * scale), radius=14 * scale, outline=ink, width=lw)
    d.rounded_rectangle((12 * scale, 18 * scale, 28 * scale, 74 * scale), radius=8 * scale, outline=ink, width=lw)
    d.line((12 * scale, 18 * scale, 12 * scale, 62 * scale), fill=(0, 0, 0, 0), width=lw)
    d.line((20 * scale, 30 * scale, 20 * scale, 66 * scale), fill=ink, width=lw)
    return img


def render_tape_corner(seed: int) -> Image.Image:
    g = rng(seed)
    w, h = 96, 40
    alpha = np.full((h, w), 150.0)
    # Zig-zag cut on both short ends.
    for y in range(h):
        cut = 4 + (3 if (y // 3) % 2 else 0)
        alpha[y, :cut] = 0
        alpha[y, w - cut:] = 0
    alpha += g.uniform(-14, 14, (h, w))
    alpha[: 2, :] *= 0.7
    rgb = np.empty((h, w, 3))
    rgb[:] = np.array([226, 212, 176], float)
    rgb += g.uniform(-4, 4, (h, w, 1))
    alpha = np.where(alpha < 40, 0, np.clip(alpha, 0, 190))
    return to_image(np.concatenate([rgb, alpha[:, :, None]], axis=2))


def rounded_plate(size: tuple[int, int], radius: int, fill, outline, shadow: int) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    if shadow:
        d.rounded_rectangle((0, shadow, w - 1, h - 1), radius=radius, fill=(42, 37, 33, 70))
    d.rounded_rectangle((0, 0, w - 1, h - 1 - shadow), radius=radius, fill=fill, outline=outline, width=2)
    return img


def render_index_tab_frame(seed: int) -> Image.Image:
    g = rng(seed)
    w, h = 160, 72
    s = SLICES["index_tab_frame"]
    sheet = np.asarray(render_paper_sheet("fresh", seed + 100), float)[:h, :w]
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    # Folder body with a slanted head on the upper-left.
    d.polygon([(0, 14), (s, 14), (s + 10, 2), (w - 40, 2), (w - 28, 14), (w - 2, 14), (w - 2, h - 2), (0, h - 2)], fill=255)
    arr = np.asarray(mask, float)
    rgb = sheet[:, :, :3] + g.uniform(-2, 2, (h, w, 1))
    edge = np.asarray(mask.filter(ImageFilter.MinFilter(3)), float) < 255
    rgb[edge] = np.array(INK, float)
    out = np.concatenate([rgb, arr[:, :, None]], axis=2)
    out[0, 0, 3] = 0
    return to_image(out)


def render_stamp_ring(seed: int) -> Image.Image:
    g = rng(seed)
    size = 192
    yy, xx = np.mgrid[0:size, 0:size]
    cx = cy = (size - 1) / 2
    r = np.hypot(xx - cx, yy - cy)
    theta = np.arctan2(yy - cy, xx - cx)
    # Slightly wobbly radius: low harmonics only.
    wobble = sum(g.uniform(-1.6, 1.6) * np.sin(k * theta + g.uniform(0, 6.28)) for k in (2, 3, 5))
    ring = np.abs(r - (74 + wobble)) < 5.0
    inner = np.abs(r - (64 + wobble * 0.7)) < 1.6
    alpha = np.where(ring | inner, 235.0, 0.0)
    # Ink dropout speckle, strongest in patches.
    patches = wrap_blur(g.standard_normal((size, size)), 5)
    dropout = (patches > 0.04) & (g.random((size, size)) < 0.45)
    alpha[dropout] *= 0.35
    alpha = np.asarray(Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), float)
    rgb = np.zeros((size, size, 3))
    return to_image(np.concatenate([rgb, alpha[:, :, None]], axis=2))


def render_keycap_plate() -> Image.Image:
    return rounded_plate((64, 64), 9, (233, 220, 194, 255), INK + (255,), 3)


def render_cork_board(seed: int) -> Image.Image:
    size = 512
    g = rng(seed)
    noise = tileable_noise(size, g)
    speck = (g.random((size, size)) < 0.04).astype(float)
    speck = wrap_blur(speck, 1) * 5
    shade = noise * 16 - speck * 18
    rgb = np.array(CORK, float)[None, None, :] + shade[:, :, None] * np.array([1.0, 0.9, 0.75])
    alpha = np.full((size, size, 1), 255.0)
    return to_image(np.concatenate([rgb, alpha], axis=2))


def build(out_dir: Path) -> list[Path]:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    images = {
        "paper_sheet_fresh": render_paper_sheet("fresh", 1),
        "paper_sheet_aged": render_paper_sheet("aged", 2),
        "paper_torn_frame": render_torn_frame(3),
        "paper_clip": render_paper_clip(),
        "tape_corner": render_tape_corner(4),
        "index_tab_frame": render_index_tab_frame(5),
        "stamp_ring": render_stamp_ring(6),
        "keycap_plate": render_keycap_plate(),
        "cork_board": render_cork_board(7),
    }
    paths = []
    for name, image in images.items():
        path = out_dir / f"{name}.png"
        image.save(path)
        paths.append(path)
    return paths


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(out_dir: Path = OUT_DIR) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp:
        fresh = build(Path(tmp))
        return [p.name for p in fresh if not (Path(out_dir) / p.name).exists() or digest(p) != digest(Path(out_dir) / p.name)]


def main(argv: list[str]) -> int:
    if "--check" in argv:
        drift = check()
        for name in drift:
            print(f"drift: {name}")
        return 1 if drift else 0
    build(OUT_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
