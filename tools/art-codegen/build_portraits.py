"""Generate NPC portraits for the dialogue band from the character sprites.

Pure code: crop the head and torso from the sprite's alpha bounding box, enlarge it, tint it sepia
and ink the contour so the enlargement does not read as blur. Fixed seed, byte-stable.

    python tools/art-codegen/build_portraits.py

Sources: `assets/_incoming/chr_<npc>_idle_sw.png` when present (512 px, magenta key, kept local),
otherwise the committed 160 px sprites in `apps/game-web/public/assets/characters/<npc>/`.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from build_game_assets import key_magenta

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "apps/game-web/public/assets/portraits"
NPCS = ("anna", "leo", "david")
SIZE = (240, 300)
PAPER = (0xCD, 0xBA, 0x97)
INK = np.array([0x3E, 0x34, 0x2B], float)
SEED = 20261003


def load_sprite(npc: str) -> Image.Image:
    incoming = ROOT / f"assets/_incoming/chr_{npc}_idle_sw.png"
    if incoming.exists():
        return key_magenta(Image.open(incoming).convert("RGB"))
    return Image.open(ROOT / f"apps/game-web/public/assets/characters/{npc}/chr_{npc}_idle_sw.png")


def render_portrait(sprite: Image.Image) -> Image.Image:
    rgba = sprite.convert("RGBA")
    x0, y0, x1, y1 = rgba.split()[-1].getbbox()
    height = y1 - y0
    pad = max(4, int((x1 - x0) * 0.3))
    crop = rgba.crop((max(0, x0 - pad), max(0, y0 - pad // 2), min(rgba.width, x1 + pad), y0 + int(height * 0.55)))
    scale = min(SIZE[0] / crop.width, SIZE[1] / crop.height)
    resized = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)

    rng = np.random.default_rng(SEED)
    paper = np.empty((SIZE[1], SIZE[0], 3), float)
    paper[:] = PAPER
    paper += rng.normal(0, 3.0, (SIZE[1], SIZE[0], 1))
    canvas = Image.fromarray(np.clip(paper, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    left = (SIZE[0] - resized.width) // 2
    canvas.alpha_composite(resized, (left, SIZE[1] - resized.height))

    rgb = np.asarray(canvas.convert("RGB"), float)
    luma = rgb @ np.array([0.299, 0.587, 0.114])
    # Sepia: dark brown shadows to warm paper highlights.
    sepia = np.stack([luma * 1.07, luma * 0.88, luma * 0.66], axis=2)
    # Ink the contour of the figure (Sobel on the figure's alpha, softened).
    alpha = np.zeros(SIZE[::-1], float)
    alpha[SIZE[1] - resized.height:, left:left + resized.width] = np.asarray(resized.split()[-1], float) / 255
    blurred = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)), float) / 255
    gx = np.zeros_like(blurred)
    gy = np.zeros_like(blurred)
    gx[:, 1:-1] = blurred[:, 2:] - blurred[:, :-2]
    gy[1:-1, :] = blurred[2:, :] - blurred[:-2, :]
    edge = np.clip(np.hypot(gx, gy) * 1.6, 0, 1)[:, :, None]
    out = sepia * (1 - edge) + INK * edge
    return Image.fromarray(np.clip(np.rint(out), 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def build(out_dir: Path) -> list[Path]:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for npc in NPCS:
        path = out_dir / f"{npc}.png"
        render_portrait(load_sprite(npc)).save(path)
        paths.append(path)
    return paths


if __name__ == "__main__":
    build(OUT_DIR)
    sys.exit(0)
