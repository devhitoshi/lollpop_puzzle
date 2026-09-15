"""Turn Gemini output (character on a flat green or magenta background) into piece art.

    python scripts/prepare_piece.py raw/kurumi.png raw/mayu.png ... --out assets/skins/members
    python scripts/prepare_piece.py raw/*.png --out assets/skins/members --sheet sheet.png
    python scripts/prepare_piece.py raw/members_faces.png --grid 5x4 --out assets/skins/members --sheet sheet.png
    python scripts/prepare_piece.py raw/members_pose.png --grid 5x1 --rows pose --out assets/skins/members

--grid COLSxROWS splits one generated sheet (all members in one image) into pieces. Characters are found as
blobs (generated sheets are not an exact grid); if the count is off it falls back to equal cells. Columns follow the
member order in js/config.js (kurumi, mayu, mau, ami, mana). --rows names the rows (default normal,happy,pop,fever):
row "normal" → kurumi.png, any other row → kurumi_<row>.png. --members names the columns when a sheet holds only
some members, e.g. redoing one person: --grid 1x4 --members mana.

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

from collections import deque

from PIL import Image, ImageChops, ImageFilter

SIZE = 512
BOX = 460
FOOT = 26
MAX_BYTES = 150_000
MEMBERS = ['kurumi', 'mayu', 'mau', 'ami', 'mana']  # same order as COLORS in js/config.js

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


def keep_main_blob(cell: Image.Image) -> Image.Image:
    """Inside one crop, keep the biggest character and drop bits of neighbors that crossed into it.

    Pieces within 6% of the crop size of the biggest blob (a hair ribbon, a detached arm) are kept too,
    unless they touch the crop edge (the feet of the character in the row above end up there).
    """
    alpha = cell.getchannel('A')
    blobs = components(alpha.point(lambda v: 255 if v > 40 else 0))
    if not blobs:
        return cell
    main = max(blobs)
    w, h = cell.size
    if main[1] <= 0 or main[2] <= 0 or main[3] >= w or main[4] >= h:
        print('  ! キャラクターが切り出した範囲の端に触れています（切れている可能性）。sheet の画像で確認してください', file=sys.stderr)
    pad = 0.06 * max(w, h)
    bx1, by1, bx2, by2 = main[1] - pad, main[2] - pad, main[3] + pad, main[4] + pad
    edge = 4  # components() works on a 1/4-size copy
    keep = [b for b in blobs if b is main or (
        b[1] >= bx1 and b[2] >= by1 and b[3] <= bx2 and b[4] <= by2
        and b[1] > edge and b[2] > edge and b[3] < w - edge and b[4] < h - edge)]
    mask = Image.new('L', cell.size, 0)
    for _, x1, y1, x2, y2 in keep:
        mask.paste(255, (x1, y1, x2, y2))
    out = cell.copy()
    out.putalpha(ImageChops.darker(alpha, mask))
    return out


def components(mask: Image.Image, step: int = 4):
    """Connected blobs of a 0/255 mask, on a 1/step-size copy. Returns [(area, x1, y1, x2, y2)] in full-size px."""
    small = mask.resize((max(1, mask.width // step), max(1, mask.height // step)), Image.BOX).point(lambda v: 255 if v > 40 else 0)
    w, h = small.size
    px = small.load()
    seen = bytearray(w * h)
    out = []
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0] == 0 or seen[y0 * w + x0]:
                continue
            q = deque([(x0, y0)])
            seen[y0 * w + x0] = 1
            n, x1, y1, x2, y2 = 0, x0, y0, x0, y0
            while q:
                x, y = q.popleft()
                n += 1
                x1, y1, x2, y2 = min(x1, x), min(y1, y), max(x2, x), max(y2, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            out.append((n, x1 * step, y1 * step, (x2 + 1) * step, (y2 + 1) * step))
    return out


def find_characters(img: Image.Image, cols: int, rows: int):
    """Bounding boxes of the characters on a generated sheet, ordered row by row, left to right.

    Generated sheets are rarely an exact grid (rows drift, feet cross the line where an equal split would cut),
    so characters are found as blobs: small bits (a ribbon, a sparkle) are merged into the nearest big blob,
    then the boxes are grouped into rows by height. Returns None if the count doesn't match cols × rows.
    """
    key = detect_key(img)
    rgb = img.convert('RGB')
    r, g, b = rgb.split()
    dominance = ImageChops.subtract(g, ImageChops.lighter(r, b)) if key == 'green' else ImageChops.subtract(ImageChops.darker(r, b), g)
    mask = dominance.point(lambda v: 255 if v <= SOFT else 0)
    blobs = components(mask)
    if not blobs:
        return None
    biggest = max(a for a, *_ in blobs)
    big = [list(bb) for bb in blobs if bb[0] >= biggest * 0.15]
    small = [bb for bb in blobs if bb[0] < biggest * 0.15 and bb[0] >= 4]
    # Merge each small bit into the big blob whose box (grown by a little) contains its center
    grow = 0.04 * max(img.width / cols, img.height / rows)
    for _, x1, y1, x2, y2 in small:
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        for bb in big:
            if bb[1] - grow <= cx <= bb[3] + grow and bb[2] - grow <= cy <= bb[4] + grow:
                bb[1], bb[2], bb[3], bb[4] = min(bb[1], x1), min(bb[2], y1), max(bb[3], x2), max(bb[4], y2)
                break
    if len(big) != cols * rows:
        print(f'  ! キャラクターが {len(big)} 体見つかりました（{cols * rows} 体のはず）。均等なマスで切り分けます', file=sys.stderr)
        return None
    big.sort(key=lambda bb: (bb[2] + bb[4]) / 2)
    ordered = []
    for r_ in range(rows):
        row = sorted(big[r_ * cols:(r_ + 1) * cols], key=lambda bb: (bb[1] + bb[3]) / 2)
        ordered.extend(tuple(bb[1:]) for bb in row)
    return ordered


def split_grid(img: Image.Image, cols: int, rows: int, row_names, members=MEMBERS):
    """Yield (name, cell image) for a sheet of cols × rows characters. Keying happens per crop, so the key
    color is detected from each crop's own corners."""
    boxes = find_characters(img, cols, rows)
    cw, ch = img.width / cols, img.height / rows
    pad = round(0.06 * min(cw, ch))
    for r in range(rows):
        row = row_names[r] if r < len(row_names) else f'row{r + 1}'
        for c in range(cols):
            if boxes:
                x1, y1, x2, y2 = boxes[r * cols + c]
                box = (max(0, x1 - pad), max(0, y1 - pad), min(img.width, x2 + pad), min(img.height, y2 + pad))
            else:
                box = (round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))
            base = members[c] if c < len(members) else f'piece{c + 1}'
            yield (base if row == 'normal' else f'{base}_{row}'), img.crop(box)


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
    ap.add_argument('--grid', help='1 枚にまとめて生成した画像を COLSxROWS で切り分ける（例：5x4。列はメンバー順）')
    ap.add_argument('--rows', default='normal,happy,pop,fever', help='段ごとの表情の名前（既定 normal,happy,pop,fever。ポーズは pose）')
    ap.add_argument('--members', default=','.join(MEMBERS), help='列ごとのメンバー（既定 kurumi,mayu,mau,ami,mana。1 人だけ作り直すときは mana など）')
    args = ap.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    written = []

    def emit(name, img, label):
        key = detect_key(img) if args.key == 'auto' else args.key
        keyed = key_out(img, key)
        piece = fit(keep_main_blob(keyed) if args.grid else keyed)
        dst = args.out / f'{name}.png'
        size = save(piece, dst)
        flag = '' if size <= MAX_BYTES else '  ! 150KB を超えています'
        print(f'{label} → {dst}  key={key}  {size / 1000:.0f}KB{flag}')
        written.append(dst)

    for src in args.inputs:
        img = Image.open(src)
        if args.grid:
            cols, rows = (int(v) for v in args.grid.lower().split('x'))
            if img.width / cols < 300:
                print(f'  ! 1 マスが {img.width // cols}px しかありません。盤面の駒（表示は 1 辺 200px 前後）には足りますが、結果画面のポーズなど大きく出す絵は粗く見えます', file=sys.stderr)
            row_names = [n.strip() for n in args.rows.split(',') if n.strip()]
            if len(row_names) < rows:
                print(f'  ! --rows の名前が {len(row_names)} 個で、段の数 {rows} より少ないです', file=sys.stderr)
            members = [m.strip() for m in args.members.split(',') if m.strip()]
            for name, cell in split_grid(img, cols, rows, row_names, members):
                emit(name, cell, f'{src.name}[{name}]')
        else:
            emit(src.stem, img, src.name)
    if args.sheet:
        contact_sheet(written, args.sheet)
        print(f'sheet → {args.sheet}')


if __name__ == '__main__':
    main()
