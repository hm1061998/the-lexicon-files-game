"""Convert a hand-made/AI walk sheet (8 columns x 4 rows NE,SE,SW,NW, flat #FF00FF background)
into the game contract chr_<name>_walk.png: 1280x640, 160 px cells, RGBA.

usage (venv python): python tools/art-codegen/slice_walk_sheet.py sheet.png <name>
  -> apps/game-web/public/assets/characters/<name>/chr_<name>_walk.png

One scale for the whole sheet (tallest figure -> FIGURE_HEIGHT px, like the idle stills); each
cell keeps its horizontal layout around the cell centre; per row, the lowest foot of the 8
frames lands on the 88% line so lifted frames stay lifted.
"""
import sys

import numpy as np
from PIL import Image

from build_game_assets import key_magenta
from make_walk_frames import CELL, FRAMES, despill, sheet_path

ROWS = 4
FIGURE_HEIGHT = 100  # px, matches the idle stills (figure ~100 px in a 160 px frame)
FEET_ROW = round(0.88 * CELL)  # 141: first row below the soles
ALPHA_MIN = 8


def _bbox(a: np.ndarray):
    ys, xs = np.nonzero(a > ALPHA_MIN)
    return (int(ys.min()), int(ys.max())) if len(ys) else None


def slice_sheet(img: Image.Image) -> Image.Image:
    if img.width % FRAMES or img.height % ROWS:
        raise ValueError(f"sheet {img.size} is not an {FRAMES}x{ROWS} grid of equal cells")
    cw, ch = img.width // FRAMES, img.height // ROWS
    keyed = key_magenta(img)
    alpha = np.asarray(keyed)[..., 3]
    boxes = [  # source bboxes, only for the common scale
        [_bbox(alpha[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]) for c in range(FRAMES)]
        for r in range(ROWS)
    ]
    heights = [b[1] - b[0] + 1 for row in boxes for b in row if b]
    if not heights:
        raise ValueError("sheet has no figure on the magenta background")
    scale = FIGURE_HEIGHT / max(heights)
    out = Image.new("RGBA", (CELL * FRAMES, CELL * ROWS), (0, 0, 0, 0))
    sw, sh = max(1, round(cw * scale)), max(1, round(ch * scale))
    for r in range(ROWS):
        cells = [
            keyed.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            .convert("RGBa")
            .resize((sw, sh), Image.LANCZOS)
            .convert("RGBA")
            for c in range(FRAMES)
        ]
        bottoms = [b[1] for b in (_bbox(np.asarray(cell)[..., 3]) for cell in cells) if b]
        if not bottoms:
            raise ValueError(f"row {r} is empty")
        # Lowest sole of the row goes to the last row above FEET_ROW.
        dy = (FEET_ROW - 1) - max(bottoms)
        for c, cell in enumerate(cells):
            frame = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
            frame.paste(cell, (CELL // 2 - sw // 2, dy), cell)
            out.paste(Image.fromarray(despill(np.asarray(frame))), (c * CELL, r * CELL))
    return out


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: slice_walk_sheet.py sheet.png <name>", file=sys.stderr)
        return 2
    sheet = slice_sheet(Image.open(argv[0]))
    dest = sheet_path(argv[1])
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, optimize=True)
    print(f"{dest} {sheet.width}x{sheet.height}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
