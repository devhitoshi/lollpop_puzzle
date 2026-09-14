"""Turn Gemini output (character on a flat green or magenta background) into piece art.

    python scripts/prepare_piece.py raw/kurumi.png raw/mayu.png ... --out assets/skins/members
    python scripts/prepare_piece.py raw/*.png --out assets/skins/members --sheet sheet.png

Output file name = input file name (kurumi.png → kurumi.png, kurumi_happy.png → kurumi_happy.png).
Spec (assets/skins/README.md): 512 × 512 transparent PNG, character fits a 460 × 460 box,
feet 26 px above the bottom, horizontally centered, ≤ 150 KB.

Key color is detected from the image corners: green (#00FF00) by default, magenta (#FF00FF) for
characters that wear green (ami's member color is green, so a green key would eat her outfit).
Requires Pillow.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

SIZE = 512
BOX = 460
FOOT = 26
MAX_BYTES = 150_000

# Key strength thresholds on "how much the key channel dominates". Member green #2e9e5b scores 67,
# pure key green scores 255, so anything below SOFT stays opaque.
SOFT = 110
HARD = 170


def detect_key(img: Image.Image) -> str:
    rgb = img.convert('RGB')
    w, h = rgb.size
    samples = [rgb.getpixel((x, y)) for x in (2, w - 3) for y in (2, h - 3)]
    greens = sum(1 for r, g, b in samples if g > 180 and r < 120 and b < 120)
    magentas = sum(1 for r, g, b in samples if r > 180 and b > 180 and g < 120)
    if magentas > greens:
        return 'magenta'
    if greens == 0:
        print('  ! 四隅が緑でもマゼンタでもありません。背景が単色になっているか確認してください', file=sys.stderr)
    return 'green'


def key_out(img: Image.Image, key: str) -> Image.Image:
    r, g, b = img.convert('RGB').split()
    if key == 'green':
        dominance = ImageChops.subtract(g, ImageChops.lighter(r, b))
    else:
        dominance = ImageChops.subtract(ImageChops.darker(r, b), g)
    # dominance ≤ SOFT → opaque, ≥ HARD → transparent, linear in between
    alpha = dominance.point(lambda v: 255 if v <= SOFT else 0 if v >= HARD else int(255 * (HARD - v) / (HARD - SOFT)))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))

    # Despill: on semi-transparent edge pixels, pull the key channel down so no green/magenta halo remains
    out = Image.merge('RGBA', (r, g, b, alpha))
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            rr, gg, bb, aa = px[x, y]
            if aa == 0 or aa == 255:
                if aa == 255 and key == 'green' and gg > max(rr, bb) + 40 and gg > 200:
                    px[x, y] = (rr, max(rr, bb) + 40, bb, aa)
                continue
            if key == 'green':
                px[x, y] = (rr, min(gg, max(rr, bb)), bb, aa)
            else:
                m = max(gg, 0)
                px[x, y] = (min(rr, m + 30), gg, min(bb, m + 30), aa)
    return out


def fit(img: Image.Image) -> Image.Image:
    bbox = img.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bbox:
        raise ValueError('キャラクターが見つかりません（全部透明になりました）')
    char = img.crop(bbox)
    scale = min(BOX / char.width, BOX / char.height)
    char = char.resize((max(1, round(char.width * scale)), max(1, round(char.height * scale))), Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - char.width) // 2
    y = SIZE - FOOT - char.height
    canvas.alpha_composite(char, (x, y))
    return canvas


def save(img: Image.Image, path: Path) -> int:
    img.save(path, optimize=True)
    size = path.stat().st_size
    if size > MAX_BYTES:
        img.quantize(colors=255, method=Image.FASTOCTREE, dither=Image.NONE).save(path, optimize=True)
        size = path.stat().st_size
    return size


def contact_sheet(paths, out: Path, bg=(26, 17, 19)):
    tile = 180
    sheet = Image.new('RGBA', (tile * len(paths), tile * 2), bg + (255,))
    for i, p in enumerate(paths):
        piece = Image.open(p).convert('RGBA').resize((tile, tile), Image.LANCZOS)
        sheet.alpha_composite(piece, (i * tile, 0))
        checker = Image.new('RGBA', (tile, tile), (255, 255, 255, 255))
        for cy in range(0, tile, 20):
            for cx in range(0, tile, 20):
                if (cx + cy) // 20 % 2:
                    checker.paste((220, 220, 220, 255), (cx, cy, cx + 20, cy + 20))
        checker.alpha_composite(piece)
        sheet.alpha_composite(checker, (i * tile, tile))
    sheet.save(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('inputs', nargs='+', type=Path)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--key', choices=['auto', 'green', 'magenta'], default='auto')
    ap.add_argument('--sheet', type=Path, help='確認用の一覧画像（上段：盤面の色の上、下段：市松模様の上）')
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    written = []
    for src in args.inputs:
        img = Image.open(src)
        key = detect_key(img) if args.key == 'auto' else args.key
        piece = fit(key_out(img, key))
        dst = args.out / (src.stem + '.png')
        size = save(piece, dst)
        flag = '' if size <= MAX_BYTES else '  ! 150KB を超えています'
        print(f'{src.name} → {dst}  key={key}  {size / 1000:.0f}KB{flag}')
        written.append(dst)
    if args.sheet:
        contact_sheet(written, args.sheet)
        print(f'sheet → {args.sheet}')


if __name__ == '__main__':
    main()
