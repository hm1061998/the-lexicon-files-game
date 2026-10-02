"""Render the Case #002 evidence images from cases/case-002/evidences.json.

The text on every image is the English `description` of the evidence, so the
picture and the notebook text cannot drift apart. Pillow only, no image model.

    python tools/art-codegen/build_case002_evidence.py [--check]
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
EVIDENCES_JSON = ROOT / "packages/game-content/cases/case-002/evidences.json"
OUT_DIR = ROOT / "apps/game-web/public/assets/evidence"
PAPER = ROOT / "apps/game-web/public/assets/textures/paper_texture.png"
SIZE = 480

DESK = (135, 120, 99, 255)
INK = (52, 44, 38, 255)
MUTED = (112, 100, 88, 255)
RED = (164, 65, 45, 255)  # clue red, AGENTS.md §6
RED_WASH = (164, 65, 45, 46)
LINE = (170, 156, 134, 255)


def blend(img, shape, *args, **kw):
    """Draw a translucent shape (ImageDraw on RGBA replaces pixels, so composite)."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    getattr(ImageDraw.Draw(layer), shape)(*args, **kw)
    img.alpha_composite(layer)


def font(size):
    return ImageFont.load_default(size=size)


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def paragraph(draw, xy, text, fnt, width, fill=INK, gap=4):
    x, y = xy
    for line in wrap(draw, text, fnt, width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + gap
    return y


def card(box=(34, 34, 446, 446), tint=(236, 224, 200)):
    """Desk backdrop, soft shadow and a sheet of paper; returns (image, draw)."""
    img = Image.new("RGBA", (SIZE, SIZE), DESK)
    draw = ImageDraw.Draw(img, "RGBA")
    x0, y0, x1, y1 = box
    for i in range(6, 0, -1):
        blend(img, "rectangle", (x0 + i, y0 + i, x1 + i, y1 + i), fill=(0, 0, 0, 10))
    paper = Image.open(PAPER).convert("RGBA").resize((x1 - x0, y1 - y0))
    sheet = Image.new("RGBA", paper.size, tint + (255,))
    sheet = Image.blend(sheet, paper, 0.25)
    img.paste(sheet, (x0, y0))
    draw.rectangle(box, outline=LINE, width=1)
    return img, ImageDraw.Draw(img, "RGBA")


def split_sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]


def render_note(e):
    img, d = card()
    d.text((56, 52), e["name"].upper(), font=font(22), fill=INK)
    d.line((56, 84, 424, 84), fill=INK, width=2)
    y = 100
    for part in split_sentences(e["description"]):
        d.rectangle((56, y + 4, 62, y + 10), outline=MUTED)
        y = paragraph(d, (74, y), part, font(17), 340) + 8
    return img


def render_log(e):
    img, d = card(tint=(228, 232, 226))
    d.text((56, 52), e["name"].upper(), font=font(22), fill=INK)
    d.line((56, 84, 424, 84), fill=INK, width=2)
    rows = [r.strip() for r in re.split(r";|(?<=\.)\s", e["description"]) if r.strip()]
    y = 98
    for row in rows:
        lines = wrap(d, row, font(16), 350)
        h = len(lines) * 21 + 8
        if "Leo" in row:
            blend(img, "rectangle", (52, y - 3, 428, y + h - 6), fill=RED_WASH)
        for line in lines:
            d.text((64, y), line, font=font(16), fill=RED if "Leo" in row else INK)
            y += 21
        d.line((56, y + 2, 424, y + 2), fill=LINE, width=1)
        y += 8
    return img


def render_receipt(e):
    img, d = card(tint=(240, 232, 214))
    d.text((56, 52), e["name"].upper(), font=font(22), fill=INK)
    d.line((56, 84, 424, 84), fill=INK, width=2)
    y = 100
    for part in split_sentences(e["description"]):
        y = paragraph(d, (60, y), part, font(17), 350) + 10
    cx, cy, r = 360, 370, 44
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=RED, width=3)
    d.ellipse((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), outline=RED, width=1)
    d.text((cx, cy), "RECEIVED", font=font(13), fill=RED, anchor="mm")
    return img


def render_email(e):
    img, d = card(tint=(244, 240, 230))
    parts = split_sentences(e["description"])
    fields = [p for p in parts if re.match(r"^(From|Subject):", p)]
    body = [p for p in parts if p not in fields]
    d.text((56, 52), "INBOX", font=font(20), fill=MUTED)
    y = 84
    for f in fields:
        label, _, value = f.partition(":")
        d.text((56, y), label.upper(), font=font(13), fill=MUTED)
        y = paragraph(d, (120, y - 2), value.strip(), font(17), 300) + 6
    d.line((56, y + 2, 424, y + 2), fill=INK, width=1)
    y += 16
    for p in body:
        y = paragraph(d, (56, y), p, font(17), 360) + 6
    return img


def render_chat(e):
    img, d = card(tint=(226, 230, 236))
    d.text((56, 52), "CHAT", font=font(20), fill=MUTED)
    speaker = r"(?:\d{1,2}:\d{2}\s+)?(?:Leo|Anna|David):"
    chunks = re.findall(rf"{speaker}.*?(?=\s+{speaker}|$)", e["description"])
    y = 88
    for chunk in (c.strip() for c in chunks if c.strip()):
        mine = bool(re.match(r"^(?:\d{1,2}:\d{2}\s+)?Anna:", chunk))
        fnt = font(16)
        lines = wrap(d, chunk, fnt, 250)
        h = len(lines) * 20 + 14
        x0 = 150 if mine else 56
        fill = (206, 222, 205, 255) if mine else (255, 255, 255, 235)
        d.rounded_rectangle((x0, y, x0 + 272, y + h), radius=10, fill=fill, outline=LINE)
        for i, line in enumerate(lines):
            d.text((x0 + 10, y + 7 + i * 20), line, font=fnt, fill=INK)
        y += h + 10
    return img


RENDERERS = {
    "delivery_note": render_note,
    "mailroom_access_log": render_log,
    "label_printer_log": render_log,
    "courier_receipt": render_receipt,
    "client_complaint_email": render_email,
    "chat_messages": render_chat,
}


def render_evidence(e):
    return RENDERERS[e["id"]](e)


def load_evidences(path=EVIDENCES_JSON):
    return json.loads(Path(path).read_text(encoding="utf-8"))["evidences"]


def build(evidences, out_dir=OUT_DIR):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for e in evidences:
        render_evidence(e).save(out_dir / f"evidence_{e['id']}.png", optimize=True)


def check(evidences, out_dir=OUT_DIR):
    """Return the file names whose on-disk image differs from a fresh render."""
    drift = []
    for e in evidences:
        name = f"evidence_{e['id']}.png"
        path = Path(out_dir) / name
        if not path.exists() or Image.open(path).convert("RGBA").tobytes() != render_evidence(e).tobytes():
            drift.append(name)
    return drift


def main(argv):
    evidences = load_evidences()
    if "--check" in argv:
        drift = check(evidences)
        for name in drift:
            print(f"drift: {name}")
        return 1 if drift else 0
    build(evidences)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
