"""Placeholder faces for the `sample` skin, so the pop / fever / pose code paths can be seen before the real art exists.

    python scripts/make_sample_faces.py            # writes assets/skins/sample/kurumi_{pop,fever,pose}.png

Draws over kurumi.png: covers the face band with skin color and draws simple new eyes and mouth.
These are test pictures only — the real member art comes from docs/member_pieces_gemini.md.
Requires Pillow.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

DIR = Path(__file__).resolve().parent.parent / 'assets' / 'skins' / 'sample'
INK = (60, 30, 30, 255)
BLUSH = (255, 140, 170, 255)


def star(draw, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    draw.polygon(pts, fill=fill, outline=INK)


def blank_face(img):
    w, h = img.size
    skin = img.getpixel((int(w * 0.5), int(h * 0.44)))
    d = ImageDraw.Draw(img)
    d.rectangle((w * 0.24, h * 0.44, w * 0.76, h * 0.68), fill=skin)
    return d, w, h


def pop(base):
    img = base.copy()
    d, w, h = blank_face(img)
    for x in (0.37, 0.63):
        d.ellipse((w * (x - 0.06), h * 0.47, w * (x + 0.06), h * 0.59), fill=(255, 255, 255, 255), outline=INK, width=6)
        d.ellipse((w * (x - 0.025), h * 0.51, w * (x + 0.025), h * 0.56), fill=INK)
    d.ellipse((w * 0.46, h * 0.60, w * 0.54, h * 0.67), fill=INK)
    return img


def fever(base):
    img = base.copy()
    d, w, h = blank_face(img)
    for x in (0.37, 0.63):
        star(d, w * x, h * 0.53, w * 0.06, (255, 212, 77, 255))
    d.chord((w * 0.42, h * 0.56, w * 0.58, h * 0.68), 0, 180, fill=INK)
    for x in (0.28, 0.72):
        d.ellipse((w * (x - 0.04), h * 0.58, w * (x + 0.04), h * 0.62), fill=BLUSH)
    return img


def pose(base):
    face = fever(base)
    w, h = face.size
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x0, x1 in ((0.2, 0.08), (0.8, 0.92)):
        d.line((w * x0, h * 0.55, w * x1, h * 0.2), fill=INK, width=int(w * 0.07))
    body = face.resize((int(w * 0.86), int(h * 0.86)))
    img.alpha_composite(body, ((w - body.width) // 2, int(h * 0.02)))
    return img


def main():
    base = Image.open(DIR / 'kurumi.png').convert('RGBA')
    for name, make in (('pop', pop), ('fever', fever), ('pose', pose)):
        out = DIR / f'kurumi_{name}.png'
        make(base).save(out, optimize=True)
        print(out)


if __name__ == '__main__':
    main()
