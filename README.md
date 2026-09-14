# !!!!!!! 落ちものパズル

アイドルグループ「ろりぽっぷ!!!!!!!」のメンバーカラーのロリポップを、なぞって消す 3 分間のパズル。
**非公式のファン制作物です。**ろりぽっぷ!!!!!!! の運営・GMOペパボとは関係ありません。

An unofficial fan-made puzzle game for the Japanese idol group "Lollipop!!!!!!!": trace candies of the same member color to clear them.

- プレビュー：https://lollpop-puzzle.lollipopfan.workers.dev/ ／ 画面設計：`/design`
- デプロイナウコンテスト（GMOペパボ）応募作（2026 年 9 月）
- 引き継ぎと今後の計画：[`docs/handoff.md`](docs/handoff.md)

## 遊び方

- 同じ色を 3 個以上なぞって指を離すと消える。続けて消すとコンボ
- 消すたびに「!」が溜まり、7 個で **!!!!!!! フィーバー**（まわりも巻き込んで消え、得点 2 倍）
- つなげる組が見つからないときは「ボム」で下を吹き飛ばして混ぜ直す（1 試合 3 回）
- 3 分で終了。結果は「ポップなお祭り度」

## 動かす

ビルドなし（素の ES modules と Canvas）。`file://` では動かないので、ローカルサーバーで開く。

```powershell
python -m http.server 8791 --bind 127.0.0.1
# http://127.0.0.1:8791/
node --test   # 盤面・ゲーム進行・スキンのテスト
```

## URL パラメータ

| クエリ | 意味 |
| --- | --- |
| `?feel=grid` / `physics` | 落ち方（マス目＋ぽよん／物理） |
| `?adj=8` / `4` | 斜めつなぎの有無（マス目のみ） |
| `?skin=candy` / `members` / `sample` | 駒の見た目（タイトル画面でも切り替えられる） |
| `?time=40` | 試合の秒数 |
| `?seed=1` | 盤面の乱数を固定 |
| `?pos=title` `play` `combo` `fever` `rescue` `hurry` `result` | その状態で止める（設計書・スクリーンショット用） |
| `?labels=1` | 部品番号の札を重ねる |
| `?debug=1` | fps と内部値 |
| `?bot=1` | 自動プレイ（動作確認用） |

## 構成

```
index.html  design.html  requirements.md
css/                 見た目（2 テーマ化の予定：docs/handoff.md）
js/config.js         調整値の全部（design.html の M 表がこれを読む）
js/field-grid.js     マス目の盤面        js/field-physics.js  物理の盤面（固定刻みの Verlet）
js/field-common.js   盤面の約束事        js/game.js           時間・得点・コンボ・フィーバー・救済
js/input.js          なぞりの入力        js/render.js         Canvas の描画
js/skin.js           駒の見た目の読み込み js/feedback.js       効果音と振動（合成）
assets/skins/        スキン（飴・メンバー・テスト用）と差し替えの決まり
scripts/prepare_piece.py   Gemini の画像を駒の画像に整える
docs/member_pieces_gemini.md  メンバー駒を作るプロンプト
design/              設計書の UI ラフと盤面の見本画像
tests/               node --test
```

盤面のロジックは DOM に触れないので、Node でそのままテストできる。

## 素材と権利

- 飴はコードで描き、効果音は Web Audio で合成している。音源・歌詞は使わない
- メンバーの駒画像（`assets/skins/members/`）は、公式写真をもとに AI（Gemini）で作画する。運営の許諾を得て掲載する予定
- メンバーカラー・曲名などの事実情報を除き、「ろりぽっぷ!!!!!!!」に関する権利はそれぞれの権利者に帰属する

## ライセンス

コードは MIT（[`LICENSE`](LICENSE)）。メンバーの駒画像はライセンスの対象外。
