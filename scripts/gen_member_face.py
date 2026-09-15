"""Generate one member's 4 head-only expressions (style A) with agy, save as raw/face_<key>.png.

usage: python scripts/gen_member_face.py <key>   (repo root; needs raw/members_faces.png and raw/style_A_ref.png)
Then: python scripts/split_member_face.py <key> assets/skins/members
Prompt, agy output and errors are kept in raw/agy/ (git-ignored). See docs/member_pieces_gemini.md.
"""
import json, os, re, subprocess, sys
from pathlib import Path
from PIL import Image

MEMBERS = {  # key: (column in raw/members_faces.png, description, extra fix)
    'kurumi': (1, 'red hair with a red flower hair ornament', ''),
    'mayu': (2, 'yellow hair', ''),
    'mau': (3, 'light blue twin-tail hair', ''),
    'ami': (4, 'green hair with a light green ribbon', ''),
    'mana': (5, 'white hair with a white frilled headdress',
             '- She is white: give her the same bold dark brown outline as the style reference and clear light gray shading on the white hair and headdress, so she is clearly visible on a white background. No white glow or haze.\n'),
}

PROMPT = """画像を 1 枚生成してください。添付は 2 枚です：raw/members_faces.png（デザインの見本）と raw/style_A_ref.png（質感の見本）。縦横比 1:1、最高解像度。
画像の生成だけを行ってください。コマンドの実行・ファイルのコピーや変換・ほかのファイルの変更・git 操作はしないでください。
最後に、生成された画像ファイルのフルパスだけを報告してください。

--- prompt（一字も変えずに使う） ---
Attachment 1 (members_faces.png) is a character sheet of 5 idols. Use ONLY the character in column {col} ({desc}) as the design reference: same face, eye color, hair color, bangs, hairstyle and hair accessory.
Attachment 2 (style_A_ref.png) is the style reference: a HEAD-ONLY game piece with a smooth soft vinyl cushion look, soft top-left highlight, gentle shading at the bottom, a small shiny spot on the hair, bold dark brown outline. Match this style, shape and rendering exactly, but with the column {col} character.
Draw a 2 x 2 grid of 4 pieces of this character, one expression per cell:
- Top left, normal: glossy eyes with a white highlight, a tiny calm smile, soft pink blush.
- Top right, happy: eyes closed in happy upward arcs, a small open joyful smile, slightly stronger blush.
- Bottom left, surprised pop: wide round eyes, small round "O" mouth, puffed cheeks, the head slightly inflated like it is about to burst.
- Bottom right, fever: sparkling yellow star-shaped eyes, a big wide-open excited smile, strong blush.
Every piece is HEAD ONLY: no body, no neck, no arms. One plump round shape (a slightly squashed circle, wider than tall), the hair forming the round silhouette, hair accessories small and inside the silhouette. The only difference between the 4 cells is the face; hair, shape, size and lighting are identical.
{fix}Each piece is centered in its own equal-size cell with a wide empty gap, never touching another piece or the image edges.
Background: one solid flat magenta #FF00FF, perfectly uniform. No gradient, shadow or glow. Do not use magenta or hot pink on the character.
Absolutely no text, letters, numbers, symbols or watermark. Square 1:1 image at the highest resolution.
"""

key = sys.argv[1]
col, desc, fix = MEMBERS[key]
out_dir = Path('raw/agy')
out_dir.mkdir(parents=True, exist_ok=True)
prompt = PROMPT.format(col=col, desc=desc, fix=fix)
(out_dir / f'{key}_prompt.txt').write_text(prompt, encoding='utf-8')

if os.environ.get('GEMINI_API_KEY') or os.environ.get('ANTIGRAVITY_API_KEY'):
    sys.exit('API key is set: abort (would bill the API key instead of the subscription)')

repo = str(Path.cwd())
r = subprocess.run(['agy', '--output-format', 'json', '--print-timeout', '280s', '--add-dir', repo, '-p', prompt],
                   capture_output=True, text=True, encoding='utf-8', shell=False)
(out_dir / f'{key}_out.json').write_text(r.stdout, encoding='utf-8')
(out_dir / f'{key}_err.txt').write_text(r.stderr, encoding='utf-8')
try:
    res = json.loads(r.stdout)
except json.JSONDecodeError:
    sys.exit(f'{key}: no JSON (exit {r.returncode}): {r.stderr[-500:]}')
if res.get('status') != 'SUCCESS':
    sys.exit(f'{key}: status {res.get("status")}: {res.get("response", "")[:500]}')
m = re.search(r'[A-Za-z]:\\[^\s"]+\.(?:jpg|jpeg|png)', res.get('response', ''))
if not m or not Path(m.group(0)).exists():
    sys.exit(f'{key}: image path not found in response: {res.get("response", "")[:500]}')
img = Image.open(m.group(0))
dst = Path('raw') / f'face_{key}.png'
img.convert('RGB').save(dst)
print(f'{key}: {img.size} → {dst}  (conversation {res["conversation_id"]})')
