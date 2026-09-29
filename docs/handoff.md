# 引き継ぎメモ（2026-09-15 昼時点）

新しいセッションはこのファイルから始める。**書いてあることを鵜呑みにせず、`git log` と実物で裏取りしてから進める。**

- 作業記録（判断の経緯）：`C:\Users\kawad\work\claude-work\20260914_落ちものパズル制作\作業記録.md`
- 要件：[`requirements.md`](../requirements.md)（UI の節は古い。下の「決定事項」が新しい）
- 設計書：[`design.html`](../design.html)（公開先 `/design`）。オーナーは部品番号で修正を指示する
- 流れの正：スキル `app-spec-flow`（要件 → 設計書 → 実装 → 番号で修正 → 公開）

## 2026-09-29：デプロイナウに公開した（ここから再開）

- **公開済み**：https://lollpop-puzzle.lolipop-now.app/ （プロジェクト ID `01M3P9F4MB2T3VJB4B6Q20WWYV`、`.lolipop/project.json` は CLI が作らないので手で置いた・gitignore 済み）
- **公開はステージングから**：デプロイナウは `.` 始まり以外を全部公開するので、リポジトリ直下からは出さない。`index.html design.html og.png LICENSE css js assets design` だけを `work/sandbox/lollpop_puzzle_deploy/` にコピー（`assets/skins/README.md` は外す）→ リポジトリ直下で `lolipop deploy --dir ../../sandbox/lollpop_puzzle_deploy`
  - 公開後に確認済み：`/` と JS・駒画像・`og.png` が 200、`/.git/HEAD` `/raw/…` `/sheet.png` `/README.md` `/docs/…` `/scripts/…` `/.lolipop/…` が 404。本番 URL で bot が結果画面まで回り、実行時エラーなし（`data/words.json` の 404 だけ。言葉は未実装のため想定内）
- この日に入れたもの
  - **遊び方 W（簡易版）**：T4 を有効化。4 項目のカード（`#howto`）。初回の「あそぶ」「エンドレス」の前に 1 回だけ出る（`CONFIG.howto.storageKey`）。`?pos=howto`。物理で触って覚える版は 10 月以降の改善
  - **X でシェア R7**：結果画面。intent URL（お祭り度・ランク・スコア・推し色・`CONFIG.share.hashtags`）。画像の共有カード S は未実装（og.png がカードになる）
  - **OG / favicon**：`og.png`（1200×630）は `scripts/og.html` を撮影したもの（作り方は og.html の先頭）
- **応募フォームの送信はオーナー**（9 月の月間賞は 9/30 締切）
- 残り：A キャンディポップ、言葉（`data/words.json`、オーナー確認待ち）、GA4、共有カード画像、物理版の W

## 以前の作業（2026-09-15 昼）

- **ブランチ** `feature/ui-stylish-endless-fx`。コミット f6733f0（E+・1 分／エンドレス・スター飴・演出）の上に 158335d（メンバー駒・既定をメンバーに）をコミット済み。push はしていない（main は 0d467f7 のまま）
- **158335d の中身**
  - メンバー駒の表情 5 種類（通常・笑顔・はじけ顔・フィーバー顔・結果のポーズ）の仕組み：`js/skin.js`（`pop` `fever` `pose`）、`js/render.js`（フィーバー中はフィーバー顔、消えた駒は 0.14 秒はじけ顔で膨らむ）、結果画面の R11（推し色メンバーのポーズ）、`?pos=pop`
  - `scripts/prepare_piece.py`：`--grid` はキャラクターを塊で見つけて切り出す（生成画像は均等なマスになっていないため）、`--rows`（段の名前）、`--members`（1 人だけ作り直すとき）
  - `scripts/make_sample_faces.py` と `assets/skins/sample/kurumi_{pop,fever,pose}.png`（表示確認用の仮の絵）
  - `scripts/cdp-probe.mjs` の `--eval=` と `--shot=`（実時間の確認と撮影）
  - **メンバー駒の本物の絵 25 枚** `assets/skins/members/*.png`（Antigravity で生成 → 切り分け済み）。元画像は `raw/members_faces.png`（1200×896、5×4）と `raw/members_pose.png`（1376×384、5×1）。`raw/` と `sheet*.png` は git の対象外
  - `docs/member_pieces_gemini.md`（一括プロンプト、1 人だけ作り直す節、Antigravity への依頼文）
- **まな（白）の作り直しは完了**
  - 問題：輪郭が薄い灰色で、淡いピンクの盤面の上で見えにくい。原因は一括プロンプトの「white with a light gray outline」（修正済み）
  - 2026-09-15 昼に `agy -p`（Antigravity CLI のヘッドレス実行）で作り直した。依頼文は `C:\Users\kawad\work\sandbox\lollpop_puzzle_eplus\agy_mana_prompt.txt`、agy の報告は同じフォルダの `agy_mana_out.txt`
  - **4 表情は済み**：`raw/mana_faces.png`（768×1376、agy が `~/.gemini/antigravity-cli/brain/…/mana_faces_*.jpg` に置いたものを PNG にした）→ 切り分けて `assets/skins/members/mana{,_happy,_pop,_fever}.png` を差し替え。輪郭は他の 4 人と同じ濃い茶色になり、盤面でも見える（撮影で確認）。旧いまなの絵は `sandbox/lollpop_puzzle_eplus/mana_old/`
    - 気になる点：フィーバー顔が星の目ではなく「><」の目になった。オーナーに見せて、気になるなら作り直す
  - **ポーズは生成し直した（2026-09-15 14:12）**：上限解除後に `agy --output-format json -p`（依頼文 `sandbox/lollpop_puzzle_eplus/agy_mana_pose_prompt.txt`、会話 ID bf3543ff-e675-4da2-b5b9-20e785e999b2）で 1024×1024 を生成 → `raw/mana_pose.png` → `prepare_piece.py --grid 1x1 --members mana --rows pose` で切り分けて差し替え。オーナーが加工版と比べて生成版を選んだ（線がくっきり、服は薄い灰色）
    - それまでの加工版（旧い絵を `pose_try/darken_pose.py` で輪郭を濃くしたもの）は `sandbox/lollpop_puzzle_eplus/pose_try/mana_pose_processed_deployed.png`、旧い薄い絵は `mana_old/`
  - まなの 3 表情の上端に上の段の靴の切れ端が残っていた → `prepare_piece.py` の `keep_main_blob` で、切り出し範囲の端に触れる小片を捨てるように直し、切り直した
- **そのあと**
  - `CONFIG.skin.default` を `members` にした（2026-09-15 オーナー指示）。端末に選択が保存されていない人はメンバーの駒で始まる。タイトルの説明文は「同じ色のロリポップを…」のまま（直すかはオーナー次第）
  - **コミット 158335d → Cloudflare プレビューに公開済み**（2026-09-15、オーナー指示。Version 93703fa7）。公開前に `.assetsignore` へ `raw` `sheet*.png` を足した（参照写真を公開しないため）。公開後に `/.git/HEAD` `/raw/…` `/sheet.png` が 404、既定がメンバーの駒になることを確認。**push はまだ**
  - push したら claude-work に判断待ちの Issue を立てる（未 push のうちはリンクが切れるので保留していた）
- **駒を顔だけ・ぷっくり 3D に作り直した**（2026-09-15 午後）：くるみで 6 案を試作（`sandbox/lollpop_puzzle_eplus/face_styles/compare.png`）→ オーナーが A → 5 人 × 4 表情を 1 人 1 回ずつ生成（`scripts/gen_member_face.py`）→ `scripts/split_member_face.py` で 20 枚を差し替え。盤面・フィーバー・はじけを撮影で確認（`face_styles/gen/game_cmp.png`）、テスト 40 件通過。**未コミット・未公開**
  - 気になる点：頭は横長なので、丸い当たり判定の上下に少しすき間が見える。まなのはじけ顔は目が丸い白目ではなく普通の目
- **この作業分の確認は済んだ**（2026-09-15）：参照写真は公式アー写、BGM は合成のオリジナル曲（下の「決定事項」）。結果画面のポーズが少し甘い件は「一旦それで」
- **次**：BGM（Web Audio の合成曲）の実装、またはオンボーディング W／A キャンディポップ。どれからにするかオーナーに聞く

## 目的と締切

- デプロイナウコンテスト（GMOペパボ）9 月の月間賞に応募する作品。**9/29 までに応募**（月末締切）
- 戦略の正：`lollpop_docs` ブランチ `strategy/20260911-deploynow-contest` の `strategy/research_2026-09-11_デプロイナウコンテスト参加戦略.md` 7 章
- 応募条件：デプロイナウで公開した URL。審査終了まで公開を維持する

## 公開先

| 公開先 | URL | 状態 |
| --- | --- | --- |
| Cloudflare Workers（プレビュー） | https://lollpop-puzzle.lollipopfan.workers.dev/ | 公開中。`npx wrangler deploy` |
| デプロイナウ（本番・応募） | https://lollpop-puzzle.lolipop-now.app/ | **公開中**（2026-09-29）。ステージングから `lolipop deploy --dir …`（上の節） |

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
| メンバー駒の絵柄 | **盤面の駒は顔だけ・ぷっくり 3D**（2026-09-15 午後。体があると跳ねたときに可愛くない、とオーナー）。6 案の試作から A を選んだ。髪はメンバーカラー、フィーバー顔は全員星の目。**結果画面のポーズは全身のまま**。手順は [`member_pieces_gemini.md`](member_pieces_gemini.md) の「今の駒」 |
| 参照写真の出典 | `lollpop_docs/work/game_assets/ref/members*.jpg` は**公式アー写**（2026-09-15 オーナー回答） |
| BGM | **合成のオリジナル曲**（Web Audio でコードから鳴らす）に決定（2026-09-15）。requirements.md の「やらないこと」から外す |
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
- メンバー駒の表情：通常・笑顔・はじけ顔・フィーバー顔・結果のポーズの 5 種類（`skin.json` の `image` `happy` `pop` `fever` `pose`）。現在 Gemini による画像生成・切り分け作業を着手中（手順：`member_pieces_gemini.md`、スクリプト：`prepare_piece.py`）。
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
