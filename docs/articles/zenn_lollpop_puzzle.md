---
title: "Claude Code から Antigravity をヘッドレスで呼んで、ゲームの駒 25 枚を Nano Banana で描かせた"
emoji: "🍭"
type: "tech"
topics: ["claudecode", "gemini", "antigravity", "canvas", "javascript"]
published: false
---

<!--
下書き（Zenn 投稿用）。画像は docs/articles/images/ にある。Zenn に上げるときは画像をアップロードして URL を差し替える。
事実の出典：scripts/gen_member_face.py、scripts/split_member_face.py、scripts/prepare_piece.py、js/config.js、js/field-physics.js、
docs/handoff.md、claude-work/20260914_落ちものパズル制作/作業記録.md（第 11〜14 弾）、~/.claude/skills/agy-ask/SKILL.md
-->

アイドルグループ「ろりぽっぷ!!!!!!!」の非公式ファンゲームとして、ツムツム風の「なぞって消す」落ちものパズルを作り、ロリポップ！デプロイナウで公開しました。

- 遊べる URL：https://lollpop-puzzle.lolipop-now.app/
- リポジトリ：https://github.com/devhitoshi/lollpop_puzzle

![プレイ中の盤面](/images/lollpop-puzzle/play.png)

開発はほぼ Claude Code と一緒に進めました。その中でいちばん嬉しかったのが、**Claude Code から Google Antigravity の CLI（`agy`）をヘッドレスで呼び出し、Google AI Pro のサブスクの枠の中で、画像生成（Nano Banana）まで一発で回せた**ことです。駒の絵を描くために別のアプリを開いてプロンプトを貼り、画像を保存して、切り抜いて……という手作業がなくなりました。

この記事では、その仕組みとハマりどころを中心に書きます。後半でゲーム本体の作りにも軽く触れます。

## やりたかったこと

駒はメンバー 5 人の顔です。1 人につき 4 つの表情（通常・笑顔・はじけ顔・フィーバー顔）が要るので、盤面用だけで 20 枚、結果画面の全身ポーズを足すと 25 枚になります。

絵は Gemini の画像生成で作りました。ただ、ブラウザの Gemini で 1 枚ずつ作ると次のような手間がかかります。

1. プロンプトと参考画像を貼る
2. 生成された画像を保存する
3. 背景を抜き、1 表情ずつ切り分けて、決まったファイル名で置く
4. ゲームに載せて、盤面の大きさで見え方を確かめる

1 と 2 は Gemini 側、3 と 4 は手元の作業です。これを Claude Code の 1 回の指示で最後まで流したい、というのが出発点でした。

## 仕組み：Claude Code → agy → Nano Banana

Antigravity の CLI には、プロンプトを渡して結果だけ受け取るヘッドレス実行（`-p`）があります。Claude Code からは Bash ツールでただのコマンドとして呼べるので、MCP サーバーも擬似端末も要りませんでした（確認したのは agy 1.2.3）。

```bash
agy --output-format json --print-timeout 280s --add-dir <リポジトリの絶対パス> -p "<プロンプト>"
```

- `--output-format json` を付けると、`{"conversation_id": "…", "status": "SUCCESS", "response": "…", …}` の形で返ってきます。成否（`status`）と会話 ID が機械的に取れるので、必ず付けています
- `--add-dir` で、参考画像のあるリポジトリを agy に見せます。付けないと agy は自分の作業用ディレクトリで動き、こちらのファイルは見えません
- 画像を生成するのは Antigravity 側のエージェントです。プロンプトで「画像を 1 枚生成して、そのフルパスだけ報告して」と頼むと、エージェントが画像生成のツール（Nano Banana）を呼び、保存先を `response` に書いて返します

これを 1 人分ずつ回すスクリプトが `scripts/gen_member_face.py` です。やっていることは 4 つだけです。

```python
# 1. サブスクではなく API キー課金に倒れる設定になっていたら止める
if os.environ.get('GEMINI_API_KEY') or os.environ.get('ANTIGRAVITY_API_KEY'):
    sys.exit('API key is set: abort (would bill the API key instead of the subscription)')

# 2. agy をヘッドレスで呼ぶ
r = subprocess.run(['agy', '--output-format', 'json', '--print-timeout', '280s', '--add-dir', repo, '-p', prompt],
                   capture_output=True, text=True, encoding='utf-8', shell=False)

# 3. JSON の response から画像のパスを拾う（exit 0 でも status を見る）
res = json.loads(r.stdout)
if res.get('status') != 'SUCCESS':
    sys.exit(f'{key}: status {res.get("status")}: {res.get("response", "")[:500]}')
m = re.search(r'[A-Za-z]:\\[^\s"]+\.(?:jpg|jpeg|png)', res.get('response', ''))

# 4. PNG にしてリポジトリの raw/ に置く
Image.open(m.group(0)).convert('RGB').save(Path('raw') / f'face_{key}.png')
```

agy は生成した画像を `~/.gemini/antigravity-cli/brain/…/` の下に jpg で置きます。**画像を動かすのは agy ではなく、こちらのスクリプトの役目**にしました。プロンプトにも「画像の生成だけを行ってください。コマンドの実行・ファイルのコピーや変換・ほかのファイルの変更・git 操作はしないでください」と書いています。別のエージェントにリポジトリを触らせないためです。

生成された 2×2 の画像は、`scripts/split_member_face.py` が 4 枚の駒に切り分けます。中で呼んでいる `scripts/prepare_piece.py` は、背景色を自動で判定して抜き、キャラクターを「塊」として見つけて切り出します。生成画像はきっちり均等なマスにはなっていないので、マスで等分すると足や髪が切れてしまったためです。

Claude Code から見た流れは、こうなります。

1. 参考画像（公式写真からまとめたデザインの見本）と質感の見本を添えて、プロンプトを組む
2. `python scripts/gen_member_face.py kurumi` で生成（1 人 1 回）
3. `python scripts/split_member_face.py kurumi assets/skins/members` で 4 表情に切り分け
4. ゲームを `?pos=fever` などの状態で止めて撮影し、盤面の大きさで見え方を確かめる

人間がやったのは、案を選ぶことと、でき上がりを見て OK を出すことだけでした。

### 質感の 6 案を 1 枚で比べる

いきなり 5 人分を作る前に、1 人（くるみ）で質感の案を 6 つ、1 回の生成で並べて描かせました。ぷっくり 3D・ぬいぐるみ・缶バッジ・飴玉・マシュマロ大福・粘土です。

![質感 6 案の比較](/images/lollpop-puzzle/styles.png)

Claude Code がこれを切り分け、盤面での実寸（約 58px）と、着地でつぶれたとき・跳ねて伸びたときの見え方を並べた比較画像を作りました。実寸にすると、ぬいぐるみは生地の質感が消えて色がくすみ、マシュマロ大福は色が抜けて色合わせのパズルに向きません。いちばん顔と色が読めた「A ぷっくり 3D」に決めました。

そのあと、A のくるみを「質感の見本」として添えて、5 人分を 1 人 1 回ずつ生成しました。**5 回とも `SUCCESS` で、20 枚の駒がそのまま盤面に載りました。**

## ハマりどころ

### API キーがあると課金に倒れる

環境変数に `GEMINI_API_KEY` か `ANTIGRAVITY_API_KEY` があると、サブスクの枠ではなく API キーの従量課金で動きます。スクリプトの先頭で止めているのはこのためです。勝手に unset してから呼ぶこともしません（意図して設定している可能性があるので、人に確認します）。

### 画像モデルには別の上限がある

サブスクの枠は `agy --output-format json -p "/usage"` でトークンを使わずに確認できます。ところが、画像生成モデルには `/usage` に出てこない別の上限がありました。

調子に乗って、サブエージェント 5 本を並列に走らせて約 15 分で 18 回ほど生成したところ、次のエラーで止まりました。

```
429 RESOURCE_EXHAUSTED: You have exhausted your capacity on this model. Your quota will reset after 4h50m
```

モデル名は `gemini-3.1-flash-image` と出ていました。このとき Gemini のグループ枠はまだ残っていました。翌日、9 枚を 1 枚ずつ確認しながら生成したときは止まっていません。**画像は並列で一気に投げず、1 枚ずつ見ながら投げる**のが今の運用です。

### Git Bash から `/usage` を送ると、ただの質問として送られる

Windows の Git Bash（MSYS）は、`/usage` のような引数を `C:/Program Files/Git/usage` というパスに書き換えます。agy には普通の質問として届き、枠を消費します（約 7 万トークンを無駄にしました）。残量の確認だけは PowerShell から送っています。

### 実在の人物を「描いて」と頼むと、送信前に止まる

`The prompt could not be submitted. The prompt contains sensitive words…` というエラーで、1 秒以内に返ってくることがあります。Google の禁止表現フィルタです。「写真の女の子を描く」のように実在の人物そのものを描かせる書き方や、プロンプト内のメンバーの名前で止まりました。写真は「衣装と髪型の参考資料」、名前は「this member」と書き換えると通りました。

なお、メンバーの絵を AI で作ることは、運営に許諾を確認してから進めています。

### 白いメンバーだけ輪郭が薄い

担当カラーが白のメンバーだけ、淡いピンクの盤面の上でほとんど見えない絵になりました。原因はこちらのプロンプトの一語で、「white with a light gray outline（薄い灰色の輪郭）」と書いていたことでした。「ほかのメンバーと同じ濃い茶色の太い輪郭」と書き直して、その 1 人だけ作り直しています。スクリプトの `MEMBERS` に、その人だけの追加の指示を持たせています。

### 背景色はキャラクターと被らない色にする

背景を抜くために単色で塗らせますが、よく使う緑はメンバーカラー（緑）と被ります。背景はマゼンタ `#FF00FF` にして、「キャラクターにマゼンタやホットピンクを使わない」とプロンプトに書いています。

## ゲーム本体の作り

ここからは短めに。

### ビルドなし：素の ES modules と Canvas

最初は Next.js で作る案もありましたが、ビルドなしの静的サイト（素の ES modules と Canvas）にしました。1 分間のパズルに必要なのは盤面の描画と入力だけで、フレームワークの出番がほとんどありません。依存を減らして、どの環境でも同じように動くこと（安定性）と、スマホでのなめらかさ（性能）を優先しました。

### 盤面は固定刻みの Verlet 物理

駒は、箱の中に丸い飴が積もって転がるように動きます（`js/field-physics.js`）。

- **Verlet 積分**：速度を持たず、「今の位置 − 1 つ前の位置」を速度とみなします。衝突したら位置を押し離すだけなので、山が落ち着きやすい
- **固定刻み**：1/120 秒ずつ進めます（`CONFIG.physics.step`）。描画のフレームレートとは切り離しているので、30fps の端末でも 120fps の端末でも同じ結果になります
- 駒は 46 個、半径にわずかなばらつき（±6%）を付けて、積もった駒が格子状にそろわないようにしています

なぞりの判定は「同じ色で、隣り合っていること」だけです。速く指を動かしても斜めの駒を飛ばさないよう、指の軌跡を細かく区切って拾っています（`js/input.js`）。

### DOM に触れないロジックはそのままテストする

盤面とゲーム進行（`js/field-*.js`、`js/game.js`）は DOM に触れないので、Node の `node --test` でそのままテストできます（今は 40 件）。

ブラウザでの確認は Claude Code 自身がやります。

- `?pos=fever` `?pos=result` のような URL パラメータで、ゲームを特定の状態で止めて撮影する
- `?bot=1` で自動プレイさせ、`scripts/cdp-probe.mjs` が Chrome DevTools Protocol で実時間のまま待ってから、画面の状態と実行時エラーを回収する

ヘッドレス Chrome の仮想時間では、自動プレイが実時間と違う動きをしました。手触りに関わる確認は、実時間で回すようにしています。

### 公開：デプロイナウは `.` で始まらないファイルを全部公開する

ロリポップ！デプロイナウには CLI があり、静的サイトは次のコマンドで公開できます。

```bash
lolipop deploy --name lollpop-puzzle --framework static
```

気を付けたのは、**`.` で始まるもの以外は、指定したディレクトリの中身が全部公開される**ことです。リポジトリの直下から出すと、`docs/` や `scripts/`、生成の元画像まで公開されてしまいます。そこで、公開するファイルだけ（`index.html` `css/` `js/` `assets/` など）を別のフォルダにコピーし、そのフォルダを `--dir` で指定して公開しました。公開したあとは、`/` や JS、駒の画像が 200、出してはいけないパスが 404 になることを確認しています。

プレビュー用の Cloudflare Workers（静的アセット）も `.git` を自動では除外しないので、こちらは `.assetsignore` を置いています。

## まとめ

- Claude Code から `agy -p` をヘッドレスで呼ぶと、Google AI Pro のサブスクの枠の中で、画像生成から切り分け・ゲームへの組み込み・撮影での確認までを 1 つの流れにできた
- `--output-format json` で成否を取る、API キーがあれば止める、画像は 1 枚ずつ投げる、agy にはファイルを触らせない。この 4 つを決めておけば、事故なく回せた
- 絵の良し悪しの判断だけは人が持つ。そのために、Claude Code に比較画像と盤面の実寸の撮影まで用意させた

ゲームは https://lollpop-puzzle.lolipop-now.app/ で遊べます。本作は「ろりぽっぷ!!!!!!!」のファンが個人で作った非公式のゲームで、運営・GMOペパボとは関係ありません。
