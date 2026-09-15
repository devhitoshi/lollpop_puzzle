# スキン（駒の見た目の差し替え）

駒の見た目は、このフォルダのスキンで決まる。**ゲームの規則は変わらない**（色の番号 0〜4 は常に同じメンバー）。

| スキン | 中身 | 使い方 |
| --- | --- | --- |
| `candy` | 画像なし。コードで飴を描く（既定） | `?skin=candy` |
| `members` | メンバーのデフォルメ画像（Gemini で作成） | `?skin=members` |
| `sample` | 差し替えテスト用の仮の絵 | `?skin=sample` |

既定のスキンは `js/config.js` の `CONFIG.skin.default`。

## 差し替えの手順

1. Gemini で作る（プロンプトは [`docs/member_pieces_gemini.md`](../../docs/member_pieces_gemini.md)。4 表情を 1 枚、ポーズを 1 枚で作る一括版がおすすめ。その場合の手順 3 は同じ文書の「後処理」のコマンド）
2. 生成画像を `raw/` などに `kurumi.png` の名前で保存する（笑顔の差分は `kurumi_happy.png`）
3. 後処理で背景を抜いて、決まりの寸法にそろえる

   ```powershell
   python scripts/prepare_piece.py raw/*.png --out assets/skins/members --sheet sheet.png
   ```

4. `sheet.png`（上段は盤面の色の上、下段は市松模様の上）で、縁に緑が残っていないか、5 人の大きさがそろっているかを見る
5. `?skin=members` で開いて確認する。問題なければ `CONFIG.skin.default` を `'members'` にする

**取り下げの要請が来たら**：`CONFIG.skin.default` を `'candy'` に戻して公開し直す。画像は画面から消える（ファイルの削除は後でよい）。

## skin.json

```json
{
  "title": "メンバー",
  "stick": false,
  "credit": "イラストは公式写真をもとに AI（Gemini）で作成。©FLAP entertainment、許諾を得て掲載",
  "pieces": [
    { "key": "kurumi", "name": "くるみ", "image": "kurumi.png", "happy": "kurumi_happy.png", "pop": "kurumi_pop.png", "fever": "kurumi_fever.png", "pose": "kurumi_pose.png" },
    { "key": "mayu",   "name": "まゆ",   "image": "mayu.png" },
    { "key": "mau",    "name": "まう",   "image": "mau.png" },
    { "key": "ami",    "name": "あみ",   "image": "ami.png" },
    { "key": "mana",   "name": "まな",   "image": "mana.png" }
  ]
}
```

| 項目 | 意味 |
| --- | --- |
| `pieces` | 5 個。**順番と `key` は `js/config.js` の `COLORS` と同じ**（くるみ・まゆ・まう・あみ・まな） |
| `image` | 通常の駒の画像。このフォルダ内のファイル名だけを書く（URL や `../` は不可） |
| `happy` | なぞって選ばれている間の画像（任意） |
| `pop` | 消えた瞬間の画像。0.14 秒だけ膨らんで紙吹雪になる（任意。無ければ happy → image） |
| `fever` | フィーバー中の画像（任意。無ければ image） |
| `pose` | 結果画面で「今日の推し色」のメンバーとして出す画像（任意。無ければ出さない） |
| `stick` | 飴の棒を描くか。キャラクターの駒は `false` |
| `credit` | タイトル画面に出すクレジット |

- `image` が無い駒、読み込めなかった駒は、**その駒だけ飴に戻る**。途中までの画像でも遊べる
- 形が間違っている `skin.json` は、全部飴に戻る（ブラウザのコンソールに理由が出る）。`node --test` でも全スキンの形を確かめる
- 画像は必ずこのサイトの中に置く。外部 URL の画像を Canvas に描くと、共有カードを画像にして書き出せなくなる

## 画像の決まり

| 項目 | 値 | 理由 |
| --- | --- | --- |
| 大きさ | 512 × 512 px、背景透過の PNG | 高解像度のスマホ（DPR 2）で 1 マスの約 2.5 倍。縮小して使うのでくっきり見える |
| キャラクターの範囲 | 中央の 460 × 460 px に収める | 盤面ではこの枠が駒の直径になる |
| 足元 | 下から 26 px | 着地で潰れる動きの支点が足元になる |
| 容量 | 1 枚 150KB 以下 | 5 人×5 種類で 3.75MB 以内。盤面の 4 表情は最初に読み、ポーズも同時に読む（合わせて初回だけ） |

`scripts/prepare_piece.py` がこの決まりに合わせて出力する。
