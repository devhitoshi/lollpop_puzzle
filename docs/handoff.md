# 引き継ぎメモ（2026-09-14 夕方時点）

新しいセッションはこのファイルから始める。**書いてあることを鵜呑みにせず、`git log` と実物で裏取りしてから進める。**

- 作業記録（判断の経緯）：`C:\Users\kawad\work\claude-work\20260914_落ちものパズル制作\作業記録.md`
- 要件：[`requirements.md`](../requirements.md)（UI の節は古い。下の「決定事項」が新しい）
- 設計書：[`design.html`](../design.html)（公開先 `/design`）。オーナーは部品番号で修正を指示する
- 流れの正：スキル `app-spec-flow`（要件 → 設計書 → 実装 → 番号で修正 → 公開）

## 目的と締切

- デプロイナウコンテスト（GMOペパボ）9 月の月間賞に応募する作品。**9/29 までに応募**（月末締切）
- 戦略の正：`lollpop_docs` ブランチ `strategy/20260911-deploynow-contest` の `strategy/research_2026-09-11_デプロイナウコンテスト参加戦略.md` 7 章
- 応募条件：デプロイナウで公開した URL。審査終了まで公開を維持する

## 公開先

| 公開先 | URL | 状態 |
| --- | --- | --- |
| Cloudflare Workers（プレビュー） | https://lollpop-puzzle.lollipopfan.workers.dev/ | 公開中。`npx wrangler deploy` |
| デプロイナウ（本番・応募） | https://lollpop-puzzle.lolipop-now.app/ （予定） | **未公開**。`lolipop deploy --name lollpop-puzzle --framework static` |

公開後は必ず `/.git/HEAD` が 404 になることを確かめる（`.assetsignore`）。

## 決定事項（オーナー）

| 項目 | 決定 |
| --- | --- |
| 遊び方 | 盤面をなぞって消す（ツムツム型）。同じ色 3 個以上 |
| 技術 | ビルドなしの静的サイト（素の ES modules と Canvas）。安定性と性能を優先。戦略メモの Next.js 案は採らない |
| 落ち方 | **物理に決定**（2026-09-14）。ほかの案のコードは「バグのもと」なので消した |
| 長さとモード | **1 分モード**（60 秒、フィーバーで +5 秒）と **エンドレス**（のこりが減り続け、消すと戻る。0 でゲームオーバー）。3 分は長くて途中で飽きるため（2026-09-14） |
| ラストスパート | 1 分モードの残り 10 秒から「!」が 2 個で 1 個。時間切れのときフィーバー中なら、終わるまで続くボーナスタイム（オーナー：フィーバーが 1 回しかなかった）。ラストスパート中のフィーバーは +5 秒を足さない |
| スター飴（仮の名前） | 7 個以上つなぐと出る。タップで周りをまとめて消す。長くつなぐ理由を作る（ツムツムのボムに相当） |
| 振動 | Android はなぞり・消す・スター飴などで振動。iPhone はボタンを押したときだけ軽く 1 回（`js/haptics.js`）。タイトルでオン／オフ |
| 連鎖 | 自動の連鎖は無い形式なので「コンボ」（前に消してから 2.5 秒以内） |
| フィーバー | 消した個数 8 個で「!」1 個、7 個で 12 秒。周りを広く巻き込み、得点 3 倍（最初は「ツムツムより早め」→「多くて短いと爽快感が少ない」で少なく長く強くした）。残り時間はバーと秒数、「!」が右から減る |
| 救済 | **「ぽっぷボム」**ボタンで下を爆発させて混ぜ直す。1 試合 3 回。得点・「!」なし、コンボは維持して猶予を数え直す |
| なぞり線 | ツムツム型の白い縁取りのカプセル |
| 言葉 | 曲名＋公式の言葉＋メンバー・公式が X で使う言葉。**歌詞は使わない**。コール語（うりゃ！おい！）は却下 |
| スコアの名前 | 「ポップなお祭り度」（段階名は仮） |
| オンボーディング | 触って覚える 3 手順（なぞる → コンボ → フィーバー）、初回だけ、20 秒以内、スキップ可、最初に消すまで時間を減らさない |
| 駒の見た目 | スキンで切り替え（飴／メンバー）。プレイヤーがタイトル画面の T8 で選べる。メンバーの絵が無いうちは「準備中」 |
| メンバーの絵 | Gemini で公式写真からデフォルメを作る。**オーナーが運営に AI 作画の許諾を確認済み**（2026-09-14 申告）。プロンプトは [`member_pieces_gemini.md`](member_pieces_gemini.md) |
| UI | `lollpop_docs/design.md` には従わない。**A キャンディポップ と E+ かわいいスタイリッシュ の 2 テーマ**をタイトル画面の T9 で切り替える。**E+ から実装**（実装済み）、A は次。E+ の色はラフのままで OK が出た |
| リポジトリ | `devhitoshi/lollpop_puzzle`（公開） |

## 今の状態

**実装済み**

- 盤面（`js/field-physics.js`。約束事は `js/field-common.js` の冒頭）
- ゲーム進行（`js/game.js`：1 分モードとエンドレス、得点・コンボ・フィーバー（個数で溜まる・+5 秒）・スター飴・救済・詰みの自動混ぜ直し、結果のランク）
- 入力（`js/input.js`）、描画（`js/render.js`：スキン対応、テーマの色 `setTheme`、なぞりのカプセル、はじけ、爆発、揺れ）、効果音と振動（`js/feedback.js`）
- スキン（`js/skin.js`、`assets/skins/{candy,members,sample}`、`scripts/prepare_piece.py`、[`assets/skins/README.md`](../assets/skins/README.md)）
- **テーマの仕組み**
  - `js/theme.js`：`resolveTheme`（`?theme=` → 端末に保存 → `CONFIG.theme.default`）、`applyTheme`（`<html data-theme>` を書き換えて、canvas 用の CSS 変数を返す）
  - `css/base.css`：配置と動き。色は変数だけで書く
  - `css/themes/stylish.css`：E+。先頭の変数で色を直せる
  - `index.html`：両テーマ分のマークアップを持つ（`.ja` と `.en` の 2 つのラベル、「!」は 1 文字ずつ、ランク、バー、盤面の枠）
- **E+ の画面**：タイトル（T1〜T9。盤面は斜めの窓から見える）、HUD（H）、盤面の四隅の括弧、コンボ（C）、フィーバー（F・F2「05.4」）、救済（Q1 ぽっぷボム）、結果（R1 ランク・%、R2 数値とバー、R3・R4）
- 設計書：実物 G1〜G7（物理×E+）、未実装のモック（W・R5〜R9・S・A。まだ旧い暗い見た目）、UI ラフ（A・E+ ほか）、M1〜M23
- 振動：`CONFIG.vibration`（Android）、`js/haptics.js`（iPhone のボタン）、タイトルの T10
- 演出：`CONFIG.fx`（粒・跳ね・揺れ・光の強さ）、`js/particles.js`（粒プール。盤面と結果画面の紙吹雪で共用）、`field.kick`（飴を弾ませる）。設計書 M27〜M32
- 調整用：`node scripts/balance.mjs`（bot で試合を回して得点・フィーバー回数・エンドレスの続く時間を出す）、`node scripts/cdp-probe.mjs <URL> <待つms>`（実時間で開いて状態と実行時エラーを取る）
- テスト：`node --test` 31 件

**未実装**

- A キャンディポップ（`css/themes/candy.css`）。今は T9 で「準備中」になり押せない
- オンボーディング（W）、共有カード（S）と共有ボタン（R5・R6）、結果の導線（R7〜R9）、「とは」画面（A）、OG 画像
- 言葉の表示（`data/words.json` が無いので今は出ない）
- 計測（GA4。duo-album の `analytics.js` を流用する予定）
- デプロイナウへの公開と応募

## オーナーの判断待ち

1. E+ の実物の見た目（設計書の G1〜G12 を番号で直してもらう）
2. スター飴の名前と見た目（仮：スター飴、ピンクの星に「!」）
3. フィーバーの爽快感：1.5 秒ごとに消して 1 分に 2 回・12 秒・3 倍、最後はラストスパートからボーナスタイムに入りやすくした（2.5 秒おきの bot でも 12 回中 10 回）。まだ物足りなければ演出（画面のフラッシュ、飴が降る速さ）も足す候補。値は `fever.piecesPerBang` `fever.duration` `fever.blastFactor` `score.feverMultiplier`
4. エンドレスの厳しさ：3 秒おきで約 20 秒、2 秒おきで約 50 秒、1.2 秒おきで約 1 分半（`CONFIG.endless`、perPiece 0.6）
5. 演出の強さ（実機で）：光・揺れ・紙吹雪の量。`CONFIG.fx` の値で調整する
6. 振動の強さ（実機で）。iPhone のボタンの振動が効くか（iOS のバージョンで違う）
7. 結果のランク（仮：S 90%／A 70%／B 40%／C）とバーの基準値（仮：コンボ 30・フィーバー 5 回・続いた時間 120 秒）。`CONFIG.result.ranks` `CONFIG.result.bars`
8. コンボの猶予：2.5 秒だと 1.5 秒ごとに消す人は切れない（100 超え）。短くするか倍率の上限を下げるか
9. 言葉の一覧：`claude-work/20260914_落ちものパズル制作/言葉とリンクの案.md`（曲名 26・公式 3・X 19）
   - 未確認の点：`#まうだよ` の裏付けが無い、`#おまゆ生誕祭` の年号が不明、長い曲名が 4 件ある
10. ポップなお祭り度の段階名（仮：お祭りの準備中／屋台めぐり／お祭りの真ん中／楽しさ無限大／ポップなお祭りの主役）と満点ライン（仮：1 分 16 万点、エンドレス 40 万点。`scripts/balance.mjs` の計測から）
11. AI 作画の許諾の確認日と範囲
   - 記録先：`lollpop_docs/data/x/media_permissions.md`
   - この記録は、ブランチ `strategy/20260911-deploynow-contest` の作業ツリーに書いただけで、**未コミット**
12. メンバー駒のクレジット文面（仮：`assets/skins/members/skin.json` の `credit`）
13. メンバー 5 人の髪型・衣装の特徴（[`member_pieces_gemini.md`](member_pieces_gemini.md) の記入表。オーナーが写真を見て書く）

## 次にやる候補

オンボーディング Wと A キャンディポップのどちらを先にするかは、オーナーに聞く。9/29 から逆算すると W を先にする方が安全（A は間に合わなければ削る）。

### A キャンディポップの作り方（仕組みはできている）

- `css/themes/candy.css` を足し、`[data-theme="candy"]` の範囲だけに効かせる。見た目の出発点は `design/ui-mocks.js` の `.ui-candy`
- `index.html` に `<link rel="stylesheet" href="css/themes/candy.css">` を足し、`js/config.js` の `theme.choices` の candy から `ready: false` を外す
- `stylish.css` の先頭の変数（`--board-bg` `--board-tint` `--text-stroke` `--text-fill` `--trace-edge` `--canvas-font` `--theme-color` など）を candy でもそろえる。canvas はこれを読む
- 部品：T はストライプの地・縁取りロゴ（「!」は 1 文字ずつメンバーカラー）・包み紙の説明・ぷっくりボタン、H は白い丸いチップ、F2 は飴のしま模様のバーと「あと 6」（`.ja`）、Q1 は丸いボム、B は白い太い枠（`.board-frame`）、R は白いカード・大きな %（ランクとバーは出さないか小さく）
- `.ja` と `.en` のどちらを出すかはテーマが決める（base は `.en` を隠している）
- A ができたら `theme.default` をどちらにするかオーナーに聞く

### テーマを作るときの注意

- clip-path は box-shadow と filter も切り取る。斜めのボタンの影は `::before`（影）と `::after`（面）の 2 枚にしている（`stylish.css` の `.btn`）
- タイトルの窓は `.title-window::before` の大きな box-shadow で周りを地の色で覆っている。ストライプは `.title-head` の中に置き、窓にかからないようにしている
- テーマで無限に続くアニメーションを足したら、そのテーマの `prefers-reduced-motion` の中で止める
- ヘッドレス Chrome の仮想時間（`--virtual-time-budget`）では bot が 1 回も消さない。元の版でも同じ。実時間で回すときは `node scripts/cdp-probe.mjs "http://127.0.0.1:8791/index.html?bot=1&time=8" 22000`（DevTools プロトコルで開いて、実時間で待ってから状態とエラーを取る。`--reduced` で視差効果を減らす設定）

## 残りの作業（UI の後。9/29 から逆算）

1. オンボーディング W（物理で作る）
2. 結果の共有：共有カード S（1200×630、Canvas。外部画像は描かない）、画像保存と X 投稿、導線 R7〜R9、「とは」画面 A
3. 言葉の表示（`data/words.json`、オーナー確認後）
4. OG 画像と `<meta>`、計測（GA4）
5. デプロイナウに公開 → 公開後の確認（`app-spec-flow/checklists/deploy.md`）→ オーナーが応募フォームを送る
6. 削る順：A キャンディポップ → 共有カードの凝った装飾 → 計測

## 作業のコツ

- **ローカル配信**：`python -m http.server 8791 --bind 127.0.0.1 --directory <repo>`
  - ポート 8765 は別のサーバー（duo-album）が使っていることがある。取り違えると別アプリのスクリーンショットになる
- **状態を止める**：`?pos=title|play|combo|fever|rescue|hurry|result`、`?seed=`、`?time=`、`?labels=1`、`?debug=1`、`?bot=1`（自動プレイ）
- **撮影**：`bash ~/.claude/skills/app-spec-flow/scripts/shots.sh <URL> <出力フォルダ> 名前=クエリ ...`（`W=500 H=900` などで大きさ指定）
  - ヘッドレス Chrome の仮想時間では bot の動きが実時間と違う。手触りは実機で確かめる
- **長い置換**：Python のスクリプトをファイルに書いてから実行する
  - bash の heredoc にテンプレートリテラル（`${}` やバッククォート）を含むコードを渡すと、解釈に失敗して何も適用されない
- **CSS の優先順位に注意**：以前、フィーバー中の「!」が `.app.fever-on .hud-bangs i` の指定に負けて、全部点灯して見えた
- **駒の画像の背景**：あみのメンバーカラーは緑なので、Gemini の背景はマゼンタにする（`prepare_piece.py` が自動判定）
- **コミットと push**：オーナーの指示があるときだけ行う
