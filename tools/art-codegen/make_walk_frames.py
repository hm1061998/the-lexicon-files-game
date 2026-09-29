"""Procedural walk sheets from the 4 idle stills of a character (stand-in until real art).

usage (venv python): python tools/art-codegen/make_walk_frames.py <name>|--all [--preview DIR]

Reads apps/game-web/public/assets/characters/<name>/chr_<name>_idle_<ne|se|sw|nw>.png and
writes chr_<name>_walk.png next to them: 8 columns x 4 rows (NE, SE, SW, NW), 160 px cells,
feet on the 88% line, RGBA. Real sheets follow the same contract (see slice_walk_sheet.py).

Deformation, per frame k (phi = 2*pi*k/8), all nearest-neighbour so no new colours appear:
- the silhouette is split at the crotch row (first row at/below the hip line, ~58% of the
  figure, where the legs are separated by a gap); below it every pixel belongs to the left or
  right leg (cut at the widest gap of each row, nearest leg elsewhere);
- legs swing horizontally +-stride*sin(phi) in anti-phase and the stepping leg lifts by
  lift*max(0, sin(phi)); the displacement ramps in from the crotch so nothing tears;
- the torso dips bob*|sin(phi)| (lowest at full stride), tilts +-tilt degrees about the hip
  and the shoulder band counter-swings +-shoulder px; the dip fades out towards the feet so
  the feet never sink below the 88% line;
- a foot that already rests on the floor line lifts at most `ground_lift` so the frame keeps
  its ground contact.
"""
import math
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
CHAR_ROOT = ROOT / "apps" / "game-web" / "public" / "assets" / "characters"
NAMES = ["player", "leo", "anna", "david"]
DIRS = ["ne", "se", "sw", "nw"]  # sheet row order
CELL = 160
FRAMES = 8


@dataclass(frozen=True)
class Params:
    stride: float = 5.0  # px, horizontal leg swing amplitude
    lift: float = 3.0  # px, max lift of the stepping foot
    ground_lift: float = 1.0  # px, max lift of a foot resting on the floor line
    bob: float = 2.0  # px, torso dip at full stride
    tilt: float = 1.5  # degrees, torso lean about the hip
    shoulder: float = 1.0  # px, shoulder counter-swing
    ramp: float = 10.0  # rows over which the leg motion fades in below the crotch


# Back-facing views (NE/NW) show the legs from behind; the same motion reads well there, so
# the defaults hold for every direction. Tune per direction here if a view needs it.
DIRECTION_PARAMS: dict[str, Params] = {d: Params() for d in DIRS}


def params_for(direction: str) -> Params:
    return DIRECTION_PARAMS[direction]


@dataclass(frozen=True)
class Analysis:
    top: int
    bottom: int  # last opaque row
    split_y: int  # first leg row
    hip_x: float
    labels: np.ndarray  # 0 transparent, 1 upper body, 2 left leg, 3 right leg
    front_leg: int  # label drawn on top when the legs overlap
    grounded: frozenset  # leg labels whose foot rests on the floor line


def idle_path(name: str, direction: str) -> Path:
    return CHAR_ROOT / name / f"chr_{name}_idle_{direction}.png"


def sheet_path(name: str) -> Path:
    return CHAR_ROOT / name / f"chr_{name}_walk.png"


def load_idle(name: str, direction: str) -> Image.Image:
    img = Image.open(idle_path(name, direction)).convert("RGBA")
    if img.size != (CELL, CELL):
        raise ValueError(f"{idle_path(name, direction)}: expected {CELL}x{CELL}, got {img.size}")
    return img


def despill(px: np.ndarray) -> np.ndarray:
    """Clamp R/B to G+20 on translucent pixels (magenta fringe left by the key); zero RGB at a=0."""
    out = px.copy()
    a = out[..., 3]
    semi = (a > 0) & (a < 255)
    g = out[..., 1].astype(int)
    for c in (0, 2):
        ch = out[..., c].astype(int)
        ch[semi] = np.minimum(ch[semi], g[semi] + 20)
        out[..., c] = ch.astype(np.uint8)
    out[a == 0, :3] = 0
    return out


def _runs(row: np.ndarray):
    xs = np.nonzero(row)[0]
    if len(xs) == 0:
        return []
    cuts = np.nonzero(np.diff(xs) > 1)[0]
    starts = np.concatenate([[xs[0]], xs[cuts + 1]])
    ends = np.concatenate([xs[cuts], [xs[-1]]])
    return list(zip(starts.tolist(), ends.tolist()))


def _propagate_rows(seed: np.ndarray, mask: np.ndarray, start: int) -> np.ndarray:
    """Top-down labelling that follows the legs: an unlabelled pixel inherits the label right
    above it, then spreads sideways within its row segment. Keeps a boot with its own shin
    where both boots touch (a plain nearest-seed fill would hand it to the other leg)."""
    leg = np.where(mask, seed, 0).astype(np.uint8)
    for y in range(start, CELL):
        row = leg[y]
        if y > start:
            inherit = mask[y] & (row == 0) & (leg[y - 1] > 0)
            row[inherit] = leg[y - 1][inherit]
        for x0, x1 in _runs(mask[y]):
            seg = row[x0:x1 + 1]
            known = np.nonzero(seg)[0]
            if len(known) == 0 or len(known) == len(seg):
                continue
            idx = np.arange(len(seg))
            nearest = known[np.abs(idx[:, None] - known[None, :]).argmin(1)]
            seg[:] = seg[nearest]
    return leg


def analyze(img: Image.Image) -> Analysis:
    px = np.asarray(img)
    alpha = px[..., 3]
    solid = alpha > 100
    ys = np.nonzero(alpha > 8)[0]
    top, bottom = int(ys.min()), int(ys.max())
    hip = top + round(0.58 * (bottom - top + 1))
    runs = [_runs(solid[y]) for y in range(CELL)]
    split_y = None
    for y in range(hip, bottom - 8):
        if all(len(runs[yy]) == 2 for yy in range(y, y + 6)):
            split_y = y
            break
    if split_y is None:  # legs never separate: fall back to the hip line
        split_y = hip
    labels = np.zeros((CELL, CELL), np.uint8)
    labels[alpha > 0] = 1
    leg_seed = np.zeros((CELL, CELL), np.uint8)
    for y in range(split_y, CELL):
        r = runs[y]
        if len(r) < 2:
            break  # seed only the separated band; _propagate_rows follows the legs below it
        gaps = [(r[i + 1][0] - r[i][1], i) for i in range(len(r) - 1)]
        _, i = max(gaps)
        cut = (r[i][1] + r[i + 1][0]) / 2
        row = solid[y]
        xs = np.arange(CELL)
        leg_seed[y, row & (xs < cut)] = 2
        leg_seed[y, row & (xs > cut)] = 3
    if not leg_seed.any():  # single mass: split at the middle column
        cx = int(np.nonzero(solid[split_y:].any(0))[0].mean())
        region = np.zeros_like(solid)
        region[split_y:] = solid[split_y:]
        leg_seed[region & (np.arange(CELL)[None, :] < cx)] = 2
        leg_seed[region & (np.arange(CELL)[None, :] >= cx)] = 3
    lower = np.zeros_like(solid)
    lower[split_y:] = alpha[split_y:] > 0
    leg = _propagate_rows(leg_seed, lower, split_y)
    # Pixels still unreached (islands) take the nearest leg.
    _, (iy, ix) = ndi.distance_transform_edt(leg == 0, return_indices=True)
    leg = np.where(leg == 0, leg[iy, ix], leg)
    labels[lower] = leg[lower]
    cols = np.nonzero(solid[split_y:split_y + 4].any(0))[0]
    hip_x = float(cols.mean()) if len(cols) else CELL / 2
    feet = {}
    for leg in (2, 3):
        lys = np.nonzero((labels == leg) & (alpha > 8))[0]
        feet[leg] = int(lys.max()) if len(lys) else -1
    front = 2 if feet[2] >= feet[3] else 3  # the lower foot is nearer the camera
    grounded = frozenset(leg for leg in (2, 3) if feet[leg] >= bottom - 1)
    return Analysis(top, bottom, split_y, hip_x, labels, front, grounded)


def _smoothstep(t: np.ndarray) -> np.ndarray:
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def make_frame(img: Image.Image, info: Analysis, k: int, p: Params) -> Image.Image:
    src = despill(np.asarray(img))
    phi = 2 * math.pi * k / FRAMES
    s = math.sin(phi)
    yy, xx = np.mgrid[0:CELL, 0:CELL].astype(np.float32)
    # Leg weight: 0 above the crotch, 1 from `ramp` rows below it.
    wl = _smoothstep((yy - info.split_y) / p.ramp)
    # Torso fields (evaluated at output coordinates; displacements are small).
    theta = math.radians(p.tilt * s)
    rx, ry = xx - info.hip_x, yy - info.split_y
    rot_dx = rx * (math.cos(theta) - 1) - ry * math.sin(theta)
    rot_dy = rx * math.sin(theta) + ry * (math.cos(theta) - 1)
    fig_h = info.bottom - info.top + 1
    sh_c = info.top + 0.25 * fig_h
    sh_w = np.exp(-(((yy - sh_c) / (0.12 * fig_h)) ** 2))
    torso_dx = rot_dx - p.shoulder * s * sh_w
    # Dip fades from the crotch to the feet so the soles stay on the floor line.
    fade = np.clip((info.bottom - yy) / max(1, info.bottom - info.split_y), 0, 1)
    torso_dy = rot_dy + p.bob * abs(s) * np.where(yy < info.split_y, 1.0, fade)
    out = np.zeros_like(src)
    order = [info.front_leg ^ 1, info.front_leg, 1]  # back leg, front leg, upper body
    for label in order:
        if label == 1:
            dx, dy = torso_dx, torso_dy
        else:
            phase = s if label == 3 else -s  # right leg steps on sin > 0
            amp = p.ground_lift if label in info.grounded else p.lift
            lift = min(amp, p.lift) * max(0.0, phase)
            dx = torso_dx * (1 - wl) + p.stride * phase * wl
            dy = torso_dy * (1 - wl) - lift * wl
        sx = np.rint(xx - dx).astype(int)
        sy = np.rint(yy - dy).astype(int)
        ok = (sx >= 0) & (sx < CELL) & (sy >= 0) & (sy < CELL)
        sxc, syc = np.clip(sx, 0, CELL - 1), np.clip(sy, 0, CELL - 1)
        hit = ok & (info.labels[syc, sxc] == label)
        sample = src[syc, sxc]
        a = np.where(hit, sample[..., 3], 0).astype(np.float32)[..., None] / 255.0
        out_a = out[..., 3:4].astype(np.float32) / 255.0
        new_a = a + out_a * (1 - a)
        rgb = (sample[..., :3] * a + out[..., :3] * out_a * (1 - a)) / np.maximum(new_a, 1e-6)
        out = np.dstack([np.rint(rgb), np.rint(new_a * 255)]).astype(np.uint8)
    return Image.fromarray(despill(out), "RGBA")


def build_sheet(name: str) -> Image.Image:
    sheet = Image.new("RGBA", (CELL * FRAMES, CELL * len(DIRS)), (0, 0, 0, 0))
    for r, d in enumerate(DIRS):
        idle = load_idle(name, d)
        info = analyze(idle)
        for k in range(FRAMES):
            sheet.paste(make_frame(idle, info, k, params_for(d)), (k * CELL, r * CELL))
    return sheet


def resolve_names(args: list[str]) -> list[str]:
    names = [a for a in args if not a.startswith("--")]
    if "--all" in args:
        return list(NAMES)
    if not names:
        raise SystemExit("usage: make_walk_frames.py <name>|--all [--preview DIR]")
    return names


def preview(sheet: Image.Image, name: str, out_dir: Path, scale: int = 3) -> None:
    """Contact strip on grey plus an animated GIF per direction, for eyeballing."""
    out_dir.mkdir(parents=True, exist_ok=True)
    bg = Image.new("RGBA", sheet.size, (200, 196, 188, 255))
    bg.alpha_composite(sheet)
    big = bg.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST)
    big.save(out_dir / f"{name}_walk_strip.png")
    for r, d in enumerate(DIRS):
        frames = [
            bg.crop((k * CELL, r * CELL, (k + 1) * CELL, (r + 1) * CELL)).resize(
                (CELL * scale, CELL * scale), Image.NEAREST
            ).convert("P", palette=Image.ADAPTIVE)
            for k in range(FRAMES)
        ]
        frames[0].save(
            out_dir / f"{name}_walk_{d}.gif", save_all=True, append_images=frames[1:],
            duration=100, loop=0,
        )


def main(argv: list[str]) -> int:
    preview_dir = None
    if "--preview" in argv:
        i = argv.index("--preview")
        preview_dir = Path(argv[i + 1])
        argv = argv[:i] + argv[i + 2:]
    for name in resolve_names(argv):
        sheet = build_sheet(name)
        dest = sheet_path(name)
        sheet.save(dest, optimize=True)
        print(f"{dest.relative_to(ROOT)} {sheet.width}x{sheet.height} {dest.stat().st_size // 1024} KB")
        if preview_dir:
            preview(sheet, name, preview_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
