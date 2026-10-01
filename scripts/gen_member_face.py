"""Generate one member's 4 head-only expressions (style A) with agy, save as raw/face_<key>.png.

usage: python scripts/gen_member_face.py <key>          (repo root)
       python scripts/gen_member_face.py <key> --pose   (the result-screen pose → raw/pose_<key>.png)
Needs raw/ref/members/<key>.jpg (official photo: the hair), raw/layout_<key>.png (the previous 2x2 sheet: layout
and faces), raw/style_A_ref.png (rendering). --pose needs raw/poseref_<key>.png (the previous pose) instead.
Then: python scripts/split_member_face.py <key> assets/skins/members
Prompt, agy output and errors are kept in raw/agy/ (git-ignored). See docs/member_pieces_gemini.md.
"""
import json, os, re, subprocess, sys
from pathlib import Path
from PIL import Image

# Hair comes from the photo (never described here). The member color goes on the hair accessory only;
# the game draws a member-color rim around the piece (js/render.js drawArt).
MEMBERS = {  # key: (member color for the hair accessory, extra fix)
    'kurumi': ('red #cc0000', ''),
    'mayu': ('yellow #f5c400', ''),
    'mau': ('light blue #7fd4e8', ''),
    'ami': ('green #2e9e5b', ''),
    'mana': ('white #ffffff',
             '- Her hair accessory is white: give it the same bold dark brown outline as the rest and clear light gray shading, so it is clearly visible on a white background. No white glow or haze.\n'),
}

HAIR = """- Hair: take the hair color, bangs, hairstyle and hair length from the photo. The hair color must be the natural hair color seen in the photo. Do NOT tint the hair with {color} or any other bright costume color.
- Hair accessory: keep the kind and position of the hair accessory from the photo, simplified, and color it {color}. Make it clearly visible."""

PROMPT = """画像を 1 枚生成してください。添付は 3 枚です：raw/ref/members/{key}.jpg（本人の写真）、raw/layout_{key}.png（構図と顔の見本）、raw/style_A_ref.png（質感の見本）。縦横比 1:1、最高解像度。
画像の生成だけを行ってください。コマンドの実行・ファイルのコピーや変換・ほかのファイルの変更・git 操作はしないでください。
最後に、生成された画像ファイルのフルパスだけを報告してください。

--- prompt（一字も変えずに使う） ---
Attachment 1 ({key}.jpg) is an official photo of an idol. Use it ONLY for her hair and hair accessory.
Attachment 2 (layout_{key}.png) is the current sheet of her game pieces: a 2 x 2 grid of HEAD-ONLY pieces. Keep its layout, piece shape, size, simple cartoon faces and the 4 expressions. Its hair color is wrong and must be replaced.
Attachment 3 (style_A_ref.png) is the style reference: a HEAD-ONLY game piece with a smooth soft vinyl cushion look, soft top-left highlight, gentle shading at the bottom, a small shiny spot on the hair, bold dark brown outline. Match this rendering exactly.
Redraw attachment 2 with these changes:
""" + HAIR + """
- Eyes: a natural dark brown eye color (not {color}), except the fever cell.
- The face stays a simple kawaii cartoon face. Do not draw a realistic face or copy facial details from the photo.
The 2 x 2 grid, one expression per cell:
- Top left, normal: glossy eyes with a white highlight, a tiny calm smile, soft pink blush.
- Top right, happy: eyes closed in happy upward arcs, a small open joyful smile, slightly stronger blush.
- Bottom left, surprised pop: wide round eyes, small round "O" mouth, puffed cheeks, the head slightly inflated like it is about to burst.
- Bottom right, fever: sparkling yellow star-shaped eyes, a big wide-open excited smile, strong blush.
Every piece is HEAD ONLY: no body, no neck, no arms. One plump round shape (a slightly squashed circle, wider than tall), the hair forming the round silhouette, hair accessories inside the silhouette. The only difference between the 4 cells is the face; hair, shape, size and lighting are identical.
{fix}Each piece is centered in its own equal-size cell with a wide empty gap, never touching another piece or the image edges.
Background: one solid flat magenta #FF00FF, perfectly uniform. No gradient, shadow or glow. Do not use magenta or hot pink on the character.
Absolutely no text, letters, numbers, symbols or watermark. Square 1:1 image at the highest resolution.
"""

POSE_PROMPT = """画像を 1 枚生成してください。添付は 2 枚です：raw/ref/members/{key}.jpg（本人の写真）と raw/poseref_{key}.png（今の絵）。縦横比 1:1、最高解像度。
画像の生成だけを行ってください。コマンドの実行・ファイルのコピーや変換・ほかのファイルの変更・git 操作はしないでください。
最後に、生成された画像ファイルのフルパスだけを報告してください。

--- prompt（一字も変えずに使う） ---
Attachment 1 ({key}.jpg) is an official photo of an idol. Use it ONLY for her hair and hair accessory.
Attachment 2 (poseref_{key}.png) is the current drawing of her as a small mascot character jumping for joy. Its hair color is wrong and must be replaced.
Redraw attachment 2 as one character, alone and centered, with exactly the same pose, body shape, outfit, outfit colors, simple cartoon face, bold dark brown outline and shading. Change only this:
""" + HAIR + """
{fix}Keep the raised arms fully inside the image with a wide margin on every side.
Background: one solid flat magenta #FF00FF, perfectly uniform. No gradient, floor, shadow, glow, sparkles or motion lines. Do not use magenta or hot pink on the character.
Absolutely no text, letters, numbers, symbols or watermark. Square 1:1 image at the highest resolution.
"""

key = sys.argv[1]
pose = '--pose' in sys.argv[2:]
kind = 'pose' if pose else 'face'
color, fix = MEMBERS[key]
out_dir = Path('raw/agy')
out_dir.mkdir(parents=True, exist_ok=True)
prompt = (POSE_PROMPT if pose else PROMPT).format(key=key, color=color, fix=fix)
needs = [f'raw/ref/members/{key}.jpg', f'raw/poseref_{key}.png'] if pose else [f'raw/ref/members/{key}.jpg', f'raw/layout_{key}.png', 'raw/style_A_ref.png']
missing = [p for p in needs if not Path(p).exists()]
if missing:
    sys.exit(f'{key}: missing {missing}')
(out_dir / f'{key}_{kind}_prompt.txt').write_text(prompt, encoding='utf-8')

if os.environ.get('GEMINI_API_KEY') or os.environ.get('ANTIGRAVITY_API_KEY'):
    sys.exit('API key is set: abort (would bill the API key instead of the subscription)')

repo = str(Path.cwd())
r = subprocess.run(['agy', '--output-format', 'json', '--print-timeout', '280s', '--add-dir', repo, '-p', prompt],
                   capture_output=True, text=True, encoding='utf-8', shell=False)
(out_dir / f'{key}_{kind}_out.json').write_text(r.stdout, encoding='utf-8')
(out_dir / f'{key}_{kind}_err.txt').write_text(r.stderr, encoding='utf-8')
try:
    res = json.loads(r.stdout)
except json.JSONDecodeError:
    sys.exit(f'{key}: no JSON (exit {r.returncode}): {r.stderr[-500:]}')
if res.get('status') != 'SUCCESS':
    sys.exit(f'{key}: status {res.get("status")}: {res.get("response", "")[:500]}')
m = re.search(r'[A-Za-z]:\\[^\s"\]()]+\.(?:jpg|jpeg|png)', res.get('response', ''))
if not m or not Path(m.group(0)).exists():
    sys.exit(f'{key}: image path not found in response: {res.get("response", "")[:500]}')
img = Image.open(m.group(0))
dst = Path('raw') / f'{kind}_{key}.png'
img.convert('RGB').save(dst)
print(f'{key}: {img.size} → {dst}  (conversation {res["conversation_id"]})')
