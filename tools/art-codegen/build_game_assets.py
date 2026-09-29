"""Build game-ready PNG assets from assets/_incoming according to assets_config.json.

usage (from repo root): python tools/art-codegen/build_game_assets.py
Dev-only tool (numpy + Pillow); not part of npm build/lint.

Config entry: {src, dest, targetWidth|null, keyMagenta, frame|null, quantize?, note?}
- keyMagenta: soft-key #FF00FF background to alpha, despill edges.
- frame: square character frame (feet on 88% line, kept from source frame layout).
- targetWidth: crop to alpha bbox first (bottom-anchored props), then resize to width.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT_ROOT = ROOT / "apps" / "game-web" / "public" / "assets"
LO, HI = 60.0, 170.0  # RGB distance to magenta: <=LO transparent, >=HI opaque


def key_magenta(img: Image.Image) -> Image.Image:
    """Soft chroma key against #FF00FF with unmix + despill. Returns RGBA."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    mg = np.array([255, 0, 255], np.float32)
    dist = np.sqrt(((rgb - mg) ** 2).sum(-1))
    a = np.clip((dist - LO) / (HI - LO), 0.0, 1.0)
    out = rgb.copy()
    edge = (a > 0) & (a < 1)
    # unmix the magenta contribution from partially covered pixels
    aa = a[edge][:, None]
    out[edge] = (rgb[edge] - (1 - aa) * mg) / np.maximum(aa, 1e-3)
    out = np.clip(out, 0, 255)
    # despill: R/B may not exceed G by more than 20 on non-opaque pixels
    g = out[..., 1]
    near = a < 1
    for c in (0, 2):
        ch = out[..., c]
        ch[near] = np.minimum(ch[near], g[near] + 20)
    a8 = np.round(a * 255).astype(np.uint8)
    rgba = np.dstack([np.round(out).astype(np.uint8), a8])
    rgba[a8 == 0, :3] = 0
    return Image.fromarray(rgba, "RGBA")


def alpha_bbox(img: Image.Image, thr: int = 8):
    return img.getchannel("A").point(lambda v: 255 if v > thr else 0).getbbox()


def fit_width(img: Image.Image, w: int) -> Image.Image:
    h = max(1, round(img.height * w / img.width))
    return img.resize((w, h), Image.LANCZOS)


def frame_character(img: Image.Image, frame: int = 160) -> Image.Image:
    """Downscale a square keyed frame to `frame` px; layout (feet at 88%) is preserved."""
    if img.width != img.height:
        raise ValueError("character frame must be square")
    return img.resize((frame, frame), Image.LANCZOS)


def process(entry: dict) -> Image.Image:
    img = Image.open(ROOT / entry["src"])
    if entry.get("keyMagenta"):
        img = key_magenta(img)
    else:
        img = img.convert("RGBA")
    if entry.get("frame"):
        img = frame_character(img, entry["frame"])
    elif entry.get("targetWidth"):
        if entry.get("keyMagenta"):
            box = alpha_bbox(img)
            if box:
                img = img.crop(box)
        img = fit_width(img, entry["targetWidth"])
    if entry.get("quantize"):
        a = img.getchannel("A")
        q = img.convert("RGB").quantize(entry["quantize"], method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        img = q.convert("RGB").convert("RGBA")
        img.putalpha(a)
    return img


def main() -> int:
    cfg = json.loads((Path(__file__).parent / "assets_config.json").read_text(encoding="utf-8"))
    print(f"{'file':60} {'size':>10} {'alpha bbox':>22} {'KB':>7}")
    for e in cfg:
        if "src" not in e:
            continue
        img = process(e)
        dest = OUT_ROOT / e["dest"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, optimize=True)
        print(f"{e['dest']:60} {img.width}x{img.height:<5} {str(alpha_bbox(img)):>22} {dest.stat().st_size // 1024:>7}")
    total = sum(p.stat().st_size for p in OUT_ROOT.rglob("*.png"))
    print(f"total public/assets png: {total / 1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
