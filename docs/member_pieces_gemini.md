# メンバー駒を Gemini で作るプロンプト

落ちものパズルの駒にする、メンバー 5 人のデフォルメ画像を Gemini アプリ（Nano Banana）で作るための手順とプロンプト。
できた画像は `scripts/prepare_piece.py` で背景を抜き、`assets/skins/members/` に置く（[`assets/skins/README.md`](../assets/skins/README.md)）。

- **許諾**：公式写真をもとに AI で作画することは、オーナーが運営に確認済み（2026-09-14 申告。記録は `lollpop_docs/data/x/media_permissions.md`、claude-work Issue #12）
- **使う写真**：`media_permissions.md` で OK になっている公式・メンバー本人の写真だけ。ファンの撮影写真は使わない（撮影者の許諾の範囲が「掲載」で、AI 作画を含むか未確認のため）

## 作る順番

1. **1 人目で絵柄を決める**：写真 1 枚＋「基本プロンプト」。気に入るまで作り直す
2. **2 人目以降**：「1 人目の完成画像（絵柄の見本）」＋「その人の写真」の 2 枚＋「2 人目以降のプロンプト」。絵柄・頭身・線の太さをそろえるため
3. **笑顔の差分（任意）**：完成画像 1 枚＋「笑顔差分のプロンプト」
4. 5 人そろったら `prepare_piece.py` の一覧画像で並べて見比べ、浮いている人だけ作り直す

## メンバーごとの記入表

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

## 基本プロンプト（1 人目）

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

### 意味（日本語）

- 写真の人物を、パズルゲームの駒になる丸いマスコットにする
- 頭と体が一体の、大福のような丸いぬいぐるみ。首なし、短い手、足は隠れる
- 顔は点の目（白いハイライト付き）・小さな口・ほっぺの赤みだけのシンプルなもの
- 本人らしさは**髪型と衣装で出す**。顔は写実的にしない（本人に似せすぎると不気味になりやすく、肖像の扱いとしても控えめな方が安全なため）
- 衣装の差し色はメンバーカラー
- 正面・左右対称・全身が中央、横幅の約 85%、正方形
- 太さの均一な濃い茶色の輪郭線、アニメ塗り、光は左上から
- 背景は完全な単色（後処理で抜くため）。文字・記号・ロゴ・枠・影は入れない

**既存作品の名前（ツムツム、Disney など）はプロンプトに書かない。**既存キャラクターの模倣と受け取られる絵が出やすくなり、コンテスト応募作として権利面の説明がしにくくなるため。形の特徴を言葉で指定している。

## 2 人目以降のプロンプト

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

## 笑顔差分のプロンプト（任意）

なぞって選ばれている間に表示する。完成画像 1 枚を添付する。

```text
Keep this exact character, pose, size, position, colors and background.
Change only the facial expression to a big happy smile: eyes closed in happy upward arcs, mouth open in a small joyful smile, blush slightly stronger.
Do not change anything else. No text, no symbols, no effects around the character.
```

保存名は `kurumi_happy.png` のように `_happy` を付ける。

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
