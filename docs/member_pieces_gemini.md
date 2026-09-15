# メンバー駒を Gemini で作るプロンプト

落ちものパズルの駒にする、メンバー 5 人のデフォルメ画像を Gemini アプリ（Nano Banana）で作るための手順とプロンプト。
できた画像は `scripts/prepare_piece.py` で背景を抜き、`assets/skins/members/` に置く（[`assets/skins/README.md`](../assets/skins/README.md)）。

- **許諾**：公式写真をもとに AI で作画することは、オーナーが運営に確認済み（2026-09-14 申告。記録は `lollpop_docs/data/x/media_permissions.md`、claude-work Issue #12）
- **使う写真**：`media_permissions.md` で OK になっている公式・メンバー本人の写真だけ。ファンの撮影写真は使わない（撮影者の許諾の範囲が「掲載」で、AI 作画を含むか未確認のため）

## 作る絵の一覧（5 人 × 5 種類 = 25 枚）

| 種類 | ファイル名 | ゲームでの使い道 |
| --- | --- | --- |
| 通常 | `kurumi.png` | 盤面にいるとき |
| 笑顔 | `kurumi_happy.png` | なぞって選ばれている間 |
| はじけ顔 | `kurumi_pop.png` | 消えた瞬間。0.14 秒だけ膨らんで紙吹雪になる |
| フィーバー顔 | `kurumi_fever.png` | フィーバー中、盤面の全員 |
| ポーズ | `kurumi_pose.png` | 結果画面。「今日の推し色」のメンバーが喜ぶ |

- 跳ねる・潰れる・揺れる・吹き飛ぶといった**動きはコードで作る**ので、コマ送りの絵は要らない
- 無い絵は自動で代わりを使う（はじけ顔 → 笑顔 → 通常、フィーバー顔 → 通常、ポーズ → 出さない）。途中までの絵でも遊べる

## 一括で作る（おすすめ：生成 2 回で 25 枚）

表情を 1 枚にまとめて作るのは、別々に作ると表情ごとに顔の形・衣装・大きさがずれるため。

### 用意するもの

- **参照画像**：公式のアーティスト写真を 5 人横に並べた 1 枚（左から くるみ・まゆ・まう・あみ・まな）
  - 置き場：`C:\Users\kawad\work\projects\lollpop_docs\work\game_assets\ref\members_montage.jpg`（1 人ずつは同じ場所の `members\*.jpg`）
  - 写真は**このリポジトリの git の対象に入れない**（公開リポジトリなので、写真の再配布になるため）。使うときは `raw/ref/` にコピーする（`raw/` は対象外）
- **画像モデル**：Nano Banana Pro など高解像度が出せるもの。解像度は選べる中でいちばん高く
  - 1 マスが 400px を切ると、512px の駒にしたときに粗くなる（`prepare_piece.py` が警告を出す）

### 生成 1：盤面の駒 20 体（参照画像を添付、縦横比 5:4）

```text
The attached image shows official photos of 5 idol members, left to right: (1) red, (2) yellow, (3) light blue, (4) green, (5) white.

Create ONE sprite sheet for a mobile puzzle game: a grid of 5 columns x 4 rows, 20 characters in total.
- Columns follow the photo order (1) to (5). Every row shows the same 5 characters; only the facial expression changes by row.
- Each character is centered in its own equal-size cell, with a wide empty gap between cells. Characters never touch each other or the image edges.

Character design (all 20 share exactly the same style, size and proportions):
- A soft, round, stackable plush mascot. Head and body are one mochi-like dome, slightly wider than tall. No neck, tiny stubby arms, feet hidden.
- Kawaii cartoon face. Do not copy realistic facial features from the photos.
- Each member is recognizable only by her hairstyle, bangs, hair color, hair accessories and stage outfit, taken from her photo and simplified.
- Main outfit accent color: (1) red #cc0000, (2) yellow #f5c400, (3) light blue #7fd4e8, (4) green #2e9e5b, (5) white #ffffff.
- Character (5) is mostly white: draw her with the same bold dark brown outline as the others and light gray shading on the white parts, so she stays clearly visible on a white background. No white glow or haze around anyone.

Rows (expression only; body, hair, outfit, size and position stay identical in every row):
- Row 1 normal: two small glossy dot eyes with a white highlight, a tiny calm smile, soft pink blush.
- Row 2 happy: eyes closed in happy upward arcs, a small open joyful smile, slightly stronger blush.
- Row 3 surprised pop: wide round eyes, small round "O" mouth, puffed cheeks, the dome slightly inflated like it is about to burst.
- Row 4 fever: sparkling yellow star-shaped eyes, a big wide-open excited smile, strong blush.

Style: clean vector-like illustration, bold dark brown outline of even thickness, soft anime cel shading, light from the top left, bright pop colors. Front view, symmetrical, standing straight.

Background: one solid flat magenta #FF00FF over the entire image, perfectly uniform like a chroma key. No gradient, floor, shadow, glow, sparkles or cell borders. Do not use magenta or hot pink anywhere on the characters.
Absolutely no text, letters, numbers, names, symbols, logos or watermark. 5:4 image at the highest resolution.
```

保存名：`raw/members_faces.png`

### 生成 2：結果画面のポーズ 5 体（生成 1 の画像と参照画像を添付、縦横比 21:9）

```text
Image 1 is the finished character sheet (the style and characters to keep). Image 2 shows the original photos in the same column order.

Create ONE image: 5 columns x 1 row, the same 5 characters from row 1 of image 1, in the same column order.
- Each character jumps for joy: both tiny arms raised high, a big happy open smile with eyes closed in upward arcs, the body slightly stretched upward, feet off the ground.
- Keep exactly the same dome body shape, hair, outfit, colors, outline and shading as image 1. Only the pose and expression change.
- Each character is centered in its own equal-size cell, with a wide empty gap between cells, never touching each other or the image edges.

Background: one solid flat magenta #FF00FF over the entire image, perfectly uniform. No gradient, floor, shadow, glow, sparkles, motion lines or cell borders. Do not use magenta or hot pink on the characters.
Absolutely no text, letters, numbers, names, symbols, logos or watermark. Wide 21:9 image at the highest resolution.
```

保存名：`raw/members_pose.png`

背景を全員マゼンタにしているのは、あみの緑の衣装が緑の背景だと抜けてしまうため。代わりに、キャラクターにマゼンタ・濃いピンクを使わないよう指定している。

### 後処理（切り分けて駒にする）

```powershell
python scripts/prepare_piece.py raw/members_faces.png --grid 5x4 --out assets/skins/members --sheet sheet.png
python scripts/prepare_piece.py raw/members_pose.png --grid 5x1 --rows pose --out assets/skins/members --sheet sheet_pose.png
```

- 列はメンバー順。段は上から `kurumi.png` → `kurumi_happy.png` → `kurumi_pop.png` → `kurumi_fever.png`、ポーズは `kurumi_pose.png`
- マスの境界を越えてきた隣のキャラクターの一部は自動で消える。自分のマスからはみ出して切れていそうなときは警告が出る
- `sheet.png` と `sheet_pose.png` で、縁の色残り・大きさのそろい・切れ・列の順番を見る
- ゲームで確認：`?skin=members` で盤面、`?skin=members&pos=fever` でフィーバー顔、`?skin=members&pos=pop` ではじけ顔、`?skin=members&pos=result` でポーズ

### うまくいかないとき

| 症状 | 対処 |
| --- | --- |
| 20 体だと細部が甘い・誰が誰か崩れる | 生成 1 を 2 回に分ける。1 回目は `5 columns x 2 rows, 10 characters` にして Row 3・Row 4 の行を消す（`--grid 5x2 --rows normal,happy`）。2 回目はその画像を添付し、`Keep these exact 10 characters, sizes, positions, colors and background. Redraw row 1 with the Row 3 expression and row 2 with the Row 4 expression.` と Row 3・Row 4 の行を貼る（保存名を変えて `--grid 5x2 --rows pop,fever`） |
| 段ごとに大きさ・衣装が変わる | `The only difference between rows is the face. Copy the body, hair and outfit pixel-for-pixel from row 1.` を足す |
| キャラクター同士がくっつく・マスに収まらない | `Leave at least 20% empty magenta space between neighboring characters.` を足す |
| ポーズで腕や足がマスからはみ出す | `Keep the raised arms fully inside the cell.` を足す |
| 1 人だけ浮いている・薄い | 下の「1 人だけ作り直す」に従う |

### 1 人だけ作り直す（例：まな）

一括の画像を絵柄の見本として添付し、その人の 4 表情を縦 1 列（縦長 9:16）で、ポーズを正方形 1:1 で作る。1 マスが大きくなるので、一括のときより解像度も上がる。

**4 表情**（`raw/members_faces.png` を添付、縦横比 9:16）

```text
The attached image is a finished character sheet: 5 columns (members) x 4 rows (expressions).
Redraw only the character in column 5 as a new image: 1 column x 4 rows, top to bottom = the same 4 expressions as rows 1-4 of the sheet (normal, happy, surprised pop, fever).
- Keep exactly the same design, hair, outfit, proportions, shading and style as the sheet.
- Fix: draw her with the same bold dark brown outline of even thickness as columns 1-4, and light gray shading on white parts, so she is clearly visible on a white background. No white glow, haze or light bloom anywhere.
- Each row is centered in its own equal-size cell with a wide empty gap, never touching the image edges.
Background: one solid flat magenta #FF00FF, perfectly uniform. No gradient, shadow or glow. Do not use magenta or hot pink on the character.
Absolutely no text, letters, numbers, symbols or watermark. Tall 9:16 image at the highest resolution.
```

保存名：`raw/mana_faces.png`

**ポーズ**（`raw/members_pose.png` を添付、縦横比 1:1）

```text
The attached image shows 5 characters jumping for joy. Redraw only the character in column 5 as a new square image, alone and centered, same pose, design, outfit and style.
Fix: the same bold dark brown outline of even thickness as the other 4 characters, light gray shading on white parts, no white glow or haze. Keep the raised arms fully inside the image with a wide margin.
Background: one solid flat magenta #FF00FF, perfectly uniform. No text, symbols or watermark. Square 1:1 at the highest resolution.
```

保存名：`raw/mana_pose.png`

後処理：

```powershell
python scripts/prepare_piece.py raw/mana_faces.png --grid 1x4 --members mana --out assets/skins/members --sheet sheet_mana.png
python scripts/prepare_piece.py raw/mana_pose.png --grid 1x1 --members mana --rows pose --out assets/skins/members
```

別の人を作り直すときは、`column 5` をその人の列番号に、`--members mana` と保存名をその人の key に替える。

## Antigravity への依頼文

Antigravity などのエージェントに任せるときは、これをそのまま渡す。

```text
# 依頼：落ちものパズルのメンバー駒の画像を作る

ワークスペース：C:\Users\kawad\work\projects\lollpop_puzzle

## 目的
アイドル 5 人（左から くるみ・まゆ・まう・あみ・まな）の丸いマスコット風デフォルメ駒を、4 表情（通常・笑顔・はじけ顔・フィーバー顔）と結果画面のポーズの計 25 枚作り、ゲームに組み込める形にする。

## 手順
1. 参照画像をワークスペースにコピーする（raw/ は git の対象外）
   - C:\Users\kawad\work\projects\lollpop_docs\work\game_assets\ref\members_montage.jpg → raw/ref/members_montage.jpg
   - C:\Users\kawad\work\projects\lollpop_docs\work\game_assets\ref\members\*.jpg → raw/ref/members/
2. docs/member_pieces_gemini.md の「一括で作る」節を読み、「生成 1」のプロンプトを一字も変えずに使う
   - raw/ref/members_montage.jpg を添付、縦横比 5:4、最高解像度
   - 保存先：raw/members_faces.png
3. 「生成 2」のプロンプトを一字も変えずに使う
   - raw/members_faces.png と raw/ref/members_montage.jpg をこの順で添付、縦横比 21:9、最高解像度
   - 保存先：raw/members_pose.png
4. 同じ節の「後処理」の 2 つのコマンドを実行する
5. sheet.png と sheet_pose.png を目で見て確認する
   - 25 体とも、背景のマゼンタが縁に残っていない
   - 切れていない（「マスの端に触れています」の警告が出たら要注意）
   - 5 人の大きさと絵柄がそろい、段ごとに表情だけが変わっている
   - 文字・記号が入っていない
   - 列の順番が参照画像と同じ
6. 問題があれば作り直す。直し方は同じ文書の「うまくいかないとき」と「よくある失敗と直し方」に従う
   - 縦横比が選べない、または「1 マスが 400px 未満」の警告が出たら、「うまくいかないとき」の分け方に切り替える

## 守ること
- プロンプトの文面は変えない。直すときは文書にある一文を足すだけにする
- 顔は写真に似せない（シンプルな漫画の顔のまま）。本人らしさは髪型と衣装だけで出す
- 参照写真を assets/ や docs/ など git の対象になる場所に置かない（公開リポジトリのため）
- js/・css/・index.html などゲーム本体のファイルは触らない
- git のコミット・push はしない
- C:\Users\kawad\work\projects\lollpop_docs の中は読むだけで、変更しない

## 報告すること
- 生成した回数と、使ったプロンプト（足した一文があればそれも）
- assets/skins/members/ にできたファイルの一覧と、それぞれの容量
- sheet.png と sheet_pose.png のパス
- 気になった点（崩れ、似ていない人、警告の内容）
```

## 1 人ずつ作る（一括で崩れたときの予備）

### 作る順番

1. **1 人目で絵柄を決める**：写真 1 枚＋「基本プロンプト」。気に入るまで作り直す
2. **2 人目以降**：「1 人目の完成画像（絵柄の見本）」＋「その人の写真」の 2 枚＋「2 人目以降のプロンプト」。絵柄・頭身・線の太さをそろえるため
3. **笑顔の差分（任意）**：完成画像 1 枚＋「笑顔差分のプロンプト」
4. 5 人そろったら `prepare_piece.py` の一覧画像で並べて見比べ、浮いている人だけ作り直す

### メンバーごとの記入表（1 人ずつ作るときだけ使う）

髪型・衣装の特徴は、**写真を見てオーナーが書く**。Claude からは容姿を推測して書かない。

| key | 名前 | メンバーカラー | 背景色 | 使う写真（出典 URL） | 髪型・前髪・髪色 | 衣装・アクセサリーの特徴 |
| --- | --- | --- | --- | --- | --- | --- |
| kurumi | やぎくるみ | 赤 `#cc0000` | 緑 | | | |
| mayu | 夏川茉夢 | 黄 `#f5c400` | 緑 | | | |
| mau | まう | 水色 `#7fd4e8` | 緑 | | | |
| ami | 松川愛美 | 緑 `#2e9e5b` | **マゼンタ** | | | |
| mana | 愛月まな | 白 `#ffffff` | 緑 | | | |

- **背景色**：後処理で背景を抜くための色。あみはメンバーカラーが緑なので、緑の背景だと服まで抜けてしまう。マゼンタにする
- **まな（白）**：白い服が背景と見分けやすいよう、輪郭線を必ず入れる（プロンプトに含めてある）

### 基本プロンプト（1 人目）

`{}` の部分を記入表から埋める。英語の方が絵柄の指定が安定するので、本文は英語にしている。

```text
Turn the person in the attached photo into a cute round mascot character for a mobile puzzle game piece.

Character design:
- A soft, round, stackable plush mascot. The head and body are one single mochi-like dome shape, slightly wider than tall.
- No neck. Tiny stubby arms on the sides. Feet are hidden under the body.
- Simple kawaii face in the middle of the dome: two small glossy dot eyes with a white highlight, a tiny mouth, soft pink blush on the cheeks.
- Keep the person's identity through hair and outfit only: {hair style, bangs, hair color}, {outfit and accessory features}.
- Use {member color name} ({member color hex}) as the main accent color of the outfit.
- The face must stay simple and cartoon-like. Do not draw a realistic face or copy facial details from the photo.

Composition:
- Front view, symmetrical, standing straight, whole character visible and centered.
- The character fills about 85% of the image width. Square 1:1 image.

Style:
- Clean vector-like illustration, bold dark brown outline of even thickness around the whole character, soft anime cel shading, light from the top left.
- Bright, friendly, pop colors.

Background and restrictions:
- Solid flat {background color} background ({background hex}) filling the entire image, completely uniform. No gradient, no floor, no shadow, no glow.
- No text, no letters, no numbers, no symbols, no logo, no watermark, no border, no frame.
- Only one character. No other characters or objects.
```

背景の値：緑は `pure green` と `#00FF00`、マゼンタは `pure magenta` と `#FF00FF`。

#### 意味（日本語）

- 写真の人物を、パズルゲームの駒になる丸いマスコットにする
- 頭と体が一体の、大福のような丸いぬいぐるみ。首なし、短い手、足は隠れる
- 顔は点の目（白いハイライト付き）・小さな口・ほっぺの赤みだけのシンプルなもの
- 本人らしさは**髪型と衣装で出す**。顔は写実的にしない（本人に似せすぎると不気味になりやすく、肖像の扱いとしても控えめな方が安全なため）
- 衣装の差し色はメンバーカラー
- 正面・左右対称・全身が中央、横幅の約 85%、正方形
- 太さの均一な濃い茶色の輪郭線、アニメ塗り、光は左上から
- 背景は完全な単色（後処理で抜くため）。文字・記号・ロゴ・枠・影は入れない

**既存作品の名前（ツムツム、Disney など）はプロンプトに書かない。**既存キャラクターの模倣と受け取られる絵が出やすくなり、コンテスト応募作として権利面の説明がしにくくなるため。形の特徴を言葉で指定している。

### 2 人目以降のプロンプト

画像 1 に完成した 1 人目、画像 2 にその人の写真を添付する。

```text
Image 1 is the finished style reference. Image 2 is a photo of a different person.

Draw the person in image 2 as a new character in exactly the same style as image 1:
- Same mochi-like dome body shape, same proportions and size in the frame, same outline thickness and color, same face style (eyes, mouth, blush), same shading and lighting.
- Change only the hair and outfit to match image 2: {hair style, bangs, hair color}, {outfit and accessory features}.
- Use {member color name} ({member color hex}) as the main accent color of the outfit.
- Do not copy the face from the photo. Keep the simple cartoon face from image 1.

Solid flat {background color} background ({background hex}), completely uniform, no shadow, no gradient.
No text, no symbols, no logo, no frame. Only one character, front view, centered, square 1:1.
```

### 笑顔差分のプロンプト

なぞって選ばれている間に表示する。完成画像 1 枚を添付する。

```text
Keep this exact character, pose, size, position, colors and background.
Change only the facial expression to a big happy smile: eyes closed in happy upward arcs, mouth open in a small joyful smile, blush slightly stronger.
Do not change anything else. No text, no symbols, no effects around the character.
```

保存名は `kurumi_happy.png` のように `_happy` を付ける。

### はじけ顔・フィーバー顔・ポーズのプロンプト（任意）

完成画像 1 枚を添付し、笑顔差分のプロンプトの 2 行目を次のどれかに替える。保存名は `_pop` `_fever` `_pose` を付ける。

- はじけ顔：`Change only the facial expression to surprise: wide round eyes, a small round "O" mouth, puffed cheeks, the body slightly inflated.`
- フィーバー顔：`Change only the facial expression to excitement: sparkling yellow star-shaped eyes, a big wide-open smile, strong blush.`
- ポーズ：`Change the pose to jumping for joy: both tiny arms raised high, feet off the ground, big happy smile with eyes closed in upward arcs.`（1 行目の `pose, size, position` は外す）

## よくある失敗と直し方

| 失敗 | 直し方（プロンプトに足す一文） |
| --- | --- |
| 「!」や名前などの文字が入る | `Absolutely no text or symbols anywhere in the image.` を最後にもう一度書く |
| 背景にグラデーション・床・影が出る | `The background must be one single flat color, like a green screen, with no shading at all.` |
| 背景が完全な緑にならず、抜いた後に縁が汚い | 生成し直す。`prepare_piece.py` は四隅の色で判定するので、四隅が単色になっているかを見る |
| 顔が写実的・本人に似せすぎる | `Make the face extremely simple: just two dot eyes and a tiny mouth, like a plush toy.` |
| 5 人で頭身や大きさがそろわない | 1 人目の完成画像を必ず画像 1 として添付し直す。`same size in the frame as image 1` を強める |
| 手足が長い・人型になる | `The body is a round dome. No legs, no long arms, no human body proportions.` |
| 白い服（まな）が背景と溶ける | 輪郭線の指定を残す。後処理の一覧画像の下段（市松模様）で縁が切れていないか確認する |
| 服の緑（あみ）が抜ける | 背景をマゼンタで作り直す（`--key` は自動判定されるので指定不要） |

## 公開前の確認

- 本人の印象を損ねていないか、崩れ（指の数・目の位置のずれ・余計なもの）がないかをオーナーが見る
- 気になるものは運営に見せてから入れる
- クレジットの文面（`assets/skins/members/skin.json` の `credit`）をオーナーが確定する
